import React from 'react'
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome'
import {
  faFileImport,
  faFileArrowDown,
  faFileExport,
  faGear,
} from '@fortawesome/free-solid-svg-icons'
import { IconDefinition } from '@fortawesome/fontawesome-svg-core'

interface NavItem {
  name: string;
  icon: IconDefinition;
}

interface SidebarMenuProps {
  active: string;
  onSelect: (name: string) => void;
}

const navItems: NavItem[] = [
  { name: 'Process Files',    icon: faFileImport },
  { name: 'Import Templates', icon: faFileArrowDown },
  { name: 'Export Templates', icon: faFileExport },
  { name: 'Settings',         icon: faGear },
]

const SidebarMenu: React.FC<SidebarMenuProps> = ({ active, onSelect }) => {
  return (
    <aside className="
      w-72                    /* 288px wide */
      sticky top-0            /* stick to viewport top */
      h-screen                /* full viewport height */
      overflow-y-auto         /* scroll if content overflows */
      bg-white
      border-r border-neutral-200
      px-6 py-6
    ">
      {/* App title */}
      <h1 className="text-2xl font-semibold mb-6">CSV Processor</h1>

      {/* Navigation */}
      <nav className="space-y-4">
        {navItems.map((item) => {
          const isActive = active === item.name
          return (
            <button
              key={item.name}
              onClick={() => onSelect(item.name)}
              className={`
                flex items-center w-full
                px-6 py-3
                rounded-lg
                transition-colors
                ${isActive
                  ? 'bg-neutral-100 text-neutral-900'
                  : 'text-neutral-600 hover:bg-neutral-50'}
              `}
            >
              {/* fixed-width icon container */}
              <div className="flex-shrink-0 w-6 flex justify-center">
                <FontAwesomeIcon icon={item.icon} className="text-xl" />
              </div>
              {/* consistent gap + label */}
              <span className="ml-4 text-base font-medium">
                {item.name}
              </span>
            </button>
          )
        })}
      </nav>
    </aside>
  )
}

export default SidebarMenu 