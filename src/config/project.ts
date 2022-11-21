import { createFileWithContents } from '../utils/file'
import constants from '../constants'

const comments = {
    LIVE_OBJECTS_SECTION: '# = Live Objects (Sources) ------------------------------',
    LINKS_SECTION: '# = Links (Inputs) --------------------------------------',
    LIVE_COLUMNS_SECTION: '# = Live Columns (Outputs) ------------------------------',
    DEFAULTS_SECTION: '# = Defaults --------------------------------------------',
}

const TEMPLATE = `${comments.LIVE_OBJECTS_SECTION}


${comments.LINKS_SECTION}


${comments.LIVE_COLUMNS_SECTION}

`

export const createSpecProjectConfigFile = () =>
    createFileWithContents(constants.PROJECT_CONFIG_PATH, TEMPLATE)
