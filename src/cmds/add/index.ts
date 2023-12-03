import addTableCmd from './table'
import chalk from 'chalk'

const CMD = 'add'

function addAddCmd(program) {
    const add = program.command(CMD).description(chalk.gray('...'))
    addTableCmd(add)
}

export default addAddCmd
