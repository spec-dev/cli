import addInitCmd from './init'

const CMD = 'db'

function addDBCmd(program) {
    const db = program.command(CMD)
    addInitCmd(db)
}

export default addDBCmd
