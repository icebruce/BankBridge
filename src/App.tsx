import React, { useState, useEffect, useCallback } from 'react'
import SidebarMenu from './components/Layout/SidebarMenu'
import DashboardLayout from './components/Layout/DashboardLayout'
import ProcessFilesPage from './components/Process files/ProcessFilesPage'
import ImportTemplatesPage from './components/ImportTemplates/ImportTemplatesPage'
import ExportTemplatesPage from './components/ExportTemplates/ExportTemplatesPage'
import { SettingsPage } from './components/Settings'
import ConfirmDialog from './components/common/ConfirmDialog'

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
  const [hasProcessFilesWork, setHasProcessFilesWork] = useState(false)
  const [showExitWarning, setShowExitWarning] = useState(false)
  const [pendingSection, setPendingSection] = useState<SectionType | null>(null)

  // Handle sidebar navigation with type checking and exit warning
  const handleSectionChange = useCallback((name: string) => {
    if (name === 'Process Files' ||
        name === 'Import Templates' ||
        name === 'Export Templates' ||
        name === 'Settings') {
      // If navigating away from Process Files with work in progress, show warning
      if (activeSection === 'Process Files' && name !== 'Process Files' && hasProcessFilesWork) {
        setPendingSection(name)
        setShowExitWarning(true)
        return
      }
      setActiveSection(name);
    }
  }, [activeSection, hasProcessFilesWork]);

  // Listen for navigation events from child components
  useEffect(() => {
    const handleNavigate = (event: CustomEvent<{ page: string }>) => {
      const section = PAGE_TO_SECTION[event.detail.page];
      if (section) {
        // If navigating away from Process Files with work, show warning
        if (activeSection === 'Process Files' && section !== 'Process Files' && hasProcessFilesWork) {
          setPendingSection(section)
          setShowExitWarning(true)
          return
        }
        setActiveSection(section);
      }
    };

    window.addEventListener('navigate', handleNavigate as EventListener);
    return () => {
      window.removeEventListener('navigate', handleNavigate as EventListener);
    };
  }, [activeSection, hasProcessFilesWork]);

  // Listen for work status updates from ProcessFilesPage
  useEffect(() => {
    const handleWorkStatus = (event: CustomEvent<{ hasWork: boolean }>) => {
      setHasProcessFilesWork(event.detail.hasWork)
    };

    window.addEventListener('process-files-work-status', handleWorkStatus as EventListener);
    return () => {
      window.removeEventListener('process-files-work-status', handleWorkStatus as EventListener);
    };
  }, []);

  const handleConfirmLeave = () => {
    setShowExitWarning(false)
    if (pendingSection) {
      setActiveSection(pendingSection)
      setPendingSection(null)
    }
  }

  const handleCancelLeave = () => {
    setShowExitWarning(false)
    setPendingSection(null)
  }

  return (
    <>
      <DashboardLayout
        sidebar={<SidebarMenu active={activeSection} onSelect={handleSectionChange} />}
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

      {/* Exit warning when navigating away from Process Files with work */}
      <ConfirmDialog
        isOpen={showExitWarning}
        title="Leave this page?"
        message="You have files in progress. If you leave now, you'll lose your work and need to start over."
        confirmLabel="Leave"
        cancelLabel="Stay"
        variant="warning"
        onConfirm={handleConfirmLeave}
        onCancel={handleCancelLeave}
      />
    </>
  )
}

export default App 