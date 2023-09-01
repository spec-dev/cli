import { logSuccess, logFailure } from '../logger'
import { deleteSession } from '../utils/auth'

const CMD = 'logout'

function addLogoutCmd(program) {
    program.command(CMD).description('Log out of your Spec account').action(logout)
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
