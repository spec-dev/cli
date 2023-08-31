import addCreateGroupCmd from './group'
import chalk from 'chalk'

const CMD = 'create'

function addCreateCmd(program) {
    const createGroup = program.command(CMD).description(chalk.gray('...'))
    addCreateGroupCmd(createGroup)
}

export default addCreateCmd
