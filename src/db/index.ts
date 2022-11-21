import { StringKeyMap } from '../types'
import { execSync } from 'node:child_process'
import { fetchDbInitFile } from './init'
import { log } from '../logger'

export async function initDatabase(dbName: string): Promise<StringKeyMap> {
    // Upsert "spec" user.
    const { error: upsertError } = upsertSpecUser()
    if (upsertError) return { error: upsertError }

    // Ensure db hasn't already been initialized.
    const { data: alreadyInitializedDb, error: schemaError } = specSchemaTablesExist(dbName)
    if (schemaError) return { error: schemaError }
    if (alreadyInitializedDb) return { error: null }

    // Fetch and save db init file.
    const { data: initFilePath, error: fetchError } = await fetchDbInitFile()
    if (fetchError) return { error: fetchError }

    log('Initializing database for spec...')

    // Apply init script to db.
    try {
        execSync(`psql -d ${dbName} -f ${initFilePath}`, { stdio: 'pipe' })
    } catch (error) {
        return { error }
    }

    return { error: null }
}

export function upsertSpecUser(): StringKeyMap {
    const { data: exists, error } = specUserExists()
    if (error) return { error }
    if (exists) return { error: null }

    log('Creating spec user...')

    try {
        execSync(`psql -c "create user spec"`, { stdio: 'pipe' })
    } catch (err) {
        return { error: err }
    }
    return { error: null }
}

export function specUserExists(): StringKeyMap {
    if (!psqlInstalled()) {
        return { error: 'psql is not installed' }
    }

    let specUserExists = false
    try {
        const out = execSync(
            `psql -c "select usename from pg_catalog.pg_user where usename = 'spec'"`
        )
        const table = out.toString().trim()
        specUserExists = table.split('\n').length > 3
    } catch (error) {
        return { error }
    }

    return { data: specUserExists }
}

export function specSchemaTablesExist(dbName: string): StringKeyMap {
    if (!psqlInstalled()) {
        return { error: 'psql is not installed' }
    }

    let specTablesExist = false
    try {
        const out = execSync(
            `psql -d ${dbName} -c "select tablename from pg_tables where schemaname = 'spec'"`
        )
        const table = out.toString().trim()
        specTablesExist = table.split('\n').length > 3
    } catch (error) {
        return { error }
    }

    return { data: specTablesExist }
}

export function psqlInstalled(): boolean {
    try {
        const out = execSync('which psql')
        const path = out.toString().trim()
        return !!path.length
    } catch (error) {
        return false
    }
}
