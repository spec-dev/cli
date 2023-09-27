import { execSync } from 'node:child_process'
import { logFailure, logSuccess } from '../../logger'

const CMD = 'seed'

const tableNameFunction = (url, tableName, columns) => {
    try {
        execSync(
            `psql ${url} -c "INSERT INTO reseed_queue (table_name, column_names, status) VALUES ('${tableName}', '${columns}','in-line');"`
        )
        logSuccess('Successfully reseeded')
    } catch (error) {
        logFailure({ error })
    }
}

function addSeedCmd(program) {
    program
        .command(CMD)
        .argument('url', 'Postgres database url to reseed')
        .argument('<table name>', 'Table that is mapped to live columns')
        .argument(
            '[column names]',
            '* for all live object columns or comma separated list of live object columns'
        )
        .action(tableNameFunction)
}

export default addSeedCmd
