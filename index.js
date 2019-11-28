const { packageJson, install, lines, json } = require('mrm-core');
const { execSync } = require('child_process');
const { question } = require('readline-sync');

async function task(config) {
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
  pkg.get().devDependencies.prettier = pkg
    .get()
    .devDependencies.prettier.replace(/[\^~]/, '');
  pkg.save();

  /**
   * Add NPM scripts
   */
  pkg
    .setScript('format', `prettier --write "${filesPattern}"`)
    .setScript(
      'format:upgrade',
      'npm install --save-exact prettier@latest && npm run format'
    )
    .setScript(
      'lint:format',
      `tslint -c tslint-prettier.json "${sourceDir}/**/*.ts"`
    );

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
  pipe(
    appendTslintConfigPrettierRules,
    removeTslintStyleRules
  )(json('tslint.json')).save();
  // TODO: handle .tslintrc, tslint.js etc.

  /**
   * Configure pre-commit hook
   */
  pkg.get().husky = {
    hooks: {
      'pre-commit': 'lint-staged'
    }
  };
  pkg.get()['lint-staged'] = {
    [filesPattern]: ['prettier --write', 'git add']
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

  if (
    questionBoolean(
      'Do you want to re-format your code base using Prettier now?'
    )
  ) {
    execSync('npm run format', { stdio: 'inherit' });
  }

  console.log(
    '\nCongratulations, your project will now be formatted using Prettier.\n\n' +
      'Further steps:\n' +
      ' * Configure your editor to format on save:\n' +
      '   https://prettier.io/docs/en/editors.html\n' +
      " * Execute 'npm run lint:format' in your CI pipeline, to let it fail when ill\n" +
      '   formatted code is commited.\n' +
      " * Periodically execute 'npm run format:upgrade' to upgrade Prettier and\n" +
      '   re-format your code base'
  );

  // TODO: detect whether TypeScript or JavaScript project, use eslint for the latter
  // TODO: detect whether npm or yarn is used
}

function appendTslintConfigPrettierRules(tslintConfig) {
  const currentExtends = tslintConfig.get('extends', []);
  tslintConfig.set('extends', [
    ...(Array.isArray(currentExtends) ? currentExtends : [currentExtends]),
    'tslint-config-prettier'
  ]);
  return tslintConfig;
}

function removeTslintStyleRules(tslintConfig) {
  const styleRules = getTsLintStyleRules();
  if (styleRules.length > 0) {
    const currentRules = tslintConfig.get('rules');
    const filteredRules = Object.keys(currentRules)
      .filter(rule => !styleRules.includes(rule))
      .reduce(
        (result, rule) => ({ ...result, [rule]: currentRules[rule] }),
        {}
      );
    tslintConfig.set('rules', filteredRules);
  }
  return tslintConfig;
}

function getTsLintStyleRules() {
  let result = '';
  try {
    execSync('tslint-config-prettier-check ./tslint.json');
  } catch (error) {
    result = error.stderr;
  }
  return result
    ? result
        .toString()
        .split('\n')
        .slice(1)
        .map(s => s.trim())
        .filter(Boolean)
    : [];
}

function questionBoolean(message) {
  const response = question(`${message} [Y/n]: `);
  return (response.trim().toLowerCase() || 'y') === 'y';
}

function pipe(...fns) {
  return arg => fns.reduce((acc, cur) => cur(acc), arg);
}

task.description = 'Adds Prettier to a project';
module.exports = task;
