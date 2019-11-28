const { packageJson, install, lines, json } = require('mrm-core');

function task(config) {
  const { sourceDir, distDir, filesPattern } = config
    .defaults({
      sourceDir: 'src',
      distDir: 'dist',
      filesPattern: './**/*.{js,ts,json,css,scss,html,md,yaml}'
    })
    .values();

  let pkg = packageJson();

  if (!pkg.exists()) {
    throw new Error('No package.json');
  }

  if (pkg.get().devDependencies.prettier || pkg.get().dependencies.prettier) {
    throw new Error('Prettier is already installed');
  }

  /**
   * Install required packages
   */
  install([
    'prettier',
    'lint-staged',
    'husky',
    'tslint-config-prettier',
    'tslint-plugin-prettier'
  ]);
  pkg = packageJson(); // Re-read updated package.json

  // Fix Prettier to specific version (manual upgrading and
  // re-formating is required)
  pkg.get().devDependencies.prettier = pkg.get().devDependencies.prettier.replace(/[\^~]/, '');
  pkg.save();

  /**
   * Add NPM scripts
   */
  pkg
    .setScript('format', `prettier --write "${filesPattern}"`)
    .setScript('lint:format', `tslint -c tslint-prettier.json "${sourceDir}/**/*.ts"`);

  /**
   * Configure Prettier
   */
  json('.prettierrc')
    .set({
      overrides: [
        {
          files: '*.{js,ts,component.html}',
          options: {
            singleQuote: true
          }
        }
      ]
    })
    .save();

  lines('.prettierignore')
    .add([distDir])
    .save();

  /**
   * Deactivate style linting
   */
  // TODO: extend tslint config with 'tslint-config-prettier' ruleset
  // TODO: remove style-rules from tslint config (tslint-config-prettier-check)

  /**
   * Configure pre-commit hook
   */
  pkg.get().husky = {
     hooks: {
         'pre-commit': 'lint-staged'
     }
  };
  pkg.get()['lint-staged'] = {
    [filesPattern]: [
      "prettier --write",
      "git add"
    ]
  };

  /**
   * Format linting for CI
   */
  json('tslint-prettier.json')
    .set({
      extends: ['tslint-plugin-prettier'],
      rules: {
        prettier: true
      }
    })
    .save();

  /**
   * Final tasks
   */
  pkg.save();

  // TODO: ask user if `npm run format` should be executed

  // TODO: detect whether TypeScript or JavaScript project, use eslint for the latter
  // TODO: print out instructions/infos?
  // TODO: add prettier upgrade script?
}

task.description = 'Adds Prettier to a project';
module.exports = task;
