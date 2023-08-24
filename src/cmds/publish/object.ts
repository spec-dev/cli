import { logWarning, logSuccess, log, logFailure } from '../../logger'
import msg from '../../utils/msg'
import fs from 'fs'
import path from 'path'
import { sleep } from '../../utils/time'
import { client } from '../../api/client'
import { getSessionToken } from '../../utils/auth'
import { getProjectCreds, getCurrentProjectId } from '../../config/global'
import ora from 'ora'
import { PublishLiveObjectVersionJobStatus, StringKeyMap } from '../../types'
import chalk from 'chalk'
import differ from 'ansi-diff-stream'

const POLL_INTERVAL = 1000

const CMD = 'object'

function publishObjectCommand(cmd) {
    cmd.command(CMD)
        .argument('[objectName]', 'The full name of the live object in "nsp.Name" format', null)
        .action(publishObject)
}

async function publishObject(objectName: string) {
    // Get current project id.
    const { data: projectId, error } = getCurrentProjectId()
    if (error) {
        logFailure(error)
        return
    }
    if (!projectId) {
        logWarning(msg.CHOOSE_PROJECT_MESSAGE)
        return
    }

    // Get current project credentials from global spec creds file.
    const { data: creds, error: credsError } = getProjectCreds(projectId)
    if (credsError) {
        logFailure(`Error finding project credentials: ${credsError}`)
        return
    }
    if (!creds?.apiKey) {
        logWarning(msg.CHOOSE_PROJECT_MESSAGE)
        return
    }

    // Get authed user's session token
    const { token: sessionToken, error: sessionTokenError } = getSessionToken()
    if (sessionTokenError) {
        logFailure(sessionTokenError)
        return
    }
    if (!sessionToken) {
        log(msg.AUTH_REQUIRED_MESSAGE)
        return
    }

    let namespace, name, folder, version, manifestJson
    try {
        const manifestPath = path.join(process.cwd(), objectName, 'manifest.json')
        const data = fs.readFileSync(manifestPath, 'utf8')
        manifestJson = JSON.parse(data)
        namespace = manifestJson.namespace
        name = manifestJson.name
        version = manifestJson.version
        folder = objectName
    } catch (err) {
        logFailure(`Error reading manifest file: ${err}`)
        return
    }

    const data = await client.publishObject(
        namespace,
        name,
        folder,
        version,
        sessionToken,
        creds.apiKey
    )
    if (data.error) {
        logFailure(`Error publishing object: ${data.error}`)
        return
    }
    if (data.uid) {
        logFailure('Error: no job uid returned from api')
        return
    }
    
    await pollForPublishObjectResult(data.uid, sessionToken, manifestJson)
}

async function pollForPublishObjectResult(
    uid: string,
    sessionToken: string,
    manifest: StringKeyMap
) {
    const spinnerText = `Publishing Live Object ${manifest.namespace} ${manifest.name} ${manifest.version}`

    const diff = differ()

    const logProgress = (cursor?: string, done?: boolean) => {
        const lines = []
        lines.push(chalk.gray(chalk.dim('...' + ' '.repeat(spinnerText.length))))
        lines.push(cursor)
        lines.push(chalk.gray(chalk.dim('...')))
        diff.write(lines.join('\n'))
    }
    diff.pipe(process.stdout)

    const spinner = ora({
        text: spinnerText,
        stream: process.stdout,
    }).start()

    // Poll for progress of the publishing live object job.
    while (true) {
        const { nsp, name, version, status, cursor, failed, error } =
            await client.getPublishLiveObjectVersionJob(sessionToken, uid)

        // Job failed.
        if (failed || error) {
            spinner.stop()
            logFailure(error || 'Publishing Live Object failed.')
            return
        }

        // Running migrations on shared tables.
        if (status === PublishLiveObjectVersionJobStatus.Migrating) {
            // logProgress(cursor)
            spinner.text = `Running shared-table migrations for ${nsp} ${name} ${version}`
        }

        if (status === PublishLiveObjectVersionJobStatus.Publishing) {
            // logProgress(cursor)
            spinner.text = `Publishing core tables for ${nsp} ${name} ${version}`
        }

        if (status === PublishLiveObjectVersionJobStatus.Indexing) {
            logProgress(`Block Time: ${cursor}`)
            spinner.text = `Indexing events for ${nsp} ${name} ${version}`
        }
        
        if (status === PublishLiveObjectVersionJobStatus.Complete) {
            logProgress(cursor, true)
            spinner.stop()
            logSuccess(
                `Published ${nsp} ${name} ${version} to SPEC platform.`
            )
            return
        }

        await sleep(POLL_INTERVAL)
    }
}

export default publishObjectCommand
