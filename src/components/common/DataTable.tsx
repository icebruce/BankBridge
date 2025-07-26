import type { ReactNode } from 'react';

export interface DataTableColumn<T = any> {
  key: string;
  header: string;
  width?: string;
  render?: (value: any, row: T, index: number) => ReactNode;
  className?: string;
  headerClassName?: string;
}

export interface DataTableProps<T = any> {
  columns: DataTableColumn<T>[];
  data: T[];
  loading?: boolean;
  emptyMessage?: string;
  emptyIcon?: ReactNode;
  className?: string;
  tableClassName?: string;
  headerClassName?: string;
  rowClassName?: string | ((row: T, index: number) => string);
  onRowClick?: (row: T, index: number) => void;
  zebra?: boolean;
  hover?: boolean;
  bordered?: boolean;
  containerBordered?: boolean;
  compact?: boolean;
  stickyHeader?: boolean;
  minWidth?: string;
  maxHeight?: string;
  title?: string;
  headerActions?: ReactNode;
  footer?: ReactNode;
  darkMode?: boolean;
}

const DataTable = <T extends Record<string, any>>({
  columns,
  data,
  loading = false,
  emptyMessage = "No data available",
  emptyIcon,
  className = "",
  tableClassName = "",
  headerClassName = "",
  rowClassName = "",
  onRowClick,
  zebra = false,
  hover = true,
  bordered = true,
  containerBordered = true,
  compact = false,
  stickyHeader = false,
  minWidth = "800px",
  maxHeight,
  title,
  headerActions,
  footer,
  darkMode = false
}: DataTableProps<T>): JSX.Element => {
  
  const getRowClassName = (row: T, index: number): string => {
    let baseClasses = darkMode ? "bg-neutral-800" : "bg-white";
    
    if (zebra && index % 2 === 1) {
      baseClasses += darkMode ? " bg-neutral-700/50" : " bg-neutral-50/30";
    }
    
    if (hover) {
      baseClasses += darkMode 
        ? " hover:bg-neutral-700/70 transition-colors duration-150"
        : " hover:bg-neutral-50/50 transition-colors duration-150";
    }
    
    if (onRowClick) {
      baseClasses += " cursor-pointer";
    }
    
    if (typeof rowClassName === 'function') {
      baseClasses += ` ${rowClassName(row, index)}`;
    } else if (rowClassName) {
      baseClasses += ` ${rowClassName}`;
    }
    
    return baseClasses;
  };

  const tableContainerClasses = [
    "overflow-x-auto",
    maxHeight && "overflow-y-auto",
    maxHeight && `max-h-[${maxHeight}]`,
    className
  ].filter(Boolean).join(" ");

  const tableClasses = [
    "w-full",
    minWidth ? `min-w-[${minWidth}]` : "min-w-full",
    "table-auto", // Changed from table-fixed to table-auto for better responsive behavior
    tableClassName
  ].filter(Boolean).join(" ");

  const headerClasses = [
    darkMode ? "bg-neutral-700" : "bg-neutral-50",
    bordered && (darkMode ? "border-b border-neutral-600" : "border-b border-neutral-200"),
    stickyHeader && "sticky top-0 z-10",
    headerClassName
  ].filter(Boolean).join(" ");

  const cellPadding = compact ? "px-3 py-2" : "px-4 py-3";
  const headerCellPadding = compact ? "px-3 py-2" : "px-4 py-3";

  const containerBorderClasses = containerBordered 
    ? (darkMode 
        ? 'bg-neutral-800 rounded-lg shadow-sm border border-neutral-600 overflow-hidden' 
        : 'bg-white rounded-lg shadow-sm border border-neutral-200 overflow-hidden')
    : (darkMode 
        ? 'bg-neutral-800 rounded-lg border border-neutral-600 overflow-hidden' 
        : 'bg-white rounded-lg border border-neutral-200 overflow-hidden');

  const titleSectionClasses = darkMode
    ? "px-4 py-4 border-b border-neutral-600 bg-neutral-700 flex justify-between items-center"
    : "px-4 py-4 border-b border-neutral-200 bg-neutral-50 flex justify-between items-center";

  const titleTextClasses = darkMode ? "text-lg font-semibold text-neutral-100" : "text-lg font-semibold text-neutral-900";
  const loadingTextClasses = darkMode ? "text-neutral-400" : "text-neutral-500";
  const emptyTextClasses = darkMode ? "text-neutral-400" : "text-neutral-500";
  const headerTextClasses = darkMode ? "text-neutral-300" : "text-neutral-600";
  const footerClasses = darkMode 
    ? "p-4 border-t border-neutral-600 bg-neutral-800"
    : "p-4 border-t border-neutral-200 bg-white";

  if (loading) {
    return (
      <div className={containerBorderClasses}>
        {(title || headerActions) && (
          <div className={titleSectionClasses}>
            {title && <h3 className={titleTextClasses}>{title}</h3>}
            {headerActions && <div>{headerActions}</div>}
          </div>
        )}
        <div className="p-8 text-center">
          <div className={loadingTextClasses}>Loading...</div>
        </div>
      </div>
    );
  }

  return (
    <div className={containerBorderClasses}>
      {(title || headerActions) && (
        <div className={titleSectionClasses}>
          {title && <h3 className={titleTextClasses}>{title}</h3>}
          {headerActions && <div>{headerActions}</div>}
        </div>
      )}
      
      <div className={tableContainerClasses}>
        <table className={tableClasses}>
          {/* Column definitions for responsive layout */}
          <colgroup>
            {columns.map((column) => (
              <col 
                key={column.key} 
                style={column.width ? { width: column.width, minWidth: column.width } : {}}
              />
            ))}
          </colgroup>
          
          <thead>
            <tr className={headerClasses}>
              {columns.map((column) => (
                <th
                  key={column.key}
                  className={`
                    ${headerCellPadding} 
                    text-left text-sm font-semibold ${headerTextClasses}
                    ${darkMode ? 'bg-neutral-700' : 'bg-neutral-50'}
                    ${bordered ? (darkMode ? 'border-b border-neutral-600' : 'border-b border-neutral-200') : ''}
                    ${column.headerClassName || ''}
                  `}
                >
                  {column.header}
                </th>
              ))}
            </tr>
          </thead>
          
          <tbody className={`${bordered ? (darkMode ? 'divide-y divide-neutral-600' : 'divide-y divide-neutral-200') : ''} ${darkMode ? 'bg-neutral-800' : 'bg-white'}`}>
            {data.length === 0 ? (
              <tr>
                <td colSpan={columns.length} className={`${cellPadding} text-center ${emptyTextClasses}`}>
                  <div className="flex flex-col items-center py-4">
                    {emptyIcon && <div className={`text-2xl ${darkMode ? 'text-neutral-500' : 'text-neutral-400'} mb-2`}>{emptyIcon}</div>}
                    <p>{emptyMessage}</p>
                  </div>
                </td>
              </tr>
            ) : (
              data.map((row, index) => (
                <tr
                  key={row.id || index}
                  className={getRowClassName(row, index)}
                  onClick={onRowClick ? () => onRowClick(row, index) : undefined}
                >
                  {columns.map((column) => (
                    <td
                      key={column.key}
                      className={`
                        ${cellPadding} 
                        text-sm 
                        ${darkMode ? 'text-neutral-200' : 'text-neutral-900'}
                        ${column.className || ''}
                      `}
                    >
                      {column.render 
                        ? column.render(row[column.key], row, index)
                        : row[column.key]
                      }
                    </td>
                  ))}
                </tr>
              ))
            )}
          </tbody>
        </table>
      </div>
      
      {footer && (
        <div className={footerClasses}>
          {footer}
        </div>
      )}
    </div>
  );
};

export default DataTable;

// Utility configurations for common table styles
export const DataTablePresets = {
  // Standard table (no container borders - for use inside white containers)
  standard: {
    hover: true,
    bordered: true,
    zebra: false,
    compact: false,
    containerBordered: false
  },
  
  // Standalone table with container borders
  standalone: {
    hover: true,
    bordered: true,
    zebra: false,
    compact: false,
    containerBordered: true
  },
  
  // Table inside a white container (no container borders) - DEPRECATED: use standard
  inContainer: {
    hover: true,
    bordered: true,
    zebra: false,
    compact: false,
    containerBordered: false
  },
  
  // Compact table for dense data
  compact: {
    hover: true,
    bordered: true,
    zebra: true,
    compact: true
  },
  
  // Simple table without borders
  simple: {
    hover: true,
    bordered: false,
    zebra: true,
    compact: false
  },
  
  // Minimal table
  minimal: {
    hover: false,
    bordered: false,
    zebra: false,
    compact: true
  }
}; 