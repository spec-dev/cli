import { logFailure, logSuccess, logWarning } from '../logger'
import { npmInstall } from '../config/custom'

const CMD = 'update'

function addUpdateCmd(program) {
    program.command(CMD).argument('component', 'The component to update').action(update)
}

const comps = {
    client: '@spec.dev/spec',
}

/**
 * Update one the of the components of Spec.
 *
 * Ex: $ spec update client
 */
async function update(comp) {
    const lib = comps[comp]
    if (!lib) {
        logWarning(
            `Component to update "${comp}" not found.\nValid values are ${Object.keys(comps)
                .map((c) => `"${c}"`)
                .join(', ')}`
        )
        return
    }

    // Reinstall lib via npm.
    const installError = npmInstall(`-g ${lib}`)
    if (installError) {
        logFailure(installError)
        return
    }

    logSuccess(`Successfully updated the Spec ${comp}.`)
}

export default addUpdateCmd
