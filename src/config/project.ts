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
    DEFAULTS_SECTION: '# = Defaults --------------------------------------------',
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

        let projectSection
        const objectSections = []
        const linkSections = []
        const liveColSections = []
        const defaultSections = []
        const otherSections = []
        for (const section of sections) {
            const sectionHeader = section.split('\n').filter((s) => !!s)[0]

            // Project section.
            if (sectionHeader === '[project]') {
                projectSection = section.trim()
                continue
            }

            // Object sections.
            if (sectionHeader.startsWith('[objects')) {
                objectSections.push(section)
                continue
            }

            // Link sections.
            if (sectionHeader.startsWith('[[objects') && sectionHeader.endsWith('.links]]')) {
                linkSections.push(section)
                continue
            }

            // Live Columns section.
            if (sectionHeader.startsWith('[tables')) {
                liveColSections.push(section)
                continue
            }

            // Defaults section.
            if (sectionHeader.startsWith('[defaults')) {
                defaultSections.push(section)
                continue
            }

            otherSections.push(section)
        }

        const newContents = [
            comments.PROJECT_SECTION,
            projectSection ? '\n' + projectSection : '',
            '\n' + comments.LIVE_OBJECTS_SECTION,
            ...(objectSections.length ? objectSections.map((section) => '\n' + section) : ['']),
            '\n' + comments.LINKS_SECTION,
            ...(linkSections.length ? linkSections.map((section) => '\n' + section) : ['']),
            '\n' + comments.LIVE_COLUMNS_SECTION,
            ...(liveColSections.length ? liveColSections.map((section) => '\n' + section) : ['']),
        ]

        if (defaultSections.length) {
            newContents.push(
                ...[
                    '\n' + comments.DEFAULTS_SECTION,
                    ...defaultSections.map((section) => '\n' + section),
                ]
            )
        }

        newContents.push(...otherSections.map((section) => '\n' + section))

        createFileWithContents(constants.PROJECT_CONFIG_PATH, newContents.join('\n').trim())
    } catch (err) {
        error = err
    }
    return { error }
}
