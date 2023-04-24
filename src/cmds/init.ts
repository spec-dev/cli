import { specConfigDirExists } from '../config/dir'
import { createNewSpecConfig } from '../config'
import { log, logSuccess } from '../logger'
import { fileExists } from '../utils/file'
import path from 'path'
import constants from '../constants'
import fs from 'fs'

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

    // Add connect.toml to .gitignore if file exists.
    const gitignorePath = path.join(process.cwd(), '.gitignore')
    if (fileExists(gitignorePath)) {
        fs.appendFileSync(
            gitignorePath,
            `\n${path.join(constants.SPEC_CONFIG_DIR_NAME, constants.CONNECTION_CONFIG_FILE_NAME)}`
        )
    }

    logSuccess('Inititalized new Spec project.')
}

export default addInitCmd
