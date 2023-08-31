import addInitCmd from './init'
import chalk from 'chalk'

const CMD = 'db'

function addDBCmd(program) {
    const db = program.command(CMD).description(chalk.gray('...'))
    addInitCmd(db)
}

export default addDBCmd
