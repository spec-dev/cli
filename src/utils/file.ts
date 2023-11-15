import fs from 'fs'
import os from 'os'

export const fileExists = (path: string): boolean => fs.existsSync(path)

export const createDir = (path: string) => fs.mkdirSync(path)

export const createFileWithContents = (path: string, contents: any) =>
    fs.writeFileSync(path, contents)

export const tmpdir = () => os.tmpdir()

export const getContentsOfFolder = (path: string) => fs.readdirSync(path)

export const isDir = (path: string) => fs.statSync(path).isDirectory()

export const getFileLines = (path: string): string[] => {
    try {
        const contents = fs.readFileSync(path, 'utf-8') || ''
        return contents.split('\n')
    } catch (err) {
        return []
    }
}
