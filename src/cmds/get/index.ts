import addGetAbiCmd from './abi'
import addGetGroupCmd from './group'
import addGetEventsCmd from './events'
import chalk from 'chalk'

const CMD = 'get'

function addGetCmd(program) {
    const getCmd = program.command(CMD).description(chalk.gray('...'))
    addGetAbiCmd(getCmd)
    addGetGroupCmd(getCmd)
    addGetEventsCmd(getCmd)
}

export default addGetCmd
