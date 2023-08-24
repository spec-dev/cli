import { StringKeyMap } from '../types'
import { execSync } from 'node:child_process'
import { log, logSuccess } from '../logger'
import path from 'path'
import { newPassword } from '../utils/pw'
import constants from '../constants'

export async function initDatabase(dbName: string, url: string | null): Promise<StringKeyMap> {
    // Upsert the "spec" database user.
    const { newlyAssignedPassword, error: upsertError } = upsertSpecUser(url)
    if (upsertError) return { error: upsertError }

    // Ensure db hasn't already been initialized.
    const { data: alreadyInitializedDb, error: schemaError } = specSchemaTablesExist(dbName, url)
    if (schemaError) return { error: schemaError }
    if (alreadyInitializedDb)
        return { newlyAssignedPassword, alreadyInitialized: true, error: null }

    const initFilePath = path.resolve(__dirname, '..', 'files', 'init.sql')
    log('Initializing database for spec...')

    // Apply init script to db.
    const conn = url ? url : `-d ${dbName}`
    try {
        execSync(`psql ${conn} -f ${initFilePath}`)
    } catch (error) {
        return { error }
    }

    return { newlyAssignedPassword, error: null }
}

export function upsertSpecUser(url?: string): StringKeyMap {
    const { data: exists, error } = specUserExists(url)
    if (error) return { error }
    if (exists) return { error: null }

    log('Creating spec user...')

    let cmd = 'psql'
    let password = null
    if (url) {
        cmd += ` ${url}`
        password = url.includes('localhost') ? null : newPassword()
    }

    const pwClause = password ? ` with password '${password}'` : ''
    cmd += ` -c "create user spec${pwClause}"`

    try {
        execSync(cmd, { stdio: 'pipe' })
    } catch (err) {
        return { error: err }
    }

    if (password) {
        logSuccess(`Created new database user:\nRole: "spec"\nPassword: "${password}"`)
    }

    return { newlyAssignedPassword: password, error: null }
}

export function specUserExists(url?: string): StringKeyMap {
    let specUserExists = false
    const cmd = url ? `psql ${url}` : 'psql'
    try {
        const out = execSync(
            `${cmd} -c "select usename from pg_catalog.pg_user where usename = 'spec'"`
        )
        const table = out.toString().trim()
        specUserExists = table.split('\n').length > 3
    } catch (error) {
        return { error }
    }
    return { data: specUserExists }
}

export function getCurrentDbUser(): StringKeyMap {
    try {
        const out = execSync(`psql -c "select current_user"`)
        return { data: (out.toString().trim().split('\n')[2] || '').trim() }
    } catch (error) {
        return { error }
    }
}

export function upsertLiveObjectTestingDB(): StringKeyMap {
    let exists = false
    try {
        const out = execSync(
            `psql -c "select datname FROM pg_catalog.pg_database where lower(datname) = lower('${constants.LIVE_OBJECT_TESTING_DB_NAME}')"`
        )
        exists = out.toString().trim().split('\n').length > 3
    } catch (err) {
        return { error: err }
    }
    if (exists) {
        return { error: null }
    }

    try {
        execSync(`createdb ${constants.LIVE_OBJECT_TESTING_DB_NAME}`)
    } catch (err) {
        return { error: err }
    }
    return { error: null }
}

export function specSchemaTablesExist(dbName: string, url?: string): StringKeyMap {
    let specTablesExist = false
    const conn = url ? url : `-d ${dbName}`
    try {
        const out = execSync(
            `psql ${conn} -c "select tablename from pg_tables where schemaname = 'spec'"`
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
