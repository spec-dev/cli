const CMD = 'abi'

function addGetABICmd(cmd) {
    cmd.command(CMD)
        .argument('address', 'Address of the contract to get the ABI for.')
        .action(getABI)
}

/**
 * Get ABI from redis server
 */
async function getABI(address: string) {
    console.log('in get abi', address)
    // Get the current project id.
    // const { data: projectId, error } = getCurrentProjectId()
    // if (error) {
    //     logFailure(error)
    //     return
    // }
    // if (!projectId) {
    //     logWarning(msg.CHOOSE_PROJECT_MESSAGE)
    //     return
    // }

    // // Get the location of the project (/path/to/project)
    // const { data: projectInfo, error: getProjectError } = getProjectInfo(projectId)
    // if (getProjectError) {
    //     logFailure(error)
    //     return
    // }
    // const { location } = projectInfo || {}
    // if (!location) {
    //     logWarning(msg.NO_PROJECT_LOCATION)
    //     return
    // }

    // logSuccess(location)
}

export default addGetABICmd
