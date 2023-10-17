import { LiveObjectVersion, Migration, StringKeyMap } from '../types'
import {
    fileExists,
    createDir,
    createFileWithContents,
    getContentsOfFolder,
    isDir,
} from '../utils/file'
import {
    getLatestMigrationVersion,
    runSQLMigrationFileAgainstDB,
    updateLatestMigrationVersion,
} from '../db'
import constants from '../constants'
import path from 'path'
import chalk from 'chalk'
import { logFailure, log, logSuccess, logWarning } from '../logger'
import { camelToSnake, fromNamespacedVersion } from '../utils/formatters'
import { guessColType } from '../utils/propertyTypes'
import { ident } from 'pg-format'
import short from 'short-uuid'

const newConstraintName = (prefix: string): string => `${prefix}_${short.generate().toLowerCase()}`

const typeIdent = (type: string): string => {
    return type.endsWith('[]') ? `${ident(type.slice(0, -2))}[]` : ident(type)
}

export const schemaName = 'public'
const UP = 'up.sql'
const DOWN = 'down.sql'

const newVersion = () => new Date(new Date().toUTCString()).getTime()

export function newMigration(action: string): Migration {
    const version = newVersion()
    const name = [version, action].join('_')
    return { name, version }
}

export function splitMigrationName(name: string): string[] | null {
    const underscoreIndex = name.indexOf('_')
    if (!underscoreIndex) return null

    let version: any = name.slice(0, underscoreIndex)
    const action = name.slice(version.length + 1)

    version = parseInt(version)
    if (Number.isNaN(version)) return null

    return [version, action]
}

export function saveMigration(
    projectPath: string,
    migration: Migration,
    up: string = '',
    down: string = ''
): StringKeyMap {
    const migrationsDirPath = path.join(
        projectPath,
        constants.SPEC_CONFIG_DIR_NAME,
        constants.MIGRATIONS_DIR_NAME
    )

    try {
        // Upsert migrations directory.
        fileExists(migrationsDirPath) || createDir(migrationsDirPath)

        // Create versioned migration directory.
        const versionDir = path.join(migrationsDirPath, migration.name)
        createDir(versionDir)

        // Create empty up/down migration files for this version.
        createFileWithContents(path.join(versionDir, UP), up)
        createFileWithContents(path.join(versionDir, DOWN), down)
        return { versionDir }
    } catch (error) {
        return { error }
    }
}

export async function syncMigrations(
    migrationsDir: string,
    url: string,
    env: string,
    logWhenNoAction: boolean = true
): Promise<boolean> {
    // Get list of current migrations.
    const { data: currentMigrations, error } = getCurrentMigrations(migrationsDir)
    if (error) {
        logFailure(`Error while inspecting current migrations: ${error}`)
        return false
    }
    if (!currentMigrations.length) {
        logWhenNoAction && log(`Migrations up-to-date.`)
        return true
    }

    // Get the latest migration version listed in the database.
    const { data: latestDbVersion, error: queryError } = getLatestMigrationVersion(url)
    if (queryError) {
        logFailure(`Error checking database for latest migration version: ${queryError}`)
        return false
    }

    // Find the migrations that haven't run yet.
    const migrationsToRun = currentMigrations.filter(({ version }) => version > latestDbVersion)
    if (!migrationsToRun.length) {
        logWhenNoAction && log(`Migrations up-to-date.`)
        return true
    }

    logSuccess(`${migrationsToRun.length} new migrations detected`)
    log(chalk.gray(`- - - - - - - - - - - - -`))
    log(
        migrationsToRun
            .map((m, i) => {
                const [_, action] = splitMigrationName(m.name)
                return `${chalk.gray(`${i + 1}.`)} ${action}`
            })
            .join('\n')
    )
    log(chalk.gray(`- - - - - - - - - - - - -`))

    for (let i = 0; i < migrationsToRun.length; i++) {
        const migration = migrationsToRun[i]
        const success = await runMigration(url, migrationsDir, migration, i + 1)
        if (!success) return false
    }

    log(chalk.greenBright(`Successfully ran ${migrationsToRun.length} migrations.`))
    return true
}

