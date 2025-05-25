import React, { useState } from 'react';
import { createTemplate } from '../../services/templateService';
import { logStoredTemplates, logStorageStats } from '../../services/templateDebugUtils';

const TemplateDebugPanel: React.FC = () => {
  const [isVisible, setIsVisible] = useState(false);
  const [testResult, setTestResult] = useState<string>('');

  const runTemplateTest = async () => {
    try {
      setTestResult('🧪 Testing template creation...');
      
      const testData = {
        name: 'Debug Test Template',
        description: 'A test template created from debug panel',
        fileType: 'CSV',
        fieldMappings: [
          {
            sourceField: 'testField1',
            targetField: 'Test Field 1',
            transform: 'text'
          },
          {
            sourceField: 'testField2',
            targetField: 'Test Field 2', 
            transform: 'number'
          }
        ]
      };

      console.log('📝 Creating test template with data:', testData);
      
      const result = await createTemplate(testData);
      
      setTestResult(`✅ Success! Created template: ${result.name} (ID: ${result.id})`);
      console.log('✅ Template created successfully:', result);
      
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : 'Unknown error';
      setTestResult(`❌ Failed: ${errorMessage}`);
      console.error('❌ Template creation failed:', error);
    }
  };

  const logTemplates = () => {
    logStoredTemplates();
    setTestResult('📋 Templates logged to console');
  };

  const logStats = () => {
    logStorageStats();
    setTestResult('📊 Storage stats logged to console');
  };

  if (!isVisible) {
    return (
      <div className="fixed bottom-4 right-4 z-50">
        <button
          onClick={() => setIsVisible(true)}
          className="px-3 py-2 bg-blue-600 text-white rounded-lg text-sm hover:bg-blue-700"
        >
          🛠️ Debug
        </button>
      </div>
    );
  }

  return (
    <div className="fixed bottom-4 right-4 z-50 bg-white border border-gray-300 rounded-lg shadow-lg p-4 w-80">
      <div className="flex justify-between items-center mb-3">
        <h3 className="font-semibold text-sm">Template Debug Panel</h3>
        <button
          onClick={() => setIsVisible(false)}
          className="text-gray-500 hover:text-gray-700"
        >
          ✕
        </button>
      </div>
      
      <div className="space-y-2">
        <button
          onClick={runTemplateTest}
          className="w-full px-3 py-2 bg-green-600 text-white rounded text-sm hover:bg-green-700"
        >
          🧪 Test Template Creation
        </button>
        
        <button
          onClick={logTemplates}
          className="w-full px-3 py-2 bg-blue-600 text-white rounded text-sm hover:bg-blue-700"
        >
          📋 Log All Templates
        </button>
        
        <button
          onClick={logStats}
          className="w-full px-3 py-2 bg-purple-600 text-white rounded text-sm hover:bg-purple-700"
        >
          📊 Log Storage Stats
        </button>
      </div>
      
      {testResult && (
        <div className="mt-3 p-2 bg-gray-100 rounded text-xs">
          {testResult}
        </div>
      )}
    </div>
  );
};

export default TemplateDebugPanel; 