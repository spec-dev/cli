import { createFileWithContents, fileExists } from '../utils/file'
import constants from '../constants'
import toml from '@ltd/j-toml'
import fs from 'fs'
import path from 'path'
import { StringKeyMap } from '../types'
import parsePostgresUrl from 'parse-database-url'

const initialTemplate = (
    name: string = '',
    port: number = 5432,
    host: string = 'localhost',
    user: string = '',
    password: string = ''
) =>
    `# Local database
[local]
name = '${name}'
port = ${port}
host = '${host}'
user = '${user}'
password = '${password}'`

export const createSpecConnectionConfigFile = (specConfigDir?: string, defaultDbUrl?: string) => {
    let contents = initialTemplate()
    if (defaultDbUrl) {
        const connParams = parsePostgresUrl(defaultDbUrl) || {}
        const { database, host, port, user, password } = connParams
        contents = initialTemplate(database, Number(port), host, user, password)
    }
    createFileWithContents(
        path.join(
            specConfigDir || constants.SPEC_CONFIG_DIR,
            constants.CONNECTION_CONFIG_FILE_NAME
        ),
        contents
    )
}

export const specConnectionConfigFileExists = (): boolean =>
    fileExists(constants.CONNECTION_CONFIG_PATH)

export function getDBConfig(): StringKeyMap {
    // Ensure connection config file exists.
    if (!specConnectionConfigFileExists()) {
        return { error: null }
    }

    const { data, error } = getConnectionConfig()
    if (error) return { error }

    return { data: data.local || null }
}

export function getConnectionConfig(): StringKeyMap {
    try {
        const data = toml.parse(fs.readFileSync(constants.CONNECTION_CONFIG_PATH, 'utf-8'))
        return { data }
    } catch (error) {
        return { error }
    }
}
