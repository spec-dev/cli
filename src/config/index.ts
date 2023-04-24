import { createSpecConnectionConfigFile } from './connect'
import { createSpecProjectConfigFile } from './project'
import constants from '../constants'
import { createDir } from '../utils/file'

export function createNewSpecConfig(specConfigDir?: string, defaultDbUrl?: string) {
    specConfigDir = specConfigDir || constants.SPEC_CONFIG_DIR
    createDir(specConfigDir)
    createSpecConnectionConfigFile(specConfigDir, defaultDbUrl)
    createSpecProjectConfigFile(specConfigDir)
}
