export function removeTrailingSlash(str: string): string {
    return str.replace(/\/+$/, '')
}