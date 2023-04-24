import { logFailure, logSuccess } from '../../logger'
import { saveState } from '../../config/global'

const CMD = 'env'

function addEnvCmd(cmd) {
    cmd.command(CMD)
        .argument('env', 'The project environment inside "connect.toml" to set as current.')
        .action(useEnv)
}

/**
 * Set the env for the current project.
 */
export async function useEnv(env: string) {
    /*
    TODO:
    ----
    1) Get the current project id from state.toml
    2) Resolve the full project from projects.toml
    3) Use the projects "location" to read connect.toml
    4) Validate the env exists in connect.toml before setting.
    */
    const { error: setEnvError } = saveState({ projectEnv: env })
    if (setEnvError) {
        logFailure(setEnvError)
        return
    }

    logSuccess(`Set current env to "${env}".`)
}

export default addEnvCmd
