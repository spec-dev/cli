import { getSessionToken } from '../../utils/auth'
import { log, logFailure, logSuccess } from '../../logger'
import msg from '../../utils/msg'
import { client } from '../../api/client'
import { StringKeyMap } from '../../types'
import { isValidAddress } from '../../utils/validators'
import { chainIdsSet } from '../../utils/chains'

const CMD = 'abi'

function addGetABICmd(cmd) {
    cmd.command(CMD)
        .argument('address', 'Address of the contract to get the ABI for.')
        .requiredOption('--chain <chain>', 'Chain id of target blockchain')
        .action(getABI)
}

/**
 * Get ABI from redis server
 */
async function getABI(
    address: string,
    opts: {
        chain: string
    }
) {
    const { isValid } = validateOptions(address, opts.chain)
    if (!isValid) return

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

    const { error: getABIError, abi } = await client.getABI(sessionToken, opts.chain, address)
    if (getABIError) {
        logFailure(`ABI retreival failed: ${getABIError}`)
        return
    }

    logSuccess(abi)
}

function validateOptions(address: string, chain: string) {
    const addressLowerCase = address.toLowerCase()
    if (!isValidAddress(addressLowerCase)) {
        logFailure(`Invalid address: ${address}`)
        return { isValid: false }
    }
    // handle chain id
    if (!chainIdsSet.has(chain)) {
        logFailure(`Invalid chain id ${chain}`)
        return { isValid: false }
    }
    return { address, chain, isValid: true }
}

export default addGetABICmd
