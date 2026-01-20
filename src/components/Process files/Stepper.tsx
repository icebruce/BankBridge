import React from 'react';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import { faCheck } from '@fortawesome/free-solid-svg-icons';

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
    <div className="flex items-center w-full">
      {steps.map((step, index) => {
        const stepNumber = index + 1;
        const isCompleted = stepNumber < currentStep;
        const isCurrent = stepNumber === currentStep;
        const isFuture = stepNumber > currentStep;
        const isClickable = isCompleted && onStepClick;

        return (
          <React.Fragment key={step.id}>
            {/* Step */}
            <div
              className={`flex flex-col items-center ${isClickable ? 'cursor-pointer group' : ''}`}
              onClick={() => handleStepClick(stepNumber)}
            >
              {/* Circle indicator */}
              <div
                className={`
                  w-9 h-9 rounded-full flex items-center justify-center
                  transition-all duration-300 border-2
                  ${isCompleted
                    ? 'bg-green-500 border-green-500 text-white'
                    : isCurrent
                      ? 'bg-neutral-900 border-neutral-900 text-white'
                      : 'bg-transparent border-neutral-300'
                  }
                  ${isClickable ? 'group-hover:bg-green-600 group-hover:border-green-600' : ''}
                `}
              >
                {isCompleted ? (
                  <FontAwesomeIcon icon={faCheck} className="text-sm" />
                ) : isCurrent ? (
                  <div className="w-2 h-2 bg-white rounded-full" />
                ) : (
                  <div className="w-2 h-2 bg-neutral-300 rounded-full" />
                )}
              </div>

              {/* Label Below */}
              <span
                className={`
                  mt-2.5 text-xs font-medium transition-colors duration-200 whitespace-nowrap
                  ${isCompleted ? 'text-green-600' : ''}
                  ${isCurrent ? 'text-neutral-900 font-semibold' : ''}
                  ${isFuture ? 'text-neutral-400' : ''}
                  ${isClickable ? 'group-hover:text-green-700' : ''}
                `}
              >
                {step.label}
              </span>
            </div>

            {/* Connector Line */}
            {index < steps.length - 1 && (
              <div className="flex-1 mx-4 -mt-5">
                <div
                  className={`
                    h-0.5 w-full transition-colors duration-300
                    ${stepNumber < currentStep ? 'bg-green-500' : 'bg-neutral-200'}
                  `}
                />
              </div>
            )}
          </React.Fragment>
        );
      })}
    </div>
  );
};

export default Stepper;
