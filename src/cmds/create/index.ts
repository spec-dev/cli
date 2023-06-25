import addCreateGroupCmd from './group'

const CMD = 'create'

function addCreateCmd(program) {
    const createGroup = program.command(CMD)
    addCreateGroupCmd(createGroup)
}

export default addCreateCmd
