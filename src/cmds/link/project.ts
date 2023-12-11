import { repoPathToComponents } from '../../utils/formatters'
import { logWarning, logSuccess } from '../../logger'
import { useProject } from '../use/project'
import { fileExists, getFileLines } from '../../utils/file'
import { setProjectLocation } from '../../config/global'
import path from 'path'
import constants from '../../constants'
import { createNewSpecConfig } from '../../config'
import fs from 'fs'

const CMD = 'project'

function addProjectCmd(cmd) {
    cmd.command(CMD)
        .description('Set the local path for a project')
        .argument('project', 'The project to link in <namespace>/<project> format')
        .argument('directory', 'Local path to the project (should contain a ".spec/" folder)')
        .action(linkProject)
}

/**
 * Set the local path for a project.
 */
export async function linkProject(
    projectPath: string,
    localPath: string,
    logResult: boolean = true
) {
    // Split input into namespace/project.
    const pathComps = repoPathToComponents(projectPath)
    if (!pathComps) {
        logWarning('Please specify the project in <namespace>/<project> format.')
        return false
    }
    const [nsp, projectName] = pathComps

    // Ensure specified location actually exists.
    const location = path.resolve(localPath)
    if (!fileExists(location)) {
        logWarning(`Local path not found: ${location}`)
        return false
    }

    // Pull the project and set it as the current one.
    const useProjectResp = await useProject(projectPath, false)
    if (!useProjectResp) return false
    const { id: projectId } = useProjectResp

    // (If needed) create new Spec config directory + project/connection config files.
    const specConfigDir = path.join(location, constants.SPEC_CONFIG_DIR_NAME)
    createNewSpecConfig(specConfigDir)

    // Add connect.toml to .gitignore if file exists.
    const gitignorePath = path.join(location, '.gitignore')
    if (fileExists(gitignorePath)) {
        const lines = getFileLines(gitignorePath)
        const connectLine = `${path.join(
            constants.SPEC_CONFIG_DIR_NAME,
            constants.CONNECTION_CONFIG_FILE_NAME
        )}`
        const alreadyIgnored = lines.find((line) => line.includes(connectLine))
        alreadyIgnored || fs.appendFileSync(gitignorePath, `\n${connectLine}`)
    }

    // Set the location of project in global config.
    setProjectLocation(nsp, projectName, projectId, location)
    logResult && logSuccess(`Set location of project "${projectPath}" to "${location}"`)
    return true
}

export default addProjectCmd
