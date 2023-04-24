import addEnvCmd from './env'
import addProjectCmd from './project'

const CMD = 'use'

function addUseCmd(program) {
    const use = program.command(CMD)
    addEnvCmd(use)
    addProjectCmd(use)
}

export default addUseCmd
