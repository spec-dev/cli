import { StringKeyMap } from './types'
import path from 'path'

const constants: StringKeyMap = {
    SPEC_CONFIG_DIR_NAME: '.spec',
    CONNECTION_CONFIG_FILE_NAME: 'connect.toml',
    PROJECT_CONFIG_FILE_NAME: 'project.toml',
}

constants.SPEC_CONFIG_DIR = path.join(process.cwd(), constants.SPEC_CONFIG_DIR_NAME)
constants.CONNECTION_CONFIG_PATH = path.join(constants.SPEC_CONFIG_DIR, constants.CONNECTION_CONFIG_FILE_NAME)
constants.PROJECT_CONFIG_PATH = path.join(constants.SPEC_CONFIG_DIR, constants.PROJECT_CONFIG_FILE_NAME)

export default constants