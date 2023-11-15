import { VARCHAR, INT4, INT8, TIMESTAMPTZ, JSON } from './columnTypes'

export const STRING = 'string'
export const NUMBER = 'number'
export const BOOLEAN = 'boolean'
export const BIG_INT = 'BigInt'
export const BIG_FLOAT = 'BigFloat'
export const BLOCK_NUMBER = 'BlockNumber'
export const TIMESTAMP = 'Timestamp'
export const ADDRESS = 'Address'
export const BLOCK_HASH = 'BlockHash'
export const TRANSACTION_HASH = 'TransactionHash'
export const CHAIN_ID = 'ChainId'
export const JSON_PROPERTY_TYPE = 'Json'
export const DATE = 'date'
export const OBJECT = 'object'
export const SYMBOL = 'symbol'

export const isDate = (value: any): boolean =>
    Object.prototype.toString.call(value) === '[object Date]'

export const isObject = (value: any): boolean =>
    Object.prototype.toString.call(value) === '[object Object]'

export function guessColType(t: string): string {
    switch (t.toLowerCase()) {
        // Varchars
        case STRING:
        case SYMBOL:
        case ADDRESS.toLowerCase():
        case CHAIN_ID.toLowerCase():
        case BLOCK_HASH.toLowerCase():
        case TRANSACTION_HASH.toLowerCase():
        case BIG_INT.toLowerCase():
        case BIG_FLOAT.toLowerCase():
            return VARCHAR

        // Integer
        case NUMBER:
            return INT4

        // Block numbers will be int8 for now.
        case BLOCK_NUMBER.toLowerCase():
            return INT8

        // Booleans
        case BOOLEAN:
            return BOOLEAN

        // Datetimes
        case DATE:
        case TIMESTAMP.toLowerCase():
            return TIMESTAMPTZ

        default:
            return JSON
    }
}
