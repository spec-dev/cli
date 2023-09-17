import { logSuccess, logFailure, logWarning, log } from '../../logger'
import { getCurrentProjectId, getCurrentProjectEnv, getProjectInfo } from '../../config/global'
import msg from '../../utils/msg'
import path from 'path'
import { fileExists } from '../../utils/file'
import constants from '../../constants'
import { installPostgraphile } from '../../addons/graphql'
import { createPostgraphileTemplate } from '../../templates'
import chalk from 'chalk'

const CMD = 'graphql'

function addEnableGraphQLCmd(cmd) {
    cmd.command(CMD)
        .description('Enable the GraphQL add-on for your Spec project')
        .action(enableGraphQL)
}

/**
 * Enable the GraphQL add-on for your Spec project.
 */
async function enableGraphQL() {
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

    installPostgraphile()
    createPostgraphileTemplate(specConfigDir)

    logSuccess('Successfully enabled GraphQL.')
}

export default addEnableGraphQLCmd
