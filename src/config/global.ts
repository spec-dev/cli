import { StringKeyMap } from '../types'
import { createFileWithContents, fileExists, createDir } from '../utils/file'
import toml, { Section } from '@ltd/j-toml'
import constants from '../constants'
import fs from 'fs'

export function saveProjectCreds(
    org: string,
    name: string,
    id: string,
    apiKey: string
): StringKeyMap {
    // Ensure spec global config directory exists.
    upsertSpecGlobalDir()

    // Get current global creds.
    const { data, error } = readGlobalCredsFile()
    if (error) return { error }

    // Upsert project section within file.
    const creds = data || {}
    const projectPath = [org, name].join('/')
    creds[projectPath] = creds[projectPath] || Section({})
    creds[projectPath].id = id
    creds[projectPath].apiKey = apiKey

    return saveGlobalCredsFile(creds)
}

export function upsertSpecGlobalDir() {
    fileExists(constants.SPEC_GLOBAL_DIR) || createDir(constants.SPEC_GLOBAL_DIR)
}

export function readGlobalCredsFile(): StringKeyMap {
    if (!fileExists(constants.SPEC_GLOBAL_CREDS_PATH)) {
        return { data: {} }
    }

    try {
        const data = toml.parse(fs.readFileSync(constants.SPEC_GLOBAL_CREDS_PATH, 'utf-8'))
        return { data }
    } catch (error) {
        return { error }
    }
}

export function saveGlobalCredsFile(table: any): StringKeyMap {
    let error
    try {
        createFileWithContents(
            constants.SPEC_GLOBAL_CREDS_PATH,
            toml.stringify(table, { newlineAround: 'section', newline: '\n' })
        )
    } catch (err) {
        error = err
    }
    return { error }
}
