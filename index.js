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
  const packages = [];

  // TODO: abort if prettier is already installed


  /**
   * Add prettier to project
   */
  packages.push('prettier');

  // Define Prettier config
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

  // Define Prettier ignores
  lines('.prettierignore')
    .add([distDir])
    .save();

  // Add format script
  pkg.setScript('format', `prettier --write "${filesPattern}"`)


  /**
   * Deactivate style linting
   */
  packages.push('tslint-config-prettier')
  // TODO: extend tslint config with 'tslint-config-prettier' ruleset
  // TODO: remove style-rules from tslint config (tslint-config-prettier-check)


  /**
   * Add pre-commit hook
   */
  // TODO: install lint-staged & husky
  // TODO: add husky config for pre-commit hook
  // TODO: add lint staged configuration


  /**
   * Format linting for CI
   */
  packages.push('tslint-plugin-prettier')

  // Create separate tslint config for format linting
  json('tslint-prettier.json')
    .set({
      extends: ['tslint-plugin-prettier'],
      rules: {
        prettier: true
      }
    })
    .save();

  // Add format linting script
  pkg.setScript('lint:format', `tslint -c tslint-prettier.json "${sourceDir}/**/*.ts"`);


  /**
   * Final tasks
   */
  // Apply changes to package.json and install packages
  pkg.save();
  install(packages);

  // Fix Prettier to specific version
  pkg = packageJson();
  const pkgContents = pkg.get();
  pkgContents.devDependencies.prettier = pkgContents.devDependencies.prettier.replace(/[\^~]/, '');
  pkg.save();


  // TODO: ask user if `npm run format` should be executed

  // TODO: detect whether TypeScript or JavaScript project, use eslint for the latter
  // TODO: print out instructions/infos?
  // TODO: add prettier upgrade script?
}

task.description = 'Adds Prettier to a project';
module.exports = task;
