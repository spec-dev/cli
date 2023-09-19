import { execSync } from 'node:child_process'
import { StringKeyMap } from '../types'
import constants from '../constants'
import path from 'path'
import { getCurrentDbUser } from '../db'
import process from 'process'
import { saveState, readGlobalStateFile } from '../config/global'
import { version } from '../version'
import { log } from '../logger'

const testLiveObjectFilePath = path.resolve(__dirname, '..', 'files', 'testLiveObject.ts')

export function ensureDenoInstalled(): boolean {
    try {
        const out = execSync('which deno')
        const path = out.toString().trim()
        return !!path.length
    } catch (error) {
        return false
    }
}

export function hasCachedDenoTestFile() {
    return readGlobalStateFile()?.data?.version === version
}

export function cacheDenoTestFile() {
    log(`Caching live object test file...`)
    try {
        execSync(`deno cache ${testLiveObjectFilePath}`, { stdio: 'inherit' })
    } catch (error) {
        return { error }
    }
    saveState({ version })
}

export async function testLiveObject(
    liveObjectFolderName: string,
    options: StringKeyMap,
    apiKey: string
): Promise<StringKeyMap> {
    const { data: user } = getCurrentDbUser()
    if (!user) {
        return { error: `No current DB user could be found.` }
    }

    hasCachedDenoTestFile() || cacheDenoTestFile()
    const liveObjectTestingDbUrl = `postgres://${user}:@localhost:5432/${constants.LIVE_OBJECT_TESTING_DB_NAME}?sslmode=disable`
    const { recent, from, fromBlock, to, toBlock, chains, allTime, keepData, port } = options
    const cmdArgs = [
        '--cached-only',
        '--allow-env',
        '--allow-net',
        '--allow-read',
        '--importmap=imports.json',
        testLiveObjectFilePath,
        liveObjectFolderName,
        liveObjectTestingDbUrl,
        constants.SPEC_API_ORIGIN,
        recent ? recent.toString() : 'false',
        from ? from.toISOString() : 'null',
        fromBlock ? fromBlock.toString() : 'null',
        to ? to.toISOString() : 'null',
        toBlock ? toBlock.toString() : 'null',
        chains ? chains.toString() : 'null',
        allTime ? allTime.toString() : 'false',
        keepData ? keepData.toString() : 'false',
        port ? port.toString() : 'null',
        apiKey ? apiKey : 'null',
    ]

    process.env.SHARED_TABLES_ORIGIN = `http://localhost:${options.port}`
    process.env.SPEC_RPC_AUTH_TOKEN = apiKey

    try {
        execSync(`deno run ${cmdArgs.join(' ')}`, { stdio: 'inherit' })
    } catch (error) {
        return { error }
    }

    return { error: null }
}
