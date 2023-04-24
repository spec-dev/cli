import { execSync } from 'node:child_process'
import { StringKeyMap } from '../types'
import constants from '../constants'
import path from 'path'
import { sleep } from './time'
import { fileExists } from './file'

export function specClientInstalled(): boolean {
    try {
        const out = execSync('which spec-client')
        const path = out.toString().trim()
        return !!path.length
    } catch (error) {
        return false
    }
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
