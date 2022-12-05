import { logSuccess, logFailure, logWarning, log } from '../logger'
import { getDBConfig } from '../config/connect'
import { getProjectCreds, getCurrentProjectId } from '../config/global'
import { ensureDockerInstalled, ensureDockerRunning, runSpec, isSpecRunning } from '../utils/docker'
import { initDatabase } from '../db'
import { parseEnvArg } from '../utils/env'
import { StringKeyMap } from '../types'
import msg from '../utils/msg'

const CMD = 'start'

function addStartCmd(program) {
    program
        .command(CMD)
        .option('-e, --env-var [envVars...]', 'Environment variable in KEY=VALUE format')
        .action(start)
}

/**
 * Start Spec locally, connecting to your local Postgres database.
 */
export async function start(options) {
    // Get current project id.
    const { data: projectId, error } = getCurrentProjectId()
    if (error) {
        logFailure(error)
        return
    }
    if (!projectId) {
        logWarning(msg.CHOOSE_PROJECT_MESSAGE)
        return
    }

    // Get current project credentials from global spec creds file.
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
    const { data: dbConfig, error: getDBConfigError } = getDBConfig()
    if (getDBConfigError) {
        logFailure(getDBConfigError)
        return
    }
    if (!dbConfig?.name) {
        logWarning(msg.POPULATE_DB_CONN_CONFIG_MESSAGE)
        return
    }

    // Ensure Docker is installed.
    const isDockerInstalled = ensureDockerInstalled()
    if (!isDockerInstalled) {
        logWarning(msg.INSTALL_DOCKER)
        return
    }

    // Ensure Docker is running.
    const isDockerRunning = ensureDockerRunning()
    if (!isDockerRunning) {
        logWarning(msg.RUN_DOCKER)
        return
    }

    // Make sure Spec isn't already running.
    if (isSpecRunning(projectId)) {
        logWarning('Spec is already running.\nRun "spec stop" to stop the current instance.')
        return
    }

    // Initialize database with Spec user/schema.
    const { error: initDBError } = await initDatabase(dbConfig.name)
    if (initDBError) {
        logFailure(`Error initializing database: ${initDBError}`)
        return
    }

    log('Starting Spec...')

    // Run the Spec docker image.
    const { error: dockerError } = runSpec(
        projectId,
        dbConfig.name,
        dbConfig.port,
        creds.apiKey,
        parseEnvVarOptions(options)
    )
    if (dockerError) {
        logFailure(`Error starting Spec docker image: ${dockerError}`)
        return
    }

    logSuccess('Successfully started Spec.')
}

function parseEnvVarOptions(options: StringKeyMap): StringKeyMap {
    const envVarArgs = (options.envVar || [])
        .filter((v) => !!v)
        .map((v) => parseEnvArg(v))
        .filter((v) => !!v)

    const envVarsMap = {}
    for (const [name, value] of envVarArgs) {
        envVarsMap[name] = value
    }
    return envVarsMap
}

export default addStartCmd
