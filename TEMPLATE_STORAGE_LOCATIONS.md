# Template Storage Locations

This document explains where JSON export templates are stored in the BankBridge application across different environments and operating systems.

## Storage Overview

The BankBridge application stores export templates as JSON files in different locations depending on:
- **Environment**: Development vs Production
- **Platform**: Windows, macOS, or Linux
- **Context**: Browser vs Electron app

## Current Implementation

### Development Mode
Templates are currently stored in **browser localStorage** with the key:
```
bankbridge_export_templates
```

### Production Mode (Electron App)
When the app is built and shipped as an Electron desktop application, templates will be stored in the operating system's standard user data directory.

## Storage Locations by Operating System

### Windows
- **Development**: `%APPDATA%\bankbridge-react-dev\templates.json`
- **Production**: `%APPDATA%\BankBridge\templates.json`

**Full paths:**
- Development: `C:\Users\{Username}\AppData\Roaming\bankbridge-react-dev\templates.json`
- Production: `C:\Users\{Username}\AppData\Roaming\BankBridge\templates.json`

### macOS
- **Development**: `~/Library/Application Support/bankbridge-react-dev/templates.json`
- **Production**: `~/Library/Application Support/BankBridge/templates.json`

**Full paths:**
- Development: `/Users/{Username}/Library/Application Support/bankbridge-react-dev/templates.json`
- Production: `/Users/{Username}/Library/Application Support/BankBridge/templates.json`

### Linux
- **Development**: `~/.config/bankbridge-react-dev/templates.json`
- **Production**: `~/.config/BankBridge/templates.json`

**Full paths:**
- Development: `/home/{username}/.config/bankbridge-react-dev/templates.json`
- Production: `/home/{username}/.config/BankBridge/templates.json`

## JSON File Structure

Templates are stored as a JSON array with the following structure:

```json
[
  {
    "id": "template_1703123456789_abc123",
    "name": "Customer Export Template",
    "description": "Template for exporting customer data",
    "fileType": "CSV",
    "fieldMappings": [
      {
        "sourceField": "Customer ID",
        "targetField": "Customer ID",
        "transform": ""
      },
      {
        "sourceField": "Transaction Date",
        "targetField": "Transaction Date",
        "transform": "YYYY-MM-DD"
      }
    ],
    "createdAt": "2023-12-21T10:30:56.789Z",
    "updatedAt": "2023-12-21T10:30:56.789Z",
    "schemaVersion": "1.0.0"
  }
]
```

## Backup and Migration

### Manual Backup
Users can manually backup their templates by:
1. Navigating to the storage location for their OS
2. Copying the `templates.json` file
3. Storing it in a safe location

### Migration Between Environments
To migrate templates from development to production:
1. Export templates from development environment
2. Copy the `templates.json` file to the production storage location
3. Restart the application

### Cross-Platform Migration
Templates can be migrated between different operating systems by:
1. Locating the `templates.json` file on the source system
2. Copying it to the appropriate location on the target system
3. Ensuring the target directory exists

## Storage Management

### Automatic Directory Creation
The application automatically creates the storage directory if it doesn't exist when:
- First template is saved
- Application starts and checks for existing templates

### File Permissions
The application requires:
- **Read** permission to load existing templates
- **Write** permission to save new/updated templates
- **Create** permission to create the storage directory

### Storage Limits
- **File size**: No hard limit, but recommended to keep under 10MB
- **Number of templates**: No hard limit, but performance may degrade with 1000+ templates
- **Field mappings per template**: No hard limit, but recommended to keep under 100 fields

## Troubleshooting

### Templates Not Loading
1. Check if the storage directory exists
2. Verify file permissions
3. Check if `templates.json` is valid JSON
4. Look for error messages in the console

### Templates Not Saving
1. Verify write permissions to the storage directory
2. Check available disk space
3. Ensure the directory is not read-only
4. Check for antivirus software blocking file writes

### Finding Storage Location
Use the debug utilities in development mode:
```javascript
// In browser console
window.templateDebug.logStorageInfo();
```

## Security Considerations

### Data Protection
- Templates are stored in user-specific directories
- No encryption is applied to the JSON files
- Sensitive field mappings should be reviewed before sharing templates

### Access Control
- Only the current user has access to their templates
- Templates are not shared between user accounts
- No network access is required for template storage

## Future Enhancements

### Planned Features
1. **Cloud Sync**: Optional cloud storage for template synchronization
2. **Encryption**: Optional encryption for sensitive templates
3. **Import/Export**: Built-in backup and restore functionality
4. **Template Sharing**: Secure template sharing between users
5. **Version Control**: Template history and rollback capabilities

### Migration Path
When new storage features are implemented:
1. Existing templates will be automatically migrated
2. Backup of current templates will be created
3. Users will be notified of storage location changes
4. Rollback options will be provided if needed 