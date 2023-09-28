import { logWarning, logFailure } from '../logger'
import constants from '../constants'
import { ensureDenoInstalled, testLiveObject } from '../utils/deno'
import msg from '../utils/msg'
import { toNumber, toDate } from '../utils/formatters'
import { psqlInstalled, upsertLiveObjectTestingDB } from '../db'
import { getProjectCreds, getCurrentProjectId } from '../config/global'
import { chainIdsSet } from '../utils/chains'
import { addDays, subtractDays } from '../utils/date'
import { StringKeyMap } from '../types'

const CMD = 'test'

function addObjectCommand(program) {
    program
        .command(CMD)
        .description('Test one or more Live Objects')
        .argument('name', 'Name of the Live Object to test')
        .option('--recent', 'Test on the previous 30 days of data')
        .option('--days <type>', 'Number of days to fetch test data for')
        .option('--from <type>', 'Start date of the date range to fetch test data for')
        .option('--from-block <type>', 'Start block of the block range to fetch test data for')
        .option('--to <type>', 'End date of the range to fetch test data for')
        .option('--to-block <type>', 'End block of the block range to fetch test data for')
        .option(
            '--all-time',
            'Test over the entire date-range of input data used by the Live Object(s)'
        )
        .option('--chains <type>', 'Chain ids to fetch test data for')
        .option('--keep-data', 'Whether to keep your existing test data from the previous run')
        .option('--port <type>', 'Port to run the testing server on')
        .action(test)
}

/**
 * Test one or more Live Objects.
 */
async function test(name, opts) {
    const { options, isValid } = validateOptions(opts || {})
    if (!isValid) return

    // Ensure Deno is installed.
    const isDenoInstalled = ensureDenoInstalled()
    if (!isDenoInstalled) {
        logWarning(msg.INSTALL_DENO)
        return
    }

    // Ensure psql is installed.
    if (!psqlInstalled()) {
        logWarning(msg.INSTALL_PSQL)
        return
    }

    // Ensure the testing database exists locally.
    const { error: dbError } = upsertLiveObjectTestingDB()
    if (dbError) {
        logFailure(`Failed to upsert the live object testing database locally: ${dbError}`)
        return
    }

    // Get current project id.
    const { data: projectId, error } = getCurrentProjectId()
    if (error) {
        logFailure(error)
        return
    }
    if (!projectId) {
        logWarning(msg.CHOOSE_PROJECT_MESSAGE)
        return
    }

    // Get current project credentials from global spec creds file.
    const { data: creds, error: credsError } = getProjectCreds(projectId)
    if (credsError) {
        logFailure(`Error finding project credentials: ${credsError}`)
        return
    }
    if (!creds?.apiKey) {
        logWarning(msg.CHOOSE_PROJECT_MESSAGE)
        return
    }

    testLiveObject(name, options, creds.apiKey)
}

function validateOptions(options: StringKeyMap): StringKeyMap {
    let { recent, days, from, fromBlock, to, toBlock, chains, allTime, keepData } = options
    const chainIds = (chains || '')
        .split(',')
        .map((id) => id.trim())
        .filter((v) => !!v)
    days = days ? toNumber(days) : null
    fromBlock = fromBlock ? toNumber(fromBlock) : null
    toBlock = toBlock ? toNumber(toBlock) : null
    from = from ? toDate(from) : null
    to = to ? toDate(to) : null

    // Validate chain ids.
    const invalidChainIds = chainIds.filter((id) => !chainIdsSet.has(id))
    if (invalidChainIds.length) {
        logWarning(`Invalid chain ids: ${invalidChainIds.join(', ')}`)
        return { isValid: false }
    }

    // Ensure negative numbers aren't given.
    if (days !== null && days < 0) {
        logWarning(`--days can't be negative`)
        return { isValid: false }
    }
    if (fromBlock !== null && fromBlock < 0) {
        logWarning(`--from-block can't be negative`)
        return { isValid: false }
    }
    if (toBlock !== null && toBlock < 0) {
        logWarning(`--to-block can't be negative`)
        return { isValid: false }
    }

    // Prevent days and block ranges from meshing.
    if ((fromBlock || toBlock) && recent) {
        logWarning(`--recent can't be used together with --from-block or --to-block`)
        return { isValid: false }
    }
    if (from && to && recent) {
        logWarning(`--recent can't be used together with --from or --to`)
        return { isValid: false }
    }
    if ((fromBlock || toBlock) && days) {
        logWarning(`--days can't be used together with --from-block or --to-block`)
        return { isValid: false }
    }
    if ((fromBlock || toBlock) && (from || to)) {
        logWarning(`Can't blend blocks and dates when specifying a range.`)
        return { isValid: false }
    }
    if (from && to && days) {
        logWarning(`--days can't be used when both --from and --to are also specified`)
        return { isValid: false }
    }
    if ((fromBlock || toBlock) && (from || to) && allTime) {
        logWarning(`Can't specify a range when using --all-time`)
        return { isValid: false }
    }

    // Only 1 chain can be specified when using block ranges.
    if ((fromBlock || toBlock) && chainIds.length > 1) {
        logWarning(`Can only use --from-block and --to-block with a single chain.`)
        return { isValid: false }
    }

    // Ensure ranges only move forwards in time or in series.
    if (fromBlock && toBlock && fromBlock > toBlock) {
        logWarning(`Invalid block range: ${fromBlock} -> ${toBlock}`)
        return { isValid: false }
    }
    if (from && to && from > to) {
        logWarning(`Invalid date range: ${from} -> ${to}`)
        return { isValid: false }
    }

    // Block ranges take priority over date ranges.
    if (fromBlock && from) {
        from = null
    }
    if (toBlock && to) {
        to = null
    }

    // Complete date range with "days" if given.
    if (from && days) {
        to = addDays(from, days)
    }
    if (to && days) {
        from = subtractDays(to, days)
    }
    if (!from && !to && days) {
        from = subtractDays(new Date(new Date().toUTCString()), days)
    }

    const opts = {
        recent,
        from,
        fromBlock,
        to,
        toBlock,
        chains: chainIds.join(','),
        allTime: !!allTime,
        keepData: !!keepData,
        port: toNumber(options.port) || constants.LIVE_OBJECT_TESTING_API_PORT,
    }

    return { options: opts, isValid: true }
}

export default addObjectCommand
