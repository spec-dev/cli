import chalk from 'chalk'

export function log(...args: any[]) {
    console.log(...args)
}

export function logSuccess(...args: any[]) {
    log(chalk.cyan(...args))
}

export function logFailure(...args: any[]) {
    log(chalk.red(...args))
}
