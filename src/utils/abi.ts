import { logFailure } from '../logger'
import { isValidPath } from './validators'
import { StringKeyMap } from '../types'
import fs from 'fs'
import path from 'path'

export function resolveAbi(abiOption: string): StringKeyMap {
    if (!abiOption) {
        return { abi: null, isValid: true }
    }

    let abi: any = abiOption
    if (isValidPath(abi)) {
        // Try to read the ABI file in as JSON.
        try {
            abi = JSON.parse(fs.readFileSync(path.resolve(abiOption), 'utf8'))
        } catch (err) {
            logFailure(`Error parsing ABI as JSON for path ${abiOption}: ${err.message}`)
            return { abi: null, isValid: false }
        }

        // Support hardhat/truffle artifacts.
        if (typeof abi === 'object' && !Array.isArray(abi) && abi.hasOwnProperty('abi')) {
            abi = abi.abi
        }
    } else {
        try {
            abi = JSON.parse(abi)
        } catch (err) {
            logFailure(`Error parsing ABI as JSON: ${err.message}`)
            return { abi: null, isValid: false }
        }
    }

    if (!Array.isArray(abi)) {
        logFailure(`Invalid ABI: Expecting a JSON array.`)
        return { abi: null, isValid: false }
    }

    return { abi, isValid: true }
}