export async function runMigration(
    url: string,
    migrationsDir: string,
    migration: Migration,
    number: number,
    direction: string = UP
): Promise<boolean> {
    if (![UP, DOWN].includes(direction)) {
        logWarning(`Invalid migration direction: ${direction}.`)
        return false
    }
    const { version, name } = migration
    const [_, action] = splitMigrationName(name)

    log(`\n${chalk.cyanBright(`${number}. ${action}`)}\n`)

    const filePath = path.join(migrationsDir, name, direction)
    if (!fileExists(filePath)) {
        logFailure(`No migration file found at: ${filePath}.`)
        return false
    }

    if (!(await runSQLMigrationFileAgainstDB(filePath, url))) {
        logFailure('Migration failed. Stopping.')
        return false
    }

    const { data: updateSuccess, error } = updateLatestMigrationVersion(url, version.toString())
    if (error) {
        logFailure(error)
        return
    }
    if (!updateSuccess) {
        logFailure(`Failed to increment migration version to ${version} in the DB.`)
        return false
    }

    return true
}

export function getCurrentMigrations(migrationsDir: string): StringKeyMap {
    let allEntries = []
    try {
        allEntries = getContentsOfFolder(migrationsDir)
    } catch (error) {
        return { error }
    }
    if (!allEntries.length) return []

    const migrations = []
    for (const name of allEntries) {
        const [version, action] = splitMigrationName(name) || []
        if (!version || !action) continue

        let hasMigrationStructure = false
        try {
            const migrationPath = path.join(migrationsDir, name)
            hasMigrationStructure =
                isDir(migrationPath) &&
                fileExists(path.join(migrationPath, UP)) &&
                fileExists(path.join(migrationPath, UP))
        } catch (err) {
            hasMigrationStructure = false
        }
        if (!hasMigrationStructure) continue

        migrations.push({ name, version })
    }

    return { data: migrations.sort((a, b) => a.version - b.version) }
}

export function generateCreateTableMigrationFromLov(
    lov: LiveObjectVersion,
    tableName: string
): StringKeyMap {
    const columns = lov.properties.map(({ name, type }) => ({
        name: camelToSnake(name),
        type: guessColType(type),
    }))
    const pkColumnNames = lov.uniqueBy.map(camelToSnake)

    // Create new table and add add primary keys.
    const [createTableSql, dropTableSql] = buildTableSql(tableName, columns)
    const addPrimaryKeySql = buildPrimaryKeySql(tableName, pkColumnNames)

    // Index by block_number/chain_id, as well as the primary timestamp.
    const indexes = [
        ['block_number', 'chain_id'],
        [camelToSnake(lov.primaryTimestampProperty)],
    ].map((columnNames) => buildIndexSql(tableName, columnNames))
    const upIndexes = []
    let downIndexes = []
    for (const [addIndex, dropIndex] of indexes) {
        upIndexes.push(addIndex)
        downIndexes.push(dropIndex)
    }
    downIndexes = downIndexes.reverse()

    const up = [createTableSql, addPrimaryKeySql, ...upIndexes]
    const down = [...downIndexes, dropTableSql]
    const migration = newMigration(`create_${tableName}`)

    return {
        up: sqlStatementsAsTx(up),
        down: sqlStatementsAsTx(down),
        migration,
    }
}

function buildTableSql(tableName: string, columns: StringKeyMap[]): string[] {
    const columnStatements = columns.map((c) => buildColumnSql(c))
    return [
        `create table ${ident(schemaName)}.${ident(tableName)} (${columnStatements.join(', ')})`,
        `drop table ${ident(schemaName)}.${ident(tableName)}`,
    ]
}

function buildColumnSql(column: StringKeyMap): string {
    return [ident(column.name), typeIdent(column.type)].join(' ')
}

function buildPrimaryKeySql(tableName: string, columnNames: string[]): string {
    const constraintName = newConstraintName('pk')
    return [
        `alter table ${ident(schemaName)}.${ident(tableName)}`,
        `add constraint ${ident(constraintName)}`,
        `primary key (${columnNames.map(ident).join(', ')})`,
    ].join(' ')
}

function buildIndexSql(tableName: string, columnNames: string[]): string[] {
    const indexName = newConstraintName('idx')
    return [
        `create index ${ident(indexName)} on ${ident(schemaName)}.${ident(tableName)} (${columnNames
            .map(ident)
            .join(', ')})`,
        `drop index ${ident(schemaName)}.${ident(indexName)}`,
    ]
}

function sqlStatementsAsTx(statements) {
    return ['BEGIN;', ...statements.map((s) => `    ${s};`), 'COMMIT;'].join('\n')
}
