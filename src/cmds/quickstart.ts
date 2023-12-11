import path from 'path'
import { logFailure, logSuccess, logWarning } from '../logger'
import { getDBConfig, updateDatabaseNameForEnv } from '../config/connect'
import { upsertDatabase } from '../db'
import constants from '../constants'
import { fileExists } from '../utils/file'
import { linkProject } from './link/project'
import process from 'process'

const CMD = 'quickstart'

function addQuickstartCmd(program) {
    program
        .command(CMD)
        .description('Quickstart the setup for a Spec project')
        .argument('project', 'The project to quickstart in <namespace>/<project> format')
        .action(quickstart)
}

/**
 * Speedrun the project setup process.
 */
export async function quickstart(project: string) {
    // Link the given project to the cwd and initialize this folder as a Spec project.
    const linkedProject = await linkProject(project, '.', false)
    if (!linkedProject) {
        logWarning(`Failed to link project ${project} to the current working directory.`)
        return
    }

    // Get refs to the spec config dir.
    const projectDirPath = process.cwd()
    const specConfigDir = path.join(projectDirPath, constants.SPEC_CONFIG_DIR_NAME)
    if (!fileExists(specConfigDir)) {
        logWarning(`Spec config directory doesn't exist at ${specConfigDir}.`)
        return
    }

    // Get the current "local" database environment info from connect.toml.
    const projectEnv = 'local'
    const { data: dbConfig, error: getDBConfigError } = getDBConfig(projectDirPath, projectEnv)
    if (getDBConfigError) {
        logFailure(getDBConfigError)
        return
    }
    if (!dbConfig) {
        logWarning(
            `No environment named "${projectEnv}" inside ${constants.CONNECTION_CONFIG_FILE_NAME}.`
        )
        return
    }

    // If database name already specified, stop here.
    if (dbConfig.name) {
        logSuccess(`Quickstart complete.`)
        return
    }

    // Upsert the quickstart database.
    const dbName = constants.QUICKSTART_DB_NAME
    const { error: dbError } = upsertDatabase(dbName)
    if (dbError) {
        logFailure(`Failed to upsert the "${dbName}" local database: ${dbError}`)
        return
    }

    // Set the quickstart database as the DB name for the local env.
    const { error: fileError } = updateDatabaseNameForEnv(projectDirPath, projectEnv, dbName)
    if (fileError) {
        logFailure(`Failed to update connect.toml: ${fileError}`)
        return
    }

    logSuccess(`Quickstart complete.`)
}

export default addQuickstartCmd
