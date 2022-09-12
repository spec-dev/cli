import { StringKeyMap } from '../types'
import { execSync } from 'node:child_process'
import { logWarning, log } from '../logger'
import { INIT_DATABASE } from './init'

export function initDatabase(dbName: string): StringKeyMap {
    // Check to make sure the DB hasn't already been initialized for Spec.
    const { data: initialized, error } = specSchemaTablesExist(dbName)
    if (error) return { error }
    if (initialized) return { error: null }

    try {
        execSync(`psql -d ${dbName} -c "create user spec"`, { stdio: 'pipe' })
    } catch (err) {}
    try {
        execSync(`psql -d ${dbName} -c "${INIT_DATABASE}"`, { stdio: 'pipe' })
        return { error: null }
    } catch (error) {
        return { error }
    }
}

export function specSchemaTablesExist(dbName: string): StringKeyMap {
    if (!psqlInstalled()) {
        logWarning('psql not installed...proceeding anyway.')
        return { data: true }
    }
    try {
        const out = execSync(
            `psql -d ${dbName} -c "select tablename from pg_tables where schemaname = 'spec'"`
        )
        const table = out.toString().trim()
        const specTablesExist = table.split('\n').length > 3
        return { data: specTablesExist }
    } catch (error) {
        return { error }
    }
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
