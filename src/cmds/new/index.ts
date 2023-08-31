import addMigrationCmd from './migration'
import addObjectCmd from './object'

const CMD = 'new'

function addNewCmd(program) {
    const newCmd = program.command(CMD).description('...')
    addMigrationCmd(newCmd)
    addObjectCmd(newCmd)
}

export default addNewCmd
