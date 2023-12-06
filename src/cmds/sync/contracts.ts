import { client } from '../../api/client'
import msg from '../../utils/msg'
import { log, logFailure, logSuccess, logWarning } from '../../logger'
import {
    StringKeyMap,
    ContractRegistrationJobStatus,
    GetContractRegistrationJobResponse,
} from '../../types'
import { getSessionToken } from '../../utils/auth'
import { chainIdsSet } from '../../utils/chains'
import { sleep } from '../../utils/time'
import { resolveAbi } from '../../utils/abi'
import constants from '../../constants'
import { isValidAddress } from '../../utils/validators'
import progress from 'progress-string'
import differ from 'ansi-diff-stream'
import ora from 'ora'
import chalk from 'chalk'
import path from 'path'
import fs from 'fs'
import process from 'process'
import { fileExists } from '../../utils/file'
import open from 'open'
import { toContractGroupsUrl } from '../../utils/formatters'

const CMD = 'contracts'

const POLL_INTERVAL = 1000

function addSyncContractsCmd(cmd) {
    cmd.command(CMD)
        .description('Sync contract groups from a JSON file')
        .option('-f, --file <type>', 'Contract groups file path')
        .option('--open', 'View your contract groups in the Spec ecosytem once synced')
        .action(syncContracts)
}

export async function syncContracts(opts: { file: string; open: boolean }) {
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

    // Read/resolve contract groups from file.
    const { contents, error: fileError } = readContractGroupsSpecFile(opts.file)
    if (fileError) {
        logWarning(fileError)
        return
    }

    // Validate file contents and format into payload.
    const { payload, error: payloadError } = resolveContractGroupsPayload(contents)
    if (payloadError || !payload) {
        payloadError && logWarning(payloadError)
        return
    }

    // Sync contracts to Spec.
    const resp = await client.registerContracts(sessionToken, payload)
    if (resp.error) {
        logFailure(`Error syncing contracts: ${resp.error}`)
        return
    }

    if (!resp.groups?.length) {
        log(`No changes to sync.`)
        return
    }

    await pollForRegistrationResult(resp, sessionToken, opts.open)
}

function readContractGroupsSpecFile(filePath: string): StringKeyMap {
    const resolvedPath = path.resolve(filePath || constants.DEFAULT_CONTRACT_GROUPS_SPEC_FILE_NAME)
    if (!fileExists(resolvedPath)) {
        return { error: `No file found at ${resolvedPath}` }
    }
    try {
        const contents = JSON.parse(fs.readFileSync(resolvedPath, 'utf-8')) || {}
        return { contents }
    } catch (err) {
        return { error: `Error reading file: ${err}` }
    }
}

function resolveContractGroupsPayload(contents: StringKeyMap): StringKeyMap {
    const nsp = contents.namespace?.trim()
    if (!nsp) {
        return { error: `No "namespace" detected.` }
    }

    const groups = (contents.groups || []).filter((v) => !!v)
    if (!groups.length) {
        return { error: `No contract groups found to sync.` }
    }

    const resolvedGroups = []
    let i = 1
    for (const group of groups) {
        const name = group.name?.trim()
        if (!name) {
            return { error: `No "name" given for contract group ${i}.` }
        }
        if (!group.abi) {
            const defaultAbiLocation = [constants.DEFAULT_ABIS_FOLDER, `${name}.json`].join('/')
            if (!fileExists(path.resolve(defaultAbiLocation))) {
                return {
                    error: `No "abi" given and no file at default location "./${defaultAbiLocation}"`,
                }
            }
            group.abi = defaultAbiLocation
        }
        const { abi, isValid: isAbiValid } = resolveAbi(group.abi)
        if (!isAbiValid) return {}

        const contracts = []
        let j = 1
        for (const contract of (group.contracts || []).filter((v) => !!v)) {
            const chainId = contract.chainId?.toString()?.trim()
            if (!chainId) {
                return { error: `No "chainId" given with contract ${j} in group "${name}"` }
            }
            if (!chainIdsSet.has(chainId)) {
                return { error: `Chain id not yet supported: ${chainId}` }
            }
            const address = contract.address?.toLowerCase().trim()
            if (!address) {
                return { error: `No "address" given with contract ${j} in group "${name}"` }
            }
            if (!isValidAddress(address)) {
                return {
                    error: `Invalid "address" given with contract ${j} in group "${name}": ${address}`,
                }
            }
            contracts.push({ chainId, address })
            j++
        }

        resolvedGroups.push({
            name,
            abi,
            contracts,
            isFactoryGroup: group.isFactoryGroup === true,
        })
        i++
    }

    const payload = { nsp, groups: resolvedGroups }
    return { payload }
}

async function pollForRegistrationResult(
    job: GetContractRegistrationJobResponse,
    sessionToken: string,
    openWhenDone: boolean
) {
    const progressBars = {}
    const diff = differ()
    const defaultBarWidth = 45

    const logProgress = (groups: StringKeyMap[], spinnerTextLength: number, done: boolean) => {
        for (const group of groups) {
            for (const instance of group.instances || []) {
                const { chainId, address } = instance
                const progressWidth = defaultBarWidth - chainId.toString().length
                const key = [chainId, address].join(':')
                progressBars[key] =
                    progressBars[key] ||
                    progress({
                        width: progressWidth,
                        total: 1,
                        incomplete: ' ',
                        complete: '.',
                    })
            }
        }
        const lines = []
        for (const group of groups) {
            lines.push('\n' + chalk.cyanBright(group.name + ':'))
            lines.push(chalk.gray(chalk.dim('—')))
            for (const instance of group.instances || []) {
                const { chainId, address } = instance
                const key = [chainId, address].join(':')
                const bar = progressBars[key]
                const value = done ? 1 : instance.progress || 0
                const pct = Math.min(Math.ceil(value * 100), 100)
                const formattedPct = pct === 100 ? chalk.cyanBright(`${pct}%`) : `${pct}%`
                lines.push(
                    `${chalk.gray(chainId)}:${address} ${chalk.cyan(bar(value))} ${formattedPct}`
                )
            }
        }
        lines.push(' '.repeat(spinnerTextLength))
        diff.write(lines.join('\n'))
    }
    diff.pipe(process.stdout)

    const spinner = ora({ stream: process.stdout })
    let startedSpinner = false
    let i = 0
    while (true) {
        job = i === 0 ? job : await client.getContractRegistrationJob(sessionToken, job.uid)
        i++
        if (job.error && job.error.toLowerCase().includes('parsing json')) continue
        if (job.failed || job.error) {
            spinner.stop()
            logFailure(job.error || 'Syncing contracts failed.')
            return
        }

        const groups = job.groups || []
        const allInstances = groups.map((g) => g.instances || []).flat()
        const numInstances = allInstances.length
        const contractsEnglish = numInstances === 1 ? '1 contract' : `${numInstances} contracts`
        const spinnerText = `Syncing ${contractsEnglish}...`
        const isComplete = job.status === ContractRegistrationJobStatus.Complete
        logProgress(groups, spinnerText.length, isComplete)

        if (!startedSpinner) {
            startedSpinner = true
            spinner.text = spinnerText
            spinner.start()
        }

        if (isComplete) {
            spinner.stop()
            logSuccess(`Contracts in-sync.`)
            openWhenDone && (await open(toContractGroupsUrl(job.nsp)))
            return
        }

        await sleep(POLL_INTERVAL)
    }
}

export default addSyncContractsCmd
