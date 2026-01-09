import React, { useState, useEffect } from 'react'
import SidebarMenu from './components/Layout/SidebarMenu'
import DashboardLayout from './components/Layout/DashboardLayout'
import ProcessFilesPage from './components/Process files/ProcessFilesPage'
import ImportTemplatesPage from './components/ImportTemplates/ImportTemplatesPage'
import ExportTemplatesPage from './components/ExportTemplates/ExportTemplatesPage'
import { SettingsPage } from './components/Settings'

type SectionType = 'Process Files' | 'Import Templates' | 'Export Templates' | 'Settings';

// Map page names to section types for navigation events
const PAGE_TO_SECTION: Record<string, SectionType> = {
  'settings': 'Settings',
  'import-templates': 'Import Templates',
  'export-templates': 'Export Templates',
  'process-files': 'Process Files'
};

const App: React.FC = () => {
  const [activeSection, setActiveSection] = useState<SectionType>('Process Files')

  // Handle sidebar navigation with type checking
  const handleSectionChange = (name: string) => {
    if (name === 'Process Files' ||
        name === 'Import Templates' ||
        name === 'Export Templates' ||
        name === 'Settings') {
      setActiveSection(name);
    }
  };

  // Listen for navigation events from child components
  useEffect(() => {
    const handleNavigate = (event: CustomEvent<{ page: string }>) => {
      const section = PAGE_TO_SECTION[event.detail.page];
      if (section) {
        setActiveSection(section);
      }
    };

    window.addEventListener('navigate', handleNavigate as EventListener);
    return () => {
      window.removeEventListener('navigate', handleNavigate as EventListener);
    };
  }, []);

  // Create sticky bar content
  const stickyBarContent = activeSection === 'Process Files' ? (
    <div className="px-4 py-2">
      <h3 className="text-lg font-semibold mb-2">Export</h3>
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
  ) : undefined

  return (
    <DashboardLayout
      sidebar={<SidebarMenu active={activeSection} onSelect={handleSectionChange} />}
      stickyBar={stickyBarContent}
    >
      {(() => {
        switch (activeSection) {
          case 'Process Files':
            return <ProcessFilesPage />
          case 'Import Templates':
            return <ImportTemplatesPage />
          case 'Export Templates':
            return <ExportTemplatesPage />
          case 'Settings':
            return <SettingsPage />
        }
      })()}
    </DashboardLayout>
  )
}

export default App 