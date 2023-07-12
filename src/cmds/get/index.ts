import addGetABICmd from './abi'
import addGetGroupCmd from './group'
import addGroupEventsCmd from './events'

const CMD = 'get'

function addGetCmd(program) {
    const getCmd = program.command(CMD)
    addGetABICmd(getCmd)
    addGetGroupCmd(getCmd)
    addGroupEventsCmd(getCmd)
}

export default addGetCmd
