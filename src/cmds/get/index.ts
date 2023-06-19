import addGetABICmd from './abi'

const CMD = 'get'

function addGetCmd(program) {
    const getAbi = program.command(CMD)
    addGetABICmd(getAbi)
}

export default addGetCmd
