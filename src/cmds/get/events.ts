import { log, logFailure, logWarning } from '../../logger'
import chalk from 'chalk'
import { client } from '../../api/client'
import { isValidContractGroup } from '../../utils/validators'
import { StringKeyMap } from '../../types'

const CMD = 'events'

function addGetEventsCmd(cmd) {
    cmd.command(CMD)
        .description('List the events in a Contract Group')
        .argument('group', 'Contract group to get events for')
        .action(getContractGroupEvents)
}

/**
 * List the events in a Contract Group.
 */
async function getContractGroupEvents(group: string) {
    if (!isValidContractGroup(group)) {
        logWarning(`Invalid contract group "${group}". Make sure it's in "nsp.GroupName" format.`)
        return
    }

    const { error, events } = await client.getContractGroupEvents(group)
    if (error) {
        logFailure(`Contract group event retreival failed: ${error}`)
        return
    }

    if (!events.length) {
        logWarning(`No events found for group "${group}"`)
        return
    }

    log(formatContractGroupEvents(events))
}

function formatContractGroupEvents(events: StringKeyMap[]): string {
    let allEvents = []
    for (const event of events) {
        const eventName = `${event.name}`
        const eventVersion = chalk.gray(` | ${event.version}`)
        allEvents.push(eventName + eventVersion)
    }

    const maxLen = Math.max(...allEvents.map((line) => line.split(' |')[0].length))

    allEvents = allEvents.map((line) => {
        let [firstPart, secondPart] = line.split(' |')
        return firstPart.padEnd(maxLen, ' ') + ' |' + secondPart
    })

    return allEvents.join('\n')
}

export default addGetEventsCmd
