import { getSessionToken } from '../../utils/auth'
import { log, logFailure, logSuccess, logWarning } from '../../logger'
import msg from '../../utils/msg'
import { client } from '../../api/client'
import { chainIdsSet } from '../../utils/chains'
import { isValidContractGroup } from '../../utils/validators'
import { resolveAbi } from '../../utils/abi'
import { getFactoryEvent, promptCreateContractGroupDetails } from '../../utils/prompt'
import chalk from 'chalk'

const CMD = 'group'

function addCreateGroupCmd(cmd) {
    cmd.command(CMD)
        .description('Create a new Contract Group')
        .argument('[group]', 'Name of the contract group in "nsp.ContractName" format', null)
        .option('--chains <chains>', `The chain ids of the group's future contracts`, null)
        .option('--abi <abi>', `Path to the group's ABI`, null)
        .option('--isFactory <isFactory>', `Factory contract?`, null)
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
        isFactory: boolean
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
    const promptResp = await promptCreateContractGroupDetails(
        group,
        opts.chains,
        opts.abi,
        opts.isFactory
    )

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

    // Validate chain ids.
    const chainIds = (promptResp.chainIds || '')
        .split(',')
        .map((id) => id.trim())
        .filter((id) => !!id)
    const invalidChainIds = chainIds.filter((id) => !chainIdsSet.has(id))
    if (invalidChainIds.length) {
        logWarning(`Invalid chain ids: ${invalidChainIds.join(', ')}`)
        return
    }

    // Get factory event details for factory group.
    if (promptResp.isFactory) {
        const [factoryEventId, addressProperty] = await getFactoryEvent(promptResp.group)
        const [name, version] = factoryEventId?.split('@') || []

        // Log factory event details (temp formatting).
        log(`
        ${chalk.cyanBright(contractName)} | Factory group
        ${
            factoryEventId
                ? `${chalk.green(name.split('.')[2])}  |  ${chalk.gray(version)}
        Address property: ${chalk.gray(addressProperty ? addressProperty : 'No property selected')}`
                : chalk.gray('No factory event selected')
        }`)
    }

    // Create empty contract group.
    const { error: createError } = await client.createContractGroup(
        sessionToken,
        chainIds,
        nsp,
        contractName,
        abi
    )
    if (createError) {
        logFailure(`Creating group failed -- ${createError}`)
        return
    }

    logSuccess(`Successfully created contract group "${promptResp.group}".`)
}

export default addCreateGroupCmd
