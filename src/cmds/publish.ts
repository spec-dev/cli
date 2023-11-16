import { logWarning, logSuccess, log, logFailure } from '../logger'
import msg from '../utils/msg'
import fs from 'fs'
import path from 'path'
import { sleep } from '../utils/time'
import { fileExists } from '../utils/file'
import { client } from '../api/client'
import { toNamespacedVersion, toLiveTableUrl } from '../utils/formatters'
import { getSessionToken } from '../utils/auth'
import ora from 'ora'
import { PublishLiveObjectVersionJobStatus, StringKeyMap } from '../types'
import chalk from 'chalk'
import differ from 'ansi-diff-stream'
import progress from 'progress-string'
import open from 'open'
import { formatDate } from '../utils/date'

const POLL_INTERVAL = 1000

const CMD = 'publish'

function addPublishCmd(program) {
    program
        .command(CMD)
        .description('Publish a Live Table')
        .argument('folder', 'Folder of the Live Table')
        .option('--open', 'Open the Live Table in the Spec ecosytem once published')
        .action(publish)
}

/**
 * Publish a Live Table.
 */
async function publish(givenFolderPath: string, opts: StringKeyMap) {
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
        logWarning(`No Live Table found within ${folderPath}`)
        return
    }

    const manifest = JSON.parse(fs.readFileSync(manifestPath, 'utf8'))
    const { namespace, name, version } = manifest

    const { uid, error } = await client.publishLiveObjectVersion(
        namespace,
        name,
        version,
        givenFolderPath,
        sessionToken
    )
    if (error) {
        logFailure(`Error publishing Live Table: ${error}`)
        return
    }

    await pollForPublishResult(namespace, uid, sessionToken, manifest, opts)
}

async function pollForPublishResult(
    nsp: string,
    uid: string,
    sessionToken: string,
    manifest: StringKeyMap,
    opts: StringKeyMap
) {
    const namespacedVersion = toNamespacedVersion(
        manifest.namespace,
        manifest.name,
        manifest.version
    )

    const progressBar = progress({
        width: 40,
        total: 1,
        incomplete: ' ',
        complete: '.',
    })

    const spinnerText = `Publishing ${namespacedVersion}`
    const diff = differ()

    const logProgress = (value: number, cursor: Date, done?: boolean) => {
        const lines = []
        const date = formatDate(cursor)
        lines.push(chalk.gray(chalk.dim('...' + ' '.repeat(spinnerText.length))))
        const suffix = value === 1 ? chalk.cyanBright(date) : date
        lines.push(`${namespacedVersion} ${chalk.cyan(progressBar(value))} ${suffix}`)
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
        const { status, cursor, metadata, failed, error } =
            await client.getPublishLiveObjectVersionJob(sessionToken, uid)
        if (error && error.toLowerCase().includes('parsing json')) continue

        // Job failed.
        if (failed || error) {
            spinner.stop()
            logFailure(error || 'Publishing Live Table failed.')
            return
        }

        // Indexing.
        if (status === PublishLiveObjectVersionJobStatus.Indexing) {
            if (metadata.startCursor) {
                const start = new Date(metadata.startCursor).getTime()
                const currentCursor = new Date(cursor || start)
                const current = currentCursor.getTime()
                const end = new Date().getTime()
                const total = end - start
                const progress = current - start
                const fraction = progress / total
                logProgress(fraction, currentCursor)
            }
            spinner.text = `Indexing Live Table`
        }

        // Done.
        if (status === PublishLiveObjectVersionJobStatus.Complete) {
            logProgress(1, new Date(cursor))
            spinner.stop()

            logSuccess(`Successfully published ${namespacedVersion}`)
            let liveTableUrl
            if (metadata.liveObjectUid) {
                liveTableUrl = toLiveTableUrl(nsp, metadata.liveObjectUid)
                log(chalk.dim('View live:'))
                log(liveTableUrl)
            }

            if (opts.open && liveTableUrl) {
                await open(liveTableUrl)
            }

            return
        }

        await sleep(POLL_INTERVAL)
    }
}

export default addPublishCmd
