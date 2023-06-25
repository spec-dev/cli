import { getSessionToken } from '../../utils/auth'
import { log, logFailure, logSuccess, logWarning } from '../../logger'
import msg from '../../utils/msg'
import { client } from '../../api/client'
import { chainIdsSet } from '../../utils/chains'
import { isValidContractGroup } from '../../utils/validators'
import { resolveAbi } from '../../utils/abi'

const CMD = 'group'

function addCreateGroupCmd(cmd) {
    cmd.command(CMD)
        .argument('group', 'Name of the contract group in "nsp.ContractName" format')
        .requiredOption('--chains <chains>', `The chain ids of the group's future contracts`)
        .requiredOption('--abi <abi>', `Path to the group's ABI`)
        .action(createGroup)
}

/**
 * Create a new contract group.
 */
async function createGroup(
    group: string,
    opts: {
        chains: string
        abi: string
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

    // Resolve, parse, and validate ABI.
    const { abi, isValid: isAbiValid } = resolveAbi(opts.abi)
    if (!isAbiValid) return

    // Validate chain ids.
    const chainIds = (opts.chains || '')
        .split(',')
        .map((id) => id.trim())
        .filter((id) => !!id)
    const invalidChainIds = chainIds.filter((id) => !chainIdsSet.has(id))
    if (invalidChainIds.length) {
        logWarning(`Invalid chain ids: ${invalidChainIds.join(', ')}`)
        return
    }

    // Validate contract group structure (e.g. "nsp.ContractName")
    if (!isValidContractGroup(group)) {
        logWarning(`Invalid contract group "${group}. Make sure it's in "nsp.ContractName" format.`)
        return { isValid: false }
    }
    const [nsp, contractName] = group.split('.')

    // Create empty contract group.
    const { error: createError } = await client.createContractGroup(
        sessionToken,
        chainIds,
        nsp,
        contractName,
        abi
    )
    if (createError) {
        logFailure(`Creating group failed -- ${createError}.`)
        return
    }

    logSuccess(`Successfully created contract group "${group}".`)
}

export default addCreateGroupCmd
