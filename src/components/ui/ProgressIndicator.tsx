import React from 'react';
import { Check } from 'lucide-react';

interface Step {
  id: string;
  title: string;
  description?: string;
  optional?: boolean;
}

interface ProgressIndicatorProps {
  steps: Step[];
  currentStep: string;
  completedSteps: string[];
  className?: string;
}

const ProgressIndicator: React.FC<ProgressIndicatorProps> = ({
  steps,
  currentStep,
  completedSteps,
  className = ''
}) => {
  const currentStepIndex = steps.findIndex(step => step.id === currentStep);
  const totalSteps = steps.length;
  const progressPercentage = ((completedSteps.length) / totalSteps) * 100;

  const getStepStatus = (step: Step, index: number) => {
    if (completedSteps.includes(step.id)) return 'completed';
    if (step.id === currentStep) return 'current';
    if (index < currentStepIndex) return 'completed';
    return 'upcoming';
  };

  return (
    <div className={`progress-indicator ${className}`}>
      {/* Progress Bar */}
      <div className="progress-bar-container">
        <div className="progress-bar-track">
          <div 
            className="progress-bar-fill"
            style={{ width: `${progressPercentage}%` }}
          />
        </div>
        <div className="progress-percentage">
          {Math.round(progressPercentage)}% Complete
        </div>
      </div>

      {/* Steps */}
      <div className="progress-steps">
        {steps.map((step, index) => {
          const status = getStepStatus(step, index);
          
          return (
            <div key={step.id} className={`progress-step ${status}`}>
              <div className="progress-step-indicator">
                <div className="progress-step-circle">
                  {status === 'completed' ? (
                    <Check className="h-4 w-4" />
                  ) : (
                    <span className="progress-step-number">{index + 1}</span>
                  )}
                </div>
                {index < steps.length - 1 && (
                  <div className="progress-step-connector" />
                )}
              </div>
              
              <div className="progress-step-content">
                <div className="progress-step-title">
                  {step.title}
                  {step.optional && (
                    <span className="progress-step-optional">(Optional)</span>
                  )}
                </div>
                {step.description && (
                  <div className="progress-step-description">
                    {step.description}
                  </div>
                )}
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
};

export default ProgressIndicator;
