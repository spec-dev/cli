import { StringKeyMap } from '../types'

const primitiveEventDataProperties = new Set([
    'contractAddress',
    'transactionHash',
    'transactionIndex',
    'transaction',
    'logIndex',
    'signature',
    'blockHash',
    'blockNumber',
    'blockTimestamp',
    'chainId',
    'contractName',
])

const EVENT_TIMESTAMP = 'eventTimestamp'
const TRANSACTION = 'transaction'

export const trimEventData = (event: StringKeyMap): StringKeyMap => {
    if (!event) return event

    const trimmedOrigin = {}
    for (const key in event.origin) {
        if ([TRANSACTION, EVENT_TIMESTAMP].includes(key)) {
            continue
        }
        trimmedOrigin[key] = event.origin[key]
    }

    const [nspName, _] = event.name.split('@')
    if (nspName.split('.').length <= 2) {
        return {
            id: event.id,
            name: event.name,
            origin: trimmedOrigin,
            data: event.data,
        }
    }

    const data = event.data || {}
    const trimmedData = {}
    for (const key in data) {
        if (primitiveEventDataProperties.has(key)) continue
        trimmedData[key] = data[key]
    }

    return {
        id: event.id,
        name: event.name,
        origin: trimmedOrigin,
        data: trimmedData,
    }
}
