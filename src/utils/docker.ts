import { execSync } from 'node:child_process'
import { StringKeyMap, SpecEnv } from '../types'
import constants from '../constants'
import { getCurrentEnv } from '../config/global'
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

export function runSpec(projectId: string, dbName: string, dbPort: number, apiKey: string): StringKeyMap {
    const { data, error } = getEnvBasedEnvVars()
    if (error) return { error }
    const { eventsHostname, logsHostname } = data

    try {
        execSync(
            `docker run -d \
                -e DB_USER=${constants.DB_USER} \
                -e DB_HOST=${constants.DB_HOST} \
                -e DB_PORT=${dbPort || constants.DB_PORT} \
                -e DB_NAME=${dbName} \
                -e PROJECT_API_KEY=${apiKey} \
                -e EVENTS_HOSTNAME=${eventsHostname} \
                -e LOGS_HOSTNAME=${logsHostname} \
                -e STREAM_LOGS='false' \
                -e DEBUG='true' \
                -e FORCE_COLOR=1 \
                -v ${constants.SPEC_CONFIG_DIR}:/usr/app/${constants.SPEC_CONFIG_DIR_NAME} \
                --name spec-${projectId} \
                ${constants.SPEC_DOCKER_IMAGE}:latest`,
            { stdio: 'pipe' }
        )
    } catch (error) {
        return { error }
    }
    return { error: null }
}

export function getEnvBasedEnvVars(): StringKeyMap {
    const { data: currentEnv, error } = getCurrentEnv()
    if (error) return { error }

    switch (currentEnv) {
        case SpecEnv.Dev:
            return { data: {
                eventsHostname: constants.SPEC_DEV_EVENTS_HOSTNAME,
                logsHostname: constants.SPEC_DEV_LOGS_HOSTNAME,
            }}
        default:
            return { data: {
                eventsHostname: constants.SPEC_PROD_EVENTS_HOSTNAME,
                logsHostname: constants.SPEC_PROD_LOGS_HOSTNAME,
            }}
    }
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