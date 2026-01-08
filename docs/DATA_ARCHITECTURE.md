# BankBridge Data Architecture

This document describes the complete data architecture for BankBridge, including storage formats, data models, and the relationships between components.

---

## Table of Contents

1. [Overview](#overview)
2. [Data Flow](#data-flow)
3. [Storage Files](#storage-files)
4. [Data Models](#data-models)
5. [Account Configuration](#account-configuration)
6. [Internal Transaction Format](#internal-transaction-format)
7. [Export Template System](#export-template-system)
8. [Import Template System](#import-template-system)
9. [Duplicate Detection](#duplicate-detection)
10. [UI Components](#ui-components)

---

## Overview

BankBridge uses a three-layer architecture for handling financial data:

1. **Import Layer**: Bank-specific CSV/Excel files are parsed using Import Templates
2. **Internal Layer**: All transactions are stored in a canonical internal format
3. **Export Layer**: Data is transformed to target formats (Monarch Money, YNAB, etc.) using Export Templates

**Key Principles:**
- Internal format is fixed and controlled by the application
- External format changes only require template updates, not data migration
- Institution and Account are stored separately for flexibility
- All configuration is stored in JSON files in AppData

---

## Data Flow

```
                                    ┌─────────────────┐
                                    │  Account Config │
                                    │ (settings.json) │
                                    └────────┬────────┘
                                             │
                                             ▼
┌──────────┐    ┌─────────────────┐    ┌──────────────┐    ┌─────────────────┐    ┌────────────┐
│ Bank CSV │ -> │ Import Template │ -> │   INTERNAL   │ -> │ Export Template │ -> │ Target CSV │
│ / Excel  │    │   (per bank)    │    │    FORMAT    │    │  (per target)   │    │  (Monarch) │
└──────────┘    └─────────────────┘    └──────┬───────┘    └─────────────────┘    └────────────┘
                                              │
                                              ▼
                                    ┌─────────────────┐
                                    │   Master Data   │
                                    │(master_data.json)│
                                    └─────────────────┘
```

---

## Storage Files

### Location
All configuration and data files are stored in the application data directory:
- **Windows**: `%APPDATA%/BankBridge/`
- **macOS**: `~/Library/Application Support/BankBridge/`
- **Linux**: `~/.config/BankBridge/`

### settings.json

Stores account configuration and application preferences.

```json
{
  "version": "1.0.0",
  "accounts": [
    {
      "id": "acc_1704700000000_abc123",
      "institutionName": "TD Bank",
      "accountName": "Checking",
      "exportDisplayName": "TD Bank - Checking",
      "accountType": "checking"
    },
    {
      "id": "acc_1704700000001_def456",
      "institutionName": "Chase",
      "accountName": "Sapphire Reserve",
      "exportDisplayName": "Chase Sapphire",
      "accountType": "credit"
    }
  ],
  "preferences": {
    "masterDataPath": "C:/Users/.../BankBridge/master_data.json"
  }
}
```

### master_data.json

Stores all processed transactions in internal format.

```json
{
  "version": "1.0.0",
  "lastUpdated": "2025-01-08T12:00:00.000Z",
  "transactions": [
    {
      "id": "txn_1704700000000_abc123",
      "date": "2025-01-08",
      "merchant": "Amazon",
      "category": "Shopping",
      "institutionName": "TD Bank",
      "accountName": "Checking",
      "originalStatement": "AMAZON.COM*ABC123",
      "notes": "",
      "amount": -58.12,
      "tags": ["online", "retail"],
      "sourceFile": "td_jan_2025.csv",
      "importedAt": "2025-01-08T12:00:00.000Z"
    }
  ],
  "metadata": {
    "totalTransactions": 1234,
    "dateRange": {
      "earliest": "2024-01-01",
      "latest": "2025-01-08"
    }
  }
}
```

---

## Data Models

### Account

```typescript
interface Account {
  id: string;                    // Unique identifier (auto-generated)
  institutionName: string;       // "TD Bank", "Chase", etc.
  accountName: string;           // "Checking", "Savings", "Sapphire Reserve"
  exportDisplayName: string;     // "TD Bank - Checking" (for export to Monarch)
  accountType?: 'checking' | 'savings' | 'credit' | 'investment';
}
```

**Notes:**
- `exportDisplayName` is auto-generated as `{institutionName} - {accountName}` but can be customized
- `accountType` is optional and used for organization/filtering

### Transaction (Internal Format)

```typescript
interface Transaction {
  id: string;                    // Unique identifier (auto-generated)
  date: string;                  // YYYY-MM-DD format
  merchant: string;              // Merchant/payee name
  category: string;              // Transaction category
  institutionName: string;       // Financial institution name
  accountName: string;           // Account name within institution
  originalStatement: string;     // Bank's original description
  notes: string;                 // User notes
  amount: number;                // Negative = debit, Positive = credit
  tags: string[];                // Array of tags
  sourceFile: string;            // Original import file name
  importedAt: string;            // ISO timestamp of when imported
}
```

### SettingsFile

```typescript
interface SettingsFile {
  version: string;
  accounts: Account[];
  preferences: {
    masterDataPath: string;
  };
}
```

### MasterDataFile

```typescript
interface MasterDataFile {
  version: string;
  lastUpdated: string;
  transactions: Transaction[];
  metadata: {
    totalTransactions: number;
    dateRange: {
      earliest: string;
      latest: string;
    };
  };
}
```

---

## Account Configuration

### Purpose
Centralized management of financial accounts to ensure consistency across:
- Import Templates (which account does this template import to?)
- Master Data (which account does this transaction belong to?)
- Export (how should this account appear in the output?)

### UI Location
Settings page → Account Configuration section

### Fields

| Field | Description | Editable |
|-------|-------------|----------|
| Institution | Financial institution name (e.g., "TD Bank") | Yes |
| Account | Account name (e.g., "Checking") | Yes |
| Export Display Name | How account appears in exports | Yes (auto-generated default) |
| Type | checking, savings, credit, investment | Yes (optional) |

### Account Deletion Protection
Accounts cannot be deleted if they are referenced by:
- Import Templates (via `accountId`)
- Transactions in Master Data (via `institutionName` + `accountName`)

---

## Internal Transaction Format

### Field Mapping to Monarch Money

| Internal Field | Monarch Money | Notes |
|----------------|---------------|-------|
| date | Date | Direct mapping |
| merchant | Merchant | Direct mapping |
| category | Category | Direct mapping |
| (computed) | Account | Uses `exportDisplayName` from Account config |
| originalStatement | Original Statement | Direct mapping |
| notes | Notes | Direct mapping |
| amount | Amount | Direct mapping |
| tags | Tags | Joined with comma |

### Fields Not Exported
- `id` - Internal identifier
- `institutionName` - Separate storage, combined for export
- `accountName` - Separate storage, combined for export
- `sourceFile` - Internal tracking
- `importedAt` - Internal tracking

---

## Export Template System

### Purpose
Define how internal data is mapped to output file columns.

### Design Principles
1. **Internal Format is Fixed** - Hard-coded in code, not user-configurable
2. **Export Template is Flexible** - User controls what fields to export and how to name them
3. **Explicit Mapping** - Clear visibility of internal field → export column relationship

### Export Template Editor UI

```
| Internal Field          | Export Field         | Type     | Sample       |
|-------------------------|----------------------|----------|--------------|
| date                    | Date                 | Date     | 2025-01-08   |
| merchant                | Merchant             | Text     | Amazon       |
| category                | Category             | Text     | Shopping     |
| exportDisplayName (i)   | Account              | Text     | TD Checking  |
| originalStatement       | Original Statement   | Text     | AMAZON.COM*  |
| notes                   | Notes                | Text     |              |
| amount                  | Amount               | Currency | -58.12       |
| tags                    | Tags                 | Text     | online,food  |
```

### Column Definitions

| Column | Editable | Description |
|--------|----------|-------------|
| Internal Field | No | Database field name (read-only) |
| Export Field | Yes | Column name in output file (freeform) |
| Type | Yes | Formatting: Date, Text, Currency |
| Sample | No | Preview of data (auto-generated) |

### Available Internal Fields

| Field | Description | Source |
|-------|-------------|--------|
| `date` | Transaction date | Transaction.date |
| `merchant` | Merchant/payee name | Transaction.merchant |
| `category` | Transaction category | Transaction.category |
| `institutionName` | Financial institution | Transaction.institutionName |
| `accountName` | Account name | Transaction.accountName |
| `exportDisplayName` | Combined account display | Account.exportDisplayName (lookup) |
| `originalStatement` | Bank's original description | Transaction.originalStatement |
| `notes` | User notes | Transaction.notes |
| `amount` | Transaction amount | Transaction.amount |
| `tags` | Tags (comma-joined) | Transaction.tags |

### Special Field: exportDisplayName

This is a computed field that looks up the account's `exportDisplayName` based on the transaction's `institutionName` and `accountName`.

**Tooltip:** "Account display name configured in Settings → Account Configuration. Combines institution and account name (e.g., 'TD Bank - Checking')."

### Export Behavior

| Scenario | Result |
|----------|--------|
| Row with Export Field filled | Internal field → Export column with that name |
| Row with Export Field blank | Field NOT exported |
| Row removed | Field NOT exported |
| Add Field | Dropdown shows available internal fields |

### Export Template Model

```typescript
interface ExportTemplateField {
  id: string;
  internalField: string;        // "date", "merchant", "exportDisplayName", etc.
  exportField: string;          // Output column name (freeform)
  dataType: 'Text' | 'Date' | 'Currency';
  order: number;                // Column order in output
}

interface ExportTemplate {
  id: string;
  name: string;
  description: string;
  fields: ExportTemplateField[];
  isDefault: boolean;
  createdAt: string;
  updatedAt: string;
}
```

---

## Import Template System

### Purpose
Define how bank-specific file formats are parsed into the internal format.

### Import Template Model

```typescript
interface ImportTemplate {
  id: string;
  name: string;
  accountId: string;            // References Account (not freeform)
  fileType: 'CSV' | 'Excel' | 'JSON';
  fieldMappings: FieldMapping[];
  // ... other existing fields
}
```

### Import Template Editor Changes
- Account is selected from dropdown (not freeform text)
- Dropdown populated from Settings → Account Configuration
- If no accounts configured, show warning with link to Settings

### Import Templates List Columns

| Column | Source |
|--------|--------|
| Template Name | template.name |
| Institution | account.institutionName (via lookup) |
| Account | account.accountName (via lookup) |
| File Type | template.fileType |
| Fields | template.fieldMappings.length |
| Last Modified | template.updatedAt |
| Actions | Edit, Duplicate, Delete |

---

## Duplicate Detection

### Import Template Duplicates
Prevents creating multiple templates for the same account + file type combination.

**Fields:** `institutionName` + `accountName` + `fileType`

```typescript
function isTemplateDuplicate(
  newTemplate: ImportTemplate,
  existingTemplates: ImportTemplate[],
  accounts: Account[]
): boolean {
  const newAccount = accounts.find(a => a.id === newTemplate.accountId);
  return existingTemplates.some(existing => {
    const existingAccount = accounts.find(a => a.id === existing.accountId);
    return (
      newAccount?.institutionName === existingAccount?.institutionName &&
      newAccount?.accountName === existingAccount?.accountName &&
      newTemplate.fileType === existing.fileType &&
      existing.id !== newTemplate.id
    );
  });
}
```

### Transaction Duplicates
Prevents importing the same transaction twice.

**Fields:** `date` + `amount` + `institutionName` + `accountName` + `originalStatement`

```typescript
function isDuplicateTransaction(
  newTxn: Transaction,
  existing: Transaction[]
): boolean {
  return existing.some(txn =>
    txn.date === newTxn.date &&
    txn.amount === newTxn.amount &&
    txn.institutionName === newTxn.institutionName &&
    txn.accountName === newTxn.accountName &&
    similarDescription(txn.originalStatement, newTxn.originalStatement)
  );
}

function similarDescription(a: string, b: string): boolean {
  const normalize = (s: string) => s.toLowerCase().replace(/[^a-z0-9]/g, '');
  return normalize(a) === normalize(b) ||
         levenshteinDistance(normalize(a), normalize(b)) < 3;
}
```

---

## UI Components

### Settings Page Layout

```
┌─────────────────────────────────────────────────────────────────────┐
│ Settings                                                             │
│ Configure accounts and manage your master data                      │
├─────────────────────────────────────────────────────────────────────┤
│                                                                      │
│ ┌─────────────────────────────────────────────────────────────────┐ │
│ │ Account Configuration                              [+ Add Account]│ │
│ │                                                                   │ │
│ │ | Institution | Account  | Export Display    | Type   | Actions | │ │
│ │ |-------------|----------|-------------------|--------|---------|│ │
│ │ | TD Bank     | Checking | TD Bank-Checking  |checking| ✏️ 🗑️   | │ │
│ │ | Chase       | Sapphire | Chase Sapphire    |credit  | ✏️ 🗑️   | │ │
│ └─────────────────────────────────────────────────────────────────┘ │
│                                                                      │
│ ┌─────────────────────────────────────────────────────────────────┐ │
│ │ Master Data                                                      │ │
│ │                                                                   │ │
│ │ Master File Location              Last modified: Jan 8, 2025     │ │
│ │ 📁 C:/Users/.../BankBridge/master_data.json                      │ │
│ │                                                                   │ │
│ │ [📂 Change Folder] [↓ Import] [↑ Export ▼]          [⟳ Reload]  │ │
│ │                                                                   │ │
│ │ Transactions                      🔍 Search...    Total: 1,234   │ │
│ │                                                                   │ │
│ │ | Date  | Merchant | Amount | Institution | Account | Category | │ │
│ │ |-------|----------|--------|-------------|---------|----------|│ │
│ │ |[Filtr]| [Filter] |[Filter]| [Filter]    |[Filter] | [Filter] |│ │
│ │ |01-08  | Amazon   | -58.12 | TD Bank     |Checking | Shopping |│ │
│ │                                                                   │ │
│ │ Showing 1-50 of 1,234      [◀ Prev] [1] [2] ... [Next ▶]        │ │
│ └─────────────────────────────────────────────────────────────────┘ │
└─────────────────────────────────────────────────────────────────────┘
```

### Setup Incomplete Warnings

When accounts or templates are not configured, show warnings:

**Import Templates Page:**
```
⚠️ No accounts configured. Please set up accounts in Settings first.
   [Go to Settings]
```

**Process Files Page:**
```
⚠️ Setup incomplete. Please configure the following:
   • Accounts (0 configured) - [Go to Settings]
   • Import Templates (0 configured) - [Go to Import Templates]
   • Export Template (not set) - [Go to Export Templates]
```

---

## Schema Versioning

Both `settings.json` and `master_data.json` include a `version` field for schema evolution.

```typescript
async function loadMasterData(): Promise<MasterDataFile> {
  const data = await readJsonFile();
  return migrateIfNeeded(data);
}

function migrateIfNeeded(data: MasterDataFile): MasterDataFile {
  const currentVersion = '1.0.0';
  if (data.version === currentVersion) return data;

  // Run incremental migrations
  let migrated = data;
  for (const [from, to, migrator] of migrations) {
    if (migrated.version === from) {
      migrated = migrator(migrated);
    }
  }
  return migrated;
}
```

### Handling Format Changes

| Change Type | Solution |
|-------------|----------|
| Bank changes export format | Update Import Template |
| Monarch Money changes format | Update Export Template |
| Internal schema changes | Schema migration on load |

---

## Quick Reference

### Key Files
| Purpose | Location |
|---------|----------|
| Account config | AppData/BankBridge/settings.json |
| Transaction data | Configurable (default: AppData/BankBridge/master_data.json) |

### Internal Fields
`date`, `merchant`, `category`, `institutionName`, `accountName`, `originalStatement`, `notes`, `amount`, `tags`

### Computed Fields
`exportDisplayName` - Looked up from Account config based on institutionName + accountName

### Duplicate Detection
| Type | Fields |
|------|--------|
| Import Template | Institution + Account + File Type |
| Transaction | date + amount + institutionName + accountName + originalStatement |
