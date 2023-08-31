import { log, logFailure, logWarning } from '../../logger'
import { client } from '../../api/client'
import { isValidContractGroup } from '../../utils/validators'

const CMD = 'abi'

function addGetAbiCmd(cmd) {
    cmd.command(CMD)
        .description('Get the ABI for a Contract Group')
        .argument('group', 'Contract group to get the ABI for')
        .action(getAbi)
}

/**
 * Get the ABI for a Contract Group.
 */
async function getAbi(group: string) {
    // Validate contract group structure (e.g. "nsp.ContractName")
    if (!isValidContractGroup(group)) {
        logWarning(`Invalid contract group "${group}. Make sure it's in "nsp.ContractName" format.`)
        return
    }

    const { error, abi } = await client.getAbi(group)
    if (error) {
        logFailure(`ABI retreival failed: ${error}`)
        return
    }

    log(abi)
}

export default addGetAbiCmd
