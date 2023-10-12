import open, { openApp } from 'open'
import constants from '../constants'
import { toNamespaceSlug, toSpecNamespaceUrl } from '../utils/formatters'

const CMD = 'open'

function addOpenCmd(program) {
    program.command(CMD).description('Open a component of Spec').action(openSpec)
}

/**
 * Open a component of Spec.
 */
async function openSpec() {
    // Open Namespace page in the Spec ecosystem.
    if (process.argv.length > 3) {
        await open(toSpecNamespaceUrl(toNamespaceSlug(process.argv[3])))
        return
    }
    // Open the Spec desktop app.
    openApp(constants.SPEC_APP_NAME)
}

export default addOpenCmd
