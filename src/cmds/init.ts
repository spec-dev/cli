import { createNewSpecConfig } from '../config'
import { log, logSuccess } from '../logger'
import { fileExists, getFileLines } from '../utils/file'
import { localConnectConfigFileExists } from '../config/connect'
import path from 'path'
import constants from '../constants'
import fs from 'fs'
import { localProjectConfigFileExists } from '../config/project'

const CMD = 'init'

function addInitCmd(program) {
    program.command(CMD).description('Initialize a new Spec project').action(init)
}

/**
 * Initialize a new Spec project locally.
 */
async function init() {
    const connectConfigExists = localConnectConfigFileExists()
    const projectConfigExists = localProjectConfigFileExists()
    if (connectConfigExists && projectConfigExists) {
        log('Project already initialized.')
        return
    }

    // Create new Spec config directory + project/connection config files.
    createNewSpecConfig()

    // Add connect.toml to .gitignore if file exists.
    const gitignorePath = path.join(process.cwd(), '.gitignore')
    if (fileExists(gitignorePath)) {
        const lines = getFileLines(gitignorePath)
        const connectLine = `${path.join(
            constants.SPEC_CONFIG_DIR_NAME,
            constants.CONNECTION_CONFIG_FILE_NAME
        )}`
        const alreadyIgnored = lines.find((line) => line.includes(connectLine))
        alreadyIgnored || fs.appendFileSync(gitignorePath, `\n${connectLine}`)
    }

    const completelyNew = !connectConfigExists && !projectConfigExists
    logSuccess(completelyNew ? 'Inititalized new Spec project.' : 'Reinitialized Spec project.')
}

export default addInitCmd
