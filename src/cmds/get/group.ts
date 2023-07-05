import { log, logFailure, logWarning } from '../../logger'
import { client } from '../../api/client'
import { isValidContractGroup } from '../../utils/validators'

const CMD = 'group'

function addGetGroupCmd(cmd) {
    cmd.command(CMD).argument('group', 'Contract group to get the ABI for').action(getGroup)
}

async function getGroup(group: string) {
    // Validate contract group structure (e.g. "nsp.ContractName")
    if (!isValidContractGroup(group)) {
        logWarning(`Invalid contract group "${group}". Make sure it's in "nsp.GroupName" format.`)
        return
    }

    const { error: getGroupError, instances } = await client.getContractGroup(group)
    if (getGroupError) {
        logFailure(`Contract group retreival failed: ${getGroupError}`)
        return
    }

    log(instances)
}

export default addGetGroupCmd
