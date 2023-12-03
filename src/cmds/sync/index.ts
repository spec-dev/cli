import addSyncContractsCmd from './contracts'
import chalk from 'chalk'

const CMD = 'sync'

function addSyncCmd(program) {
    const sync = program.command(CMD).description(chalk.gray('...'))
    addSyncContractsCmd(sync)
}

export default addSyncCmd
