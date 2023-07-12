import { log, logFailure, logWarning } from '../../logger'
import chalk from 'chalk'
import { client } from '../../api/client'
import { isValidContractGroup } from '../../utils/validators'
import { StringKeyMap } from '../../types'

const CMD = 'events'

function addGroupEventsCmd(cmd) {
    cmd.command(CMD)
        .requiredOption('--group <group>', 'Contract group to get events for')
        .action(getContractGroupEvents)
}

async function getContractGroupEvents(opts: { group: string }) {
    const { group } = opts
    if (!isValidContractGroup(group)) {
        logWarning(`Invalid contract group "${group}". Make sure it's in "nsp.GroupName" format.`)
        return
    }

    // Get all contract addresses, across all chains, in this contract group.
    const { error: getGroupEvents, events } = await client.getContractGroupEvents(group)
    if (getGroupEvents) {
        logFailure(`Contract group retreival failed: ${getGroupEvents}`)
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

export default addGroupEventsCmd
