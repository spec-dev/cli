export const ev = (name: string, fallback: any = null) =>
    process.env.hasOwnProperty(name) ? process.env[name] : fallback

export const parseEnvArg = (str: string): string[] | null => {
    const firstEqualSignIndex = str.indexOf('=')
    if (firstEqualSignIndex === -1) return null

    const name = str.slice(0, firstEqualSignIndex)
    const value = str.slice(firstEqualSignIndex + 1)
    if (!name || !value) return null

    return [name, value]
}
