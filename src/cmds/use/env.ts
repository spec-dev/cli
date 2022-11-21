import { setCurrentEnv } from '../../config/global'
import { log, logFailure, logSuccess, logWarning } from '../../logger'
import { SpecEnv } from '../../types'

const CMD = 'env'

function addEnvCmd(cmd) {
    cmd.command(CMD).argument('env', "Spec API environment to use ('dev' or 'prod')").action(useEnv)
}

/**
 * Specify which of Spec's API environments to communicate with.
 */
async function useEnv(env: SpecEnv) {
    // Validate env arg.
    const acceptedEnvs = Object.values(SpecEnv)
    if (!acceptedEnvs.includes(env)) {
        logWarning(`Unsupported environment "${env}".`)
        log(`Accepted values: ${acceptedEnvs.join(', ')}`)
        return
    }

    // Set current env in global state file.
    const { error } = setCurrentEnv(env)
    if (error) {
        logFailure(error)
        return
    }

    logSuccess(`Switched to env: ${env}`)
}

export default addEnvCmd
