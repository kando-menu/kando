# Kando Plugin System
## Open Source Contribution Specification

---

## Overview

A generic plugin loader for Kando that enables external Electron-based apps to integrate as menu items using a simple folder structure, distributed as ZIP files.

---

## Plugin Distribution Format

Plugins are distributed as **ZIP files** containing a built web application:

```text
my-plugin.zip
├── kando-plugin.json      # Plugin manifest (required)
├── index.html             # Entry point (required)
├── assets/
│   ├── index-[hash].js    # Bundled application
│   └── index-[hash].css   # Styles
├── preload.js             # Electron preload (optional)
└── icon.png               # Plugin icon (optional)
```

---

## Plugin Manifest Schema

File: `kando-plugin.json`

```json
{
  "id": "unique-plugin-id",
  "name": "Human Readable Name",
  "version": "1.0.0",
  "description": "What this plugin does",
  "author": "Author Name",
  "icon": "icon.png",
  "window": {
    "width": 460,
    "height": 600,
    "minWidth": 360,
    "minHeight": 450,
    "frame": false,
    "titleBarStyle": "hidden",
    "alwaysOnTop": true
  },
  "preload": "preload.js",
  "parameters": {
    "apiEndpoint": {
      "type": "string",
      "title": "API Endpoint",
      "description": "The base URL for API calls",
      "default": "https://api.example.com",
      "required": true
    },
    "refreshInterval": {
      "type": "number",
      "title": "Refresh Interval (seconds)",
      "description": "How often to refresh data",
      "default": 60,
      "min": 10,
      "max": 3600
    },
    "enableNotifications": {
      "type": "boolean",
      "title": "Enable Notifications",
      "description": "Show desktop notifications",
      "default": true
    },
    "theme": {
      "type": "select",
      "title": "Theme",
      "description": "Visual theme for the plugin",
      "options": ["light", "dark", "system"],
      "default": "system"
    },
    "credentialsPath": {
      "type": "file",
      "title": "Credentials File",
      "description": "Path to service account JSON",
      "fileTypes": [".json"],
      "required": true
    }
  }
}
```

---

## Parameter Types

| Type | Description | Additional Properties |
|------|-------------|----------------------|
| `string` | Text input | `minLength`, `maxLength`, `pattern` |
| `number` | Numeric input | `min`, `max`, `step` |
| `boolean` | Toggle switch | - |
| `select` | Dropdown menu | `options` (array of choices) |
| `file` | File path picker | `fileTypes` (extensions filter) |
| `folder` | Folder path picker | - |
| `password` | Masked text input | Stored securely |

---

## Plugin Execution Flow

```text
USER                    KANDO                         PLUGIN
  |                       |                              |
  |-- Select plugin       |                              |
  |   from menu           |                              |
  |                       |                              |
  |                       |-- Read manifest & user config |
  |                       |                              |
  |                       |-- Create BrowserWindow       |
  |                       |   with window settings       |
  |                       |                              |
  |                       |-- loadFile(index.html)       |
  |                       |   Pass config via preload -->|
  |                       |                              |
  |                       |   [Kando returns to idle]    |
  |                       |                              |
  |                       |          [Plugin runs independently]
  |                       |          [Plugin closes itself when done]
```

---

## New Files for Kando Fork

### 1. Plugin Manifest Parser
**Location:** `src/common/plugin-manifest.ts`

TypeScript interfaces and validation:
- IPluginManifest interface
- IPluginWindowConfig interface
- IPluginParameter interface (with type discriminator)
- validateManifest(json): Verify required fields and parameter schemas
- Default values for optional fields

### 2. Plugin Manager
**Location:** `src/main/plugins/plugin-manager.ts`

Core plugin management:
- getPluginsDirectory(): Platform-specific path
  - Windows: %APPDATA%/kando/plugins/
  - macOS: ~/Library/Application Support/kando/plugins/
  - Linux: ~/.config/kando/plugins/
- scanPlugins(): List all valid plugin folders
- validatePlugin(path): Check manifest and required files
- getPluginManifest(id): Return parsed manifest
- importPluginFromZip(zipPath): Extract and validate ZIP
- removePlugin(id): Delete plugin folder
- getPluginConfig(id): Load user configuration
- savePluginConfig(id, config): Persist user configuration

### 3. Plugin Config Storage
**Location:** `src/main/plugins/plugin-config-store.ts`

Stores user-defined parameter values:
- Config stored in: ~/.config/kando/plugin-configs/{plugin-id}.json
- Separate from manifest (user data vs plugin definition)
- Handles migration when plugin updates change parameters
- Validates config against manifest parameter schema

