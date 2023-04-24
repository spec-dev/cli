import { execSync, spawn } from 'node:child_process'
import { StringKeyMap } from '../types'
import constants from '../constants'
import { sleep } from './time'
import path from 'path'
import { saveProjectComposeEnvs } from '../config/global'
import { log } from '../logger'
import { getOS, OS } from './os'
import process from 'process'
import { fileExists } from './file'

export function ensureDockerInstalled(): boolean {
    try {
        const out = execSync('which docker')
        const path = out.toString().trim()
        return !!path.length
    } catch (error) {
        return false
    }
}

export function ensureDockerComposeInstalled(): boolean {
    let installed = true
    try {
        execSync(`docker compose`)
    } catch (error) {
        installed = false
    }
    if (installed) return true

    try {
        const out = execSync('which docker-compose')
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

export function stopSpec(projectId: string): StringKeyMap {
    const composeFilePath = getDockerComposeFilePath()
    const envsFilePath = path.join(constants.SPEC_GLOBAL_COMPOSE_DIR, `${projectId}.env`)
    let error = null
    try {
        execSync(
            `docker compose --file ${composeFilePath} --env-file ${envsFilePath} down`,
            { stdio: 'pipe' }
        )
    } catch (err) {
        error = err
    }
    if (error) return { error }

    // const pid = findSpecClientProcess(projectId)
    // if (pid === null) return { error: null }

    // try {
    //     execSync(`kill ${pid}`)
    // } catch (err) {
    //     error = err
    // }

    try {
        execSync(`rm ${path.join(constants.SPEC_GLOBAL_DIR, `${projectId}.log`)}`)
    } catch (err) {}

    return { error }
}

export async function startSpec(
    projectId: string, 
    projectApiKey: string,
    dbConfig: StringKeyMap,
    newlyAssignedSpecUserPassword: string | null,
): Promise<StringKeyMap> {
    const dbName = dbConfig.name || 'postgres'
    const dbPort = Number(dbConfig.port || constants.DB_PORT)
    const dbUser = dbConfig.user || constants.APP_API_DB_USER
    const dbHost = dbConfig.host || 'localhost'
    const dbPassword = dbConfig.password || ''
    const composeFilePath = getDockerComposeFilePath()

    const { path: envsFilePath, error } = saveProjectComposeEnvs(projectId, {
        PROJECT_ID: projectId,
        DB_HOST: dbHost === 'localhost' ? constants.INTERNAL_DOCKER_HOST : dbHost,
        DB_NAME: dbName,
        DB_USER: dbUser,
        DB_PORT: dbPort,
        DB_PASSWORD: dbPassword,
        SPEC_CONFIG_DIR: constants.SPEC_CONFIG_DIR,
    })
    if (error) return { error }

    log('Resolving dashboard image...')

    try {
        execSync(
            `docker compose --file ${composeFilePath} --env-file ${envsFilePath} up -d`,
            { stdio: 'pipe' }
        )
    } catch (error) {
        return { error }
    }

    // Wait for app to be running.
    let i = 0
    while (true) {
        i === 1 && log('Starting dashboard...')
        let containerExists = false
        try {
            const out = execSync(`docker ps --filter "name=app-api-${projectId}" | grep app-api-${projectId} | wc -l`)
            const numMatchingContainers = parseInt(out.toString().trim())
            containerExists = !Number.isNaN(numMatchingContainers) && numMatchingContainers > 0    
        } catch (err) {
            return { error : err }
        }
        if (!containerExists) {
            await sleep(1000)
            i++
            continue
        }

        let up = false
        try {
            const out = execSync(`docker logs app-api-${projectId} | grep listening | wc -l`)
            const numOut = parseInt(out.toString().trim())
            up = !Number.isNaN(numOut) && numOut > 0    
        } catch (err) {
            return { error : err }
        }
        if (!up) {
            await sleep(1000)
            i++
            continue
        }
        break
    }

    log('Starting Spec client...')
    await sleep(1000)

    let specDbUser = constants.SPEC_CLIENT_DB_USER
    let specDbPassword = newlyAssignedSpecUserPassword
    if (!newlyAssignedSpecUserPassword && dbHost !== 'localhost') {
        specDbUser = dbUser
        specDbPassword = dbPassword
    }
    
    const clientCmdArgs = [
        ['--config-dir', constants.SPEC_CONFIG_DIR],
        ['--user', specDbUser],
        ['--host', dbHost],
        ['--port', dbPort],
        ['--name', dbName],
        ['--id', projectId],
        ['--api-key', projectApiKey],
        ['--stream-logs', 'local'],
        ['--debug', 'true'],
    ].flat()

    if (specDbPassword) {
        clientCmdArgs.push(...['--password', specDbPassword])
    }

    process.env.FORCE_COLOR = '1'

    const nodePath = addCustomNodeModulesToPath()
    if (nodePath) {
        process.env.NODE_PATH = nodePath
    }
    
    let proc
    try {
        proc = spawn('spec-client', clientCmdArgs, { detached: true, stdio: 'ignore' })
    } catch (error) {
        return { error }
    }
    proc.unref()

    return { error: null }
}

function getDockerComposeFilePath(): string {
    const os = getOS()
    const fileName = os === OS.Linux ? 'linux.yaml' : 'default.yaml'
    return path.resolve(__dirname, '..', 'files', fileName)
}

function addCustomNodeModulesToPath(): string {
    const currentNodePath = process.env.NODE_PATH || ''
    const currentImportPaths = currentNodePath.split(':').filter(v => !!v)
    const cwdNodeModulesPath = path.join(process.cwd(), 'node_modules')
    if (!fileExists(cwdNodeModulesPath)) return ''

    if (!currentImportPaths.includes(cwdNodeModulesPath)) {
        currentImportPaths.push(cwdNodeModulesPath)
    }

    return currentImportPaths.join(':')
}