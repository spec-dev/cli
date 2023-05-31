// import { saveProjectCreds, saveState, DEFAULT_PROJECT_ENV } from '../../config/global'
import path from 'path'
import fs from 'fs'
import { client } from '../../api/client'
import msg from '../../utils/msg'
import { getCurrentProjectId } from '../../config/global'
import { log, logFailure, logSuccess } from '../../logger'
import { StringKeyMap } from '../../types'
import { getSessionToken } from '../../utils/auth'
import { chainIdsSet } from '../../utils/chains'

const CMD = 'contract'

function addContractCmd(cmd) {
    cmd.command(CMD)
        .argument('<address>', 'Address of deployed target contract')
        .requiredOption('--chain <chain>', 'Chain id of target blockchain')
        .requiredOption('--group <group>', 'Contract group to register target contract under')
        .option('--abi <abi>', 'Path to target contract ABI', null)
        .action(registerContract)
}

export async function registerContract(
    address: string,
    opts: {
        chain: string
        group: string
        abi: string
    }
) {
    // Get authed user's session token (if any).
    const { token: sessionToken, error } = getSessionToken()
    if (error) {
        logFailure(error)
        return
    }
    if (!sessionToken) {
        log(msg.AUTH_REQUIRED_MESSAGE)
        return
    }

    // validate auguments
    const { options, isValid } = validateOptions({ ...opts, abi: readABIFromPath(opts.abi) } || {})
    if (!isValid) return

    const addressLowerCase = address.toLowerCase()
    if (!isValidAddress(addressLowerCase)) {
        logFailure(`Invalid address: ${address}`)
        return
    }

    const { chain, group, abi } = options
    const [nsp, contractName] = group.split('.')
    const contractDesc = ''

    const { error: registerError } = await client.registerContract(
        sessionToken,
        nsp,
        chain,
        address,
        contractName,
        contractDesc,
        abi
    )
    if (registerError) {
        logFailure(`Register failed: ${registerError}`)
        return
    }
    logSuccess('Successfully registered contract')
}

function readABIFromPath(abi: string): string {
    if (!abi) return null
    if (isValidPath(abi)) {
        // code to support hardhat/truffle artifacts
        if (abi.includes('artifacts')) {
            const abiParsed = JSON.parse(fs.readFileSync(path.resolve(abi), 'utf8'))
            return JSON.stringify(abiParsed.abi)
        }
        return fs.readFileSync(path.resolve(abi), 'utf8')
    }
    // if the abi arg isn't a valid path, we treat the argument as a raw abi string:
    return abi
}

function validateOptions(options: StringKeyMap) {
    // handle abi
    if (options.abi && !isValidABI(options.abi)) {
        logFailure('Invalid ABI')
        return { isValid: false }
    }
    // handle chain id
    if (!chainIdsSet.has(options.chain)) {
        logFailure(`Invalid chain id ${options.chain}`)
        return { isValid: false }
    }
    // handle contract group
    if (!isValidContractGroup(options.group)) {
        logFailure(`Invalid contract group ${options.group}`)
        return { isValid: false }
    }
    return { options, isValid: true }
}

function isValidPath(p) {
    try {
        fs.accessSync(path.resolve(p))
        return true
    } catch (err) {
        return false
    }
}

function isValidAddress(address: string): boolean {
    return /^0x[a-fA-F0-9]{40}$/.test(address)
}

function isValidABI(abi: string): boolean {
    try {
        JSON.parse(abi)
        return true
    } catch (e) {
        return false
    }
}

function isValidContractGroup(group: string): boolean {
    return true
}

export default addContractCmd
