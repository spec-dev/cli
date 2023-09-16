import { repoPathToComponents } from '../../utils/formatters'
import { logWarning, logSuccess } from '../../logger'
import { useProject } from '../use/project'
import { fileExists } from '../../utils/file'
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
async function linkProject(projectPath: string, localPath: string) {
    // Ensure specified location actually exists.
    const location = path.resolve(localPath)
    if (!fileExists(location)) {
        logWarning(`Local path not found: ${location}`)
        return
    }

    // Pull the project and set it as the current one.
    const useProjectResp = await useProject(projectPath, false)
    if (!useProjectResp) return
    const { id: projectId } = useProjectResp

    // (If needed) create new Spec config directory + project/connection config files.
    const specConfigDir = path.join(location, constants.SPEC_CONFIG_DIR_NAME)
    if (!fileExists(specConfigDir)) {
        createNewSpecConfig(specConfigDir)
        logSuccess('Inititalized new Spec project.')

        // Add connect.toml to .gitignore if file exists.
        const gitignorePath = path.join(location, '.gitignore')
        if (fileExists(gitignorePath)) {
            fs.appendFileSync(
                gitignorePath,
                `\n${path.join(
                    constants.SPEC_CONFIG_DIR_NAME,
                    constants.CONNECTION_CONFIG_FILE_NAME
                )}`
            )
        }
    }

    // Set the location of project in global config.
    const [nsp, projectName] = repoPathToComponents(projectPath)
    setProjectLocation(nsp, projectName, projectId, location)
    logSuccess(`Set location of project "${projectPath}" to "${location}"`)
}

export default addProjectCmd
