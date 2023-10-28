import addMigrationCmd from './migration'
import addTableCmd from './table'
import chalk from 'chalk'

const CMD = 'new'

function addNewCmd(program) {
    const newCmd = program.command(CMD).description(chalk.gray('...'))
    addMigrationCmd(newCmd)
    addTableCmd(newCmd)
}

export default addNewCmd
