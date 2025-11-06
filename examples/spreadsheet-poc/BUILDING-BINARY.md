# Building RexxSheet Production Binary

## Overview

After building, you'll have a standalone `rexxsheet` binary that doesn't require Node.js or npm to run.

## Build Steps

### 1. Build the Production Binary

```bash
cd examples/spreadsheet-poc
npm run tauri:build
```

This will:
- Create optimized production build
- Compile Rust backend
- Bundle everything into a single binary

**Build output location:**
- Linux: `src-tauri/target/release/app`
- macOS: `src-tauri/target/release/bundle/macos/app.app`
- Windows: `src-tauri/target/release/app.exe`

### 2. Create Launch Script

After building, create a `rexxsheet` script in your `$PATH`:

```bash
#!/usr/bin/env bash
# rexxsheet - Launch RexxJS Spreadsheet (production)

BINARY_PATH="/path/to/RexxJS/examples/spreadsheet-poc/src-tauri/target/release/app"

if [[ -n "$1" ]]; then
    # Convert to absolute path if relative
    FILE_PATH="$1"
    if [[ ! "$FILE_PATH" = /* ]]; then
        FILE_PATH="$(pwd)/$FILE_PATH"
    fi

    # Launch with file
    exec "$BINARY_PATH" "$FILE_PATH"
else
    # Launch without file (sample data)
    exec "$BINARY_PATH"
fi
```

### 3. Install System-Wide (Optional)

#### Linux/macOS:

```bash
# Copy binary to /usr/local/bin (or ~/bin)
sudo cp src-tauri/target/release/app /usr/local/bin/rexxsheet
sudo chmod +x /usr/local/bin/rexxsheet

# Now you can run from anywhere:
rexxsheet ~/Documents/budget.json
```

#### macOS Bundle:

```bash
# Copy app bundle to Applications
cp -r src-tauri/target/release/bundle/macos/app.app \
     /Applications/RexxSheet.app

# Create command-line wrapper
echo '#!/usr/bin/env bash
exec /Applications/RexxSheet.app/Contents/MacOS/app "$@"' \
  | sudo tee /usr/local/bin/rexxsheet
sudo chmod +x /usr/local/bin/rexxsheet
```

#### Windows:

```powershell
# Copy to Program Files
copy src-tauri\target\release\app.exe "C:\Program Files\RexxSheet\rexxsheet.exe"

# Add to PATH via System Properties > Environment Variables
# Or create a .bat file in a directory that's already in PATH
```

## Usage After Building

### With File:
```bash
rexxsheet my-spreadsheet.json
rexxsheet ~/Documents/budget-2025.json
rexxsheet /tmp/quarterly-report.json
```

### Without File (Sample Data):
```bash
rexxsheet
```

## File Associations (Optional)

### Linux (Create .desktop file):

```bash
cat > ~/.local/share/applications/rexxsheet.desktop <<EOF
[Desktop Entry]
Version=1.0
Type=Application
Name=RexxSheet
Comment=RexxJS Spreadsheet
Exec=/usr/local/bin/rexxsheet %f
Icon=/path/to/icon.png
Terminal=false
Categories=Office;Spreadsheet;
MimeType=application/json;
EOF

update-desktop-database ~/.local/share/applications
```

### macOS (UTI Registration):

Add to `src-tauri/tauri.conf.json` before building:

```json
{
  "bundle": {
    "macOS": {
      "fileAssociations": [
        {
          "ext": ["json"],
          "name": "RexxSheet Spreadsheet",
          "role": "Editor"
        }
      ]
    }
  }
}
```

### Windows (Registry):

```reg
Windows Registry Editor Version 5.00

[HKEY_CLASSES_ROOT\.rexxsheet]
@="RexxSheet.Spreadsheet"

[HKEY_CLASSES_ROOT\RexxSheet.Spreadsheet]
@="RexxSheet Spreadsheet"

[HKEY_CLASSES_ROOT\RexxSheet.Spreadsheet\DefaultIcon]
@="C:\\Program Files\\RexxSheet\\rexxsheet.exe,0"

[HKEY_CLASSES_ROOT\RexxSheet.Spreadsheet\shell\open\command]
@="\"C:\\Program Files\\RexxSheet\\rexxsheet.exe\" \"%1\""
```

## Size and Dependencies

**Binary Size:**
- Linux: ~15-20MB (statically linked)
- macOS: ~20-25MB (app bundle)
- Windows: ~15-20MB (.exe)

**Runtime Dependencies:**
- **None** - Fully self-contained
- Includes: Rust runtime, WebView2 (Windows)/WebKit (macOS)/WebKitGTK (Linux)

## Distribution

### For End Users:

1. **Build release binary** (steps above)
2. **Create installer** (optional):
   ```bash
   # Tauri can create platform-specific installers
   npm run tauri:build -- --bundles deb      # Linux .deb
   npm run tauri:build -- --bundles app,dmg  # macOS .app + .dmg
   npm run tauri:build -- --bundles msi      # Windows .msi
   ```

3. **Distribute** via:
   - GitHub Releases
   - Your own website
   - Package managers (Homebrew, Chocolatey, etc.)

### Package Manager Examples:

**Homebrew (macOS/Linux):**
```ruby
# Create a homebrew formula
class Rexxsheet < Formula
  desc "RexxJS Spreadsheet"
  homepage "https://github.com/yourusername/rexxjs"
  url "https://github.com/yourusername/rexxjs/releases/download/v1.0.0/rexxsheet-macos.tar.gz"
  sha256 "..."

  def install
    bin.install "rexxsheet"
  end
end
```

**Snapcraft (Linux):**
```yaml
# snapcraft.yaml
name: rexxsheet
version: '1.0'
summary: RexxJS Spreadsheet
description: A spreadsheet powered by RexxJS expressions
base: core20
confinement: strict

apps:
  rexxsheet:
    command: bin/app
    plugs: [home, network]
```

## Development vs Production

| Feature | Development (`rexxsheet-dev`) | Production (`rexxsheet`) |
|---------|-------------------------------|--------------------------|
| Requires Node.js | ✅ Yes | ❌ No |
| Hot Reload | ✅ Yes | ❌ No |
| Size | N/A | ~15-25MB |
| Startup Time | Slower | Faster |
| Updates | Edit code directly | Rebuild required |
| Use Case | Development/Testing | End users |
