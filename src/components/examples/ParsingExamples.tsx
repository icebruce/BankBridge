import React, { useState } from 'react';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import { faCode, faPlay, faDownload } from '@fortawesome/free-solid-svg-icons';

import FileParser from '../common/FileParser';
import { useQuickParse } from '../../ui/hooks/useQuickParse';
import { ParseResult, ParsedRow } from '../../models/parse';
import { 
  ParsePresets, 
  extractColumns, 
  filterRows, 
  calculateColumnStats,
  convertToCSV,
  formatParseResultSummary,
  sampleData
} from '../../utils/parseHelpers';

/**
 * Example 1: Basic File Upload and Parse
 */
export const BasicParsingExample: React.FC = () => {
  const [result, setResult] = useState<ParseResult | null>(null);

  const handleParseComplete = (parseResult: ParseResult) => {
    setResult(parseResult);
    console.log('Parse completed:', parseResult);
  };

  const handleParseError = (error: string) => {
    console.error('Parse error:', error);
  };

  return (
    <div className="space-y-4">
      <h3 className="text-lg font-semibold">Basic File Parsing</h3>
      
      <FileParser
        title="Upload Data File"
        description="Upload a CSV, JSON, or TXT file to parse"
        onParseComplete={handleParseComplete}
        onParseError={handleParseError}
        parseOptions={ParsePresets.BALANCED}
        showAdvancedOptions={true}
      />

      {result && (
        <div className="bg-gray-50 p-4 rounded-lg">
          <h4 className="font-medium mb-2">Parse Results</h4>
          <p className="text-sm text-gray-600">{formatParseResultSummary(result)}</p>
          
          {result.data && result.data.length > 0 && (
            <div className="mt-3">
              <p className="text-sm font-medium">Sample Data (first 3 rows):</p>
              <pre className="text-xs bg-white p-2 rounded border mt-1 overflow-auto">
                {JSON.stringify(sampleData(result.data, 3), null, 2)}
              </pre>
            </div>
          )}
        </div>
      )}
    </div>
  );
};

/**
 * Example 2: Programmatic Parsing with Quick Parse Hook
 */
