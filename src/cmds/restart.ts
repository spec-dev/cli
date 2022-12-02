import { logFailure, logWarning, log } from '../logger'
import { getCurrentProjectId } from '../config/global'
import { isSpecRunning, stopSpec } from '../utils/docker'
import msg from '../utils/msg'
import { start } from './start'

const CMD = 'restart'

function addRestartCmd(program) {
    program.command(CMD).action(restart)
}

/**
 * Restart locally running version of Spec.
 */
async function restart() {
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

    // Stop Spec if running.
    if (isSpecRunning(projectId)) {
        log('Stopping Spec...')
        const { error: stopError } = stopSpec(projectId)
        if (stopError) {
            logFailure(stopError)
            return
        }
    }

    await start()
}

export default addRestartCmd
