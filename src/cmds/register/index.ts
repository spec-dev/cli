import addContractCmd from './contract'

const CMD = 'register'

function addRegisterCmd(program) {
    const register = program.command(CMD)
    addContractCmd(register)
}

export default addRegisterCmd
