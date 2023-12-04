import { StringKeyMap } from './types'
import path from 'path'
import { ev } from './utils/env'
import os from 'os'

const constants: StringKeyMap = {
    // Spec project config.
    SPEC_CONFIG_DIR_NAME: '.spec',
    CONNECTION_CONFIG_FILE_NAME: 'connect.toml',
    PROJECT_CONFIG_FILE_NAME: 'project.toml',
    MIGRATIONS_DIR_NAME: 'migrations',
    HANDLERS_DIR_NAME: 'handlers',
    HOOKS_DIR_NAME: 'hooks',
    GRAPHQL_DIR_NAME: 'graphql',
    DEFAULT_CONTRACT_GROUPS_SPEC_FILE_NAME: 'contracts.spec.json',

    // Global CLI config.
    SPEC_GLOBAL_DIR: path.join(os.homedir(), '.spec'),
    SPEC_GLOBAL_STATE_FILE_NAME: 'state.toml',
    SPEC_GLOBAL_CREDS_FILE_NAME: 'creds.toml',
    SPEC_GLOBAL_PROJECTS_FILE_NAME: 'projects.toml',

    // Spec base/ecosystem and docs.
    SPEC_ORIGIN: ev('SPEC_ORIGIN', 'https://spec.dev'),
    DOCS_ORIGIN: ev('SPEC_DOCS_ORIGIN', 'https://docs.spec.dev'),

    // Spec API config.
    SPEC_API_ORIGIN: ev('SPEC_API_ORIGIN', 'https://api.spec.dev'),
    USER_AUTH_HEADER_NAME: 'Spec-User-Auth-Token',

    AUTH_HEADER_NAME: 'Spec-Auth-Token',

    // DB defaults.
    SPEC_DB_USER: 'spec',
    DB_PORT: 5432,

    // Live Table testing.
    LIVE_OBJECT_TESTING_DB_NAME: 'spec-test',
    LIVE_OBJECT_TESTING_API_PORT: 8000,

    // Desktop app name.
    SPEC_APP_NAME: 'Spec',

    // Default log size.
    DEFAULT_LOG_TAIL_SIZE: 20,
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
constants.SPEC_GLOBAL_STATE_PATH = path.join(
    constants.SPEC_GLOBAL_DIR,
    constants.SPEC_GLOBAL_STATE_FILE_NAME
)
constants.SPEC_GLOBAL_CREDS_PATH = path.join(
    constants.SPEC_GLOBAL_DIR,
    constants.SPEC_GLOBAL_CREDS_FILE_NAME
)
constants.SPEC_GLOBAL_PROJECTS_PATH = path.join(
    constants.SPEC_GLOBAL_DIR,
    constants.SPEC_GLOBAL_PROJECTS_FILE_NAME
)
constants.SPEC_GLOBAL_COMPOSE_DIR = path.join(constants.SPEC_GLOBAL_DIR, 'compose')
constants.SPEC_HANDLERS_DIR = path.join(constants.SPEC_CONFIG_DIR, constants.HANDLERS_DIR_NAME)
constants.SPEC_HOOKS_DIR = path.join(constants.SPEC_CONFIG_DIR, constants.HOOKS_DIR_NAME)

export default constants
