import { logWarning, logFailure, log, logSuccess } from '../../logger'
import msg from '../../utils/msg'
import { psqlInstalled } from '../../db'
import { newPassword } from '../../utils/pw'
import { initDatabase } from '../../db'

const CMD = 'init'

function addInitCmd(cmd) {
    cmd.command(CMD)
        .description('Initialize a Postgres database to use Spec')
        .argument('url', 'Database URL')
        .action(initDB)
}

/**
 * Initialize a Postgres database to use Spec.
 */
async function initDB(url) {
    // Ensure psql is installed.
    if (!psqlInstalled()) {
        logWarning(msg.INSTALL_PSQL)
        return
    }

    // Initialize database with Spec user/schema.
    const { alreadyInitialized, error: initDBError } = await initDatabase('', url)
    if (initDBError) {
        logFailure(`Error initializing database: ${initDBError}`)
        return
    }
    if (alreadyInitialized) {
        log(`Database already initialized for Spec.`)
        return
    }

    logSuccess(`Database ready to be used with Spec.`)
}

export default addInitCmd
