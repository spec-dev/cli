import path from 'path'
import { client } from '../../api/client'
import msg from '../../utils/msg'
import { logFailure, logSuccess, logWarning } from '../../logger'
import { fileExists } from '../../utils/file'
import { getCurrentProjectId, getProjectInfo } from '../../config/global'
import constants from '../../constants'
import { saveMigration, generateCreateTableMigrationFromLov } from '../../config/migrations'
import { camelToSnake, fromNamespacedVersion } from '../../utils/formatters'
import { upsertLiveColumns } from '@spec.dev/pm'
import { migrate } from '../migrate'
import { schemaName } from '../../config/migrations'

const CMD = 'table'

function addContractsCmd(cmd) {
    cmd.command(CMD)
        .description('Add a new live table to your current project')
        .requiredOption('--from <id>', 'Live object version', null)
        .option('--name <type>', 'Table name')
        .option('--migrate', 'Whether to also immediately run the new table migration')
        .option('--config-only', 'Avoid generating the SQL migration')
        .action(addTable)
}

/**
 * Add the SQL migration and Spec config for a
 * new live table to your current project.
 */
export async function addTable(opts: {
    from: string
    name: string
    migrate: boolean
    configOnly: boolean
}) {
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
    const projectConfigPath = path.join(specConfigDir, constants.PROJECT_CONFIG_FILE_NAME)
    if (!fileExists(projectConfigPath)) {
        logWarning(
            `project.toml is missing inside the current project. Try running "spec init" and then try again.`
        )
        return
    }

    // Get live object version by "id".
    const id = opts.from
    const { lov, error: lovError } = await client.getLiveObjectVersion(id)
    if (lovError) {
        lovError.toLowerCase().includes('not found')
            ? logWarning(`No live object version found for "${id}".`)
            : logFailure(`Error resolving live object version: ${lovError}`)
        return
    }

    const { name } = fromNamespacedVersion(lov.name)
    const tableName = opts.name || camelToSnake(name)
    const tablePath = [schemaName, tableName].join('.')

    if (!opts.configOnly) {
        // Create new table migration from this live object version's structure.
        const { up, down, migration } = generateCreateTableMigrationFromLov(lov, tableName)
        const { error: migrationError } = saveMigration(projectDirPath, migration, up, down)
        if (migrationError) {
            logFailure(migrationError)
            return
        }
        if (opts.migrate && !(await migrate({}, false))) return
    }

    // Add the default live table config to project.toml
    const liveColumns = {}
    for (const { name } of lov.properties) {
        liveColumns[camelToSnake(name)] = { property: name }
    }
    try {
        upsertLiveColumns(projectDirPath, {
            tablePath,
            liveObjectVersionId: lov.name,
            liveColumns,
            filters: [],
            uniqueBy: lov.uniqueBy,
        })
    } catch (err) {
        logFailure(err)
        return
    }

    logSuccess(`Added new live table "${tablePath.split('.')[1]}".`)
}

export default addContractsCmd
