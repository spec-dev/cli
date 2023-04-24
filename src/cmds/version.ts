import { log } from '../logger'
import { version as currentVersion } from '../version'

const CMD = 'version'

function addVersionCmd(program) {
    program.command(CMD).action(version)
}

/**
 * Show currently installed version of the CLI.
 */
async function version() {
    log(currentVersion)
}

export default addVersionCmd
