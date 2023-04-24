import addObjectCommand from './object'

const CMD = 'test'

function addTestCmd(program) {
    const test = program.command(CMD)
    addObjectCommand(test)
}

export default addTestCmd
