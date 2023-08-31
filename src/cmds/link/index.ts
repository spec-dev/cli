import addProjectCmd from './project'
import chalk from 'chalk'

const CMD = 'link'

function addUseCmd(program) {
    const use = program.command(CMD).description(chalk.gray('...'))
    addProjectCmd(use)
}

export default addUseCmd
