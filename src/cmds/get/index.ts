import addGetABICmd from './abi'
import addGetGroupCmd from './group'
import addGetEventsCmd from './events'
import addGetEventCmd from './event'

const CMD = 'get'

function addGetCmd(program) {
    const getCmd = program.command(CMD)
    addGetABICmd(getCmd)
    addGetGroupCmd(getCmd)
    addGetEventsCmd(getCmd)
    addGetEventCmd(getCmd)
}

export default addGetCmd
