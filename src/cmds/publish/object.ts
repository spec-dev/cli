import { logWarning, logSuccess, log, logFailure } from '../../logger'
import msg from '../../utils/msg'
import fs from 'fs'
import path from 'path'
import { client } from '../../api/client'
import { getSessionToken } from '../../utils/auth'
import { getProjectCreds, getCurrentProjectId } from '../../config/global'

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

    let namespace, name, folder, version
    try {
        const manifestPath = path.join(process.cwd(), objectName, 'manifest.json')
        const data = fs.readFileSync(manifestPath, 'utf8')
        const manifestJson = JSON.parse(data)
        namespace = manifestJson.namespace
        name = manifestJson.name
        version = manifestJson.version
        folder = objectName
    } catch (err) {
        logFailure(`Error reading manifest file: ${err}`)
    }

    await client.publishObject(namespace, name, folder, version, sessionToken, creds.apiKey)
}

export default publishObjectCommand
