import { logFailure, logSuccess } from '../logger'
import { client } from '../api/client'
import { log } from '../logger'
import constants from '../constants'
import { repoPathToComponents } from '../utils/formatters'
import { setProject, specProjectConfigFileExists } from '../config/project'
import { saveProjectCreds } from '../config/global'
import { getSessionToken } from '../utils/auth'

const CMD = 'link'

function addLinkCmd(program) {
    program
        .command(CMD)
        .requiredOption('-p, --project <org>/<name>', 'Remote Spec project')
        .action(link)
}

/**
 * Link a local project to a hosted Spec project.
 */
async function link({ project: projectPath }) {
    // Split input into org/project.
    const pathComps = repoPathToComponents(projectPath)
    if (!pathComps) {
        log('Please specify the project in <org-name>/<project-name> format.')
        return
    }
    const [orgName, projectName] = pathComps

    // Get authed user's session token (if any).
    const { token, error } = getSessionToken()
    if (error) {
        logFailure(error)
        return
    }
    if (!token) {
        log(constants.AUTH_REQUIRED_MESSAGE)
        return
    }

    // Ensure spec project config file exists.
    if (!specProjectConfigFileExists()) {
        log(constants.INIT_PROJECT_MESSAGE)
        return
    }

    // Resolve user's project by org/name.
    const {
        id,
        name,
        org,
        apiKey,
        error: apiError,
    } = await client.linkProject(orgName, projectName, token)
    if (apiError) {
        logFailure(`Failed to resolve project ${projectPath}: ${apiError}`)
        return
    }
    if (!id || !name || !org || !apiKey) {
        logFailure(
            `Failed to resolve project with ${projectPath}.\n
            Couldn't resolve all necessary project attributes:\n
            id=${id}\n
            name=${name}\n
            org=${org}\n
            apiKey=${apiKey}`
        )
        return
    }

    // Update project section of config.
    const { error: setProjectError } = setProject(id, org, name)
    if (setProjectError) {
        logFailure(`Failed to link project: ${setProjectError}`)
        return
    }

    // Save project id and api key to global creds file.
    const { error: saveCredsError } = saveProjectCreds(org, name, id, apiKey)
    if (saveCredsError) {
        logFailure(`Failed to link project: ${saveCredsError}`)
        return
    }

    logSuccess(`Successfully linked to project ${org}/${name}.`)
}

export default addLinkCmd
