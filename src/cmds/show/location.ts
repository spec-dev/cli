import { getCurrentProjectId, getProjectInfo } from '../../config/global'
import { logFailure, logSuccess, logWarning } from '../../logger'
import msg from '../../utils/msg'

const CMD = 'location'

function addLocationCmd(cmd) {
    cmd.command(CMD).description('Show the current project location').action(showLocation)
}

/**
 * Show the current project location.
 */
async function showLocation() {
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

    // Get the location of the project (/path/to/project)
    const { data: projectInfo, error: getProjectError } = getProjectInfo(projectId)
    if (getProjectError) {
        logFailure(error)
        return
    }
    const { location } = projectInfo || {}
    if (!location) {
        logWarning(msg.NO_PROJECT_LOCATION)
        return
    }

    logSuccess(location)
}

export default addLocationCmd
