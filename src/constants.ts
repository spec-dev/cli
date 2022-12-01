import { StringKeyMap } from './types'
import path from 'path'
import { ev } from './utils/env'
import os from 'os'

const constants: StringKeyMap = {
    // Spec project config.
    SPEC_CONFIG_DIR_NAME: '.spec',
    CONNECTION_CONFIG_FILE_NAME: 'connect.toml',
    PROJECT_CONFIG_FILE_NAME: 'project.toml',

    // Global CLI config.
    SPEC_GLOBAL_DIR: path.join(os.homedir(), '.spec'),
    SPEC_GLOBAL_STATE_FILE_NAME: 'state.toml',
    SPEC_GLOBAL_CREDS_FILE_NAME: 'creds.toml',

    // Spec API config.
    SPEC_API_ORIGIN: ev('SPEC_API_ORIGIN', 'https://api.spec.dev'),
    USER_AUTH_HEADER_NAME: 'Spec-User-Auth-Token',

    // Default DB config.
    DB_USER: 'spec',
    DB_HOST: 'docker.for.mac.host.internal',
    DB_PORT: 5432,
    DB_INIT_PATH: 'https://raw.githubusercontent.com/spec-dev/spec/master/db/init.sql',
    DB_INIT_TMP_FILE_NAME: 'spec-db-init.sql',

    // Docker image.
    SPEC_DOCKER_IMAGE: 'specdev/spec',
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

export default constants
