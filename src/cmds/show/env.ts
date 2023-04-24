import { getCurrentProjectEnv } from '../../config/global'
import { logFailure, logSuccess } from '../../logger'

const CMD = 'env'

function addEnvCmd(cmd) {
    cmd.command(CMD).action(showEnv)
}

/**
 * Show the current project environment.
 */
async function showEnv() {
    const { data: env, error } = getCurrentProjectEnv()
    if (error) {
        logFailure(error)
        return
    }
    logSuccess(env)
}

export default addEnvCmd
