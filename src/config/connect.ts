import { createFileWithContents, fileExists, saveTomlConfigFile } from '../utils/file'
import constants from '../constants'
import toml from '@ltd/j-toml'
import fs from 'fs'
import path from 'path'
import { StringKeyMap } from '../types'
import { getCurrentDbUser } from '../db'

const initialTemplate = (user: string = '') =>
    `# Local database
[local]
name = ''
port = 5432
host = 'localhost'
user = '${user}'
password = ''`

export const createSpecConnectionConfigFile = (specConfigDir?: string) => {
    let { data: user, error } = getCurrentDbUser()
    if (error || !user) {
        user = ''
    }
    let contents = initialTemplate(user)

    const filePath = path.join(
        specConfigDir || constants.SPEC_CONFIG_DIR,
        constants.CONNECTION_CONFIG_FILE_NAME
    )

    fileExists(filePath) || createFileWithContents(filePath, contents)
}

export const localConnectConfigFileExists = (): boolean =>
    fileExists(constants.CONNECTION_CONFIG_PATH)

export function getDBConfig(projectDirPath: string, projectEnv: string): StringKeyMap {
    const connectFilePath = path.join(
        projectDirPath,
        constants.SPEC_CONFIG_DIR_NAME,
        constants.CONNECTION_CONFIG_FILE_NAME
    )

    // Ensure connection config file exists.
    if (!fileExists(connectFilePath)) {
        return { error: null }
    }

    // Return config for given environment.
    try {
        const data = toml.parse(fs.readFileSync(connectFilePath, 'utf-8')) || {}
        return { data: data[projectEnv] || null }
    } catch (error) {
        return { error }
    }
}

export function updateDatabaseNameForEnv(
    projectDirPath: string,
    env: string,
    dbName: string
): StringKeyMap {
    const connectFilePath = path.join(
        projectDirPath,
        constants.SPEC_CONFIG_DIR_NAME,
        constants.CONNECTION_CONFIG_FILE_NAME
    )

    // Ensure connection config file exists.
    if (!fileExists(connectFilePath)) {
        return { error: `No file found at ${connectFilePath}` }
    }

    // Get existing config.
    let config
    try {
        config = toml.parse(fs.readFileSync(connectFilePath, 'utf-8')) || {}
    } catch (error) {
        return { error }
    }

    if (!config[env]) {
        return { error: `No environment named ${env} inside connect.toml` }
    }

    config[env].name = dbName
    return saveTomlConfigFile(connectFilePath, config)
}
