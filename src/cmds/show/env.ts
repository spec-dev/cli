import { getCurrentEnv } from '../../config/global'
import { logFailure, logSuccess } from '../../logger'

const CMD = 'env'

function addEnvCmd(cmd) {
    cmd.command(CMD).action(showEnv)
}

/**
 * Show the currently configured Spec API environment.
 */
async function showEnv() {
    // Get current env from global state file.
    const { data: currentEnv, error } = getCurrentEnv()
    if (error) {
        logFailure(error)
        return
    }

    logSuccess(currentEnv)
}

export default addEnvCmd
