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
    SPEC_CLIENT_DB_USER: 'spec',
    APP_API_DB_USER: 'postgres',
    DB_PORT: 5432,

    // Local shared tables.
    SHARED_TABLES_DB_NAME: 'shared-tables',
    LOCAL_SHARED_TABLES_API_PORT: 8000,

    // Docker image.
    SPEC_DOCKER_IMAGE: 'specdev/spec',
    INTERNAL_DOCKER_HOST: 'host.docker.internal',

    // Local dashboard url
    SPEC_DASHBOARD_URL: 'http://localhost:54321',
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

export default constants
