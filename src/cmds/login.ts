import { logSuccess, logFailure } from '../logger'
import { client } from '../api/client'
import { promptEmailPassword } from '../utils/prompt'
import { persistSession } from '../utils/auth'

const CMD = 'login'

function addLoginCmd(program) {
    program.command(CMD).action(login)
}

/**
 * Login to Spec with email/password.
 */
async function login() {
    // Prompt user for email/password.
    const { email, password } = await promptEmailPassword()

    // Exchange email/password for a new session token.
    const { message, sessionToken, error } = await client.login(email, password)
    if (error) {
        logFailure(`Login failed: ${error}`)
        return
    }
    if (!sessionToken) {
        logFailure('Login failed: No session found in response.')
        return
    }

    // Save session token to .netrc
    const { error: saveError } = persistSession(email, sessionToken)
    if (saveError) {
        logFailure(`Login failed: ${saveError}.`)
        return
    }

    logSuccess(message)
}

export default addLoginCmd
