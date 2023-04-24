import addEnvCmd from './env'
import addProjectCmd from './project'

const CMD = 'show'

function addShowCmd(program) {
    const show = program.command(CMD)
    addEnvCmd(show)
    addProjectCmd(show)
}

export default addShowCmd
