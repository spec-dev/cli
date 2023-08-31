import { openApp } from 'open'
import constants from '../constants'

const CMD = 'open'

function addOpenCmd(program) {
    program.command(CMD).description('Open the Spec desktop app').action(openSpec)
}

/**
 * Open the Spec App.
 */
async function openSpec() {
    openApp(constants.SPEC_APP_NAME)
}

export default addOpenCmd
