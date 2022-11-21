import { SpecEnv, StringKeyMap } from '../types'
import { createFileWithContents, fileExists, createDir } from '../utils/file'
import toml, { Section } from '@ltd/j-toml'
import constants from '../constants'
import fs from 'fs'
import { toMap } from '../utils/formatters'
import path from 'path'

export function saveProjectCreds(
    org: string,
    name: string,
    id: string,
    apiKey: string
): StringKeyMap {
    // Ensure spec global config directory exists.
    upsertSpecGlobalDir()

    // Get current env.
    const { data: currentEnv, error: envErr } = getCurrentEnv()
    if (envErr) return { error: envErr }

    // Get current global creds.
    const { data, error } = readGlobalCredsFile(currentEnv)
    if (error) return { error }

    // Upsert project section within file.
    const creds = data || {}
    const projectPath = [org, name].join('/')
    creds[projectPath] = creds[projectPath] || Section({})
    creds[projectPath].id = id
    creds[projectPath].apiKey = apiKey

    return saveGlobalCredsFile(currentEnv, creds)
}

export function getProjectCreds(projectId: string): StringKeyMap {
    // Get current env.
    const { data: currentEnv, error: envErr } = getCurrentEnv()
    if (envErr) return { error: envErr }

    const { data, error } = readGlobalCredsFile(currentEnv)
    if (error) return { error }

    const creds = toMap(data || {})
    for (const key in creds) {
        const projectCreds = creds[key]
        if (projectCreds.id === projectId) {
            return { data: { ...projectCreds, path: key } }
        }
    }
    return { data: null }
}

export function upsertGlobalState(): StringKeyMap {
    const { data, error } = readGlobalStateFile()
    if (error) return { error }

    if (!data.env) {
        data.env = SpecEnv.Prod
        const { error: setError } = setCurrentEnv(data.env)
        if (error) return { error: setError }
    }

    return { data }
}

export function getCurrentEnv(): StringKeyMap {
    const { data, error } = upsertGlobalState()
    if (error) return { error }
    return { data: data.env }
}

export function setCurrentEnv(env: SpecEnv): StringKeyMap {
    return saveState({ env })
}

export function getCurrentProjectId(): StringKeyMap {
    const { data, error } = upsertGlobalState()
    if (error) return { error }
    return { data: (data[data.env] || {}).projectId || null }
}

export function setCurrentProjectId(projectId: string): StringKeyMap {
    const { data: currentEnv, error } = getCurrentEnv()
    if (error) return { error }

    const state = {}
    state[currentEnv] = Section({})
    state[currentEnv].projectId = projectId
    return saveState(state)
}

export function saveState(updates: StringKeyMap): StringKeyMap {
    // Ensure spec global config directory exists.
    upsertSpecGlobalDir()

    // Get current global state.
    const { data, error } = readGlobalStateFile()
    if (error) return { error }

    // Apply and save updates.
    return saveGlobalStateFile({ ...data, ...updates })
}

export function upsertSpecGlobalDir() {
    fileExists(constants.SPEC_GLOBAL_DIR) || createDir(constants.SPEC_GLOBAL_DIR)
}

export function readGlobalCredsFile(env: SpecEnv): StringKeyMap {
    return readTomlConfigFile(path.join(constants.SPEC_GLOBAL_DIR, `${env}-creds.toml`))
}

export function saveGlobalCredsFile(env: SpecEnv, table: any): StringKeyMap {
    return saveTomlConfigFile(path.join(constants.SPEC_GLOBAL_DIR, `${env}-creds.toml`), table)
}

export function readGlobalStateFile(): StringKeyMap {
    return readTomlConfigFile(constants.SPEC_GLOBAL_STATE_PATH)
}

export function saveGlobalStateFile(table: any): StringKeyMap {
    return saveTomlConfigFile(constants.SPEC_GLOBAL_STATE_PATH, table)
}

export function readTomlConfigFile(path: string): StringKeyMap {
    if (!fileExists(path)) {
        return { data: {} }
    }
    try {
        const data = toml.parse(fs.readFileSync(path, 'utf-8'))
        return { data }
    } catch (error) {
        return { error }
    }
}

export function saveTomlConfigFile(path: string, table: any): StringKeyMap {
    let error
    try {
        createFileWithContents(
            path,
            toml.stringify(table, { newlineAround: 'section', newline: '\n' })
        )
    } catch (err) {
        error = err
    }
    return { error }
}
