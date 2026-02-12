import { Command } from 'commander';
import chalk from 'chalk';
import inquirer from 'inquirer';
import { ConfigurationService } from '../../../../core/config/configuration.service';

export function createConfigCommands(getDataDir: () => string | undefined): Command {
  const config = new Command('config').description('Manage configuration settings');

  // Show current configuration
  config
    .command('show')
    .description('Display current configuration')
    .action(async () => {
      const dataDir = getDataDir();
      const configService = new ConfigurationService(dataDir);
      const cfg = configService.getConfig();

      console.log(chalk.bold('\n⚙️  Configuration\n'));

      console.log(chalk.dim('Data Paths:'));
      console.log(`  Data:  ${cfg.paths.data}`);
      console.log(`  Logs:  ${cfg.paths.logs}`);
      console.log(`  Cache: ${cfg.paths.cache}`);

      console.log(chalk.dim('\nJupiter API:'));
      console.log(`  Base URL: ${cfg.jupiter.baseUrl}`);
      console.log(`  API Key:  ${cfg.jupiter.apiKey ? '✅ Configured' : '❌ Not configured'}`);

      console.log(chalk.dim('\nSolana:'));
      console.log(`  RPC URL:    ${cfg.solana.rpcUrl}`);
      console.log(`  Commitment: ${cfg.solana.commitment}`);

      console.log(chalk.dim('\nLogging:'));
      console.log(`  Level:  ${cfg.logging.level}`);
      console.log(`  Console: ${cfg.logging.console ? '✅' : '❌'}`);
      console.log(`  File:    ${cfg.logging.file ? '✅' : '❌'}`);

      console.log();
    });

  // Set Jupiter API key
  config
    .command('set-jupiter-key')
    .description('Set or update Jupiter API key')
    .argument('[api-key]', 'Jupiter API key (optional, will prompt if not provided)')
    .action(async (apiKeyArg) => {
      const dataDir = getDataDir();
      const configService = new ConfigurationService(dataDir);

      let apiKey = apiKeyArg;

      if (!apiKey) {
        const answer = await inquirer.prompt([
          {
            type: 'password',
            name: 'apiKey',
            message: 'Enter your Jupiter API key:',
            mask: '*',
            validate: (input: string) => {
              if (!input || input.trim() === '') {
                return 'API key cannot be empty';
              }
              return true;
            },
          },
        ]);
        apiKey = answer.apiKey;
      }

      try {
        const cfg = configService.getConfig();
        cfg.jupiter.apiKey = apiKey.trim();
        configService.saveConfiguration();

        console.log(chalk.green('\n✅ Jupiter API key configured successfully!'));
        console.log(chalk.dim('\nYou can now use Jupiter trading commands.'));
        console.log(chalk.dim('Get your API key at: https://portal.jup.ag/'));
      } catch (error) {
        console.error(
          chalk.red(`\n❌ Error: ${error instanceof Error ? error.message : 'Unknown error'}`)
        );
        process.exit(1);
      }
    });

  // Remove Jupiter API key
  config
    .command('remove-jupiter-key')
    .description('Remove Jupiter API key')
    .action(async () => {
      const dataDir = getDataDir();
      const configService = new ConfigurationService(dataDir);

      const { confirm } = await inquirer.prompt([
        {
          type: 'confirm',
          name: 'confirm',
          message: 'Are you sure you want to remove the Jupiter API key?',
          default: false,
        },
      ]);

      if (!confirm) {
        console.log(chalk.yellow('\nOperation cancelled.'));
        return;
      }

      try {
        const cfg = configService.getConfig();
        cfg.jupiter.apiKey = '';
        configService.saveConfiguration();

        console.log(chalk.green('\n✅ Jupiter API key removed.'));
        console.log(chalk.yellow('\n⚠️  Trading commands will not work without an API key.'));
      } catch (error) {
        console.error(
          chalk.red(`\n❌ Error: ${error instanceof Error ? error.message : 'Unknown error'}`)
        );
        process.exit(1);
      }
    });

  // Set custom RPC URL
  config
    .command('set-rpc')
    .description('Set custom Solana RPC URL')
    .argument('<url>', 'RPC URL (e.g., https://api.mainnet-beta.solana.com)')
    .action(async (url) => {
      const dataDir = getDataDir();
      const configService = new ConfigurationService(dataDir);

      try {
        const cfg = configService.getConfig();
        cfg.solana.rpcUrl = url;
        configService.saveConfiguration();

        console.log(chalk.green('\n✅ RPC URL updated successfully!'));
        console.log(chalk.dim(`New URL: ${url}`));
      } catch (error) {
        console.error(
          chalk.red(`\n❌ Error: ${error instanceof Error ? error.message : 'Unknown error'}`)
        );
        process.exit(1);
      }
    });

  // Set log level
  config
    .command('set-log-level')
    .description('Set logging level')
    .argument('<level>', 'Log level (debug, info, warn, error)')
    .action(async (level) => {
      const validLevels = ['debug', 'info', 'warn', 'error'];

      if (!validLevels.includes(level.toLowerCase())) {
        console.error(
          chalk.red(`\n❌ Invalid log level. Must be one of: ${validLevels.join(', ')}`)
        );
        process.exit(1);
      }

      const dataDir = getDataDir();
      const configService = new ConfigurationService(dataDir);

      try {
        const cfg = configService.getConfig();
        cfg.logging.level = level.toLowerCase();
        configService.saveConfiguration();

        console.log(chalk.green('\n✅ Log level updated successfully!'));
        console.log(chalk.dim(`New level: ${level.toLowerCase()}`));
      } catch (error) {
        console.error(
          chalk.red(`\n❌ Error: ${error instanceof Error ? error.message : 'Unknown error'}`)
        );
        process.exit(1);
      }
    });

  return config;
}
