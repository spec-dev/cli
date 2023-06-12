import addContractsCmd from './contracts'

const CMD = 'register'

function addRegisterCmd(program) {
    const register = program.command(CMD)
    addContractsCmd(register)
}

export default addRegisterCmd
