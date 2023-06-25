import addContractsCmd from './contracts'

const CMD = 'add'

function addAddCmd(program) {
    const add = program.command(CMD)
    addContractsCmd(add)
}

export default addAddCmd
