import path from 'path'
import { logFailure, logWarning } from '../logger'
import { getDBConfig } from '../config/connect'
import {
    getProjectCreds,
    getCurrentProjectId,
    getCurrentProjectEnv,
    getProjectInfo,
} from '../config/global'
import { initDatabase, psqlInstalled } from '../db'
import { specClientInstalled, startSpec } from '../utils/client'
import msg from '../utils/msg'
import constants from '../constants'
import parsePostgresUrl from 'parse-database-url'
import { fileExists } from '../utils/file'

const CMD = 'start'

function addStartCmd(program) {
    program
        .command(CMD)
        .option('--url <type>', 'Run Spec against a specific Postgres url.')
        .action(start)
}

/**
 * Start Spec locally, connecting to your local Postgres database.
 */
export async function start(options) {
    // Get the current project id.
    const { data: projectId, error } = getCurrentProjectId()
    if (error) {
        logFailure(error)
        return
    }
    if (!projectId) {
        logWarning(msg.CHOOSE_PROJECT_MESSAGE)
        return
    }

    // Get the current project env (local, staging, prod, etc).
    const { data: projectEnv, error: getEnvError } = getCurrentProjectEnv()
    if (getEnvError) {
        logFailure(error)
        return
    }
    if (!projectEnv) {
        logWarning(msg.NO_CURRENT_ENV_MESSAGE)
        return
    }

    // Get the location of the project (/path/to/project)
    const { data: projectInfo, error: getProjectError } = getProjectInfo(projectId)
    if (getProjectError) {
        logFailure(error)
        return
    }
    const { location: projectDirPath } = projectInfo || {}
    if (!projectDirPath) {
        logWarning(msg.NO_PROJECT_LOCATION)
        return
    }
    const specConfigDir = path.join(projectDirPath, constants.SPEC_CONFIG_DIR_NAME)
    if (!fileExists(specConfigDir)) {
        logWarning(`Spec config directory doesn't exist at ${specConfigDir}.`)
        return
    }

    // Get the current project credentials from the global creds file.
    const { data: creds, error: credsError } = getProjectCreds(projectId)
    if (credsError) {
        logFailure(`Error finding project credentials: ${credsError}`)
        return
    }
    if (!creds?.apiKey) {
        logWarning(msg.CHOOSE_PROJECT_MESSAGE)
        return
    }

    // Get DB info from connection config file.
    let { data: dbConfig, error: getDBConfigError } = getDBConfig(projectDirPath, projectEnv)
    if (getDBConfigError) {
        logFailure(getDBConfigError)
        return
    }

    // Override db config with given --url option if provided.
    if (options.url) {
        if (!options.url.startsWith('postgres')) {
            logWarning(msg.MUST_BE_PG_URL)
            return
        }
        dbConfig = parsePostgresUrl(options.url)
        dbConfig.name = dbConfig.database
    }
    if (!dbConfig?.name && !options.url) {
        logWarning(msg.POPULATE_DB_CONN_CONFIG_MESSAGE)
        return
    }

    // Ensure psql is installed.
    if (!psqlInstalled()) {
        logWarning(msg.INSTALL_PSQL)
        return
    }

    // Ensure spec-client is installed.
    if (!specClientInstalled()) {
        logWarning(msg.INSTALL_SPEC_CLIENT)
        return
    }

    // Initialize database for usage with Spec.
    const { newlyAssignedPassword, error: initDBError } = await initDatabase(
        dbConfig.name,
        options.url
    )
    if (initDBError) {
        logFailure(`Error initializing database: ${initDBError}`)
        return
    }
    if (newlyAssignedPassword) {
        dbConfig.user = constants.SPEC_DB_USER
        dbConfig.password = newlyAssignedPassword
    }

    // Run the Spec client.
    const { error: startError } = await startSpec(projectId, specConfigDir, creds.apiKey, dbConfig)
    if (startError) {
        logFailure(`Error starting Spec: ${startError}`)
    }
}

export default addStartCmd
