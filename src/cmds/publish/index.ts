import addObjectCmd from './object'

const CMD = 'publish'

function addPublishCmd(program) {
    const newCmd = program.command(CMD)
    addObjectCmd(newCmd)
}

export default addPublishCmd
