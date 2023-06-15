import netrc from 'netrc'
import { logFailure, logSuccess } from '../../logger'
import { getNetrcEntryId, getSessionToken } from '../../utils/auth'

const CMD = 'user'

function addUserCmd(cmd) {
    cmd.command(CMD).action(showUser)
}

/**
 * Show the current user.
 */
async function showUser() {
    const { token, error } = getSessionToken()
    if (!token || error) {
        logFailure('No current user is set. Try running "spec login"')
        return
    }

    const loginInfo = netrc()
    if (loginInfo[getNetrcEntryId()].password === token) {
        logSuccess(loginInfo[getNetrcEntryId()].login)
    }
}

export default addUserCmd
