import { execSync } from 'node:child_process'
import { StringKeyMap } from '../types'
import constants from '../constants'
import { sleep } from './time'

export function ensureDockerInstalled(): boolean {
    try {
        const out = execSync('which docker')
        const path = out.toString().trim()
        return !!path.length
    } catch (error) {
        return false
    }
}

export function ensureDockerRunning(): boolean {
    try {
        execSync('docker version')
        return true
    } catch (error) {
        return false
    }
}

export function isSpecRunning(projectId: string): boolean {
    try {
        const out = execSync(`docker ps --filter "name=spec-${projectId}" | grep spec-${projectId} | wc -l`)
        const numMatchingContainers = parseInt(out.toString().trim())
        return !Number.isNaN(numMatchingContainers) && numMatchingContainers > 0
    } catch (error) {
        return false
    }
}

export function stopSpec(projectId: string): StringKeyMap {
    let error = null
    try {
        const out = execSync(`docker stop spec-${projectId} && docker rm spec-${projectId}`)
    } catch (err) {
        error = err
    }
    return { error }
}

export function runSpec(
    projectId: string, 
    dbName: string, 
    dbPort: number, 
    apiKey: string,
    envs?: StringKeyMap,
): StringKeyMap {
    const formattedEnvs = formatEnvs({
        DB_USER: constants.DB_USER,
        DB_HOST: constants.DB_HOST,
        DB_PORT: dbPort || constants.DB_PORT,
        DB_NAME: dbName,
        PROJECT_API_KEY: apiKey,
        STREAM_LOGS: 'false',
        DEBUG: 'true',
        FORCE_COLOR: 1,
        ...(envs || {})
    })

    try {
        execSync(
            `docker run -d \
                ${formattedEnvs} \
                -v ${constants.SPEC_CONFIG_DIR}:/usr/app/${constants.SPEC_CONFIG_DIR_NAME} \
                --name spec-${projectId} \
                ${constants.SPEC_DOCKER_IMAGE}:local-latest`,
            { stdio: 'pipe' }
        )
    } catch (error) {
        return { error }
    }
    return { error: null }
}

export async function followDockerLogs(projectId: string): Promise<StringKeyMap> {
    while (!isSpecRunning(projectId)) {
        await sleep(50)
    }

    try {
        execSync(`docker logs -f spec-${projectId}`, { stdio: 'inherit' })
    } catch (error) {
        return { error }
    }
    return { error: null }
}

function formatEnvs(envs: StringKeyMap): string {
    const formattedEnvs = []
    for (const key in envs) {
        formattedEnvs.push(`-e ${key}=${envs[key]}`)
    }
    return formattedEnvs.join(' ')
}