import { log, logFailure, logWarning } from '../../logger'
import { client } from '../../api/client'
import { isValidContractGroup } from '../../utils/validators'
import { capitalize } from '../../utils/formatters'
import { chainNameForId } from '../../utils/chains'
import chalk from 'chalk'
import { StringKeyMap } from '../../types'

const CMD = 'group'

function addGetGroupCmd(cmd) {
    cmd.command(CMD)
        .description('List the addresses in a Contract Group')
        .argument('group', 'Contract group to get the ABI for')
        .action(getGroup)
}

/**
 * List the addresses in a Contract Group.
 */
async function getGroup(group: string) {
    // Validate contract group structure (e.g. "nsp.ContractName")
    if (!isValidContractGroup(group)) {
        logWarning(`Invalid contract group "${group}". Make sure it's in "nsp.GroupName" format.`)
        return
    }

    // Get all contract addresses, across all chains, in this contract group.
    const { error: getGroupError, instances } = await client.getContractGroup(group)
    if (getGroupError) {
        logFailure(`Contract group retreival failed: ${getGroupError}`)
        return
    }
    if (!Object.keys(instances).length) {
        logWarning(`No contracts found in group "${group}"`)
        return
    }

    // Show the addresses grouped by chain.
    log(formatInstances(instances))
}

function formatInstances(instances: StringKeyMap): string {
    const allGroups = []
    for (const chainId in instances) {
        const groupTitle = `${chalk.cyanBright(capitalize(chainNameForId[chainId]))} ${chalk.gray(
            '| ' + chainId
        )}`
        const addresses = Object.values(instances[chainId]).map((i: any) => i.address)
        const groupAddresses = addresses.map((a) => `    ${a}`).join('\n')
        const group = `${groupTitle}\n\n${groupAddresses}\n`
        allGroups.push(group)
    }
    return allGroups.join('\n')
}

export default addGetGroupCmd
