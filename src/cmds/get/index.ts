import addGetAbiCmd from './abi'
import addGetGroupCmd from './group'
import addGetEventsCmd from './events'
import addGetEventCmd from './event'
import chalk from 'chalk'

const CMD = 'get'

function addGetCmd(program) {
    const getCmd = program.command(CMD).description(chalk.gray('...'))
    addGetAbiCmd(getCmd)
    addGetGroupCmd(getCmd)
    addGetEventsCmd(getCmd)
    addGetEventCmd(getCmd)
}

export default addGetCmd
