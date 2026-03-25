#!/usr/bin/env node
import { Command } from 'commander';

const program = new Command();

program
  .name('move-chat')
  .description('Move Claude Code chat sessions between machines')
  .version('0.1.0');

program
  .command('push')
  .description('Send a chat session to another machine')
  .option('-s, --session <id>', 'Session ID to push (default: most recent)')
  .action(async (opts) => {
    console.log('push', opts);
  });

program
  .command('pull')
  .description('Receive a chat session from another machine')
  .argument('<code>', 'Transfer code from push command')
  .option('--cwd <path>', 'Override project directory on this machine')
  .action(async (code, opts) => {
    console.log('pull', code, opts);
  });

program
  .command('list')
  .description('List local Claude Code sessions')
  .action(async () => {
    console.log('list');
  });

program.parse();
