import addProjectCmd from './project'

const CMD = 'link'

function addUseCmd(program) {
    const use = program.command(CMD).description('...')
    addProjectCmd(use)
}

export default addUseCmd
