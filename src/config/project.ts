import { StringKeyMap } from '../types'
import { createFileWithContents, fileExists } from '../utils/file'
import toml from '@ltd/j-toml'
import constants from '../constants'
import fs from 'fs'

const comments = {
    PROJECT_SECTION: '# = Project --------------------------------------------',
    LIVE_OBJECTS_SECTION: '# = Live Objects (Sources) ------------------------------',
    LINKS_SECTION: '# = Links (Inputs) --------------------------------------',
    LIVE_COLUMNS_SECTION: '# = Live Columns (Outputs) ------------------------------',
}

const TEMPLATE = `${comments.PROJECT_SECTION}

[project]
id = ''
org = ''
name = ''

${comments.LIVE_OBJECTS_SECTION}


${comments.LINKS_SECTION}


${comments.LIVE_COLUMNS_SECTION}

`

export const createSpecProjectConfigFile = () =>
    createFileWithContents(constants.PROJECT_CONFIG_PATH, TEMPLATE)

export const specProjectConfigFileExists = (): boolean => fileExists(constants.PROJECT_CONFIG_PATH)

export function setProject(id: string, org: string, name: string): StringKeyMap {
    // Ensure project config file exists.
    if (!specProjectConfigFileExists()) {
        return { error: "Project config file doesn't exist." }
    }

    // Get current config file contents.
    const { data = {}, error } = getProjectConfig()
    if (error) return { error }

    // Update project section.
    data.project = data.project || {}
    data.project.id = id
    data.project.org = org
    data.project.name = name

    // Save project config.
    return saveProjectConfig(data)
}

export function getCurrentProject(): StringKeyMap {
    // Ensure project config file exists.
    if (!specProjectConfigFileExists()) {
        return { error: null }
    }

    const { data, error } = getProjectConfig()
    if (error) return { error }

    return { data: data.project || null }
}

export function getProjectConfig(): StringKeyMap {
    try {
        const data = toml.parse(fs.readFileSync(constants.PROJECT_CONFIG_PATH, 'utf-8'), {
            x: { comment: true },
        })
        return { data }
    } catch (error) {
        return { error }
    }
}

export function saveProjectConfig(table: any): StringKeyMap {
    let error
    try {
        // Get stringified sections.
        const doc = toml.stringify(table, { newlineAround: 'section', newline: '\n' })
        const sections = doc.split('\n\n')

        let projectSection, objectsSection, linksSection, liveColsSection
        for (const section of sections) {
            const sectionHeader = section.split('\n').filter((s) => !!s)[0]

            // Project section.
            if (!projectSection && sectionHeader === '[project]') {
                projectSection = section.trim()
            }

            // Objects section.
            if (!objectsSection && sectionHeader.startsWith('[objects')) {
                objectsSection = section
            }

            // Links section.
            if (
                !linksSection &&
                sectionHeader.startsWith('[[objects') &&
                sectionHeader.endsWith('.links]]')
            ) {
                linksSection = section
            }

            // Live Columns section.
            if (!liveColsSection && sectionHeader.startsWith('[tables')) {
                liveColsSection = section.trim()
            }
        }

        // I know this looks fucking weird but leave it - @ben
        const newContents = `${comments.PROJECT_SECTION}
${projectSection ? '\n' + projectSection : ''}

${comments.LIVE_OBJECTS_SECTION}
${objectsSection ? '\n' + objectsSection : ''}

${comments.LINKS_SECTION}
${linksSection ? '\n' + linksSection : ''}

${comments.LIVE_COLUMNS_SECTION}
${liveColsSection ? '\n' + liveColsSection : '\n'}`

        createFileWithContents(constants.PROJECT_CONFIG_PATH, newContents)
    } catch (err) {
        error = err
    }
    return { error }
}
