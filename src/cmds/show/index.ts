import addEnvCmd from './env'
import addLocationCmd from './location'
import addProjectCmd from './project'
import addUserCmd from './user'
import chalk from 'chalk'

const CMD = 'show'

function addShowCmd(program) {
    const show = program.command(CMD).description(chalk.gray('...'))
    addEnvCmd(show)
    addLocationCmd(show)
    addProjectCmd(show)
    addUserCmd(show)
}

export default addShowCmd
