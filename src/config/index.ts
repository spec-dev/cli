import { createSpecConfigDir } from './dir'
import { createSpecConnectionConfigFile } from './connect'
import { createSpecProjectConfigFile } from './project'

export function createNewSpecConfig() {
    createSpecConfigDir()
    createSpecConnectionConfigFile()
    createSpecProjectConfigFile()
}
