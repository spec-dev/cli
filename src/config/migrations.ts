import { Migration, StringKeyMap } from '../types'
import { fileExists, createDir, createFileWithContents } from '../utils/file'
import constants from '../constants'
import path from 'path'

const UP = 'up.sql'
const DOWN = 'down.sql'

const newVersion = () => new Date(new Date().toUTCString()).getTime().toString()

export function newMigration(action: string): Migration {
    const version = newVersion()
    const name = [version, action].join('_')
    return { name, version }
}

export const saveMigration = (migration: Migration): StringKeyMap => {
    let error = null
    try {
        // Upsert migrations directory.
        fileExists(constants.SPEC_MIGRATIONS_DIR) || createDir(constants.SPEC_MIGRATIONS_DIR)

        // Create versioned migration directory.
        const versionDir = path.join(constants.SPEC_MIGRATIONS_DIR, migration.name)
        createDir(versionDir)

        // Create empty up/down migration files for this version.
        createFileWithContents(path.join(versionDir, UP), '')
        createFileWithContents(path.join(versionDir, DOWN), '')
    } catch (err) {
        error = err
    }
    return { error }
}
