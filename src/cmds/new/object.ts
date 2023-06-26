import { logWarning, logSuccess } from '../../logger'
import { createLiveObjectTemplate } from '../../templates'
import { promptNewLiveObjectDetails } from '../../utils/prompt'
import { unique } from '../../utils/formatters'
import { chainIdsSet } from '../../utils/chains'

const CMD = 'object'

function addObjectCommand(cmd) {
    cmd.command(CMD)
        .argument('[fullName]', 'The full name of the live object in "nsp.Name" format', null)
        .action(newObject)
}

/**
 * Create a new Live Object template.
 */
async function newObject(fullName: string) {
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
    const inputEvents = parseInputEventOrCall(promptResp.inputEvents)
    const inputCalls = parseInputEventOrCall(promptResp.inputCalls)

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
        description,
        inputEvents,
        inputCalls
    )
    if (!success) return
    logSuccess(`Created template for live object "${liveObjectId}" in folder "./${name}"`)
}

function parseInputEventOrCall(input: string): string[] {
    return (input || '')
        .split(',')
        .map((e) => e.trim())
        .filter((e) => !!e)
}

export default addObjectCommand
