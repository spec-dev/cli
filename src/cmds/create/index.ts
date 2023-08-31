import addCreateGroupCmd from './group'

const CMD = 'create'

function addCreateCmd(program) {
    const createGroup = program.command(CMD).description('...')
    addCreateGroupCmd(createGroup)
}

export default addCreateCmd
