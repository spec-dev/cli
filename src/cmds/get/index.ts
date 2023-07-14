import addGetABICmd from './abi'
import addGetGroupCmd from './group'
import addGetEventsCmd from './events'

const CMD = 'get'

function addGetCmd(program) {
    const getCmd = program.command(CMD)
    addGetABICmd(getCmd)
    addGetGroupCmd(getCmd)
    addGetEventsCmd(getCmd)
}

export default addGetCmd
