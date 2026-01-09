import type { FC } from 'react';
import AccountConfiguration from './AccountConfiguration';
import MasterDataSection from './MasterDataSection';
import { useToast, ToastContainer } from '../common/Toast';

const SettingsPage: FC = () => {
  const { toasts, removeToast, showSuccess, showError } = useToast();

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

      {/* Account Configuration Section */}
      <div className="bg-white rounded-lg shadow-sm p-6 mb-6">
        <AccountConfiguration
          onSuccess={showSuccess}
          onError={showError}
        />
      </div>

      {/* Master Data Section */}
      <div className="bg-white rounded-lg shadow-sm p-6">
        <MasterDataSection
          onSuccess={showSuccess}
          onError={showError}
        />
      </div>

      {/* Fixed-position Toast Notifications */}
      <ToastContainer toasts={toasts} onRemove={removeToast} />
    </div>
  );
};

export default SettingsPage;
