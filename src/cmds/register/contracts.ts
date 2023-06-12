import path from 'path'
import fs from 'fs'
import { client } from '../../api/client'
import msg from '../../utils/msg'
import { log, logFailure, logSuccess } from '../../logger'
import { StringKeyMap, ContractRegistrationJobStatus } from '../../types'
import { getSessionToken } from '../../utils/auth'
import { chainIdsSet } from '../../utils/chains'
import { sleep } from '../../utils/time'
import { isValidAddress, isValidContractGroup, isValidPath } from '../../utils/validators'
import progress from 'progress-string'
import differ from 'ansi-diff-stream'
import ora from 'ora'
import chalk from 'chalk'

const CMD = 'contract'

const POLL_INTERVAL = 1000

function addContractsCmd(cmd) {
    cmd.command(CMD)
        .alias('contracts')
        .argument('<addresses>', 'Addresses of deployed target contracts')
        .requiredOption('--chain <chain>', 'Chain id of target blockchain')
        .requiredOption('--group <group>', 'Contract group to register target contracts under')
        .option('--abi <abi>', 'Path to ABI for target contracts', null)
        .action(registerContracts)
}

export async function registerContracts(
    addresses: string,
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

    // Parse and validate contract addresses.
    const contractAddresses = (addresses || '')
        .split(',')
        .map((a) => a.trim().toLowerCase())
        .filter((a) => !!a)

    for (const address of contractAddresses) {
        if (!isValidAddress(address)) {
            logFailure(`Invalid address: ${address}`)
            return
        }
    }

    // Resolve, parse, and validate ABI.
    const { abi, isValid: isAbiValid } = resolveAbi(opts.abi)
    if (!isAbiValid) return

    // Validate chain id.
    if (!chainIdsSet.has(opts.chain)) {
        logFailure(`Invalid chain id ${opts.chain}`)
        return { isValid: false }
    }

    // Validate contract group structure (e.g. "nsp.Contract")
    if (!isValidContractGroup(opts.group)) {
        logFailure(`Invalid contract group ${opts.group}.`)
        return { isValid: false }
    }
    const [nsp, contractName] = opts.group.split('.')

    // Register addresses in contract group.
    const { uid, error: registerError } = await client.registerContracts(
        sessionToken,
        opts.chain,
        nsp,
        contractName,
        contractAddresses,
        abi
    )
    if (registerError) {
        logFailure(`Contract registration failed: ${registerError}`)
        return
    }

    await pollForRegistrationResult(uid, contractAddresses, opts.group, sessionToken)
}

async function pollForRegistrationResult(
    uid: string,
    contractAddresses: string[],
    group: string,
    sessionToken: string
) {
    const progressBars = {}
    for (const address of contractAddresses) {
        progressBars[address] = progress({
            width: 40,
            total: 1,
            incomplete: ' ',
            complete: '.',
        })
    }

    let numContractsEnglish = `${contractAddresses.length} contract`
    if (contractAddresses.length > 1) {
        numContractsEnglish += 's'
    }

    const spinnerText = `Registering ${numContractsEnglish}`
    const diff = differ()

    const logProgress = (cursors: StringKeyMap, done?: boolean) => {
        const lines = []
        lines.push(chalk.gray(chalk.dim('...' + ' '.repeat(spinnerText.length))))
        for (const address of contractAddresses) {
            const bar = progressBars[address]
            const value = done ? 1 : cursors[address] || 0
            const pct = Math.min(Math.ceil(value * 100), 100)
            const formattedPct = pct === 100 ? chalk.cyanBright(`${pct}%`) : `${pct}%`
            lines.push(`${address} ${chalk.cyan(bar(value))} ${formattedPct}`)
        }
        lines.push(chalk.gray(chalk.dim('...')))
        diff.write(lines.join('\n'))
    }
    diff.pipe(process.stdout)

    const spinner = ora({
        text: spinnerText,
        stream: process.stdout,
    }).start()

    // Poll for progress of the contract registration job.
    while (true) {
        const {
            status,
            cursors = {},
            failed,
            error,
        } = await client.getContractRegistrationJob(sessionToken, uid)

        // Job failed.
        if (failed || error) {
            spinner.stop()
            logFailure(error || 'Contract registration failed.')
            return
        }

        // Decoding contracts.
        if (status === ContractRegistrationJobStatus.Decoding) {
            logProgress(cursors)
            spinner.text = `Decoding ${numContractsEnglish}`
        }

        // Job complete.
        const isComplete =
            status === ContractRegistrationJobStatus.Complete ||
            contractAddresses.every((address) => cursors[address] === 1)
        if (isComplete) {
            logProgress(cursors, true)
            spinner.stop()
            logSuccess(`Added ${numContractsEnglish} to "${group}"`)
            return
        }

        await sleep(POLL_INTERVAL)
    }
}

function resolveAbi(abiOption: string): StringKeyMap {
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

export default addContractsCmd
