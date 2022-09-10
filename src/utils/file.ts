import fs from 'fs'
import constants from '../constants'
import { CONNECTION_CONFIG_FILE_TEMPLATE, PROJECT_CONFIG_FILE_TEMPLATE } from './templates'

export const fileExists = (path: string): boolean => fs.existsSync(path)

export const createDir = (path: string) => fs.mkdirSync(path)

export const createFileWithContents = (path: string, contents: any) => fs.writeFileSync(path, contents)

export const specConfigDirExists = (): boolean => fileExists(constants.SPEC_CONFIG_DIR)

export const createSpecConfigDir = () => createDir(constants.SPEC_CONFIG_DIR)

export const createSpecConnectionConfigFile = () => createFileWithContents(
    constants.CONNECTION_CONFIG_PATH,
    CONNECTION_CONFIG_FILE_TEMPLATE,
)

export const createSpecProjectConfigFile = () => createFileWithContents(
    constants.PROJECT_CONFIG_PATH,
    PROJECT_CONFIG_FILE_TEMPLATE,
)

export function createNewSpecConfig() {
    createSpecConfigDir()
    createSpecConnectionConfigFile()
    createSpecProjectConfigFile()
}