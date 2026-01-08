import { useState } from 'react';
import type { FC } from 'react';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import { faDatabase, faFileImport, faArrowRight } from '@fortawesome/free-solid-svg-icons';

interface InitialSetupWizardProps {
  onStartFresh: () => Promise<void>;
  onImportExisting: () => void;
}

type SetupOption = 'fresh' | 'import' | null;

const InitialSetupWizard: FC<InitialSetupWizardProps> = ({
  onStartFresh,
  onImportExisting
}) => {
  const [selectedOption, setSelectedOption] = useState<SetupOption>(null);
  const [isProcessing, setIsProcessing] = useState(false);

  const handleContinue = async () => {
    if (!selectedOption) return;

    setIsProcessing(true);
    try {
      if (selectedOption === 'fresh') {
        await onStartFresh();
      } else {
        onImportExisting();
      }
    } finally {
      setIsProcessing(false);
    }
  };

  return (
    <div className="py-8 px-6">
      {/* Header */}
      <div className="text-center mb-8">
        <div className="inline-flex items-center justify-center w-16 h-16 bg-blue-50 rounded-full mb-4">
          <FontAwesomeIcon icon={faDatabase} className="w-8 h-8 text-blue-500" />
        </div>
        <h3 className="text-xl font-semibold text-neutral-900 mb-2">
          Welcome to Master Data
        </h3>
        <p className="text-neutral-600">
          No master data file found. How would you like to get started?
        </p>
      </div>

      {/* Options */}
      <div className="max-w-md mx-auto space-y-3 mb-8">
        {/* Start Fresh Option */}
        <button
          className={`w-full p-4 rounded-lg border-2 text-left transition-all ${
            selectedOption === 'fresh'
              ? 'border-blue-500 bg-blue-50'
              : 'border-neutral-200 hover:border-neutral-300 bg-white'
          }`}
          onClick={() => setSelectedOption('fresh')}
        >
          <div className="flex items-start gap-3">
            <div className={`mt-0.5 w-5 h-5 rounded-full border-2 flex items-center justify-center flex-shrink-0 ${
              selectedOption === 'fresh'
                ? 'border-blue-500'
                : 'border-neutral-300'
            }`}>
              {selectedOption === 'fresh' && (
                <div className="w-2.5 h-2.5 rounded-full bg-blue-500" />
              )}
            </div>
            <div>
              <div className="font-medium text-neutral-900">Start Fresh</div>
              <div className="text-sm text-neutral-500 mt-0.5">
                Begin with an empty master data file
              </div>
            </div>
          </div>
        </button>

        {/* Import Existing Option */}
        <button
          className={`w-full p-4 rounded-lg border-2 text-left transition-all ${
            selectedOption === 'import'
              ? 'border-blue-500 bg-blue-50'
              : 'border-neutral-200 hover:border-neutral-300 bg-white'
          }`}
          onClick={() => setSelectedOption('import')}
        >
          <div className="flex items-start gap-3">
            <div className={`mt-0.5 w-5 h-5 rounded-full border-2 flex items-center justify-center flex-shrink-0 ${
              selectedOption === 'import'
                ? 'border-blue-500'
                : 'border-neutral-300'
            }`}>
              {selectedOption === 'import' && (
                <div className="w-2.5 h-2.5 rounded-full bg-blue-500" />
              )}
            </div>
            <div>
              <div className="font-medium text-neutral-900 flex items-center gap-2">
                <FontAwesomeIcon icon={faFileImport} className="w-4 h-4 text-neutral-400" />
                Import Existing Data
              </div>
              <div className="text-sm text-neutral-500 mt-0.5">
                Import transactions from a CSV or Excel file
              </div>
            </div>
          </div>
        </button>
      </div>

      {/* Continue Button */}
      <div className="text-center">
        <button
          className={`px-6 py-2.5 rounded-lg font-medium transition-colors flex items-center gap-2 mx-auto ${
            selectedOption
              ? 'bg-neutral-900 text-white hover:bg-neutral-800'
              : 'bg-neutral-200 text-neutral-400 cursor-not-allowed'
          }`}
          onClick={handleContinue}
          disabled={!selectedOption || isProcessing}
        >
          {isProcessing ? (
            <>
              <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" />
              Processing...
            </>
          ) : (
            <>
              Continue
              <FontAwesomeIcon icon={faArrowRight} className="w-4 h-4" />
            </>
          )}
        </button>
      </div>
    </div>
  );
};

export default InitialSetupWizard;
