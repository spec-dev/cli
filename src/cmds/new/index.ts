import addMigrationCmd from './migration'
import addObjectCmd from './object'
import chalk from 'chalk'

const CMD = 'new'

function addNewCmd(program) {
    const newCmd = program.command(CMD).description(chalk.gray('...'))
    addMigrationCmd(newCmd)
    addObjectCmd(newCmd)
}

export default addNewCmd
