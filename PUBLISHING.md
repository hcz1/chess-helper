# Publishing Guide

This guide explains how to publish chess-helper to npm.

## Prerequisites

1. Create an npm account at [npmjs.com](https://www.npmjs.com/signup)
2. Login to npm from terminal:
   ```bash
   npm login
   ```

## Pre-Publishing Checklist

Before publishing, make sure:

- [ ] All tests pass (when you add them)
- [ ] README.md is complete and accurate
- [ ] Version number is correct in package.json
- [ ] Repository URL is correct in package.json
- [ ] Author field is filled in package.json
- [ ] .npmignore is configured (excludes dev files)
- [ ] All dependencies are in package.json

## Publishing Steps

### 1. Update Version

Follow [semantic versioning](https://semver.org/):

```bash
# Patch release (bug fixes): 3.0.0 -> 3.0.1
npm version patch

# Minor release (new features): 3.0.0 -> 3.1.0
npm version minor

# Major release (breaking changes): 3.0.0 -> 4.0.0
npm version major
```

### 2. Test the Package Locally

Before publishing, test that everything works:

```bash
# Link locally
npm link

# Test in a new terminal
chess-helper

# Test commands
chess-helper --help
chess-helper --version

# Unlink when done testing
npm unlink -g chess-helper
```

### 3. Check Package Contents

See what files will be included:

```bash
npm pack --dry-run
```

This creates a tarball showing exactly what will be published.

### 4. Publish to npm

```bash
# First time (public package)
npm publish --access public

# Subsequent updates
npm publish
```

### 5. Verify Publication

1. Check on npm: https://www.npmjs.com/package/chess-helper
2. Install globally to test:
   ```bash
   npm install -g chess-helper
   chess-helper
   ```

## Updating the Package

When you make changes:

1. Make your changes
2. Test locally with `npm link`
3. Update version: `npm version patch|minor|major`
4. Publish: `npm publish`
5. Announce: Update README, create GitHub release

## Unpublishing

**WARNING:** npm has strict unpublish policies. You can only unpublish within 72 hours.

```bash
# Unpublish specific version
npm unpublish chess-helper@3.0.0

# Unpublish entire package (within 72 hours only)
npm unpublish chess-helper --force
```

## Version History

- **3.0.0** - Phase 3: Board visualization, commands, analysis
- **2.0.0** - Phase 2: Modular architecture
- **1.0.0** - Phase 1: Initial release

## Package Statistics

After publishing, you can check:
- Download stats: https://www.npmjs.com/package/chess-helper
- npm trends: https://npmtrends.com/chess-helper

## Automation with GitHub Actions (Optional)

Create `.github/workflows/publish.yml` to automate publishing:

```yaml
name: Publish Package

on:
  release:
    types: [created]

jobs:
  publish:
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v3
      - uses: actions/setup-node@v3
        with:
          node-version: '16'
          registry-url: 'https://registry.npmjs.org'
      - run: npm ci
      - run: npm test
      - run: npm publish --access public
        env:
          NODE_AUTH_TOKEN: ${{secrets.NPM_TOKEN}}
```

## Beta/Alpha Releases

For testing pre-releases:

```bash
# Update to beta version
npm version 3.1.0-beta.0

# Publish with beta tag
npm publish --tag beta

# Users install with
npm install -g chess-helper@beta
```

## Scoped Package (Alternative)

If "chess-helper" is taken, use a scope:

1. Update package.json:
   ```json
   "name": "@yourusername/chess-helper"
   ```

2. Publish scoped package:
   ```bash
   npm publish --access public
   ```

3. Users install:
   ```bash
   npm install -g @yourusername/chess-helper
   ```

## Troubleshooting

### "You do not have permission to publish"
- Package name might be taken
- Try a different name or use scoped package

### "You must verify your email"
- Check your npm account email
- Verify before publishing

### "ENEEDAUTH"
- Run `npm login` again
- Check credentials

## Resources

- [npm Publishing Guide](https://docs.npmjs.com/packages-and-modules/contributing-packages-to-the-registry)
- [Semantic Versioning](https://semver.org/)
- [npm CLI Documentation](https://docs.npmjs.com/cli/)
