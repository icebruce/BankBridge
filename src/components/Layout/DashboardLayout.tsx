import React from 'react'

interface DashboardLayoutProps {
  sidebar: React.ReactNode
  children: React.ReactNode
  stickyBar?: React.ReactNode
}

const DashboardLayout: React.FC<DashboardLayoutProps> = ({ 
  sidebar, 
  children, 
  stickyBar 
}) => {
  return (
    <div className="flex min-h-screen bg-neutral-50">
      {/* Sidebar - fixed width, never shrinks */}
      <div className="w-60 min-w-56 flex-shrink-0">
        {sidebar}
      </div>

      {/* Main content area - flexible, can scroll horizontally if needed */}
      <div className="flex-1 min-w-0 overflow-x-auto">
        {/* Content wrapper with max-width and centering */}
        <div className="max-w-7xl mx-auto p-8">
          {children}
        </div>
      </div>

      {/* Sticky bar positioned relative to sidebar */}
      {stickyBar && (
        <div 
          className="fixed bottom-0 bg-white border-t border-neutral-200 shadow-lg"
          style={{ left: '15rem', right: '0' }}
        >
          <div className="max-w-7xl mx-auto px-6">
            {stickyBar}
          </div>
        </div>
      )}
    </div>
  )
}

export default DashboardLayout 