import { getSessionToken } from '../../utils/auth'
import { log, logFailure, logSuccess, logWarning } from '../../logger'
import msg from '../../utils/msg'
import { client } from '../../api/client'
import { isValidContractGroup } from '../../utils/validators'
import { resolveAbi } from '../../utils/abi'
import { promptCreateContractGroupDetails } from '../../utils/prompt'

const CMD = 'group'

function addCreateGroupCmd(cmd) {
    cmd.command(CMD)
        .description('Create a new Contract Group')
        .argument('[group]', 'Name of the contract group in "nsp.ContractName" format', null)
        .option('--abi <abi>', `Path to the group's ABI`, null)
        .option('--factory-group', `Whether this group holds factory-produced contracts`)
        .action(createGroup)
}

/**
 * Create a new contract group.
 */
async function createGroup(
    group: string,
    opts: {
        abi: string
        factoryGroup: boolean
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

    // Prompt user for inputs if not given directly.
    const promptResp = await promptCreateContractGroupDetails(group, opts.abi, opts.factoryGroup)

    // Validate contract group structure (e.g. "nsp.ContractName")
    if (!isValidContractGroup(promptResp.group)) {
        logWarning(
            `Invalid contract group "${promptResp.group}. Make sure it's in "nsp.ContractName" format.`
        )
        return
    }
    const [nsp, contractName] = promptResp.group.split('.')

    // Resolve, parse, and validate ABI.
    const { abi, isValid: isAbiValid } = resolveAbi(promptResp.abi)
    if (!isAbiValid) return

    // Create empty contract group.
    const { error: createError } = await client.createContractGroup(
        sessionToken,
        nsp,
        contractName,
        promptResp.isFactoryGroup,
        abi,
    )
    if (createError) {
        logFailure(`Creating group failed: ${createError}`)
        return
    }

    logSuccess(`Successfully created contract group "${promptResp.group}".`)
}

export default addCreateGroupCmd