### 4. Plugin Item Type
**Location:** `src/common/item-types/plugin-item-type.ts`

Defines the "plugin" item type:
- Icon: puzzle-piece
- Default name: "Plugin"
- Data schema: { pluginId: string }
- No children allowed

### 5. Plugin Item Action
**Location:** `src/main/item-actions/plugin-item-action.ts`

Executes plugins when triggered:
- Get plugin path from pluginId
- Read manifest and user config
- Create BrowserWindow with manifest.window settings
- Inject user config into preload context
- Load index.html via loadFile()
- Return immediately (fire-and-forget)

### 6. Settings UI - Import Button
**Location:** `src/renderer/editor/toolbar/add-items-tab.tsx` (modify)

Add "Import Plugin" functionality:
- New button with upload/import icon
- Opens file picker filtered to .zip files
- Validates ZIP contains valid kando-plugin.json
- Extracts to plugins directory
- Shows success notification with plugin name
- Refreshes available items list
- Handles errors (invalid manifest, extraction failure)

### 7. Plugin Properties Editor
**Location:** `src/renderer/editor/properties/plugin-item-props.tsx`

Configuration UI for plugin menu items:
- Plugin selector dropdown (from installed plugins)
- Plugin info display (name, version, description, icon)
- Dynamic form generated from manifest.parameters:
  - string: Text input field
  - number: Number input with min/max
  - boolean: Toggle switch
  - select: Dropdown menu
  - file: File picker with button
  - folder: Folder picker with button
  - password: Masked input
- Save/reset buttons for configuration
- Validation feedback for required fields

### 8. ZIP Handler Utility
**Location:** `src/main/plugins/zip-handler.ts`

ZIP file operations:
- extractZip(zipPath, destFolder): Extract ZIP contents
- validateZipContents(zipPath): Check for manifest before extracting
- Uses built-in Node.js zlib or lightweight library
- Handles nested folder structures in ZIP

---

## Registration Changes

**item-type-registry.ts**
```typescript
import { PluginItemType } from './plugin-item-type';
// Add to registry:
this.types.set('plugin', new PluginItemType());
```

**item-action-registry.ts**
```typescript
import { PluginItemAction } from './plugin-item-action';
// Add to registry:
this.actions.set('plugin', new PluginItemAction(this.pluginManager));
```

---

## Implementation Phases

### Phase 1: Core Infrastructure
1. Fork Kando repository
2. Create plugin-manifest.ts with interfaces
3. Implement PluginManager class
4. Implement zip-handler.ts for ZIP extraction
5. Create PluginItemType class
6. Create PluginItemAction class
7. Register new item type in registries
8. Test with minimal hello-world.zip plugin

### Phase 2: Settings UI (Import & Configure)
1. Add "Import Plugin" button to add-items-tab.tsx
2. Implement file picker for .zip files
3. Create plugin-item-props.tsx for configuration
4. Build dynamic form renderer for parameters
5. Implement plugin-config-store.ts for persistence
6. Add validation and error handling

---

## Security Considerations

- Plugins explicitly installed by user (trust model)
- Each plugin runs in isolated BrowserWindow
- nodeIntegration: false by default
- contextIsolation: true by default
- File/folder pickers use Electron's secure dialogs
- Password parameters stored with OS keychain integration

---

## Future Optimizations

### 1. ASAR Packaging Option
For tamper-resistant distribution:
```bash
npx asar pack plugin-folder/ plugin.asar
```
- Single file instead of ZIP
- Read-only archive
- Slightly faster loading

### 2. Plugin Marketplace
- Central repository of verified plugins
- One-click install from within Kando
- Version management and updates
- Rating and review system

### 3. Plugin Sandboxing
- More granular permissions system
- Limit file system access
- Network access controls
- Resource usage limits

---

## File Summary

| File | Type | Purpose |
|------|------|---------|
| src/common/plugin-manifest.ts | New | TypeScript interfaces for manifest |
| src/main/plugins/plugin-manager.ts | New | Plugin discovery and management |
| src/main/plugins/plugin-config-store.ts | New | User config persistence |
| src/main/plugins/zip-handler.ts | New | ZIP extraction utility |
| src/common/item-types/plugin-item-type.ts | New | Plugin item type definition |
| src/main/item-actions/plugin-item-action.ts | New | Plugin execution logic |
| src/renderer/editor/properties/plugin-item-props.tsx | New | Config UI with dynamic form |
| src/renderer/editor/toolbar/add-items-tab.tsx | Modify | Add "Import Plugin" button |
| src/common/item-type-registry.ts | Modify | Register plugin type |
| src/main/item-action-registry.ts | Modify | Register plugin action |
