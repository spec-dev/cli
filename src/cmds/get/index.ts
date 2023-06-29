import addGetABICmd from './abi'
import addGetGroupCmd from './group'

const CMD = 'get'

function addGetCmd(program) {
    const getCmd = program.command(CMD)
    addGetABICmd(getCmd)
    addGetGroupCmd(getCmd)
}

export default addGetCmd
