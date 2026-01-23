import React from 'react';

interface StepDefinition {
  id: string;
  label: string;
}

interface StepperProps {
  steps: StepDefinition[];
  currentStep: number;
  onStepClick?: (step: number) => void;
}

const Stepper: React.FC<StepperProps> = ({ steps, currentStep, onStepClick }) => {
  const handleStepClick = (stepIndex: number) => {
    // Only allow clicking on completed steps
    if (stepIndex < currentStep && onStepClick) {
      onStepClick(stepIndex);
    }
  };

  return (
    <div className="flex w-full gap-4">
      {steps.map((step, index) => {
        const stepNumber = index + 1;
        const isCompleted = stepNumber < currentStep;
        const isCurrent = stepNumber === currentStep;
        const isFuture = stepNumber > currentStep;
        const isClickable = isCompleted && onStepClick;

        return (
          <div
            key={step.id}
            className={`flex-1 ${isClickable ? 'cursor-pointer group' : ''}`}
            onClick={() => handleStepClick(stepNumber)}
          >
            {/* Progress bar segment */}
            <div
              className={`
                h-2 w-full rounded-full transition-all duration-300
                ${isCompleted
                  ? 'bg-neutral-800 group-hover:bg-neutral-600'
                  : isCurrent
                    ? 'bg-blue-500'
                    : 'bg-neutral-200'
                }
              `}
            />

            {/* Label below */}
            <div className="mt-3 flex items-center gap-2">
              {isCurrent && (
                <span className="inline-flex items-center justify-center w-5 h-5 text-xs font-semibold rounded-full bg-blue-100 text-blue-600">
                  {stepNumber}
                </span>
              )}
              {isCompleted && (
                <svg
                  className="w-4 h-4 text-neutral-600 group-hover:text-neutral-500"
                  fill="currentColor"
                  viewBox="0 0 20 20"
                >
                  <path
                    fillRule="evenodd"
                    d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z"
                    clipRule="evenodd"
                  />
                </svg>
              )}
              {isFuture && (
                <span className="inline-flex items-center justify-center w-5 h-5 text-xs font-medium rounded-full bg-neutral-100 text-neutral-400">
                  {stepNumber}
                </span>
              )}
              <span
                className={`
                  text-sm font-medium transition-colors duration-200
                  ${isCompleted
                    ? 'text-neutral-800 group-hover:text-neutral-600'
                    : isCurrent
                      ? 'text-blue-600'
                      : 'text-neutral-400'
                  }
                `}
              >
                {step.label}
              </span>
            </div>
          </div>
        );
      })}
    </div>
  );
};

export default Stepper;
