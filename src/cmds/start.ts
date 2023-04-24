import { logFailure, logWarning, log, logSuccess } from '../logger'
import { getDBConfig } from '../config/connect'
import { getProjectCreds, getCurrentProjectId } from '../config/global'
import {
    ensureDockerInstalled,
    ensureDockerComposeInstalled,
    ensureDockerRunning,
    startSpec,
} from '../utils/docker'
import { initDatabase, psqlInstalled } from '../db'
import { specClientInstalled } from '../utils/client'
import msg from '../utils/msg'
import open from 'open'
import constants from '../constants'
import { installCustomPackages } from '../config/custom'
import { newPassword } from '../utils/pw'
import parsePostgresUrl from 'parse-database-url'

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
    let { data: dbConfig, error: getDBConfigError } = getDBConfig()
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

    // Ensure Docker is installed.
    const isDockerInstalled = ensureDockerInstalled()
    if (!isDockerInstalled) {
        logWarning(msg.INSTALL_DOCKER)
        return
    }

    // Ensure docker-compose is installed.
    const isDockerComposeInstalled = ensureDockerComposeInstalled()
    if (!isDockerComposeInstalled) {
        logWarning(msg.INSTALL_DOCKER_COMPOSE)
        return
    }

    // Ensure Docker is running.
    const isDockerRunning = ensureDockerRunning()
    if (!isDockerRunning) {
        logWarning(msg.RUN_DOCKER)
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

    // // Make sure Spec isn't already running.
    // if (isSpecRunning(projectId)) {
    //     logWarning('Spec is already running.\nRun "spec stop" to spin everything down.')
    //     return
    // }

    // Install any custom modules (handlers, hooks, transforms).
    const { error: customPkgInstallationError } = installCustomPackages()
    if (customPkgInstallationError) {
        logFailure(customPkgInstallationError)
        return
    }

    // Initialize database with Spec user/schema.
    const { newlyAssignedPassword, error: initDBError } = await initDatabase(
        dbConfig.name,
        options.url
    )
    if (initDBError) {
        logFailure(`Error initializing database: ${initDBError}`)
        return
    }

    // Start all components of Spec.
    const { error: startError } = await startSpec(
        projectId,
        creds.apiKey,
        dbConfig,
        newlyAssignedPassword || null
    )
    if (startError) {
        logFailure(`Error starting Spec: ${startError}`)
        return
    }

    // Open the Spec dashboard.
    open(constants.SPEC_DASHBOARD_URL)

    logSuccess(`Successfully started Spec.`)
}

export default addStartCmd
