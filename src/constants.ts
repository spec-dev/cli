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

    // Global CLI config.
    SPEC_GLOBAL_DIR: path.join(os.homedir(), '.spec'),
    SPEC_GLOBAL_STATE_FILE_NAME: 'state.toml',
    SPEC_GLOBAL_CREDS_FILE_NAME: 'creds.toml',
    SPEC_GLOBAL_PROJECTS_FILE_NAME: 'projects.toml',

    // Spec API config.
    SPEC_API_ORIGIN: ev('SPEC_API_ORIGIN', 'https://api.spec.dev'),
    USER_AUTH_HEADER_NAME: 'Spec-User-Auth-Token',

    // Default DB config.
    SPEC_DB_USER: 'spec',
    DB_PORT: 5432,

    // Local shared tables API (for live object testing).
    SHARED_TABLES_DB_NAME: 'shared-tables',
    LOCAL_SHARED_TABLES_API_PORT: 8000,

    // Desktop app name.
    SPEC_APP_NAME: 'Spec',
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
constants.SPEC_MIGRATIONS_DIR = path.join(constants.SPEC_CONFIG_DIR, constants.MIGRATIONS_DIR_NAME)
constants.SPEC_HANDLERS_DIR = path.join(constants.SPEC_CONFIG_DIR, constants.HANDLERS_DIR_NAME)
constants.SPEC_HOOKS_DIR = path.join(constants.SPEC_CONFIG_DIR, constants.HOOKS_DIR_NAME)
constants.TEST_DATA_URL = path.join(
    constants.SPEC_API_ORIGIN,
    '/live-object-version/generate-test-inputs'
)

export default constants
