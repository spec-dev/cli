import { StringKeyMap } from '../types'
import { createFileWithContents, fileExists, createDir } from '../utils/file'
import toml, { Section } from '@ltd/j-toml'
import constants from '../constants'
import fs from 'fs'
import { toMap } from '../utils/formatters'
import path from 'path'

export const DEFAULT_PROJECT_ENV = 'local'

export function saveProjectCreds(
    nsp: string,
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
    const projectPath = [nsp, name].join('/')
    creds[projectPath] = creds[projectPath] || Section({})
    creds[projectPath].id = id
    creds[projectPath].apiKey = apiKey

    return saveGlobalCredsFile(creds)
}

export function getProjectCreds(projectId: string): StringKeyMap {
    const { data, error } = readGlobalCredsFile()
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

export function getCurrentProjectId(): StringKeyMap {
    const { data, error } = readGlobalStateFile()
    if (error) return { error }
    return { data: data?.projectId || null }
}

export function getCurrentProjectEnv(): StringKeyMap {
    const { data, error } = readGlobalStateFile()
    if (error) return { error }
    return { data: data?.projectEnv || null }
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

export function saveProjectInfo(
    nsp: string,
    name: string,
    id: string,
    updates: StringKeyMap
): StringKeyMap {
    // Ensure spec global config directory exists.
    upsertSpecGlobalDir()

    // Get current global creds.
    const { data, error } = readGlobalProjectsFile()
    if (error) return { error }

    // Upsert project section within file.
    const projects = data || {}
    const projectPath = [nsp, name].join('/')
    projects[projectPath] = projects[projectPath] || Section({})
    projects[projectPath].id = id
    for (const key in updates || {}) {
        projects[projectPath][key] = updates[key]
    }

    return saveGlobalProjectsFile(projects)
}

export function setProjectLocation(nsp: string, name: string, id: string, path: string) {
    saveProjectInfo(nsp, name, id, { location: path })
}

export function upsertSpecGlobalDir() {
    fileExists(constants.SPEC_GLOBAL_DIR) || createDir(constants.SPEC_GLOBAL_DIR)
}

export function upsertSpecGlobalComposeDir() {
    fileExists(constants.SPEC_GLOBAL_COMPOSE_DIR) || createDir(constants.SPEC_GLOBAL_COMPOSE_DIR)
}

export function readGlobalCredsFile(): StringKeyMap {
    return readTomlConfigFile(constants.SPEC_GLOBAL_CREDS_PATH)
}

export function saveGlobalCredsFile(table: any): StringKeyMap {
    return saveTomlConfigFile(constants.SPEC_GLOBAL_CREDS_PATH, table)
}

export function readGlobalStateFile(): StringKeyMap {
    return readTomlConfigFile(constants.SPEC_GLOBAL_STATE_PATH)
}

export function saveGlobalStateFile(table: any): StringKeyMap {
    return saveTomlConfigFile(constants.SPEC_GLOBAL_STATE_PATH, table)
}

export function readGlobalProjectsFile(): StringKeyMap {
    return readTomlConfigFile(constants.SPEC_GLOBAL_PROJECTS_PATH)
}

export function saveGlobalProjectsFile(table: any): StringKeyMap {
    return saveTomlConfigFile(constants.SPEC_GLOBAL_PROJECTS_PATH, table)
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

export function saveProjectComposeEnvs(projectId: string, envs: StringKeyMap): StringKeyMap {
    upsertSpecGlobalComposeDir()
    const envsFilePath = path.join(constants.SPEC_GLOBAL_COMPOSE_DIR, `${projectId}.env`)

    let contents = ''
    for (const key in envs) {
        contents += `${key}=${envs[key]}\n`
    }

    let error
    try {
        createFileWithContents(envsFilePath, contents)
    } catch (err) {
        error = `Error saving envs to path ${envsFilePath}: ${err}`
    }
    return { path: envsFilePath, error }
}
