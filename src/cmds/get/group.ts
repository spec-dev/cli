import { log, logFailure } from '../../logger'
import { client } from '../../api/client'

const CMD = 'group'

function addGetGroupCmd(cmd) {
    cmd.command(CMD).argument('group', 'Contract group to get the ABI for').action(getGroup)
}

async function getGroup(group: string) {
    const { error: getGroupError, data } = await client.getContractGroup(group)
    if (getGroupError) {
        logFailure(`Contract group retreival failed: ${getGroupError}`)
        return
    }

    log(data)
}

export default addGetGroupCmd
