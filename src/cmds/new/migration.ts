import { logFailure, logSuccess } from '../../logger'
import path from 'path'
import constants from '../../constants'
import { newMigration, saveMigration } from '../../config/migrations'

const CMD = 'migration'

function addMigrationCmd(cmd) {
    cmd.command(CMD)
        .description('Create a new migration for the current project')
        .argument('name', 'Name of the migration')
        .action(newEmptyMigration)
}

/**
 * Create a new migration (up/down) in the Spec migrations directory.
 */
async function newEmptyMigration(name) {
    // Create new empty migration object with a version attached to the given name.
    const migration = newMigration(name)

    // Create/save empty up.sql and down.sql files inside the new migration version dir.
    const { error } = saveMigration(migration)
    if (error) {
        logFailure(error)
        return
    }

    const displayPath = path.join(
        constants.SPEC_CONFIG_DIR_NAME,
        constants.MIGRATIONS_DIR_NAME,
        migration.name
    )
    logSuccess(`New empty migration at "${displayPath}"`)
}

export default addMigrationCmd
