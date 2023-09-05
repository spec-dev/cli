import addEnvCmd from './env'
import addProjectCmd from './project'
import chalk from 'chalk'

const CMD = 'use'

function addUseCmd(program) {
    const use = program.command(CMD).description(chalk.gray('...'))
    addEnvCmd(use)
    addProjectCmd(use)
}

export default addUseCmd
