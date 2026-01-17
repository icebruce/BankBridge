import { useState, useEffect, useCallback } from 'react';
import type { FC } from 'react';
import FileLocationSection from './FileLocationSection';
import MasterDataTable from './MasterDataTable';
import InitialSetupWizard from './InitialSetupWizard';
import ColumnMappingStep from './ColumnMappingStep';
import ImportPreviewStep from './ImportPreviewStep';
import type { ColumnMapping } from './ColumnMappingStep';
import {
  loadMasterData,
  getFileInfo,
  initializeMasterData,
  addTransactions
} from '../../services/masterDataService';
import { fileParserService } from '../../services/fileParserService';
import type { MasterDataFile, MasterDataFileInfo, CreateTransactionInput } from '../../models/MasterData';

interface MasterDataSectionProps {
  onSuccess: (message: string) => void;
  onError: (message: string) => void;
}

type SetupMode = 'wizard' | 'mapping' | 'preview' | 'none';

interface ImportData {
  sourceColumns: string[];
  sampleData: Record<string, string>[];
}

const MasterDataSection: FC<MasterDataSectionProps> = ({ onSuccess, onError }) => {
  const [masterData, setMasterData] = useState<MasterDataFile | null>(null);
  const [fileInfo, setFileInfo] = useState<MasterDataFileInfo | null>(null);
  const [loading, setLoading] = useState(true);
  const [setupMode, setSetupMode] = useState<SetupMode>('none');
  const [importData, setImportData] = useState<ImportData | null>(null);
  // Store pending transactions between mapping and preview steps
  const [pendingTransactions, setPendingTransactions] = useState<CreateTransactionInput[]>([]);

  // Load master data on mount
  useEffect(() => {
    loadData();
  }, []);

  const loadData = async () => {
    try {
      setLoading(true);

      // Check if master data exists
      const fileInfo = await getFileInfo();
      const exists = fileInfo.exists;

      if (!exists) {
        // Show setup wizard for first-time users
        setSetupMode('wizard');
        setLoading(false);
        return;
      }

      // Use the file info we already got
      setFileInfo(fileInfo);

      // Load master data
      const data = await loadMasterData();
      setMasterData(data);
      setSetupMode('none');
    } catch (error) {
      console.error('Error loading master data:', error);
      onError('Failed to load master data');
    } finally {
      setLoading(false);
    }
  };

  const handleReload = useCallback(async () => {
    await loadData();
    onSuccess('Master data reloaded');
  }, [onSuccess]);

  // Handle "Start Fresh" from wizard - create empty master data file
  const handleStartFresh = useCallback(async () => {
    try {
      await initializeMasterData();
      onSuccess('Master data file created successfully');
      await loadData();
    } catch (error) {
      console.error('Error initializing master data:', error);
      onError('Failed to create master data file');
    }
  }, [onSuccess, onError]);

  // Handle "Import Existing" from wizard - open file picker
  const handleImportExisting = useCallback(async () => {
    if (!window.electronAPI) {
      onError('This feature is only available in the desktop app');
      return;
    }

    try {
      const result = await window.electronAPI.masterData.importFile();
      if (!result) return; // User cancelled

      let columns: string[] = [];
      let data: Record<string, string>[] = [];

      if (result.type === 'csv' && result.content) {
        // Use fileParserService for proper CSV parsing (handles multi-line quoted fields, escaped quotes)
        const parsed = fileParserService.parseCSVContent(result.content);
        columns = parsed.columns;
        data = parsed.data;
      } else if (result.type === 'excel' && result.data) {
        if (result.data.length > 0) {
          columns = Object.keys(result.data[0]);
          data = result.data.map(row => {
            return columns.reduce((obj, col) => {
              obj[col] = String(row[col] ?? '');
              return obj;
            }, {} as Record<string, string>);
          });
        }
      }

      if (columns.length === 0) {
        onError('No data found in file');
        return;
      }

      setImportData({ sourceColumns: columns, sampleData: data });
      setSetupMode('mapping');
    } catch (error) {
      console.error('Error importing file:', error);
      onError('Failed to import file');
    }
  }, [onError]);

  // Handle import button click - open file picker and parse
  const handleImportClick = useCallback(async () => {
    if (!window.electronAPI) {
      onError('This feature is only available in the desktop app');
      return;
    }

    try {
      const result = await window.electronAPI.masterData.importFile();
      if (!result) return; // User cancelled

      let columns: string[] = [];
      let data: Record<string, string>[] = [];

      if (result.type === 'csv' && result.content) {
        // Use fileParserService for proper CSV parsing (handles multi-line quoted fields, escaped quotes)
        const parsed = fileParserService.parseCSVContent(result.content);
        columns = parsed.columns;
        data = parsed.data;
      } else if (result.type === 'excel' && result.data) {
        // Excel data is already parsed as array of objects
        if (result.data.length > 0) {
          columns = Object.keys(result.data[0]);
          data = result.data.map(row => {
            return columns.reduce((obj, col) => {
              obj[col] = String(row[col] ?? '');
              return obj;
            }, {} as Record<string, string>);
          });
        }
      }

      if (columns.length === 0) {
        onError('No data found in file');
        return;
      }

      setImportData({ sourceColumns: columns, sampleData: data });
      setSetupMode('mapping');
    } catch (error) {
      console.error('Error importing file:', error);
      onError('Failed to import file');
    }
  }, [onError]);

  // Handle column mapping - transform data and go to preview
  const handleMappingImport = useCallback(async (mappings: ColumnMapping[]) => {
    if (!importData) return;

    try {
      // Transform data using mappings (without generating IDs - that happens on final import)
      const transactions: CreateTransactionInput[] = importData.sampleData.map(row => {
        const mappedData: Partial<CreateTransactionInput> = {};

        mappings.forEach(mapping => {
          if (mapping.targetField && mapping.sourceColumn) {
            const value = row[mapping.sourceColumn] || '';

            // Handle amount conversion
            if (mapping.targetField === 'amount') {
              mappedData.amount = parseFloat(value.replace(/[^0-9.-]/g, '')) || 0;
            } else if (mapping.targetField === 'tags') {
              mappedData.tags = value ? value.split(',').map(t => t.trim()) : [];
            } else {
              (mappedData as any)[mapping.targetField] = value;
            }
          }
        });

        // Create transaction input with defaults
        const transaction: CreateTransactionInput = {
          date: mappedData.date || new Date().toISOString().split('T')[0],
          merchant: mappedData.merchant || '',
          category: mappedData.category || '',
          institutionName: mappedData.institutionName || '',
          accountName: mappedData.accountName || '',
          originalStatement: mappedData.originalStatement || '',
          notes: mappedData.notes || '',
          amount: mappedData.amount ?? 0,
          tags: mappedData.tags || [],
          sourceFile: 'manual_import',
        };

        return transaction;
      });

      // Store pending transactions and go to preview
      setPendingTransactions(transactions);
      setSetupMode('preview');
    } catch (error) {
      console.error('Error processing mapped data:', error);
      onError('Failed to process data');
    }
  }, [importData, onError]);

  // Handle preview import - final import of selected transactions
  const handlePreviewImport = useCallback(async (transactions: CreateTransactionInput[]) => {
    try {
      // Ensure master data exists
      let data = await loadMasterData();
      if (!data || !data.transactions) {
        data = await initializeMasterData();
      }

      // Add transactions using service (generates IDs and timestamps)
      await addTransactions(transactions);

      onSuccess(`Imported ${transactions.length} transaction${transactions.length !== 1 ? 's' : ''} successfully`);
      setSetupMode('none');
      setImportData(null);
      setPendingTransactions([]);
      await loadData();
    } catch (error) {
      console.error('Error importing transactions:', error);
      onError('Failed to import transactions');
    }
  }, [onSuccess, onError]);

  // Handle going back from preview to mapping
  const handlePreviewBack = useCallback(() => {
    setSetupMode('mapping');
  }, []);

  // Handle cancel from preview
  const handlePreviewCancel = useCallback(() => {
    if (masterData && masterData.transactions.length > 0) {
      setSetupMode('none');
    } else {
      setSetupMode('wizard');
    }
    setImportData(null);
    setPendingTransactions([]);
  }, [masterData]);

  // Handle cancel from column mapping
  const handleMappingCancel = useCallback(() => {
    // If master data exists, go back to normal view; otherwise show wizard
    if (masterData && masterData.transactions.length > 0) {
      setSetupMode('none');
    } else {
      setSetupMode('wizard');
    }
    setImportData(null);
  }, [masterData]);

  // Show setup wizard for first-time users
  if (setupMode === 'wizard') {
    return (
      <div>
        {/* Section Header */}
        <div className="mb-4">
          <h3 className="text-lg font-semibold text-neutral-900">Master Data</h3>
          <p className="text-sm text-neutral-500 mt-0.5">
            Manage your transaction database for processing and export
          </p>
        </div>

        {/* Initial Setup Wizard */}
        <div className="border border-neutral-200 rounded-lg overflow-hidden">
          <InitialSetupWizard
            onStartFresh={handleStartFresh}
            onImportExisting={handleImportExisting}
          />
        </div>
      </div>
    );
  }

  // Show column mapping for import
  if (setupMode === 'mapping' && importData) {
    return (
      <div>
        {/* Section Header */}
        <div className="mb-4">
          <h3 className="text-lg font-semibold text-neutral-900">Master Data</h3>
          <p className="text-sm text-neutral-500 mt-0.5">
            Manage your transaction database for processing and export
          </p>
        </div>

        {/* Column Mapping Step */}
        <div className="border border-neutral-200 rounded-lg overflow-hidden">
          <ColumnMappingStep
            sourceColumns={importData.sourceColumns}
            sampleData={importData.sampleData}
            onImport={handleMappingImport}
            onCancel={handleMappingCancel}
          />
        </div>
      </div>
    );
  }

  // Show import preview with duplicate detection
  if (setupMode === 'preview' && pendingTransactions.length > 0) {
    return (
      <div>
        {/* Section Header */}
        <div className="mb-4">
          <h3 className="text-lg font-semibold text-neutral-900">Master Data</h3>
          <p className="text-sm text-neutral-500 mt-0.5">
            Manage your transaction database for processing and export
          </p>
        </div>

        {/* Import Preview Step */}
        <div className="border border-neutral-200 rounded-lg overflow-hidden">
          <ImportPreviewStep
            transactions={pendingTransactions}
            onImport={handlePreviewImport}
            onCancel={handlePreviewCancel}
            onBack={handlePreviewBack}
          />
        </div>
      </div>
    );
  }

  return (
    <div>
      {/* Section Header */}
      <div className="mb-4">
        <h3 className="text-lg font-semibold text-neutral-900">Master Data</h3>
        <p className="text-sm text-neutral-500 mt-0.5">
          Manage your transaction database for processing and export
        </p>
      </div>

      {/* File Location Section */}
      <div className="mb-4">
        <FileLocationSection
          fileInfo={fileInfo}
          lastUpdated={masterData?.lastUpdated}
          transactions={masterData?.transactions || []}
          onReload={handleReload}
          onImportClick={handleImportClick}
          onSuccess={onSuccess}
          onError={onError}
        />
      </div>

      {/* Master Data Table */}
      {loading ? (
        <div className="border border-neutral-200 rounded-lg text-center py-12 text-neutral-500">
          <div className="animate-pulse">Loading master data...</div>
        </div>
      ) : !masterData || masterData.transactions.length === 0 ? (
        <div className="border border-neutral-200 rounded-lg text-center py-12">
          <div className="text-neutral-400 mb-3">
            <svg className="w-12 h-12 mx-auto" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M20 13V6a2 2 0 00-2-2H6a2 2 0 00-2 2v7m16 0v5a2 2 0 01-2 2H6a2 2 0 01-2-2v-5m16 0h-2.586a1 1 0 00-.707.293l-2.414 2.414a1 1 0 01-.707.293h-3.172a1 1 0 01-.707-.293l-2.414-2.414A1 1 0 006.586 13H4" />
            </svg>
          </div>
          <p className="text-neutral-600 mb-4">No transactions in master data</p>
          <p className="text-neutral-500 text-sm">
            Import transactions from the Process Files page or use the Import button above
          </p>
        </div>
      ) : (
        <MasterDataTable
          transactions={masterData.transactions}
          totalTransactions={masterData.metadata.totalTransactions}
        />
      )}
    </div>
  );
};

export default MasterDataSection;
