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
      <div className="w-72 min-w-72 flex-shrink-0">
        {sidebar}
      </div>

      {/* Main content area - flexible, can scroll horizontally if needed */}
      <div className="flex-1 p-8">
        {children}
      </div>

      {/* Sticky bar positioned relative to sidebar */}
      {stickyBar && (
        <div 
          className="fixed bottom-0 bg-white border-t border-neutral-200 shadow-lg p-6"
          style={{ left: '18rem', right: '0' }}
        >
          {stickyBar}
        </div>
      )}
    </div>
  )
}

export default DashboardLayout 