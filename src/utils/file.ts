import fs from 'fs'
import os from 'os'

export const fileExists = (path: string): boolean => fs.existsSync(path)

export const createDir = (path: string) => fs.mkdirSync(path)

export const createFileWithContents = (path: string, contents: any) =>
    fs.writeFileSync(path, contents)

export const tmpdir = () => os.tmpdir()
