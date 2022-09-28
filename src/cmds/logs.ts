import { logFailure, log } from '../logger'
import { client } from '../api/client'
import constants from '../constants'
import { Log, LogLevel } from '../types'
import { getSessionToken } from '../utils/auth'
import { getCurrentProject } from '../config/project'
import { JSONParser } from '@streamparser/json'
import chalk from 'chalk'
import { exit } from 'process'

const CMD = 'logs'

function addLogsCmd(program) {
    program.command(CMD).action(logs)
}

/**
 * Tail the logs for the currently linked Spec project.
 */
async function logs() {
    // Get authed user's session token (if any).
    const { token, error } = getSessionToken()
    if (error) {
        logFailure(error)
        return
    }
    if (!token) {
        log(constants.AUTH_REQUIRED_MESSAGE)
        return
    }

    // Get currently linked project info.
    const { data: project, error: currProjectError } = getCurrentProject()
    if (currProjectError) {
        logFailure(currProjectError)
        return
    }
    if (!project || !project.id) {
        log(constants.LINK_PROJECT_MESSAGE)
        return
    }

    // Fetch log stream.
    const { data: body, error: apiError } = await client.logs(project.id, token)
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
