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
