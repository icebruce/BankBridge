import React, { useState, useEffect } from 'react'
import SidebarMenu from './components/Layout/SidebarMenu'
import ProcessFilesPage from './components/Process files/ProcessFilesPage'
import ImportTemplatesPage from './components/ImportTemplates/ImportTemplatesPage'
import ExportTemplatesPage from './components/ExportTemplates/ExportTemplatesPage'
import MasterDataPage from './components/MasterData/MasterDataPage'
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome'
import {
  faCloudArrowUp,
  faTriangleExclamation,
  faXmark,
  faCopy,
  faFileArrowDown,
} from '@fortawesome/free-solid-svg-icons'
import { faFileLines } from '@fortawesome/free-regular-svg-icons'
import ExampleComponent from './components/ExampleComponent'
import { attachDebugToWindow } from './services/templateDebugUtils'
import TemplateDebugPanel from './components/Debug/TemplateDebugPanel'

type SectionType = 'Process Files' | 'Import Templates' | 'Export Templates' | 'Master Data';

const App: React.FC = () => {
  const [activeSection, setActiveSection] = useState<SectionType>('Process Files')
  const [showCssTest, setShowCssTest] = useState(true)

  // Initialize debug utilities in development
  useEffect(() => {
    if (process.env.NODE_ENV === 'development') {
      attachDebugToWindow();
    }
  }, []);

  // Handle sidebar navigation with type checking
  const handleSectionChange = (name: string) => {
    if (name === 'Process Files' || 
        name === 'Import Templates' || 
        name === 'Export Templates' || 
        name === 'Master Data') {
      setActiveSection(name);
    }
  };

  return (
    <div id="layout" className="flex min-h-screen bg-neutral-50">
      {/* Sidebar */}
      <SidebarMenu active={activeSection} onSelect={handleSectionChange} />

      <div id="main-content" className="flex-1 p-8">
        {showCssTest && (
          <div className="mb-6">
            <ExampleComponent />
            <button 
              onClick={() => setShowCssTest(false)}
              className="mt-4 px-3 py-1 bg-red-500 text-white rounded"
            >
              Hide Test Component
            </button>
          </div>
        )}

        {(() => {
          switch (activeSection) {
            case 'Process Files':
              return <ProcessFilesPage />
            case 'Import Templates':
              return <ImportTemplatesPage />
            case 'Export Templates':
              return <ExportTemplatesPage />
            case 'Master Data':
              return <MasterDataPage />
          }
        })()}
      </div>

      {/* Sticky Process & Export Bar */}
      {activeSection === 'Process Files' && (
        <div id="process-export-bar" className="fixed bottom-0 right-0 bg-white border-t border-neutral-200 shadow-lg" style={{left: '18rem'}}>
          <div className="p-6">
            <h3 className="text-xl mb-3">Export</h3>
            <div className="flex justify-between items-center">
              <div className="text-neutral-600">
                <p>3 files ready for processing</p>
                <p className="text-sm">Estimated processing time: 2 minutes</p>
              </div>
              <div className="flex gap-4 items-center">
                <div className="flex-1">
                  <input 
                    type="text" 
                    className="w-96 px-3 py-2 border border-neutral-200 rounded-lg" 
                    placeholder="/path/to/output" 
                    readOnly 
                  />
                  <button className="ml-2 px-4 py-2 bg-neutral-200 text-neutral-700 rounded-lg hover:bg-neutral-300">
                    Browse
                  </button>
                </div>
                <button className="px-6 py-2 bg-neutral-900 text-white rounded-lg hover:bg-neutral-800">
                  Process & Export
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
      
      {/* Debug Panel - only in development */}
      {process.env.NODE_ENV === 'development' && <TemplateDebugPanel />}
    </div>
  )
}

export default App 