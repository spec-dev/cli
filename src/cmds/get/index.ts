import addGetAbiCmd from './abi'
import addGetGroupCmd from './group'
import addGetEventsCmd from './events'

const CMD = 'get'

function addGetCmd(program) {
    const getCmd = program.command(CMD)
    addGetAbiCmd(getCmd)
    addGetGroupCmd(getCmd)
    addGetEventsCmd(getCmd)
}

export default addGetCmd
