export default {
    AUTH_REQUIRED_MESSAGE:
        'You must be logged in to perform this command.\nRun "spec login" first, and then try again.',
    INIT_PROJECT_MESSAGE:
        'Run "spec init" to initialize a new local project before running this command.',
    CHOOSE_PROJECT_MESSAGE:
        'One of your projects must be set as the *current* project before running this command.\nRun "spec use project <namespace>/<project>", and then try again.',
    NO_CURRENT_PROJECT_MESSAGE:
        'No project has been set as the current project yet.\nRun "spec use project <namespace>/<project>" to do so.',
    POPULATE_DB_CONN_CONFIG_MESSAGE:
        'Please specify the "name" of the database you wish to connect to within .spec/connect.toml.\nRun "spec init" if you need to initialize a new .spec/ config directory.',
    INSTALL_DOCKER:
        'Docker is required in order to run Spec locally. Please install docker and then try again.',
    INSTALL_DOCKER_COMPOSE:
        'docker-compose is required in order to run Spec locally. Please install docker-compose and then try again.',
    RUN_DOCKER:
        'Docker does not appear to be running...Make sure docker is started and then try again.',
    INSTALL_PSQL: 'Make sure postgres is installed, running, and "psql" is available.',
    MUST_BE_PG_URL: 'Database url must be a valid postgres url.',
    INSTALL_SPEC_CLIENT:
        'The spec client needs to be installed to run Spec locally.\nTry running "npm install -g @spec.dev/spec", and then try again.',
    INSTALL_DENO:
        'Deno is required to test Live Objects locally. Please install deno and then try again.',
}
