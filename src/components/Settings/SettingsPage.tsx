import { useState, useEffect } from 'react';
import type { FC } from 'react';
import AccountConfiguration from './AccountConfiguration';
import MasterDataSection from './MasterDataSection';

const SettingsPage: FC = () => {
  const [successMessage, setSuccessMessage] = useState<string>('');
  const [errorMessage, setErrorMessage] = useState<string>('');

  // Auto-clear messages after 5 seconds
  useEffect(() => {
    if (successMessage) {
      const timer = setTimeout(() => setSuccessMessage(''), 5000);
      return () => clearTimeout(timer);
    }
  }, [successMessage]);

  useEffect(() => {
    if (errorMessage) {
      const timer = setTimeout(() => setErrorMessage(''), 5000);
      return () => clearTimeout(timer);
    }
  }, [errorMessage]);

  const handleSuccess = (message: string) => {
    setSuccessMessage(message);
    setErrorMessage('');
  };

  const handleError = (message: string) => {
    setErrorMessage(message);
    setSuccessMessage('');
  };

  return (
    <div>
      {/* Header Section */}
      <div id="header" className="mb-8">
        <div className="flex justify-between items-center mb-4">
          <div>
            <h2 className="text-2xl font-semibold">Settings</h2>
            <p className="text-neutral-600">Configure accounts and manage your master data</p>
          </div>
        </div>
      </div>

      {/* Success Message */}
      {successMessage && (
        <div className="bg-green-50 border border-green-200 text-green-700 px-4 py-3 rounded-lg mb-4">
          {successMessage}
        </div>
      )}

      {/* Error Message */}
      {errorMessage && (
        <div className="bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded-lg mb-4">
          {errorMessage}
        </div>
      )}

      {/* Account Configuration Section */}
      <div className="bg-white rounded-lg shadow-sm p-6 mb-6">
        <AccountConfiguration
          onSuccess={handleSuccess}
          onError={handleError}
        />
      </div>

      {/* Master Data Section */}
      <div className="bg-white rounded-lg shadow-sm p-6">
        <MasterDataSection
          onSuccess={handleSuccess}
          onError={handleError}
        />
      </div>
    </div>
  );
};

export default SettingsPage;
