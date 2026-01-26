import React, { useState, useEffect, useRef } from 'react';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import {
  faCheck,
  faTriangleExclamation,
  faMagicWandSparkles,
  faCircleInfo,
  faXmark,
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

// Tooltip component for showing mismatch details
const MismatchTooltip: React.FC<{ missingColumns: string[] }> = ({ missingColumns }) => {
  const [isOpen, setIsOpen] = useState(false);
  const tooltipRef = useRef<HTMLDivElement>(null);

  // Close tooltip when clicking outside
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (tooltipRef.current && !tooltipRef.current.contains(event.target as Node)) {
        setIsOpen(false);
      }
    };

    if (isOpen) {
      document.addEventListener('mousedown', handleClickOutside);
    }
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, [isOpen]);

  return (
    <div className="relative inline-block" ref={tooltipRef}>
      <button
        type="button"
        onClick={() => setIsOpen(!isOpen)}
        className="flex items-center gap-1.5 text-xs text-red-600 mt-1.5 hover:text-red-700 transition-colors"
      >
        <span>File does not match template</span>
        <FontAwesomeIcon icon={faCircleInfo} className="text-red-400 hover:text-red-500" />
      </button>

      {isOpen && (
        <div className="absolute left-0 top-full mt-2 z-50 w-64 bg-white border border-neutral-200 rounded-lg shadow-lg p-3">
          <div className="flex items-center justify-between mb-2">
            <span className="text-xs font-semibold text-neutral-700">Missing Columns</span>
            <button
              type="button"
              onClick={() => setIsOpen(false)}
              className="text-neutral-400 hover:text-neutral-600 p-0.5"
            >
              <FontAwesomeIcon icon={faXmark} className="text-xs" />
            </button>
          </div>
          <p className="text-xs text-neutral-500 mb-2">
            The selected template expects these columns which are not in your file:
          </p>
          <ul className="space-y-1">
            {missingColumns.map((col, idx) => (
              <li key={idx} className="text-xs text-red-600 flex items-start gap-1.5">
                <span className="text-red-400 mt-0.5">•</span>
                <span className="font-mono bg-red-50 px-1.5 py-0.5 rounded">{col}</span>
              </li>
            ))}
          </ul>
        </div>
      )}
    </div>
  );
};

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
              const suggestedTemplate = enrichedTemplates.find(t => t.id === suggestion.templateId);
              const match = checkTemplateMatch(suggestedTemplate, file.parseResult?.columns);
              onUpdateFile(file.id, {
                suggestedTemplateId: suggestion.templateId,
                selectedTemplateId: suggestion.templateId,
                isAutoMatched: true,
                hasColumnMismatch: suggestedTemplate ? !match.isMatch : false,
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
    const file = files.find(f => f.id === fileId);
    const template = templateId ? getTemplateById(templateId) : undefined;
    const match = checkTemplateMatch(template, file?.parseResult?.columns);

    onUpdateFile(fileId, {
      selectedTemplateId: templateId || undefined,
      isAutoMatched: false,
      hasColumnMismatch: template ? !match.isMatch : false,
    });
  };

  const getTemplateById = (id: string): TemplateWithAccount | undefined => {
    return templates.find((t) => t.id === id);
  };

  // Check if template's mapped source fields exist in file's columns
  const checkTemplateMatch = (
    template: TemplateWithAccount | undefined,
    fileColumns: string[] | undefined
  ): { isMatch: boolean; missingColumns: string[] } => {
    if (!template || !fileColumns) {
      return { isMatch: true, missingColumns: [] };
    }

    // Get source fields that are actually mapped to a target field
    // Only these are "required" - unmapped columns are ignored
    const mappedFields = template.fieldMappings
      .filter(m => m.sourceField && m.targetField) // Must have both source AND target
      .map(m => m.sourceField);

    // Also check field combinations (combined fields)
    const combinedFields = (template.fieldCombinations || [])
      .flatMap(c => c.sourceFields?.map(sf => sf.fieldName) || []);

    // All fields that the template expects from the file
    const requiredFields = [...new Set([...mappedFields, ...combinedFields])];

    // Find which template fields are missing from file columns
    const missingColumns = requiredFields.filter(
      field => !fileColumns.includes(field)
    );

    return {
      isMatch: missingColumns.length === 0,
      missingColumns
    };
  };

  // Check if any file needs attention
  const filesNeedingAttention = files.filter(
    (f) => !f.selectedTemplateId && f.parseStatus === 'complete'
  );

  // Check for files with template mismatches
  const filesWithMismatch = files.filter((f) => {
    if (!f.selectedTemplateId) return false;
    const template = getTemplateById(f.selectedTemplateId);
    const match = checkTemplateMatch(template, f.parseResult?.columns);
    return !match.isMatch;
  });

  const filesReady = files.filter((f) => {
    if (!f.selectedTemplateId) return false;
    const template = getTemplateById(f.selectedTemplateId);
    const match = checkTemplateMatch(template, f.parseResult?.columns);
    return match.isMatch;
  });

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
          {filesWithMismatch.length > 0 && (
            <span className="text-red-600 flex items-center">
              <FontAwesomeIcon icon={faXmark} className="mr-2" />
              {filesWithMismatch.length} {filesWithMismatch.length === 1 ? 'error' : 'errors'}
            </span>
          )}
          {filesNeedingAttention.length > 0 && (
            <span className="text-yellow-700 flex items-center">
              <FontAwesomeIcon icon={faTriangleExclamation} className="mr-2" />
              {filesNeedingAttention.length} need template
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

              // Check if selected template matches file columns
              const templateMatch = checkTemplateMatch(selectedTemplate, file.parseResult?.columns);
              const hasMismatch = selectedTemplate && !templateMatch.isMatch;

              return (
                <tr
                  key={file.id}
                  className={`
                    transition-colors
                    ${needsAttention || hasMismatch ? 'bg-yellow-50/50' : 'hover:bg-neutral-50'}
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
                    {hasMismatch && (
                      <span className="text-xs px-2.5 py-1 bg-red-100 text-red-700 rounded-full font-medium inline-flex items-center">
                        <FontAwesomeIcon icon={faXmark} className="mr-1.5" />
                        Error
                      </span>
                    )}
                    {!hasMismatch && file.isAutoMatched && file.selectedTemplateId && (
                      <span className="text-xs px-2.5 py-1 bg-green-100 text-green-700 rounded-full font-medium inline-flex items-center">
                        <FontAwesomeIcon icon={faMagicWandSparkles} className="mr-1.5" />
                        Auto-matched
                      </span>
                    )}
                    {!hasMismatch && selectedTemplate && !file.isAutoMatched && (
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
                        ${hasMismatch ? 'border-red-300' : needsAttention ? 'border-yellow-200' : 'border-neutral-200'}
                      `}
                    >
                      <option value="">Select...</option>
                      {templates.map((template) => (
                        <option key={template.id} value={template.id}>
                          {template.accountDisplayName}
                        </option>
                      ))}
                    </select>
                    {hasMismatch && (
                      <MismatchTooltip missingColumns={templateMatch.missingColumns} />
                    )}
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
