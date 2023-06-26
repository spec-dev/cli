import { client } from '../../api/client'
import msg from '../../utils/msg'
import { log, logFailure, logSuccess, logWarning } from '../../logger'
import { StringKeyMap, ContractRegistrationJobStatus } from '../../types'
import { getSessionToken } from '../../utils/auth'
import { chainIdsSet, chainNameForId } from '../../utils/chains'
import { sleep } from '../../utils/time'
import { resolveAbi } from '../../utils/abi'
import { isValidAddress, isValidContractGroup } from '../../utils/validators'
import progress from 'progress-string'
import differ from 'ansi-diff-stream'
import ora from 'ora'
import chalk from 'chalk'
import { promptAddContractsDetails } from '../../utils/prompt'

const CMD = 'contract'

const POLL_INTERVAL = 1000

function addContractsCmd(cmd) {
    cmd.command(CMD)
        .alias('contracts')
        .argument('[addresses]', 'Contract addresses', null)
        .option('--chain <chain>', 'Chain id of contract addresses', null)
        .option('--group <group>', 'Group to add contracts to', null)
        .option('--abi <abi>', 'Path to ABI', null)
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

    // Prompt user for inputs if not given directly.
    const promptResp = await promptAddContractsDetails(addresses, opts.chain, opts.group, opts.abi)
    const { chainId, group } = promptResp

    // Parse and validate contract addresses.
    const contractAddresses = (promptResp.addresses || '')
        .split(',')
        .map((a) => a.trim().toLowerCase())
        .filter((a) => !!a)

    for (const address of contractAddresses) {
        if (!isValidAddress(address)) {
            logWarning(`Invalid address: ${address}`)
            return
        }
    }

    // Resolve, parse, and validate ABI.
    const { abi, isValid: isAbiValid } = resolveAbi(promptResp.abi)
    if (!isAbiValid) return

    // Validate chain id.
    if (!chainIdsSet.has(chainId)) {
        logWarning(`Invalid chain id ${chainId}`)
        return
    }

    // Validate contract group structure (e.g. "nsp.ContractName")
    if (!isValidContractGroup(group)) {
        logWarning(`Invalid contract group "${group}". Make sure it's in "nsp.GroupName" format.`)
        return
    }
    const [nsp, contractName] = group.split('.')

    // Register addresses in contract group.
    const { uid, error: registerError } = await client.registerContracts(
        sessionToken,
        chainId,
        nsp,
        contractName,
        contractAddresses,
        abi
    )
    if (registerError) {
        logFailure(`Contract registration failed: ${registerError}`)
        return
    }

    await pollForRegistrationResult(uid, contractAddresses, group, sessionToken)
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

    let contractsEnglish = 'contract'
    if (contractAddresses.length > 1) {
        contractsEnglish += 's'
    }

    const spinnerText = `Registering ${contractAddresses.length} ${contractsEnglish}`
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
            chainId,
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
            spinner.text = `Decoding ${contractAddresses.length} ${contractsEnglish}`
        }

        // Job complete.
        const isComplete =
            status === ContractRegistrationJobStatus.Complete ||
            contractAddresses.every((address) => cursors[address] === 1)
        if (isComplete) {
            logProgress(cursors, true)
            spinner.stop()
            logSuccess(
                `Added ${contractAddresses.length} ${chainNameForId[chainId]} ${contractsEnglish} to group "${group}".`
            )
            return
        }

        await sleep(POLL_INTERVAL)
    }
}

export default addContractsCmd
