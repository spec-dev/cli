import { StringKeyMap } from '../types'

const primitiveEventDataProperties = new Set([
    'contractAddress',
    'transactionHash',
    'transactionIndex',
    'logIndex',
    'signature',
    'blockHash',
    'blockNumber',
    'blockTimestamp',
    'chainId',
    'contractName',
])

const EVENT_TIMESTAMP = 'eventTimestamp'

export const trimEventData = (event: StringKeyMap): StringKeyMap => {
    if (!event) return event

    const data = event.data || {}
    const trimmedData = {}
    for (const key in data) {
        if (primitiveEventDataProperties.has(key)) continue
        trimmedData[key] = data[key]
    }

    const trimmedOrigin = {}
    for (const key in event.origin) {
        if (key !== EVENT_TIMESTAMP) {
            trimmedOrigin[key] = event.origin[key]
        }
    }

    return {
        id: event.id,
        name: event.name,
        origin: trimmedOrigin,
        data: trimmedData,
    }
}
