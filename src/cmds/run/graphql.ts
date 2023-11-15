import { logFailure, logWarning } from '../../logger'
import { getCurrentProjectId, getCurrentProjectEnv, getProjectInfo } from '../../config/global'
import { getDBConfig } from '../../config/connect'
import msg from '../../utils/msg'
import path from 'path'
import { fileExists } from '../../utils/file'
import constants from '../../constants'
import { isPostgraphileInstalled } from '../../addons/graphql'
import { doesPostgraphilercExist } from '../../templates/postgraphilercTemplate'
import { asPostgresUrl } from '../../utils/formatters'
import { resolveDBConnectionParams, specSchemaTablesExist } from '../../db'
import { startPostgraphile } from '../../addons/graphql'

const CMD = 'graphql'

function addRunGraphQLCmd(cmd) {
    cmd.command(CMD)
        .description('Start a local GraphQL API into your Spec database')
        .action(runGraphQL)
}

/**
 * Start a GraphQL API locally with your Spec database.
 */
async function runGraphQL() {
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

    // Get DB info from connection config file.
    let { data: dbConfig, error: getDBConfigError } = getDBConfig(projectDirPath, projectEnv)
    if (getDBConfigError) {
        logFailure(getDBConfigError)
        return
    }
    if (!dbConfig) {
        logWarning(
            `No environment named "${projectEnv}" inside ${constants.CONNECTION_CONFIG_FILE_NAME}.`
        )
        return
    }
    if (!dbConfig.name) {
        logWarning(
            `No database "name" specified for the "${projectEnv}" environment in ${constants.CONNECTION_CONFIG_FILE_NAME}.`
        )
        return
    }
    const { data: connParams, error: formatError } = resolveDBConnectionParams(dbConfig)
    if (formatError) {
        logWarning(`Invalid database environment "${projectEnv}" — ${formatError}`)
        return false
    }

    // Ensure database was already initialized for Spec.
    const url = asPostgresUrl(connParams)
    const { data: alreadyInitializedDb, error: schemaError } = specSchemaTablesExist(
        connParams.name,
        url
    )
    if (schemaError) {
        logFailure(schemaError)
        return false
    }
    if (!alreadyInitializedDb) {
        logWarning(msg.DB_NOT_INITIALIZED)
        return false
    }

    if (!isPostgraphileInstalled()) {
        logWarning(
            `Postgraphile currently isn't installed...is the GraphQL add-on enabled?\n` +
                `Run "spec enable graphql" and try again.`
        )
        return
    }

    if (!doesPostgraphilercExist(specConfigDir)) {
        logWarning(
            `No Postgraphile config was found for the current project...is the GraphQL add-on enabled?\n` +
                `Run "spec enable graphql" and try again.`
        )
        return
    }

    startPostgraphile(specConfigDir, url)
}

export default addRunGraphQLCmd
