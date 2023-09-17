import { Migration, StringKeyMap } from '../types'
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

export function saveMigration(projectPath: string, migration: Migration): StringKeyMap {
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
        createFileWithContents(path.join(versionDir, UP), '')
        createFileWithContents(path.join(versionDir, DOWN), '')
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
) {
    // Get list of current migrations.
    const { data: currentMigrations, error } = getCurrentMigrations(migrationsDir)
    if (error) {
        logFailure(`Error while inspecting current migrations: ${error}`)
        return
    }
    if (!currentMigrations.length) {
        logWhenNoAction && log(`Migrations up-to-date.`)
        return
    }

    // Get the latest migration version listed in the database.
    const { data: latestDbVersion, error: queryError } = getLatestMigrationVersion(url)
    if (queryError) {
        logFailure(`Error checking database for latest migration version: ${queryError}`)
        return
    }

    // Find the migrations that haven't run yet.
    const migrationsToRun = currentMigrations.filter(({ version }) => version > latestDbVersion)
    if (!migrationsToRun.length) {
        logWhenNoAction && log(`Migrations up-to-date.`)
        return
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
        if (!success) return
    }

    log(chalk.greenBright(`Successfully ran ${migrationsToRun.length} migrations.`))
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
