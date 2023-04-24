import addProjectCmd from './project'

const CMD = 'link'

function addUseCmd(program) {
    const use = program.command(CMD)
    addProjectCmd(use)
}

export default addUseCmd
