import { execSync } from 'node:child_process'
import { StringKeyMap } from '../types'
import constants from '../constants'
import path from 'path'
import { sleep } from './time'
import { fileExists } from './file'
import { resolveDBConnectionParams, clearEventCursors } from '../db'
import { asPostgresUrl } from '../utils/formatters'

export function specClientInstalled(): boolean {
    try {
        const out = execSync('which spec-client')
        const path = out.toString().trim()
        return !!path.length
    } catch (error) {
        return false
    }
}

export async function startSpec(
    projectId: string,
    specConfigDir: string,
    projectApiKey: string,
    dbConfig: StringKeyMap
): Promise<StringKeyMap> {
    const { data: connParams, error: formatError } = resolveDBConnectionParams(dbConfig)
    if (formatError) return { error: formatError }

    // Wipe any event cursors for now when running locally.
    const url = asPostgresUrl(connParams)
    clearEventCursors(url)

    const args = [
        ['--config-dir', specConfigDir],
        ['--user', connParams.user],
        ['--host', connParams.host],
        ['--port', connParams.port],
        ['--name', connParams.name],
        ['--id', projectId],
        ['--api-key', projectApiKey],
        ['--debug', 'true'],
    ].flat()

    if (connParams.password) {
        args.push(...['--password', connParams.password])
    }

    try {
        execSync(`spec-client ${args.join(' ')}`, { stdio: 'inherit' })
    } catch (error) {
        return { error }
    }

    return { error: null }
}

export async function followLocalLogs(projectId: string, tail: number): Promise<StringKeyMap> {
    const logFilePath = path.join(constants.SPEC_GLOBAL_DIR, `${projectId}.log`)
    while (!fileExists(logFilePath)) {
        await sleep(100)
    }
    try {
        execSync(`tail -n ${tail} -f ${logFilePath}`, { stdio: 'inherit' })
    } catch (error) {
        return { error }
    }

    return { error: null }
}
