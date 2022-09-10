import { StringKeyMap } from './types'
import path from 'path'
import { ev } from './utils/env'
import { removeTrailingSlash } from './utils/formatters'

const constants: StringKeyMap = {
    // Spec config.
    SPEC_CONFIG_DIR_NAME: '.spec',
    CONNECTION_CONFIG_FILE_NAME: 'connect.toml',
    PROJECT_CONFIG_FILE_NAME: 'project.toml',

    // Spec API.
    SPEC_API_ORIGIN: removeTrailingSlash(ev('SPEC_API_ORIGIN', 'https://api.spec.dev')),
    USER_AUTH_HEADER_NAME: 'Spec-User-Auth-Token',
    SPEC_NETRC_ENTRY: 'api.spec.dev'
}

constants.SPEC_CONFIG_DIR = path.join(process.cwd(), constants.SPEC_CONFIG_DIR_NAME)
constants.CONNECTION_CONFIG_PATH = path.join(constants.SPEC_CONFIG_DIR, constants.CONNECTION_CONFIG_FILE_NAME)
constants.PROJECT_CONFIG_PATH = path.join(constants.SPEC_CONFIG_DIR, constants.PROJECT_CONFIG_FILE_NAME)

export default constants