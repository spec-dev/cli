import { logFailure, log, logWarning } from '../logger'
import { client } from '../api/client'
import { couldBeEventName } from '../utils/validators'
import { sleep } from '../utils/time'
import { trimEventData } from '../utils/events'

const CMD = 'tail'

const POLL_INTERVAL = 2000

function addTailCmd(program) {
    program
        .command(CMD)
        .description('Tail an event stream')
        .argument('event', 'Event to tail')
        .action(tail)
}

/**
 * Tail an event stream on Spec.
 */
async function tail(event: string) {
    if (!couldBeEventName(event)) {
        logFailure(`Invalid event name "${event}"`)
        return
    }

    const { error, cursors, latestEvent } = await client.resolveEventVersionCursors(event)
    if (error) {
        logFailure(error)
        return
    }
    if (!cursors?.length) {
        logWarning(`No events found for "${event}"`)
        return
    }

    latestEvent && log(trimEventData(latestEvent))

    const nonceForEventName = {}
    for (const entry of cursors) {
        nonceForEventName[entry.name] = entry.nonce
    }

    while (true) {
        await sleep(POLL_INTERVAL)

        const latestCursors = []
        for (const [name, nonce] of Object.entries(nonceForEventName)) {
            latestCursors.push({ name, nonce })
        }

        const { error, events: eventsMap } = await client.getEventVersionDataAfter(latestCursors)
        if (error) {
            logFailure(error)
            break
        }

        let eventsToLog = []
        for (const [name, events] of Object.entries(eventsMap)) {
            if (!events?.length) continue
            eventsToLog.push(...events)
            const latestEvent = events[events.length - 1]
            nonceForEventName[name] = latestEvent.nonce
        }

        eventsToLog
            .sort(
                // @ts-ignore
                (a, b) => new Date(a.origin.blockTimestamp) - new Date(b.origin.blockTimestamp)
            )
            .forEach((event) => {
                log(trimEventData(event))
            })
    }
}

export default addTailCmd
