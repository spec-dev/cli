import { logSuccess, logFailure, logWarning, log } from '../logger'
import { getCurrentProjectId } from '../config/global'
import { stopSpec } from '../utils/docker'
import msg from '../utils/msg'

const CMD = 'stop'

function addStopCmd(program) {
    program.command(CMD).action(stop)
}

/**
 * Stop Spec from running locally.
 */
async function stop() {
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

    log('Stopping Spec...')

    // Stop container.
    const { error: stopError } = stopSpec(projectId)
    if (stopError) {
        logFailure(stopError)
        return
    }

    logSuccess('Successfully stopped Spec.')
}

export default addStopCmd
