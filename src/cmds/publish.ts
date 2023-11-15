import { logWarning, logSuccess, log, logFailure } from '../logger'
import msg from '../utils/msg'
import fs from 'fs'
import path from 'path'
import { sleep } from '../utils/time'
import { fileExists } from '../utils/file'
import { client } from '../api/client'
import { getSessionToken } from '../utils/auth'
import { getProjectCreds, getCurrentProjectId } from '../config/global'
import ora from 'ora'
import { PublishLiveObjectVersionJobStatus, StringKeyMap } from '../types'
import chalk from 'chalk'
import differ from 'ansi-diff-stream'

const POLL_INTERVAL = 1000

const CMD = 'publish'

function addPublishCmd(program) {
    program
        .command(CMD)
        .description('Publish a Live Table')
        .argument('folder', 'Folder of the Live Table')
        .action(publish)
}

/**
 * Publish a Live Table.
 */
async function publish(givenFolderPath: string) {
    const { token: sessionToken, error: sessionTokenError } = getSessionToken()
    if (sessionTokenError) {
        logFailure(sessionTokenError)
        return
    }
    if (!sessionToken) {
        log(msg.AUTH_REQUIRED_MESSAGE)
        return
    }

    const folderPath = path.join(process.cwd(), givenFolderPath)
    const manifestPath = path.join(folderPath, 'manifest.json')
    if (!fileExists(manifestPath)) {
        logWarning(`No Live Table found at ${folderPath}`)
        return
    }

    const manifest = JSON.parse(fs.readFileSync(manifestPath, 'utf8'))
    const { namespace, name, version } = manifest

    const { uid, error } = await client.publishLiveObjectVersion(
        namespace,
        name,
        version,
        givenFolderPath,
        sessionToken,
    )
    if (error) {
        logFailure(`Error publishing Live Table: ${error}`)
        return
    }

    await pollForPublishResult(uid, sessionToken, manifest)
}

async function pollForPublishResult(
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
            logProgress(cursor)
            spinner.text = `Running shared-table migrations for ${nsp} ${name} ${version}`
        }

        if (status === PublishLiveObjectVersionJobStatus.Publishing) {
            logProgress(cursor)
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

export default addPublishCmd