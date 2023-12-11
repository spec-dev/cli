import fs from 'fs'
import os from 'os'
import toml from '@ltd/j-toml'
import { StringKeyMap } from '../types'

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

export function readTomlConfigFile(path: string): StringKeyMap {
    if (!fileExists(path)) {
        return { data: {} }
    }
    try {
        const data = toml.parse(fs.readFileSync(path, 'utf-8'))
        return { data }
    } catch (error) {
        return { error }
    }
}

export function saveTomlConfigFile(path: string, table: any): StringKeyMap {
    let error
    try {
        createFileWithContents(
            path,
            toml.stringify(table, { newlineAround: 'section', newline: '\n' })
        )
    } catch (err) {
        error = err
    }
    return { error }
}
