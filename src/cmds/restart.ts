import { logFailure, logWarning, log } from '../logger'
import { getCurrentProjectId } from '../config/global'
import { stopSpec } from '../utils/docker'
import msg from '../utils/msg'
import { start } from './start'

const CMD = 'restart'

function addRestartCmd(program) {
    program
        .command(CMD)
        .option('--url <type>', 'Run Spec against a specific Postgres url.')
        .action(restart)
}

/**
 * Restart locally running version of Spec.
 */
async function restart(options) {
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

    // // Stop Spec if running.
    // if (isSpecRunning(projectId)) {
    //     log('Stopping Spec...')
    //     const { error: stopError } = stopSpec(projectId)
    //     if (stopError) {
    //         logFailure(stopError)
    //         return
    //     }
    // }

    await start(options)
}

export default addRestartCmd
