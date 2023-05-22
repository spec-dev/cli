import addEnvCmd from './env'
import addLocationCmd from './location'
import addProjectCmd from './project'

const CMD = 'show'

function addShowCmd(program) {
    const show = program.command(CMD)
    addEnvCmd(show)
    addLocationCmd(show)
    addProjectCmd(show)
}

export default addShowCmd
