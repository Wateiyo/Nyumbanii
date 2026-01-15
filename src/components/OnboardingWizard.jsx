import React, { useState, useEffect } from 'react';
import { X, ChevronRight, ChevronLeft, Check } from 'lucide-react';

const OnboardingWizard = ({ steps, onComplete, onSkip, userRole }) => {
  const [currentStep, setCurrentStep] = useState(0);
  const [isVisible, setIsVisible] = useState(true);

  const handleNext = () => {
    if (currentStep < steps.length - 1) {
      setCurrentStep(currentStep + 1);
    } else {
      handleComplete();
    }
  };

  const handlePrevious = () => {
    if (currentStep > 0) {
      setCurrentStep(currentStep - 1);
    }
  };

  const handleComplete = () => {
    setIsVisible(false);
    onComplete();
  };

  const handleSkipTour = () => {
    setIsVisible(false);
    onSkip();
  };

  if (!isVisible || steps.length === 0) {
    return null;
  }

  const currentStepData = steps[currentStep];
  const progress = ((currentStep + 1) / steps.length) * 100;
  const isLastStep = currentStep === steps.length - 1;

  return (
    <>
      {/* Backdrop Overlay */}
      <div className="fixed inset-0 bg-black bg-opacity-60 z-50 transition-opacity duration-300" />

      {/* Wizard Modal */}
      <div className="fixed inset-0 z-[60] flex items-center justify-center p-4 pointer-events-none">
        <div className="bg-white dark:bg-gray-800 rounded-2xl shadow-2xl max-w-2xl w-full pointer-events-auto transform transition-all duration-300 scale-100">
          {/* Header */}
          <div className="relative p-6 border-b border-gray-200 dark:border-gray-700">
            <button
              onClick={handleSkipTour}
              className="absolute top-4 right-4 text-gray-400 hover:text-gray-600 dark:hover:text-gray-300 transition-colors"
              aria-label="Skip tour"
            >
              <X className="w-6 h-6" />
            </button>

            <div className="pr-8">
              <h2 className="text-2xl font-bold text-gray-900 dark:text-white mb-2">
                Welcome to Your {userRole} Dashboard!
              </h2>
              <p className="text-sm text-gray-600 dark:text-gray-400">
                Step {currentStep + 1} of {steps.length}
              </p>
            </div>

            {/* Progress Bar */}
            <div className="mt-4 bg-gray-200 dark:bg-gray-700 rounded-full h-2 overflow-hidden">
              <div
                className="bg-gradient-to-r from-blue-500 to-blue-600 h-full rounded-full transition-all duration-500 ease-out"
                style={{ width: `${progress}%` }}
              />
            </div>
          </div>

          {/* Content */}
          <div className="p-6 space-y-4">
            {/* Step Icon */}
            <div className="flex items-center justify-center mb-4">
              <div className="w-16 h-16 bg-gradient-to-br from-blue-500 to-blue-600 rounded-full flex items-center justify-center text-white">
                {currentStepData.icon}
              </div>
            </div>

            {/* Step Title */}
            <h3 className="text-xl font-bold text-gray-900 dark:text-white text-center">
              {currentStepData.title}
            </h3>

            {/* Step Description */}
            <p className="text-gray-600 dark:text-gray-300 text-center leading-relaxed">
              {currentStepData.description}
            </p>

            {/* Key Features List */}
            {currentStepData.features && currentStepData.features.length > 0 && (
              <div className="bg-blue-50 dark:bg-gray-700/50 rounded-xl p-4 space-y-3 mt-4">
                <p className="font-semibold text-gray-900 dark:text-white text-sm mb-3">
                  Key Features:
                </p>
                <ul className="space-y-2">
                  {currentStepData.features.map((feature, index) => (
                    <li key={index} className="flex items-start gap-2 text-sm">
                      <Check className="w-4 h-4 text-blue-600 dark:text-blue-400 flex-shrink-0 mt-0.5" />
                      <span className="text-gray-700 dark:text-gray-300">{feature}</span>
                    </li>
                  ))}
                </ul>
              </div>
            )}

            {/* Tips */}
            {currentStepData.tip && (
              <div className="bg-yellow-50 dark:bg-yellow-900/20 border-l-4 border-yellow-400 p-4 rounded-r-lg">
                <p className="text-sm text-yellow-800 dark:text-yellow-200">
                  <span className="font-semibold">💡 Pro Tip:</span> {currentStepData.tip}
                </p>
              </div>
            )}
          </div>

          {/* Footer - Navigation */}
          <div className="p-6 border-t border-gray-200 dark:border-gray-700 flex items-center justify-between">
            <button
              onClick={handleSkipTour}
              className="text-gray-500 hover:text-gray-700 dark:text-gray-400 dark:hover:text-gray-200 font-medium text-sm transition-colors"
            >
              Skip Tour
            </button>

            <div className="flex items-center gap-3">
              {currentStep > 0 && (
                <button
                  onClick={handlePrevious}
                  className="flex items-center gap-2 px-4 py-2 rounded-lg border border-gray-300 dark:border-gray-600 text-gray-700 dark:text-gray-300 hover:bg-gray-50 dark:hover:bg-gray-700 transition-colors"
                >
                  <ChevronLeft className="w-4 h-4" />
                  Previous
                </button>
              )}

              <button
                onClick={handleNext}
                className="flex items-center gap-2 px-6 py-2 rounded-lg bg-gradient-to-r from-blue-500 to-blue-600 text-white hover:from-blue-600 hover:to-blue-700 transition-all shadow-md hover:shadow-lg font-medium"
              >
                {isLastStep ? (
                  <>
                    Get Started
                    <Check className="w-4 h-4" />
                  </>
                ) : (
                  <>
                    Next
                    <ChevronRight className="w-4 h-4" />
                  </>
                )}
              </button>
            </div>
          </div>
        </div>
      </div>
    </>
  );
};

export default OnboardingWizard;
