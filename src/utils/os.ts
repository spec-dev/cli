import { execSync } from 'node:child_process'

export enum OS {
    Mac = 'mac',
    Linux = 'linux',
    Unknown = 'unknown',
}

export function getOS(): OS {
    try {
        const out = execSync('uname -s') || ''
        if (out.includes('Darwin')) return OS.Mac
        if (out.includes('Linux')) return OS.Linux
        return OS.Unknown
    } catch (error) {
        return OS.Unknown
    }
}
