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

    // DB config.
    DB_USER: 'spec',
    DB_PORT: 5432,

    // Docker image.
    SPEC_DOCKER_IMAGE: 'specdev/spec',

    // Common error/warning messages.
    AUTH_REQUIRED_MESSAGE:
        'You must be logged in to perform this command.\nRun "spec login" first, and then try again.',
    INIT_PROJECT_MESSAGE:
        'Run "spec init" to initialize a new local project before running this command.',
    LINK_PROJECT_MESSAGE:
        'No Spec project is currently linked.\nRun "spec init" followed by "spec link --project <org>/<name>" to set this up.',
    POPULATE_DB_CONN_CONFIG_MESSAGE:
        'Please specify the "name" of the database you wish to connect to within .spec/connect.toml.\nRun "spec init" if you need to initialize a new .spec/ config directory.',
    INSTALL_DOCKER:
        'Docker is required in order to run Spec locally. Please install docker and then try again.',
    RUN_DOCKER:
        'Docker does not appear to be running...Make sure docker is started and then try again.',
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
