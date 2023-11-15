import { logWarning, logFailure, log, logSuccess } from '../../logger'
import msg from '../../utils/msg'
import { psqlInstalled } from '../../db'
import { initDatabase } from '../../db'

const CMD = 'init'

function addInitCmd(cmd) {
    cmd.command(CMD)
        .description('Initialize a Postgres database to use Spec')
        .option('-n, --name <type>', 'Database name')
        .option('--url <type>', 'Database URL')
        .action(initDB)
}

/**
 * Initialize a Postgres database to use Spec.
 */
async function initDB(options) {
    // Ensure psql is installed.
    if (!psqlInstalled()) {
        logWarning(msg.INSTALL_PSQL)
        return
    }

    const { name, url } = options
    if (!name && !url) {
        logWarning(
            `Database not specified.\nEither use --name <dbname> or --url <dburl> to specify which database to initialize.`
        )
        return
    }

    // Initialize database with Spec user/schema.
    const { alreadyInitialized, error: initDBError } = await initDatabase(name, url)
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
