import netrc from 'netrc'
import { logFailure, log, logSuccess } from '../../logger'
import { getNetrcEntryId, getSessionToken } from '../../utils/auth'
import msg from '../../utils/msg'

const CMD = 'user'

function addUserCmd(cmd) {
    cmd.command(CMD).action(showUser)
}

/**
 * Show the current user.
 */
async function showUser() {
    const { token, error } = getSessionToken()
    if (error) {
        logFailure(error)
        return
    }
    if (!token) {
        log(msg.AUTH_REQUIRED_MESSAGE)
        return
    }

    const loginInfo = netrc()
    if (loginInfo[getNetrcEntryId()].password === token) {
        logSuccess(loginInfo[getNetrcEntryId()].login)
    }
}

export default addUserCmd
