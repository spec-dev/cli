import { createSpecConnectionConfigFile } from './connect'
import { createSpecProjectConfigFile } from './project'
import constants from '../constants'
import { createDir, fileExists } from '../utils/file'

export function createNewSpecConfig(specConfigDir?: string) {
    specConfigDir = specConfigDir || constants.SPEC_CONFIG_DIR
    fileExists(specConfigDir) || createDir(specConfigDir)
    createSpecConnectionConfigFile(specConfigDir)
    createSpecProjectConfigFile(specConfigDir)
}
