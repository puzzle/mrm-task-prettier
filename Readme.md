# @puzzleitc/mrm-task-prettier

**⚠️THIS PROJECT IS NO MORE MAINTAINED ⚠️**

[Mrm](https://github.com/sapegin/mrm) task to add the opinionated source code formatter [Prettier](https://prettier.io/) to your project following our best practices.

[Changelog](Changelog.md)

## Best practices

We recommend to use Prettier in three phases:

1. Integration in the editor by formatting on file save.
2. Integration in the SCM by formatting on commit (Git pre-commit hook).
3. Integration in the CI pipeline by using a linting step that fails if a file is not properly formatted.

Furthermore, consider the following aspects:

- Always use a project-local version of Prettier, don’t install it globally. It is important that all developers/systems use the same Prettier version as the style may differ from version to version.
- For the same reason, you must pin a particular Prettier version in your package.json (i.e. "prettier": "1.16.4" not "prettier": "^1.16.4") and perform Prettier updates manually, reformatting the whole code base afterwards.
- Disable all style linting (e.g. with ESLint/TSLint), as this is needless and may conflict with Prettier.

## Usage

Within the directory of your project, execute the following command to setup Prettier in your project:

```
npx mrm @puzzleitc/mrm-task-prettier
```

## Known issues

- Currently only works with TypeScript projects with TSLint (and `tslint.json` file, not `.tslintrc` or `tslint.js`).

## What it does

- Installs the latest Prettier version
- Adds a `.prettierrc` file:
  - Uses the default configuration except for single quotes in JavaScript/TypeScript files and Angular templates.
  - Activates Prettier for the most common file types (see `filesPattern` in the _Options_ section below).
- Adds a `.prettierignore` file with the `dist/` directory being ignored per default.
- Sets up a Git pre-commit hook with `husky`/`lint-staged`.
- It deactivates or removes all style rules in your TSLint configuration using `tslint-config-prettier`.
- Adds a few NPM scripts described in the `NPM scripts` section below.
- Asks you whether to format all relevant files in your project at the end.

## Options

These are the possible configuration options and their defaults:

- `--config:ignores "dist"` – Comma separated list of paths Prettier should ignore
- `--config:filesPattern "./**/*.{js,ts,json,css,scss,html,md,yaml}"` – Glob for the files to be formatted with Prettier
- `--config:lintingFilesPattern "src/**/*.ts"` – Glob for the scripts to be linted with `lint:format`

## NPM scripts

The following NPM scripts will be added to your `package.json` and can be executed with `npm run <script>` or `yarn <script>`:

- `format` – formats all relevant files in your project with Prettier
- `format:upgrade` – updates Prettier to the latest version and re-formats all relevant files in your project
- `lint:format` – script to be called in your CI pipeline, to let the build fail when ill formatted code is committed without pre-commit hook

## Authors

[Mathis Hofer](https://github.com/hupf)

## License

This work is licensed under the terms of the [MIT license](License.md).
