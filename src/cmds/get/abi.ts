import { getSessionToken } from '../../utils/auth'
import { log, logFailure, logSuccess } from '../../logger'
import msg from '../../utils/msg'
import { client } from '../../api/client'
import { isValidAddress } from '../../utils/validators'
import { chainIdsSet } from '../../utils/chains'

const CMD = 'abi'

function addGetABICmd(cmd) {
    cmd.command(CMD)
        .argument('group', 'Address of the contract to get the ABI for.')
        .option('--chain <chain>', 'Chain id of target blockchain', null)
        .action(getABI)
}

/**
 * Get ABI from redis server
 */
async function getABI(
    group: string,
    opts: {
        chain: string
    }
) {
    // Get authed user's session token (if any).
    const { token: sessionToken, error } = getSessionToken()

    if (error) {
        logFailure(error)
        return
    }
    if (!sessionToken) {
        log(msg.AUTH_REQUIRED_MESSAGE)
        return
    }

    const { isValid } = validateOptions(group, opts.chain)
    if (!isValid) return

    const { error: getABIError, abi } = await client.getABI(sessionToken, opts.chain, group)
    if (getABIError) {
        logFailure(`ABI retreival failed: ${getABIError}`)
        return
    }

    logSuccess(abi)
}

function validateOptions(group: string, chain: string) {
    // const addressLowerCase = address.toLowerCase()
    // if (!isValidAddress(addressLowerCase)) {
    //     logFailure(`Invalid address: ${address}`)
    //     return { isValid: false }
    // }
    // handle chain id
    if (!chainIdsSet.has(chain)) {
        logFailure(`Invalid chain id ${chain}`)
        return { isValid: false }
    }
    return { group, chain, isValid: true }
}

export default addGetABICmd
