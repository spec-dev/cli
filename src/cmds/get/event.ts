import { log, logFailure, logWarning } from '../../logger'
import chalk from 'chalk'
import { client } from '../../api/client'
import { couldBeEventName } from '../../utils/validators'
import { StringKeyMap } from '../../types'

const CMD = 'event'

function addGetEventCmd(cmd) {
    cmd.command(CMD)
        .argument('event', 'Event to get recient data for')
        .action(getContractGroupEvents)
}

async function getContractGroupEvents(event: string) {
    if (!couldBeEventName(event)) {
        logFailure(`Invalid event name ${event}`)
        return
    }

    const { error, event: sampleOutput } = await client.getContractGroupSampleEvent(event)
    if (error) {
        logFailure(`Contract group event retreival failed: ${error}`)
        return
    }

    if (!sampleOutput) {
        logWarning('No events found.')
        return
    }

    log(JSON.stringify(sampleOutput, null, 4))
}

export default addGetEventCmd
