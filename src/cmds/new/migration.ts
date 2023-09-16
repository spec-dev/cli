import { logFailure, logSuccess, logWarning } from '../../logger'
import path from 'path'
import constants from '../../constants'
import { newMigration, saveMigration } from '../../config/migrations'
import { getCurrentProjectId, getProjectInfo } from '../../config/global'
import msg from '../../utils/msg'
import { fileExists } from '../../utils/file'

const CMD = 'migration'

function addMigrationCmd(cmd) {
    cmd.command(CMD)
        .description('Create a new migration for the current project')
        .argument('name', 'Name of the migration')
        .action(newEmptyMigration)
}

/**
 * Create a new migration (up/down) for your current Spec project.
 */
async function newEmptyMigration(name) {
    // Get the current project id.
    const { data: projectId, error } = getCurrentProjectId()
    if (error) {
        logFailure(error)
        return
    }
    if (!projectId) {
        logWarning(msg.CHOOSE_PROJECT_MESSAGE)
        return
    }

    // Get the location of the project (/path/to/project)
    const { data: projectInfo, error: getProjectError } = getProjectInfo(projectId)
    if (getProjectError) {
        logFailure(error)
        return
    }
    const { location: projectDirPath } = projectInfo || {}
    if (!projectDirPath) {
        logWarning(msg.NO_PROJECT_LOCATION)
        return
    }
    const specConfigDir = path.join(projectDirPath, constants.SPEC_CONFIG_DIR_NAME)
    if (!fileExists(specConfigDir)) {
        logWarning(`Spec config directory doesn't exist at ${specConfigDir}.`)
        return
    }

    // Create new empty migration object with a version attached to the given name.
    const migration = newMigration(name)

    // Create/save empty up.sql and down.sql files inside the new migration version dir.
    const { versionDir, error: creationError } = saveMigration(projectDirPath, migration)
    if (creationError) {
        logFailure(creationError)
        return
    }

    logSuccess(`New empty migration at "${versionDir}"`)
}

export default addMigrationCmd
