import { createFileWithContents, fileExists } from '../utils/file'
import constants from '../constants'
import path from 'path'

const comments = {
    DATA_SOURCES_SECTION: '# = Data Sources -----------------------------',
    LIVE_TABLES_SECTION: '# = Live Tables ------------------------------',
    LINKS_SECTION: '# = Links & Filters --------------------------',
    DEFAULTS_SECTION: '# = Defaults ---------------------------------',
}

const TEMPLATE = `${comments.DATA_SOURCES_SECTION}


${comments.LIVE_TABLES_SECTION}


${comments.LINKS_SECTION}

`

export const createSpecProjectConfigFile = (specConfigDir?: string) => {
    specConfigDir = specConfigDir || constants.SPEC_CONFIG_DIR
    const filePath = path.join(specConfigDir, constants.PROJECT_CONFIG_FILE_NAME)
    fileExists(filePath) || createFileWithContents(filePath, TEMPLATE)
}

export const localProjectConfigFileExists = () => fileExists(constants.PROJECT_CONFIG_PATH)
