import addContractsCmd from './contracts'
import chalk from 'chalk'

const CMD = 'add'

function addAddCmd(program) {
    const add = program.command(CMD).description(chalk.gray('...'))
    addContractsCmd(add)
}

export default addAddCmd
