import addObjectCommand from './object'
import chalk from 'chalk'

const CMD = 'test'

function addTestCmd(program) {
    const test = program.command(CMD).description(chalk.gray('...'))
    addObjectCommand(test)
}

export default addTestCmd
