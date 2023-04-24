import { execSync } from 'node:child_process'
import { StringKeyMap } from '../types'
import constants from '../constants'
import path from 'path'
import { getCurrentDbUser } from '../db'
import process from 'process'

export function ensureDenoInstalled(): boolean {
    try {
        const out = execSync('which deno')
        const path = out.toString().trim()
        return !!path.length
    } catch (error) {
        return false
    }
}

export async function testLiveObject(
    liveObjectFolderName: string,
    localSharedTablesApiPort: number,
    projectApiKey: string
): Promise<StringKeyMap> {
    const testLiveObjectFilePath = path.resolve(__dirname, '..', 'files', 'testLiveObject.ts')
    const { data: user } = getCurrentDbUser()
    if (!user) {
        return { error: `No current DB user could be found.` }
    }
    const localSharedTablesDbUrl = `postgres://${user}:@localhost:5432/${constants.SHARED_TABLES_DB_NAME}`
    const cmdArgs = [
        ['--allow-env'],
        ['--allow-net'],
        ['--allow-read'],
        ['--importmap=imports.json'],
        [testLiveObjectFilePath],
        [liveObjectFolderName],
        [localSharedTablesDbUrl],
        [localSharedTablesApiPort],
        [projectApiKey],
    ].flat()

    process.env.SHARED_TABLES_ORIGIN = `http://localhost:${localSharedTablesApiPort}`

    try {
        execSync(`deno run ${cmdArgs.join(' ')}`, { stdio: 'inherit' })
    } catch (error) {
        return { error }
    }
    return { error: null }
}
