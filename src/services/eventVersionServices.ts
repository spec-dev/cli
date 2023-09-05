import chalk from 'chalk'
import { client } from '../api/client'
import { logFailure } from '../logger'
import { StringKeyMap } from '../types'

export const getEventVersions = async (name) => {
    const { error, events } = await client.searchEventVersions(name)
    if (error) {
        logFailure(`Event retreival failed: ${error}`)
        return
    }
    return events
}

export const formatEventVersions = async (events: StringKeyMap): Promise<StringKeyMap> => {
    const cliEvents = events.map((event) => {
        const [cliName, version] = event.searchId.split('@')
        const formattedEventVersion = chalk.gray(
            ` | ${version.slice(0, 10)}${version.length > 10 ? '...' : ''}`
        )
        return {
            title: cliName + formattedEventVersion,
            value: event.searchId,
        }
    })

    return cliEvents
}
