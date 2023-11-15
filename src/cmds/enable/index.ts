import addEnableGraphQLCmd from './graphql'
import chalk from 'chalk'

const CMD = 'enable'

function addEnableCmd(program) {
    const enableCmd = program.command(CMD).description(chalk.gray('...'))
    addEnableGraphQLCmd(enableCmd)
}

export default addEnableCmd
