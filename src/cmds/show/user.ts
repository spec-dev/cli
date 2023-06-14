import { log } from '../../logger'

const CMD = 'user'

function addUserCmd(cmd) {
    cmd.command(CMD).action(showUser)
}

/**
 * Show the current user.
 */
async function showUser() {
    // if user logged in
    // log(username)
    // else
    // log(No current user is set. Try running "spec login")
    log('No current user is set. Try running "spec login"')
}

export default addUserCmd
