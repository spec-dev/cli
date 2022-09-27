import { execSync } from 'node:child_process'
import { StringKeyMap } from '../types'
import constants from '../constants'
 
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

export function runSpec(projectId: string, dbName: string, dbPort: number, apiKey: string): StringKeyMap {
    try {
        execSync(
            `docker run -d \
                -e DB_HOST='docker.for.mac.host.internal' \
                -e DB_PORT=${dbPort || constants.DB_PORT} \
                -e DB_NAME=${dbName} \
                -e DB_USER=${constants.DB_USER} \
                -e PROJECT_API_KEY=${apiKey} \
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