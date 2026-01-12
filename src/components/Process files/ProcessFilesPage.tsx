// src/components/ProcessFiles/ProcessFilesPage.tsx
import React from 'react'
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome'
import {
  faCloudArrowUp,
  faTriangleExclamation,
  faXmark,
  faCopy,
  faFileArrowDown,
} from '@fortawesome/free-solid-svg-icons'
import { faFileLines } from '@fortawesome/free-regular-svg-icons'

const ProcessFilesPage: React.FC = () => {
  return (
    <div>
      {/* Header Section */}
      <div id="header" className="mb-8">
        <div className="flex justify-between items-center mb-4">
          <div>
            <h2 className="text-2xl font-semibold">Process Files</h2>
            <p className="text-neutral-600">Upload and process your CSV files</p>
          </div>
        </div>
      </div>

      {/* Upload Section */}
      <div id="upload-section" className="bg-white p-6 border border-neutral-200 rounded-lg shadow-sm mb-6">
        <div className="border-2 border-dashed border-neutral-300 rounded-lg p-8 text-center">
          <FontAwesomeIcon
            icon={faCloudArrowUp}
            className="text-4xl text-neutral-400 mb-4"
          />
          <p className="mb-4">Drag and drop your CSV file here, or</p>
          <button className="px-4 py-2 bg-neutral-100 text-neutral-700 rounded-lg hover:bg-neutral-200 hover:shadow-sm transition-all duration-200">
            Browse Files
          </button>
        </div>
      </div>

      {/* File Processing Configuration */}
      <div id="file-config" className="bg-white p-6 border border-neutral-200 rounded-lg shadow-sm mb-6">
        <div className="flex justify-between items-center mb-4">
          <div>
            <h3 className="text-lg font-semibold mb-2">Process Files (3 files ready)</h3>
            <div className="text-neutral-600 text-sm">
              <p>3 files ready for processing</p>
              <p>Estimated processing time: 2 minutes</p>
            </div>
          </div>
          <button className="px-6 py-2 bg-neutral-900 text-white rounded-lg hover:bg-neutral-800 hover:shadow-sm transition-all duration-200">
            Process Files
          </button>
        </div>

        <div className="flex items-center text-sm text-amber-600 mb-4">
          <FontAwesomeIcon icon={faTriangleExclamation} className="mr-2 text-amber-500" />
          <span>Warning: 2 duplicate files detected</span>
        </div>

        <div className="max-h-[400px] overflow-y-auto space-y-6">
          {/* File 1 */}
          <div className="bg-white border border-neutral-200 rounded-lg p-4">
            <div className="flex items-center justify-between mb-4">
              <div className="flex items-center">
                <FontAwesomeIcon
                  icon={faFileLines}
                  className="mr-3 text-neutral-400"
                />
                <span>sales_data.csv</span>
              </div>
              <button className="text-neutral-400 hover:text-neutral-600">
                <FontAwesomeIcon icon={faXmark} />
              </button>
            </div>
            <div className="grid grid-cols-2 gap-4 mb-4">
              <div>
                <label className="block text-sm font-semibold text-neutral-600 mb-1">Account</label>
                <select className="w-full px-3 py-2 border border-neutral-200 rounded-lg electronInput focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-colors">
                  <option>Select Account</option>
                  <option>Account 1</option>
                  <option>Account 2</option>
                </select>
              </div>
              <div>
                <label className="block text-sm font-semibold text-neutral-600 mb-1">File Type</label>
                <select className="w-full px-3 py-2 border border-neutral-200 rounded-lg electronInput focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-colors">
                  <option>Select Type</option>
                  <option>Sales Data</option>
                  <option>Customer Data</option>
                </select>
              </div>
            </div>
            <div className="bg-neutral-50 p-3 rounded-lg mb-4">
              <div className="flex justify-between mb-2">
                <span className="text-sm">Processing Status</span>
                <span className="text-sm">Records: 1,234</span>
              </div>
              <div className="h-2 bg-neutral-200 rounded-full">
                <div className="h-2 bg-neutral-700 rounded-full w-3/4" />
              </div>
            </div>
            <div className="space-y-2">
              <div className="flex items-center text-sm text-amber-600">
                <FontAwesomeIcon icon={faTriangleExclamation} className="mr-2 text-amber-500" />
                <span>3 parsing errors found</span>
                <button className="ml-2 underline hover:text-amber-700 transition-colors duration-200">View</button>
              </div>
              <div className="flex items-center text-sm text-neutral-600">
                <FontAwesomeIcon icon={faCopy} className="mr-2" />
                <span>5 duplicate records found</span>
                <button className="ml-2 underline">Review</button>
              </div>
            </div>
          </div>

          {/* File 2 */}
          <div className="bg-white border border-neutral-200 rounded-lg p-4">
            <div className="flex items-center justify-between mb-4">
              <div className="flex items-center">
                <FontAwesomeIcon
                  icon={faFileLines}
                  className="mr-3 text-neutral-400"
                />
                <span>q1_transactions.csv</span>
              </div>
              <button className="text-neutral-400 hover:text-neutral-600">
                <FontAwesomeIcon icon={faXmark} />
              </button>
            </div>
            <div className="grid grid-cols-2 gap-4 mb-4">
              <div>
                <label className="block text-sm font-semibold text-neutral-600 mb-1">Account</label>
                <select className="w-full px-3 py-2 border border-neutral-200 rounded-lg electronInput focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-colors">
                  <option>Account 2</option>
                </select>
              </div>
              <div>
                <label className="block text-sm font-semibold text-neutral-600 mb-1">File Type</label>
                <select className="w-full px-3 py-2 border border-neutral-200 rounded-lg electronInput focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-colors">
                  <option>Sales Data</option>
                </select>
              </div>
            </div>
            <div className="bg-neutral-50 p-3 rounded-lg mb-4">
              <div className="flex justify-between mb-2">
                <span className="text-sm">Processing Status</span>
                <span className="text-sm">Records: 2,456</span>
              </div>
              <div className="h-2 bg-neutral-200 rounded-full">
                <div className="h-2 bg-neutral-700 rounded-full w-1/2" />
              </div>
            </div>
            <div className="space-y-2">
              <div className="flex items-center text-sm text-amber-600">
                <FontAwesomeIcon icon={faTriangleExclamation} className="mr-2 text-amber-500" />
                <span>2 parsing errors found</span>
                <button className="ml-2 underline hover:text-amber-700 transition-colors duration-200">View</button>
              </div>
              <div className="flex items-center text-sm text-neutral-600">
                <FontAwesomeIcon icon={faCopy} className="mr-2" />
                <span>3 duplicate records found</span>
                <button className="ml-2 underline">Review</button>
              </div>
            </div>
          </div>

          {/* File 3 */}
          <div className="bg-white border border-neutral-200 rounded-lg p-4">
            <div className="flex items-center justify-between mb-4">
              <div className="flex items-center">
                <FontAwesomeIcon
                  icon={faFileLines}
                  className="mr-3 text-neutral-400"
                />
                <span>q2_sales.csv</span>
              </div>
              <button className="text-neutral-400 hover:text-neutral-600">
                <FontAwesomeIcon icon={faXmark} />
              </button>
            </div>
            <div className="grid grid-cols-2 gap-4 mb-4">
              <div>
                <label className="block text-sm font-semibold text-neutral-600 mb-1">Account</label>
                <select className="w-full px-3 py-2 border border-neutral-200 rounded-lg electronInput focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-colors">
                  <option>Account 1</option>
                </select>
              </div>
              <div>
                <label className="block text-sm font-semibold text-neutral-600 mb-1">File Type</label>
                <select className="w-full px-3 py-2 border border-neutral-200 rounded-lg electronInput focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-colors">
                  <option>Sales Data</option>
                </select>
              </div>
            </div>
            <div className="bg-neutral-50 p-3 rounded-lg mb-4">
              <div className="flex justify-between mb-2">
                <span className="text-sm">Processing Status</span>
                <span className="text-sm">Records: 1,890</span>
              </div>
              <div className="h-2 bg-neutral-200 rounded-full">
                <div className="h-2 bg-neutral-700 rounded-full w-1/3" />
              </div>
            </div>
            <div className="space-y-2">
              <div className="flex items-center text-sm text-amber-600">
                <FontAwesomeIcon icon={faTriangleExclamation} className="mr-2 text-amber-500" />
                <span>1 parsing error found</span>
                <button className="ml-2 underline hover:text-amber-700 transition-colors duration-200">View</button>
              </div>
              <div className="flex items-center text-sm text-neutral-600">
                <FontAwesomeIcon icon={faCopy} className="mr-2" />
                <span>0 duplicate records found</span>
                <button className="ml-2 underline">Review</button>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Processing Summary Section */}
      <div id="processing-summary" className="bg-white p-6 border border-neutral-200 rounded-lg shadow-sm mb-6">
        <h3 className="text-lg font-semibold mb-4">Processing Summary</h3>
        
        {/* Account 1 */}
        <div className="bg-white border border-neutral-200 rounded-lg p-4 mb-4">
          <h4 className="text-base font-medium mb-4">Account 1</h4>
          <div className="grid grid-cols-2 gap-4">
            <div>
              <h5 className="font-medium mb-2">Original Files</h5>
              <div className="space-y-1">
                <div className="flex justify-between">
                  <span className="text-neutral-600">Total Records:</span>
                  <span>3,690</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-neutral-600">Total Amount:</span>
                  <span>$234,567.00</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-neutral-600">Date Range:</span>
                  <span>Jan 1 - Mar 31, 2025</span>
                </div>
              </div>
            </div>
            
            <div>
              <h5 className="font-medium mb-2">Processed Files</h5>
              <div className="space-y-1">
                <div className="flex justify-between">
                  <span className="text-neutral-600">Total Records:</span>
                  <span>3,682 <span className="text-green-600">(-8)</span></span>
                </div>
                <div className="flex justify-between">
                  <span className="text-neutral-600">Total Amount:</span>
                  <span>$234,123.00 <span className="text-green-600">(-$444)</span></span>
                </div>
                <div className="flex justify-between">
                  <span className="text-neutral-600">Date Range:</span>
                  <span>Jan 1 - Mar 31, 2025</span>
                </div>
              </div>
            </div>
          </div>
        </div>
        
        {/* Account 2 */}
        <div className="bg-white border border-neutral-200 rounded-lg p-4">
          <h4 className="text-base font-medium mb-4">Account 2</h4>
          <div className="grid grid-cols-2 gap-4">
            <div>
              <h5 className="font-medium mb-2">Original Files</h5>
              <div className="space-y-1">
                <div className="flex justify-between">
                  <span className="text-neutral-600">Total Records:</span>
                  <span>2,345</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-neutral-600">Total Amount:</span>
                  <span>$123,456.00</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-neutral-600">Date Range:</span>
                  <span>Apr 1 - Jun 30, 2025</span>
                </div>
              </div>
            </div>
            
            <div>
              <h5 className="font-medium mb-2">Processed Files</h5>
              <div className="space-y-1">
                <div className="flex justify-between">
                  <span className="text-neutral-600">Total Records:</span>
                  <span>2,337 <span className="text-green-600">(-8)</span></span>
                </div>
                <div className="flex justify-between">
                  <span className="text-neutral-600">Total Amount:</span>
                  <span>$122,912.00 <span className="text-green-600">(-$544)</span></span>
                </div>
                <div className="flex justify-between">
                  <span className="text-neutral-600">Date Range:</span>
                  <span>Apr 1 - Jun 30, 2025</span>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Recent Files Section */}
      <div id="recent-files" className="bg-white p-6 border border-neutral-200 rounded-lg shadow-sm mb-6">
        <h3 className="text-lg font-semibold mb-4">Recent Files</h3>
        <div className="flex items-center justify-between bg-white border border-neutral-200 rounded-lg p-4 mb-2">
          <div>
            <div className="font-medium">march_sales.csv</div>
            <div className="text-sm text-neutral-600">Processed on Apr 26, 2025</div>
          </div>
          <button className="text-neutral-400 hover:text-neutral-600">
            <FontAwesomeIcon icon={faFileArrowDown} />
          </button>
        </div>
      </div>

      {/* Add padding at the bottom to prevent content from being hidden behind the sticky Export section */}
      <div className="h-[42px]"></div>
    </div>
  )
}

export default ProcessFilesPage
