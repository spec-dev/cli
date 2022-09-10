import { specConfigDirExists, createNewSpecConfig } from '../utils/file'
import { log, logSuccess } from '../logger'

const CMD = 'init'

function addInitCmd(program) {
    program.command(CMD).action(init)
}

/**
 * Initialize a new Spec project locally.
 */
async function init() {
    if (specConfigDirExists()) {
        log('Spec project already initialized.')
        return
    }
    createNewSpecConfig()
    logSuccess('Inititalized new Spec project.')
}

export default addInitCmd
