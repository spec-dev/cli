import open from 'open'
import constants from '../constants'

const CMD = 'docs'

function addDocsCmd(program) {
    program.command(CMD).description('Open the Spec docs').action(docs)
}

/**
 * Open the Spec docs.
 */
async function docs() {
    await open(constants.DOCS_ORIGIN)
}

export default addDocsCmd
