#!/usr/bin/env node
import { program } from './program'
import addInitCmd from './cmds/init'
addInitCmd(program)
program.parse()
