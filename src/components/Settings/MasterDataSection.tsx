import { useState, useEffect, useCallback } from 'react';
import type { FC } from 'react';
import FileLocationSection from './FileLocationSection';
import MasterDataTable from './MasterDataTable';
import InitialSetupWizard from './InitialSetupWizard';
import ColumnMappingStep from './ColumnMappingStep';
import type { ColumnMapping } from './ColumnMappingStep';
import {
  loadMasterData,
  getFileInfo,
  initializeMasterData
} from '../../services/masterDataService';
import type { MasterDataFile, MasterDataFileInfo } from '../../models/MasterData';

interface MasterDataSectionProps {
  onSuccess: (message: string) => void;
  onError: (message: string) => void;
}

type SetupMode = 'wizard' | 'mapping' | 'none';

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

  const handleDataChange = useCallback(() => {
    // Refresh data after changes
    loadData();
  }, []);

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
    try {
      // TODO: Open file picker and parse file
      // For now, show a message that this is coming soon
      onError('Import functionality coming soon. Please use "Start Fresh" for now.');

      // When implemented:
      // const result = await pickAndParseFile();
      // if (result) {
      //   setImportData({
      //     sourceColumns: result.columns,
      //     sampleData: result.data
      //   });
      //   setSetupMode('mapping');
      // }
    } catch (error) {
      console.error('Error importing file:', error);
      onError('Failed to import file');
    }
  }, [onError]);

  // Handle column mapping import
  const handleMappingImport = useCallback(async (_mappings: ColumnMapping[]) => {
    try {
      // TODO: Transform data using mappings and save to master data
      // For now, just initialize empty and show success
      await initializeMasterData();
      onSuccess('Data imported successfully');
      setSetupMode('none');
      setImportData(null);
      await loadData();
    } catch (error) {
      console.error('Error importing mapped data:', error);
      onError('Failed to import data');
    }
  }, [onSuccess, onError]);

  // Handle cancel from column mapping
  const handleMappingCancel = useCallback(() => {
    setSetupMode('wizard');
    setImportData(null);
  }, []);

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
          onReload={handleReload}
          onSuccess={onSuccess}
          onError={onError}
        />
      </div>

      {/* Master Data Table */}
      <div className="border border-neutral-200 rounded-lg overflow-hidden">
        {loading ? (
          <div className="text-center py-12 text-neutral-500">
            <div className="animate-pulse">Loading master data...</div>
          </div>
        ) : !masterData || masterData.transactions.length === 0 ? (
          <div className="text-center py-12">
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
            onDelete={handleDataChange}
            onSuccess={onSuccess}
            onError={onError}
          />
        )}
      </div>
    </div>
  );
};

export default MasterDataSection;
