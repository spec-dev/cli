export function removeTrailingSlash(str: string): string {
    return str.replace(/\/+$/, '')
}

export function repoPathToComponents(path: string): string[] | null {
    const splitPath = path.split('/')
    return splitPath.length === 2 ? splitPath : null
}
