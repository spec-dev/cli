import addContractsCmd from './contracts'
import addTableCmd from './table'
import chalk from 'chalk'

const CMD = 'add'

function addAddCmd(program) {
    const add = program.command(CMD).description(chalk.gray('...'))
    addContractsCmd(add)
    addTableCmd(add)
}

export default addAddCmd
