import { getCurrentProjectId, getProjectCreds } from '../../config/global'
import { log, logFailure, logSuccess } from '../../logger'
import msg from '../../utils/msg'

const CMD = 'project'

function addProjectCmd(cmd) {
    cmd.command(CMD).action(showProject)
}

/**
 * Show which project has been set as the *current* project.
 */
async function showProject() {
    // Get current project id.
    const { data: projectId, error } = getCurrentProjectId()
    if (error) {
        logFailure(error)
        return
    }
    if (!projectId) {
        log(msg.NO_CURRENT_PROJECT_MESSAGE)
        return
    }

    // Get project info from global spec creds file.
    const { data, error: infoError } = getProjectCreds(projectId)
    if (infoError) {
        logFailure(infoError)
        return
    }
    if (!data?.path) {
        log(msg.NO_CURRENT_PROJECT_MESSAGE)
        return
    }

    logSuccess(data.path)
}

export default addProjectCmd
