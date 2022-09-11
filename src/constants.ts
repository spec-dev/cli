import { StringKeyMap } from './types'
import path from 'path'
import { ev } from './utils/env'
import os from 'os'
import { removeTrailingSlash } from './utils/formatters'

const constants: StringKeyMap = {
    // Spec config.
    SPEC_CONFIG_DIR_NAME: '.spec',
    CONNECTION_CONFIG_FILE_NAME: 'connect.toml',
    PROJECT_CONFIG_FILE_NAME: 'project.toml',

    // Global creds config.
    SPEC_GLOBAL_DIR: path.join(os.homedir(), '.spec'),
    SPEC_GLOBAL_CREDS_FILE_NAME: 'creds.toml',

    // Spec API.
    SPEC_API_ORIGIN: removeTrailingSlash(ev('SPEC_API_ORIGIN', 'https://api.spec.dev')),
    USER_AUTH_HEADER_NAME: 'Spec-User-Auth-Token',
    SPEC_NETRC_ENTRY: 'api.spec.dev',

    // Common error/warning messages.
    AUTH_REQUIRED_MESSAGE:
        'You must be logged in to perform this command.\nRun "spec login" first, and then try again.',
    INIT_PROJECT_MESSAGE: `Run "spec init" to initialize a new local project before running this command.`,
}

constants.SPEC_CONFIG_DIR = path.join(process.cwd(), constants.SPEC_CONFIG_DIR_NAME)

constants.CONNECTION_CONFIG_PATH = path.join(
    constants.SPEC_CONFIG_DIR,
    constants.CONNECTION_CONFIG_FILE_NAME
)

constants.PROJECT_CONFIG_PATH = path.join(
    constants.SPEC_CONFIG_DIR,
    constants.PROJECT_CONFIG_FILE_NAME
)

constants.SPEC_GLOBAL_CREDS_PATH = path.join(
    constants.SPEC_GLOBAL_DIR,
    constants.SPEC_GLOBAL_CREDS_FILE_NAME
)

export default constants
