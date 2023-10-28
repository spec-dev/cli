import { logWarning, logSuccess } from '../../logger'
import { createLiveObjectTemplate } from '../../templates'
import { promptNewLiveObjectDetails } from '../../utils/prompt'
import { unique } from '../../utils/formatters'
import { chainIdsSet } from '../../utils/chains'

const CMD = 'table'

function addTableCommand(cmd) {
    cmd.command(CMD)
        .description('Create a new custom Live Table')
        .argument('[fullName]', 'The full name of the Live Table in "nsp.Name" format', null)
        .action(newTable)
}

/**
 * Create a new Live Table template.
 */
async function newTable(fullName: string) {
    let namespace = ''
    let name = ''
    if (fullName) {
        const splitFullName = fullName.split('.')
        if (splitFullName.length !== 2) {
            logWarning('Invalid full name for object: Must be in "nsp.Name" format.')
            return
        }
        ;[namespace, name] = splitFullName
    }

    const promptResp = await promptNewLiveObjectDetails(namespace, name)
    ;({ namespace, name } = promptResp)
    const { chainIds, displayName, description } = promptResp

    // Parse & validate chain ids.
    const chains = unique((chainIds || '').split(',').map((id) => id.trim()))
    if (!chains.length) {
        logWarning('Must provide at least 1 chain id.')
        return
    }
    const invalidChainIds = chains.filter((id) => !chainIdsSet.has(id))
    if (invalidChainIds.length) {
        logWarning(`Invalid chain ids: ${invalidChainIds.join(', ')}`)
        return
    }

    if (!namespace || !name) {
        logWarning('Both "namespace" and "name" are required.')
        return
    }

    const { liveObjectId, success } = createLiveObjectTemplate(
        namespace,
        name,
        chains,
        displayName,
        description
    )
    if (!success) return
    logSuccess(`Created template for live object "${liveObjectId}" in folder "./${name}"`)
}

export default addTableCommand
