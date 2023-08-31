import addInitCmd from './init'

const CMD = 'db'

function addDBCmd(program) {
    const db = program.command(CMD).description('...')
    addInitCmd(db)
}

export default addDBCmd
