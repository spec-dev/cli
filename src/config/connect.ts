import { createFileWithContents, fileExists } from '../utils/file'
import constants from '../constants'
import toml from '@ltd/j-toml'
import fs from 'fs'
import { StringKeyMap } from '../types'

const TEMPLATE = `[db]
# Name of database to connect to.
name = ''
# Local database port to connect to.
port = 5432`

export const createSpecConnectionConfigFile = () =>
    createFileWithContents(constants.CONNECTION_CONFIG_PATH, TEMPLATE)

export const specConnectionConfigFileExists = (): boolean =>
    fileExists(constants.CONNECTION_CONFIG_PATH)

export function getDBConfig(): StringKeyMap {
    // Ensure connection config file exists.
    if (!specConnectionConfigFileExists()) {
        return { error: null }
    }

    const { data, error } = getConnectionConfig()
    if (error) return { error }

    return { data: data.db || null }
}

export function getConnectionConfig(): StringKeyMap {
    try {
        const data = toml.parse(fs.readFileSync(constants.CONNECTION_CONFIG_PATH, 'utf-8'))
        return { data }
    } catch (error) {
        return { error }
    }
}
