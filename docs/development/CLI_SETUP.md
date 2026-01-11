# CLI Installation Complete! 🎉

Your chess-helper is now ready to be installed as a global CLI tool!

## ✅ What's Been Set Up

1. **package.json** - Configured with:
   - `bin` field pointing to `src/index.js`
   - `engines` requirement (Node.js 16+)
   - `files` list (what gets published)
   - `repository` field (update with your GitHub URL)

2. **Shebang** - Already in place in `src/index.js`:
   ```
   #!/usr/bin/env node
   ```

3. **.npmignore** - Excludes dev files from npm package

4. **Documentation**:
   - `INSTALLATION.md` - User installation guide
   - `PUBLISHING.md` - How to publish to npm
   - Updated `README.md` - New installation section

5. **Test Script** - `test-cli.sh` for quick testing

## 🚀 Quick Start

### Option 1: Test Locally (Development)

Run this command in your project directory:

```bash
npm link
```

Now you can run from **anywhere**:

```bash
chess-helper
```

Test commands:
```bash
chess-helper --version
chess-helper --help
chess-helper --color white
chess-helper analyze "rnbqkbnr/pppppppp/8/8/8/8/PPPPPPPP/RNBQKBNR w KQkq - 0 1"
chess-helper config
```

### Option 2: Publish to npm (Public Distribution)

1. **Update package.json**:
   - Add your name to `author` field
   - Update `repository.url` with your GitHub repo

2. **Test locally first**:
   ```bash
   ./test-cli.sh
   ```

3. **Login to npm**:
   ```bash
   npm login
   ```

4. **Publish**:
   ```bash
   npm publish --access public
   ```

5. **Anyone can now install**:
   ```bash
   npm install -g chess-helper
   ```

## 🧪 Testing Your CLI

Run the test script:
```bash
./test-cli.sh
```

Or manually test:
```bash
# Test version
chess-helper --version

# Test help
chess-helper --help

# Test game mode
chess-helper

# Test with options
chess-helper --color white --depth 20

# Test analysis mode
chess-helper analyze "rnbqkbnr/pppppppp/8/8/4P3/8/PPPP1PPP/RNBQKBNR b KQkq e3 0 1"

# Test config
chess-helper config
```

## 📦 Available Commands

After installation, users can run:

```bash
chess-helper                    # Start interactive game
chess-helper --help             # Show help
chess-helper --version          # Show version
chess-helper --color white      # Start as white
chess-helper --depth 20         # Set engine depth
chess-helper --fen "..."        # Start from position
chess-helper analyze "..."      # Analyze position
chess-helper config             # Show config
chess-helper config-set key val # Set config
chess-helper config-reset       # Reset config
```

## 🔄 Workflow

### Development Workflow
1. Make changes to code
2. Test with `chess-helper` (already linked)
3. Changes are immediately reflected
4. No need to re-link

### Publishing Updates
1. Make changes
2. Test locally
3. Update version: `npm version patch|minor|major`
4. Publish: `npm publish`

### Unlinking (Stop using local version)
```bash
npm unlink -g chess-helper
```

## 📝 Next Steps

### Before Publishing to npm:

1. **Update package.json**:
   ```json
   {
     "author": "Your Name <your.email@example.com>",
     "repository": {
       "type": "git",
       "url": "https://github.com/yourusername/chess-helper.git"
     }
   }
   ```

2. **Check package name availability**:
   ```bash
   npm search chess-helper
   ```
   If taken, consider:
   - `@yourusername/chess-helper` (scoped)
   - `chess-helper-cli`
   - `chess-move-helper`

3. **Create GitHub repo** (if not done):
   ```bash
   git remote add origin https://github.com/yourusername/chess-helper.git
   git push -u origin main
   ```

4. **Add LICENSE file** (ISC license):
   - Create `LICENSE` file
   - npm init will help generate one

5. **Test the package**:
   ```bash
   npm pack --dry-run
   ```

## 🐛 Troubleshooting

### "command not found: chess-helper"

**After npm link:**
```bash
# Check where npm links to
npm bin -g

# Add to PATH (add to ~/.zshrc or ~/.bashrc)
export PATH="$(npm bin -g):$PATH"
```

**After npm publish:**
```bash
# Verify installation
npm list -g chess-helper

# Reinstall if needed
npm uninstall -g chess-helper
npm install -g chess-helper
```

### Permission Errors

**macOS/Linux:**
```bash
# Option 1: Use sudo (not recommended)
sudo npm link

# Option 2: Fix npm permissions (recommended)
mkdir ~/.npm-global
npm config set prefix '~/.npm-global'
echo 'export PATH=~/.npm-global/bin:$PATH' >> ~/.zshrc
source ~/.zshrc
```

### Verify Setup

Check these files exist:
- ✅ `src/index.js` has `#!/usr/bin/env node`
- ✅ `package.json` has `bin` field
- ✅ `src/index.js` is executable (npm link sets this)

## 📚 Documentation Files

- **INSTALLATION.md** - For users installing your tool
- **PUBLISHING.md** - For you when publishing to npm
- **README.md** - Updated with installation instructions
- **CLI_SETUP.md** - This file (overview)

## 🎯 What You Can Do Now

✅ **Run globally**: `chess-helper` works from any directory  
✅ **Test commands**: All CLI flags and subcommands work  
✅ **Share**: Others can test with `npm link` from your repo  
✅ **Publish**: Ready to publish to npm when you're ready  

## 🌟 Pro Tips

1. **Alias for shorter command** (add to ~/.zshrc):
   ```bash
   alias chess="chess-helper"
   ```

2. **Shell completion** (future enhancement):
   - Add tab completion for commands
   - Use `tabtab` or `omelette` npm packages

3. **Update notification**:
   - Add `update-notifier` package
   - Notify users when new version available

4. **Analytics** (optional):
   - Track usage with npm download stats
   - See: https://www.npmjs.com/package/chess-helper

---

**You're all set! 🎉**

Try it now:
```bash
npm link
chess-helper --help
```
