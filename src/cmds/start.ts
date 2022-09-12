import { logSuccess, logFailure, log } from '../logger'
import { getDBConfig } from '../config/connect'
import { getCurrentProject } from '../config/project'
import { getProjectCreds } from '../config/global'
import { ensureDockerInstalled, ensureDockerRunning, runSpec, isSpecRunning } from '../utils/docker'
import constants from '../constants'
import { initDatabase } from '../db'

const CMD = 'start'

function addStartCmd(program) {
    program.command(CMD).action(start)
}

/**
 * Start Spec locally, connecting to your local Postgres database.
 */
async function start() {
    log('Resolving linked project...')

    // Get currently linked project info.
    const { data: project, error } = getCurrentProject()
    if (error) {
        logFailure(error)
        return
    }
    if (!project || !project.id) {
        log(constants.LINK_PROJECT_MESSAGE)
        return
    }

    // Get DB info from connection config file.
    const { data: dbConfig, error: getDBConfigError } = getDBConfig()
    if (getDBConfigError) {
        logFailure(getDBConfigError)
        return
    }
    if (!dbConfig || !dbConfig.name) {
        log(constants.POPULATE_DB_CONN_CONFIG_MESSAGE)
        return
    }

    // Get project credentials from global spec creds file.
    const { data: creds, error: credsError } = getProjectCreds(project.id)
    if (credsError) {
        logFailure(`Error finding project credentials: ${credsError}`)
        return
    }
    if (!creds || !creds.apiKey) {
        log(constants.LINK_PROJECT_MESSAGE)
        return
    }

    // Ensure Docker is installed.
    const isDockerInstalled = ensureDockerInstalled()
    if (!isDockerInstalled) {
        log(constants.INSTALL_DOCKER)
        return
    }

    // Ensure Docker is running.
    const isDockerRunning = ensureDockerRunning()
    if (!isDockerRunning) {
        log(constants.RUN_DOCKER)
        return
    }

    // Make sure Spec isn't already running.
    if (isSpecRunning(project.id)) {
        log('Spec is already running.')
        return
    }

    log('Initializing database...')

    // Initialize database with Spec user/schema.
    const { error: initDBError } = initDatabase(dbConfig.name)
    if (initDBError) {
        logFailure(`Error initializing database: ${initDBError}`)
        return
    }

    log('Starting Spec...')

    // Run the Spec docker image.
    const { error: dockerError } = runSpec(project.id, dbConfig.name, dbConfig.port)
    if (dockerError) {
        logFailure(`Error starting Spec docker image: ${dockerError}`)
        return
    }

    logSuccess('Successfully started Spec.')
}

export default addStartCmd
