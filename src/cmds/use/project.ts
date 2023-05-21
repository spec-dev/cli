import { repoPathToComponents } from '../../utils/formatters'
import { logWarning, logFailure, logSuccess } from '../../logger'
import { client } from '../../api/client'
import msg from '../../utils/msg'
import { saveProjectCreds, saveState, DEFAULT_PROJECT_ENV } from '../../config/global'
import { getSessionToken } from '../../utils/auth'

const CMD = 'project'

function addProjectCmd(cmd) {
    cmd.command(CMD)
        .argument('project', 'Spec project to use in <namespace>/<project> format')
        .action(useProject)
}

/**
 * Set a Spec project as the "current" project.
 */
export async function useProject(projectPath: string, logResult: boolean = true) {
    // Split input into namespace/project.
    const pathComps = repoPathToComponents(projectPath)
    if (!pathComps) {
        logWarning('Please specify the project in <namespace>/<project> format.')
        return
    }
    const [nsp, projectName] = pathComps

    // Get authed user's session token (if any).
    const { token, error } = getSessionToken()
    if (error) {
        logFailure(error)
        return
    }
    if (!token) {
        logWarning(msg.AUTH_REQUIRED_MESSAGE)
        return
    }

    // Resolve user's project by nsp/name.
    const {
        id,
        name,
        namespace,
        apiKey,
        metadata,
        error: apiError,
    } = await client.getProject(nsp, projectName, token)
    if (apiError) {
        logFailure(`Failed to resolve project ${projectPath}: ${apiError}`)
        return
    }
    if (!id || !name || !namespace || !apiKey) {
        logFailure(
            `Failed to resolve project with ${projectPath}.\n
            Couldn't resolve all necessary project attributes:\n
            id=${id}\n
            name=${name}\n 
            namespace=${namespace}\n
            apiKey=${apiKey}`
        )
        return
    }

    // Save project id and api key to global creds file.
    const { error: saveCredsError } = saveProjectCreds(namespace, name, id, apiKey)
    if (saveCredsError) {
        logFailure(saveCredsError)
        return
    }

    // Set current project id in global state.
    const { error: setProjectIdError } = saveState({
        projectId: id,
        projectEnv: DEFAULT_PROJECT_ENV,
    })
    if (setProjectIdError) {
        logFailure(setProjectIdError)
        return
    }

    logResult && logSuccess(`Switched to project: ${namespace}/${name}`)
    return { id, metadata }
}

export default addProjectCmd
