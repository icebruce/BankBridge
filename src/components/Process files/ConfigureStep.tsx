import React, { useState, useEffect } from 'react';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import {
  faCheck,
  faTriangleExclamation,
  faXmark,
  faMagicWandSparkles,
} from '@fortawesome/free-solid-svg-icons';
import { faFileLines } from '@fortawesome/free-regular-svg-icons';
import type { FileEntry } from './ProcessFilesPage';
import { fetchImportTemplates, suggestTemplateForColumns } from '../../services/importTemplateService';
import { getAccounts } from '../../services/settingsService';
import type { ImportTemplate } from '../../models/ImportTemplate';

interface ConfigureStepProps {
  files: FileEntry[];
  onUpdateFile: (id: string, updates: Partial<FileEntry>) => void;
}

interface TemplateWithAccount extends ImportTemplate {
  accountDisplayName?: string;
}

const ConfigureStep: React.FC<ConfigureStepProps> = ({
  files,
  onUpdateFile,
}) => {
  const [templates, setTemplates] = useState<TemplateWithAccount[]>([]);
  const [loading, setLoading] = useState(true);

  // Load templates and accounts
  useEffect(() => {
    const loadData = async () => {
      try {
        const [templatesData, accountsData] = await Promise.all([
          fetchImportTemplates(),
          getAccounts(),
        ]);

        // Enrich templates with account display name
        const enrichedTemplates = templatesData.map((template) => {
          const account = accountsData.find((a) => a.id === template.accountId);
          return {
            ...template,
            accountDisplayName: account?.exportDisplayName || template.account || 'Unknown Account',
          };
        });

        setTemplates(enrichedTemplates);
        setLoading(false);

        // Suggest templates for files that don't have one selected
        files.forEach((file) => {
          if (!file.selectedTemplateId && file.parseStatus === 'complete' && file.parseResult) {
            const suggestion = suggestTemplateForColumns(file.parseResult.columns, enrichedTemplates);
            if (suggestion) {
              onUpdateFile(file.id, {
                suggestedTemplateId: suggestion.templateId,
                selectedTemplateId: suggestion.templateId,
                isAutoMatched: true,
              });
            }
          }
        });
      } catch (error) {
        console.error('Failed to load templates:', error);
        setLoading(false);
      }
    };

    loadData();
  }, [files, onUpdateFile]);

  const handleTemplateChange = (fileId: string, templateId: string) => {
    onUpdateFile(fileId, {
      selectedTemplateId: templateId || undefined,
      isAutoMatched: false,
    });
  };

  const getTemplateById = (id: string): TemplateWithAccount | undefined => {
    return templates.find((t) => t.id === id);
  };

  // Check if any file needs attention
  const filesNeedingAttention = files.filter(
    (f) => !f.selectedTemplateId && f.parseStatus === 'complete'
  );
  const filesReady = files.filter((f) => f.selectedTemplateId);

  if (loading) {
    return (
      <div className="bg-white p-8 border border-neutral-200 rounded-lg shadow-sm text-center">
        <div className="animate-pulse">
          <div className="h-4 bg-neutral-200 rounded w-1/3 mx-auto mb-4"></div>
          <div className="h-4 bg-neutral-200 rounded w-1/2 mx-auto"></div>
        </div>
        <p className="text-neutral-500 mt-4">Loading import templates...</p>
      </div>
    );
  }

  // No templates available
  if (templates.length === 0) {
    return (
      <div className="bg-white p-8 border border-neutral-200 rounded-lg shadow-sm">
        <div className="text-center">
          <FontAwesomeIcon
            icon={faTriangleExclamation}
            className="text-4xl text-yellow-600 mb-4"
          />
          <h3 className="text-lg font-semibold mb-2">No Import Templates Found</h3>
          <p className="text-neutral-600 mb-4">
            You need at least one import template to process files.
            Import templates define how to map your bank's CSV columns to the standard format.
          </p>
          <button
            onClick={() => {
              window.dispatchEvent(
                new CustomEvent('navigate', { detail: { page: 'import-templates' } })
              );
            }}
            className="px-4 py-2 bg-neutral-900 text-white rounded-lg hover:bg-neutral-800 hover:shadow-sm transition-all duration-200"
          >
            Create Import Template
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="flex flex-col h-full">
      {/* Summary Header */}
      <div className="flex items-center justify-between mb-6">
        <div>
          <h3 className="text-lg font-semibold mb-1">
            Configure Files ({files.length})
          </h3>
          <p className="text-sm text-neutral-600">
            Select an import template for each file to map columns correctly
          </p>
        </div>
        <div className="flex items-center gap-4 text-sm">
          {filesReady.length > 0 && (
            <span className="text-green-600 flex items-center">
              <FontAwesomeIcon icon={faCheck} className="mr-2" />
              {filesReady.length} ready
            </span>
          )}
          {filesNeedingAttention.length > 0 && (
            <span className="text-yellow-700 flex items-center">
              <FontAwesomeIcon icon={faTriangleExclamation} className="mr-2" />
              {filesNeedingAttention.length} need attention
            </span>
          )}
        </div>
      </div>

      {/* File Table */}
      <div className="flex-1 min-h-0 border border-neutral-200 rounded-lg bg-white overflow-hidden">
        <div className="h-full overflow-auto">
        <table className="w-full table-fixed" style={{ borderCollapse: 'separate', borderSpacing: 0 }}>
          <colgroup>
            <col style={{ width: '40%' }} />
            <col style={{ width: '10%' }} />
            <col style={{ width: '20%' }} />
            <col style={{ width: '30%' }} />
          </colgroup>
          <thead className="bg-neutral-50 sticky top-0">
            <tr>
              <th style={{ paddingLeft: '24px' }} className="text-left text-sm font-medium text-neutral-600 pr-4 py-3 border-b border-neutral-200">File Name</th>
              <th className="text-left text-sm font-medium text-neutral-600 px-4 py-3 border-b border-neutral-200">Records</th>
              <th className="text-left text-sm font-medium text-neutral-600 px-4 py-3 border-b border-neutral-200">Status</th>
              <th style={{ paddingRight: '24px' }} className="text-left text-sm font-medium text-neutral-600 pl-4 py-3 border-b border-neutral-200">Import Template</th>
            </tr>
          </thead>
          <tbody>
            {files.map((file, index) => {
              const selectedTemplate = file.selectedTemplateId
                ? getTemplateById(file.selectedTemplateId)
                : undefined;
              const needsAttention = !file.selectedTemplateId && file.parseStatus === 'complete';
              const isLastRow = index === files.length - 1;
              const borderClass = isLastRow ? '' : 'border-b border-neutral-200';

              return (
                <tr
                  key={file.id}
                  className={`
                    transition-colors
                    ${needsAttention ? 'bg-yellow-50/50' : 'hover:bg-neutral-50'}
                  `}
                >
                  {/* File Name */}
                  <td style={{ paddingLeft: '24px' }} className={`text-left pr-4 py-4 ${borderClass}`}>
                    <div className="flex items-center gap-3">
                      <FontAwesomeIcon
                        icon={faFileLines}
                        className="text-neutral-400 flex-shrink-0"
                      />
                      <span className="font-medium text-neutral-900 truncate">{file.name}</span>
                    </div>
                  </td>

                  {/* Records */}
                  <td className={`text-left px-4 py-4 ${borderClass}`}>
                    <span className="text-sm text-neutral-600">
                      {file.parseResult?.rowCount.toLocaleString() || 0}
                    </span>
                  </td>

                  {/* Status */}
                  <td className={`text-left px-4 py-4 ${borderClass}`}>
                    {file.isAutoMatched && file.selectedTemplateId && (
                      <span className="text-xs px-2.5 py-1 bg-green-100 text-green-700 rounded-full font-medium inline-flex items-center">
                        <FontAwesomeIcon icon={faMagicWandSparkles} className="mr-1.5" />
                        Auto-matched
                      </span>
                    )}
                    {selectedTemplate && !file.isAutoMatched && (
                      <span className="text-xs px-2.5 py-1 bg-green-100 text-green-700 rounded-full font-medium inline-flex items-center">
                        <FontAwesomeIcon icon={faCheck} className="mr-1.5" />
                        Ready
                      </span>
                    )}
                    {needsAttention && (
                      <span className="text-xs px-2.5 py-1 bg-yellow-100 text-yellow-800 rounded-full font-medium inline-flex items-center">
                        <FontAwesomeIcon icon={faTriangleExclamation} className="mr-1.5" />
                        Select template
                      </span>
                    )}
                  </td>

                  {/* Import Template */}
                  <td style={{ paddingRight: '24px' }} className={`text-left pl-4 py-4 ${borderClass}`}>
                    <select
                      value={file.selectedTemplateId || ''}
                      onChange={(e) => handleTemplateChange(file.id, e.target.value)}
                      className={`
                        w-full px-3 py-1.5 text-sm border rounded-lg electronInput
                        focus:ring-2 focus:ring-blue-500 focus:border-blue-500 focus:outline-none
                        transition-colors
                        ${needsAttention ? 'border-yellow-200' : 'border-neutral-200'}
                      `}
                    >
                      <option value="">Select...</option>
                      {templates.map((template) => (
                        <option key={template.id} value={template.id}>
                          {template.accountDisplayName}
                        </option>
                      ))}
                    </select>
                  </td>
                </tr>
              );
            })}
          </tbody>
        </table>
        </div>
      </div>
    </div>
  );
};

export default ConfigureStep;
