import netrc from 'netrc'
import { logSuccess, logFailure } from '../logger'
import { getNetrcEntryId, getSessionToken } from '../utils/auth'

const CMD = 'logout'

function addLogoutCmd(program) {
    program.command(CMD).action(logout)
}

/**
 * Logout of Spec.
 */
async function logout() {
    const { token, error } = getSessionToken()
    if (!token || error) {
        logFailure('You can not logout because you are not logged in.')
        return
    }

    const entries = netrc()
    delete entries[getNetrcEntryId()]
    netrc.save(entries)
    logSuccess('Successfully logged out.')
}

export default addLogoutCmd
