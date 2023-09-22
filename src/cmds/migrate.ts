import { logFailure, logWarning, log } from '../logger'
import msg from '../utils/msg'
import { getCurrentProjectId, getProjectInfo, getCurrentProjectEnv } from '../config/global'
import { getDBConfig } from '../config/connect'
import constants from '../constants'
import path from 'path'
import { resolveDBConnectionParams, specSchemaTablesExist } from '../db'
import { fileExists } from '../utils/file'
import { syncMigrations } from '../config/migrations'
import { asPostgresUrl } from '../utils/formatters'

const CMD = 'migrate'

function addMigrateCmd(program) {
    program
        .command(CMD)
        .description("Sync your current project's SQL migrations to a database")
        .option('--env <type>', 'Project environment to run migrations against')
        .action(migrate)
}

/**
 * Run the SQL migrations for your current project (inside .spec/migrations)
 * against one of your database environments listed in connect.toml.
 */
export async function migrate(options, logWhenNoAction: boolean = true) {
    // Get the current project id.
    const { data: projectId, error } = getCurrentProjectId()
    if (error) {
        logFailure(error)
        return false
    }
    if (!projectId) {
        logWarning(msg.CHOOSE_PROJECT_MESSAGE)
        return false
    }

    // Get the current project env (local, staging, prod, etc).
    let env = options.env
    if (!env) {
        const { data, error: getEnvError } = getCurrentProjectEnv()
        env = data
        if (getEnvError) {
            logFailure(error)
            return false
        }
        if (!env) {
            logWarning(msg.NO_CURRENT_ENV_MESSAGE)
            return false
        }
    }

    // Get the location of the project (/path/to/project)
    const { data: projectInfo, error: getProjectError } = getProjectInfo(projectId)
    if (getProjectError) {
        logFailure(error)
        return false
    }
    const { location: projectDirPath } = projectInfo || {}
    if (!projectDirPath) {
        logWarning(msg.NO_PROJECT_LOCATION)
        return false
    }
    const specConfigDir = path.join(projectDirPath, constants.SPEC_CONFIG_DIR_NAME)
    if (!fileExists(specConfigDir)) {
        logWarning(`Spec config directory doesn't exist at ${specConfigDir}.`)
        return false
    }
    const migrationsDir = path.join(specConfigDir, constants.MIGRATIONS_DIR_NAME)
    if (!fileExists(migrationsDir)) {
        logWhenNoAction && log(`Migrations up-to-date.`)
        return true
    }

    // Get DB info from connection config file.
    let { data: dbConfig, error: getDBConfigError } = getDBConfig(projectDirPath, env)
    if (getDBConfigError) {
        logFailure(getDBConfigError)
        return false
    }
    if (!dbConfig) {
        logWarning(`No environment named "${env}" inside ${constants.CONNECTION_CONFIG_FILE_NAME}.`)
        return false
    }
    if (!dbConfig.name) {
        logWarning(
            `No database "name" specified for the "${env}" environment in ${constants.CONNECTION_CONFIG_FILE_NAME}.`
        )
        return false
    }
    const { data: connParams, error: formatError } = resolveDBConnectionParams(dbConfig)
    if (formatError) {
        logWarning(`Invalid database environment "${env}" — ${formatError}`)
        return false
    }

    // Ensure database was already initialized for Spec.
    const url = asPostgresUrl(connParams)
    const { data: alreadyInitializedDb, error: schemaError } = specSchemaTablesExist(
        connParams.name,
        url
    )
    if (schemaError) {
        logFailure(schemaError)
        return false
    }
    if (!alreadyInitializedDb) {
        logWarning(msg.DB_NOT_INITIALIZED)
        return false
    }

    await syncMigrations(migrationsDir, url, env, logWhenNoAction)

    return true
}

export default addMigrateCmd