export const QuickParseExample: React.FC = () => {
  const { parseFromDialog, parseFile } = useQuickParse();
  const [result, setResult] = useState<ParseResult | null>(null);
  const [isLoading, setIsLoading] = useState(false);

  const handleQuickParse = async () => {
    setIsLoading(true);
    try {
      const parseResult = await parseFromDialog({
        title: 'Select file for quick parsing',
        ...ParsePresets.FAST
      });
      
      if (parseResult) {
        setResult(parseResult);
      }
    } catch (error) {
      console.error('Quick parse error:', error);
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="space-y-4">
      <h3 className="text-lg font-semibold">Quick Parse (Programmatic)</h3>
      
      <button
        onClick={handleQuickParse}
        disabled={isLoading}
        className="flex items-center px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 disabled:opacity-50"
      >
        <FontAwesomeIcon icon={faPlay} className="mr-2" />
        {isLoading ? 'Parsing...' : 'Open File Dialog & Parse'}
      </button>

      {result && (
        <div className="bg-gray-50 p-4 rounded-lg">
          <h4 className="font-medium mb-2">Quick Parse Results</h4>
          <p className="text-sm text-gray-600">{formatParseResultSummary(result)}</p>
        </div>
      )}
    </div>
  );
};

/**
 * Example 3: Data Processing and Analysis
 */
export const DataAnalysisExample: React.FC = () => {
  const [data, setData] = useState<ParsedRow[]>([]);
  const [analysis, setAnalysis] = useState<any>(null);

  const handleParseComplete = (result: ParseResult) => {
    if (result.success && result.data) {
      setData(result.data);
      performAnalysis(result.data);
    }
  };

  const performAnalysis = (parsedData: ParsedRow[]) => {
    if (parsedData.length === 0) return;

    const columns = Object.keys(parsedData[0]);
    const numericColumns = columns.filter(col => {
      const sampleValues = parsedData.slice(0, 10).map(row => row[col]);
      return sampleValues.some(val => !isNaN(Number(val)));
    });

    const stats: any = {};
    numericColumns.forEach(col => {
      stats[col] = calculateColumnStats(parsedData, col);
    });

    // Example filtering
    const filteredData = filterRows(parsedData, {
      // Example: filter rows where first numeric column > 0
      [numericColumns[0]]: (value) => Number(value) > 0
    });

    setAnalysis({
      totalRows: parsedData.length,
      columns: columns.length,
      numericColumns,
      stats,
      filteredCount: filteredData.length
    });
  };

  const downloadCSV = () => {
    if (data.length === 0) return;
    
    const csv = convertToCSV(data);
    const blob = new Blob([csv], { type: 'text/csv' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = 'parsed_data.csv';
    a.click();
    URL.revokeObjectURL(url);
  };

  return (
    <div className="space-y-4">
      <h3 className="text-lg font-semibold">Data Analysis Example</h3>
      
      <FileParser
        title="Upload Data for Analysis"
        description="Upload a file to analyze and process the data"
        onParseComplete={handleParseComplete}
        parseOptions={ParsePresets.BALANCED}
        maxFileSizeMB={50}
      />

      {analysis && (
        <div className="bg-gray-50 p-4 rounded-lg space-y-3">
          <h4 className="font-medium">Data Analysis Results</h4>
          
          <div className="grid grid-cols-2 gap-4 text-sm">
            <div>
              <span className="font-medium">Total Rows:</span> {analysis.totalRows}
            </div>
            <div>
              <span className="font-medium">Columns:</span> {analysis.columns}
            </div>
            <div>
              <span className="font-medium">Numeric Columns:</span> {analysis.numericColumns.length}
            </div>
            <div>
              <span className="font-medium">Filtered Rows:</span> {analysis.filteredCount}
            </div>
          </div>

          {analysis.numericColumns.length > 0 && (
            <div>
              <h5 className="font-medium text-sm mb-2">Column Statistics:</h5>
              <div className="space-y-2">
                {analysis.numericColumns.slice(0, 3).map((col: string) => (
                  <div key={col} className="text-xs bg-white p-2 rounded">
                    <div className="font-medium">{col}</div>
                    <div className="text-gray-600">
                      Avg: {analysis.stats[col]?.average.toFixed(2)} | 
                      Min: {analysis.stats[col]?.min} | 
                      Max: {analysis.stats[col]?.max}
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}

          <button
            onClick={downloadCSV}
            className="flex items-center px-3 py-2 bg-green-600 text-white rounded text-sm hover:bg-green-700"
          >
            <FontAwesomeIcon icon={faDownload} className="mr-2" />
            Download as CSV
          </button>
        </div>
      )}
    </div>
  );
};

/**
 * Example 4: Import Template Parsing
 */
export const ImportTemplateExample: React.FC = () => {
  const [templateData, setTemplateData] = useState<ParsedRow[]>([]);

  const handleTemplateParseComplete = (result: ParseResult) => {
    if (result.success && result.data) {
      setTemplateData(result.data);
      
      // Process template data - extract required columns
      const requiredColumns = ['account', 'amount', 'date'];
      const extractedData = extractColumns(result.data, requiredColumns);
      
      console.log('Template data extracted:', extractedData);
    }
  };

  return (
    <div className="space-y-4">
      <h3 className="text-lg font-semibold">Import Template Parsing</h3>
      
      <FileParser
        title="Upload Import Template"
        description="Upload a template file for import processing"
        onParseComplete={handleTemplateParseComplete}
        parseOptions={{
          ...ParsePresets.IMPORT_TEMPLATE,
          mapping: {
            transactions: { type: 'array', explode: true }
          }
        }}
        acceptedTypes=".csv,.json"
        maxFileSizeMB={25}
        showAdvancedOptions={false}
      />

      {templateData.length > 0 && (
        <div className="bg-blue-50 p-4 rounded-lg">
          <h4 className="font-medium text-blue-900">Template Loaded</h4>
          <p className="text-sm text-blue-700">
            Successfully loaded {templateData.length} template records
          </p>
          
          <div className="mt-2 text-xs">
            <span className="font-medium">Available fields:</span>{' '}
            {Object.keys(templateData[0] || {}).join(', ')}
          </div>
        </div>
      )}
    </div>
  );
};

/**
 * Main Examples Container
 */
export const ParsingExamples: React.FC = () => {
  const [activeExample, setActiveExample] = useState(0);

  const examples = [
    { title: 'Basic Parsing', component: BasicParsingExample },
    { title: 'Quick Parse', component: QuickParseExample },
    { title: 'Data Analysis', component: DataAnalysisExample },
    { title: 'Import Template', component: ImportTemplateExample }
  ];

  const ActiveComponent = examples[activeExample].component;

  return (
    <div className="max-w-4xl mx-auto p-6">
      <div className="mb-6">
        <h2 className="text-2xl font-bold mb-2">Parsing Strategy Examples</h2>
        <p className="text-gray-600">
          Demonstrations of how to use the reusable parsing components across different scenarios
        </p>
      </div>

      {/* Example Tabs */}
      <div className="flex space-x-1 mb-6 bg-gray-100 p-1 rounded-lg">
        {examples.map((example, index) => (
          <button
            key={index}
            onClick={() => setActiveExample(index)}
            className={`flex-1 px-4 py-2 rounded-md text-sm font-medium transition-colors ${
              activeExample === index
                ? 'bg-white text-blue-600 shadow-sm'
                : 'text-gray-600 hover:text-gray-900'
            }`}
          >
            {example.title}
          </button>
        ))}
      </div>

      {/* Active Example */}
      <div className="bg-white border border-gray-200 rounded-lg p-6">
        <ActiveComponent />
      </div>

      {/* Code Example */}
      <div className="mt-6 bg-gray-900 text-gray-100 rounded-lg p-4">
        <div className="flex items-center mb-3">
          <FontAwesomeIcon icon={faCode} className="mr-2" />
          <span className="font-medium">Usage Example</span>
        </div>
        <pre className="text-sm overflow-auto">
{`// Basic usage
import FileParser from '@/components/common/FileParser';
import { ParsePresets } from '@/utils/parseHelpers';

<FileParser
  title="Upload Data File"
  onParseComplete={(result) => console.log(result)}
  parseOptions={ParsePresets.BALANCED}
  showAdvancedOptions={true}
/>

// Programmatic usage
import { useQuickParse } from '@/ui/hooks/useQuickParse';

const { parseFromDialog } = useQuickParse();
const result = await parseFromDialog(ParsePresets.FAST);`}
        </pre>
      </div>
    </div>
  );
};

export default ParsingExamples; 