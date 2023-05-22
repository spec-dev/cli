import { execSync } from 'node:child_process'
import { StringKeyMap } from '../types'
import constants from '../constants'
import path from 'path'
import { sleep } from './time'
import { fileExists } from './file'
import { getCurrentDbUser } from '../db'

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
    let dbUser = dbConfig.user
    if (!dbUser) {
        const { data: user, error } = getCurrentDbUser()
        if (error) return { error }
        dbUser = user
    }
    if (!dbUser) {
        return { error: `Database user not specified.` }
    }

    const args = [
        ['--config-dir', specConfigDir],
        ['--user', dbUser],
        ['--host', dbConfig.host || 'localhost'],
        ['--port', Number(dbConfig.port || constants.DB_PORT)],
        ['--name', dbConfig.name || 'postgres'],
        ['--id', projectId],
        ['--api-key', projectApiKey],
        ['--debug', 'true'],
    ].flat()

    const dbPassword = dbConfig.password || ''
    if (dbPassword) {
        args.push(...['--password', dbPassword])
    }

    try {
        execSync(`spec-client ${args.join(' ')}`, { stdio: 'inherit' })
    } catch (error) {
        return { error }
    }

    return { error: null }
}

export async function followLocalLogs(projectId: string): Promise<StringKeyMap> {
    const logFilePath = path.join(constants.SPEC_GLOBAL_DIR, `${projectId}.log`)
    while (!fileExists(logFilePath)) {
        await sleep(100)
    }
    try {
        execSync(`tail -n 20 -f ${logFilePath}`, { stdio: 'inherit' })
    } catch (error) {
        return { error }
    }

    return { error: null }
}
