import addProjectCmd from './project'

const CMD = 'show'

function addShowCmd(program) {
    const show = program.command(CMD)
    addProjectCmd(show)
}

export default addShowCmd
