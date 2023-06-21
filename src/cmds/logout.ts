import { logSuccess, logFailure } from '../logger'
import { deleteSession } from '../utils/auth'

const CMD = 'logout'

function addLogoutCmd(program) {
    program.command(CMD).action(logout)
}

/**
 * Logout of Spec.
 */
async function logout() {
    const { error } = deleteSession()
    if (error) {
        logFailure(error)
        return
    }
    logSuccess('Successfully logged out.')
}

export default addLogoutCmd
