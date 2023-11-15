export default {
    AUTH_REQUIRED_MESSAGE:
        'You must be logged in to perform this command.\nRun "spec login" first, and then try again.',
    INIT_PROJECT_MESSAGE:
        'Run "spec init" to initialize a new local project before running this command.',
    CHOOSE_PROJECT_MESSAGE:
        'One of your projects must be set as the *current* project before running this command.\nRun "spec use project <namespace>/<project>", and then try again.',
    NO_CURRENT_PROJECT_MESSAGE:
        'No project has been set as the current project yet.\nRun "spec use project <namespace>/<project>" to do so.',
    NO_PROJECT_LOCATION: `This project doesn\'t have a local directory set as its main location yet.\nRun "spec link project <namespace>/<project> /path/to/project" and then try again.`,
    NO_CURRENT_ENV_MESSAGE: `No environment has been set as the current environment for this project yet (e.g. local, staging, prod).\nRun "spec use env <env>" and then try again.`,
    INSTALL_PSQL: 'Make sure postgres is installed, running, and "psql" is available.',
    MUST_BE_PG_URL: 'Database url must be a valid postgres url.',
    INSTALL_SPEC_CLIENT:
        'The spec client needs to be installed to run Spec locally.\nTry running "npm install -g @spec.dev/spec", and then try again.',
    INSTALL_DENO:
        'Deno is required to test Live Objects locally. Please install deno and then try again.',
    DB_NOT_INITIALIZED:
        'Database not yet initialized for Spec. Run "spec db init --url <DB_URL>" and then try again.',
}
