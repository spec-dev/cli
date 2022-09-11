import { specConfigDirExists } from '../config/dir'
import { createNewSpecConfig } from '../config'
import { log, logSuccess } from '../logger'

const CMD = 'init'

function addInitCmd(program) {
    program.command(CMD).action(init)
}

/**
 * Initialize a new Spec project locally.
 */
async function init() {
    // Ensure Spec config directory doesn't already exist.
    if (specConfigDirExists()) {
        log('Spec project already initialized.')
        return
    }

    // Create new Spec config directory + project/connection config files.
    createNewSpecConfig()
    logSuccess('Inititalized new Spec project.')
}

export default addInitCmd
