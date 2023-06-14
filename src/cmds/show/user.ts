import { logSuccess } from '../../logger'

const CMD = 'user'

function addUserCmd(cmd) {
    cmd.command(CMD).action(showLocation)
}

async function showLocation() {
    logSuccess('seeing this route')
}

export default addUserCmd
