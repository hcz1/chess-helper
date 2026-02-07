# Installation Guide

## Method 1: Install from npm (Recommended)

Once published to npm, users can install globally:

```bash
npm install -g chess-helper
```

Then run from anywhere:

```bash
chess-helper
```

## Method 2: Install from Source (Development)

1. Clone the repository:
```bash
git clone https://github.com/yourusername/chess-helper.git
cd chess-helper
```

2. Install dependencies:
```bash
npm install
```

3. Link globally (creates symlink):
```bash
npm link
```

4. Run from anywhere:
```bash
chess-helper
```

## Method 3: Run without Installing

```bash
npx chess-helper
```

(This works after publishing to npm)

## Uninstalling

### If installed via npm:
```bash
npm uninstall -g chess-helper
```

### If linked via npm link:
```bash
npm unlink -g chess-helper
```

## Updating

### If installed via npm:
```bash
npm update -g chess-helper
```

### If linked (development):
```bash
cd /path/to/chess-helper
git pull
npm install
```

## Platform-Specific Notes

### macOS/Linux
No additional setup required.

### Windows
Make sure you have Node.js installed and added to PATH.

## Verifying Installation

Check if installed correctly:

```bash
chess-helper --version
```

```bash
chess-helper --help
```

## Troubleshooting

### "command not found: chess-helper"

**On macOS/Linux:**
- Make sure npm global bin directory is in your PATH
- Find npm bin path: `npm bin -g`
- Add to PATH in `~/.bashrc` or `~/.zshrc`:
  ```bash
  export PATH="$(npm bin -g):$PATH"
  ```

**On Windows:**
- Verify Node.js is in PATH
- Try restarting terminal/command prompt

### Permission Errors (macOS/Linux)

If you get EACCES errors:
```bash
sudo npm install -g chess-helper
```

Or better, configure npm to install without sudo:
```bash
mkdir ~/.npm-global
npm config set prefix '~/.npm-global'
echo 'export PATH=~/.npm-global/bin:$PATH' >> ~/.bashrc
source ~/.bashrc
```

### Module Not Found Errors

Make sure all dependencies are installed:
```bash
cd /path/to/chess-helper
npm install
```

## Requirements

- Node.js 20.x or higher
- npm or yarn
- macOS, Linux, or Windows

## Support

For issues, see:
- [GitHub Issues](https://github.com/yourusername/chess-helper/issues)
- README.md troubleshooting section
