import { logFailure, log, logSuccess } from '../../logger'
import { getSessionLogin } from '../../utils/auth'
import msg from '../../utils/msg'

const CMD = 'user'

function addUserCmd(cmd) {
    cmd.command(CMD).description('Show the current user').action(showUser)
}

/**
 * Show the current user.
 */
async function showUser() {
    const { login, error } = getSessionLogin()
    if (error) {
        logFailure(error)
        return
    }
    if (!login) {
        log(msg.AUTH_REQUIRED_MESSAGE)
        return
    }
    logSuccess(login)
}

export default addUserCmd
