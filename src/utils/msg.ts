export default {
    AUTH_REQUIRED_MESSAGE:
        'You must be logged in to perform this command.\nRun "spec login" first, and then try again.',
    INIT_PROJECT_MESSAGE:
        'Run "spec init" to initialize a new local project before running this command.',
    CHOOSE_PROJECT_MESSAGE:
        'One of your projects must be set as the *current* project before running this command.\nRun "spec use project <org>/<name>", and then try again.',
    NO_CURRENT_PROJECT_MESSAGE:
        'No project has been set as the current project yet.\nRun "spec use project <org>/<name>" to do so.',
    POPULATE_DB_CONN_CONFIG_MESSAGE:
        'Please specify the "name" of the database you wish to connect to within .spec/connect.toml.\nRun "spec init" if you need to initialize a new .spec/ config directory.',
    INSTALL_DOCKER:
        'Docker is required in order to run Spec locally. Please install docker and then try again.',
    RUN_DOCKER:
        'Docker does not appear to be running...Make sure docker is started and then try again.',
}
