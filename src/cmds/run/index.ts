import addRunGraphQLCmd from './graphql'
import chalk from 'chalk'

const CMD = 'run'

function addRunCmd(program) {
    const runCmd = program.command(CMD).description(chalk.gray('...'))
    addRunGraphQLCmd(runCmd)
}

export default addRunCmd
