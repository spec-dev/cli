import { logWarning, logFailure } from '../../logger'
import constants from '../../constants'
import { ensureDenoInstalled, testLiveObject } from '../../utils/deno'
import msg from '../../utils/msg'
import { psqlInstalled, upsertSharedTablesDB } from '../../db'
import { getProjectCreds, getCurrentProjectId } from '../../config/global'

const CMD = 'object'

function addObjectCommand(cmd) {
    cmd.command(CMD)
        .alias('objects')
        .argument('name', 'Name of Live Object to test')
        .option('--port <type>', 'Port to run the Live Object testing server on.')
        .action(testObject)
}

/**
 * Test a Live Object locally.
 */
async function testObject(name, options) {
    const port = options?.port || constants.LOCAL_SHARED_TABLES_API_PORT

    // Ensure Deno is installed.
    const isDenoInstalled = ensureDenoInstalled()
    if (!isDenoInstalled) {
        logWarning(msg.INSTALL_DOCKER)
        return
    }

    // Ensure psql is installed.
    if (!psqlInstalled()) {
        logWarning(msg.INSTALL_PSQL)
        return
    }

    // Ensure the "shared-tables" database exists locally.
    const { error: sharedTablesDbError } = upsertSharedTablesDB()
    if (sharedTablesDbError) {
        logFailure(`Failed to upsert the "shared-tables" database locally: ${sharedTablesDbError}`)
        return
    }

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

    // Run the test Live Object Deno script.
    testLiveObject(name, port, creds.apiKey)
}

export default addObjectCommand
