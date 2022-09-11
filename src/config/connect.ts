import { createFileWithContents } from '../utils/file'
import constants from '../constants'

const TEMPLATE = `[db]
# Name of database to connect to.
name = ''
# Local database port to connect to.
port = 5432`

export const createSpecConnectionConfigFile = () =>
    createFileWithContents(constants.CONNECTION_CONFIG_PATH, TEMPLATE)
