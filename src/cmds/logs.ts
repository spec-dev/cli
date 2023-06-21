import { logFailure, log, logWarning } from '../logger'
import { client } from '../api/client'
import msg from '../utils/msg'
import { Log, LogLevel } from '../types'
import { getCurrentProjectId } from '../config/global'
import { getSessionToken } from '../utils/auth'
import { JSONParser } from '@streamparser/json'
import { followLocalLogs } from '../utils/client'
import chalk from 'chalk'
import { exit } from 'process'
import constants from '../constants'

const CMD = 'logs'

function addLogsCmd(program) {
    program
        .command(CMD)
        .option('--local', 'Display logs for the locally running Spec instance')
        .option('--env <type>', 'Filter logs by Spec environment')
        .option(
            '--tail <number>',
            'Lines of historical logs to show',
            constants.DEFAULT_LOG_TAIL_SIZE
        )
        .action(logs)
}

/**
 * Tail the logs for the currently linked Spec project.
 */
async function logs(options) {
    // Get authed user's session token (if any).
    const { token, error } = getSessionToken()
    if (error) {
        logFailure(error)
        return
    }
    if (!token) {
        log(msg.AUTH_REQUIRED_MESSAGE)
        return
    }

    // Get current project id.
    const { data: projectId, error: currProjectIdError } = getCurrentProjectId()
    if (currProjectIdError) {
        logFailure(currProjectIdError)
        return
    }
    if (!projectId) {
        log(msg.CHOOSE_PROJECT_MESSAGE)
        return
    }

    // Get log tail size.
    const tail = parseInt(options.tail, 10)
    if (isNaN(tail) || tail < 0) {
        logWarning(`--tail must be a number >= 0`)
        return
    }

    // Stream logs from local spec instance if --local option provided.
    if (!!options.local || options.env === 'local') {
        const { error: logsError } = await followLocalLogs(projectId, tail)
        if (logsError) {
            logFailure(logsError)
        }
        return
    }

    // Fetch log stream.
    const { data: body, error: apiError } = await client.logs(projectId, token, tail, options.env)
    if (apiError) {
        logFailure(`Error fetching project logs: ${apiError}`)
        return
    }

    // Format & print logs as they come.
    try {
        await streamLogs(body)
    } catch (err) {
        logFailure(`Error iterating log stream: ${err?.message || err}`)
        exit(1)
    }
}

async function streamLogs(body) {
    const jsonParser = new JSONParser({
        stringBufferSize: undefined,
        paths: ['$.*'],
        keepStack: false,
    })

    jsonParser.onValue = (obj) => {
        if (!obj || obj.ping) return
        const data = obj as Log
        printLog(data)
    }

    for await (const chunk of body) {
        jsonParser.write(chunk)
    }
}

function printLog(data: Log) {
    const timestamp = chalk.gray(data.timestamp)

    let level
    switch (data.level) {
        case LogLevel.Error:
            level = chalk.redBright(data.level.toUpperCase())
            break
        case LogLevel.Warn:
            level = chalk.yellowBright(data.level.toUpperCase())
            break
        default:
            level = chalk.gray(data.level.toUpperCase())
    }

    const leftSplit = chalk.gray('|')
    const rightSplit = data.level === LogLevel.Error ? chalk.redBright('->') : chalk.gray('|')
    const message = (data.message || '')
        .split('\n')
        .map((line, i) => {
            let levelText = level
            if (i > 0 && data.level !== LogLevel.Info) {
                const ellipsis = ' ...'
                switch (data.level) {
                    case LogLevel.Error:
                        levelText = chalk.redBright(ellipsis)
                        break
                    case LogLevel.Warn:
                        levelText = chalk.yellowBright(ellipsis)
                        break
                }
            }
            const prefix = `${timestamp} ${leftSplit} ${levelText} ${rightSplit}`
            return `${prefix} ${line}`
        })
        .join('\n')

    log(message)
}

export default addLogsCmd
