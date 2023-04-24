import { fileExists, createDir } from '../utils/file'
import constants from '../constants'

export const specConfigDirExists = (): boolean => fileExists(constants.SPEC_CONFIG_DIR)
