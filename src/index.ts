#!/usr/bin/env node
import { program } from './program'
import addInitCmd from './cmds/init'
import addLoginCmd from './cmds/login'
addInitCmd(program)
addLoginCmd(program)
program.parse()
