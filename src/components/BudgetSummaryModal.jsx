import { X, TrendingUp, TrendingDown, DollarSign, Clock, AlertCircle } from 'lucide-react';

const BudgetSummaryModal = ({ isOpen, budgetInfo, onClose }) => {
  if (!isOpen || !budgetInfo) return null;

  const {
    request,
    estimatedCost,
    actualCost,
    variance,
    percentageVariance,
    estimatedDuration,
    actualDuration,
    costBreakdown,
    actualCostBreakdown,
    completionNotes
  } = budgetInfo;

  const isOverBudget = variance > 0;
  const isUnderBudget = variance < 0;
  const isOnBudget = variance === 0;

  return (
    <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
      <div className="bg-white rounded-xl w-full max-w-4xl max-h-[90vh] overflow-y-auto">
        <div className="p-6 border-b border-gray-200">
          <div className="flex items-center justify-between">
            <div>
              <h3 className="text-xl font-bold text-gray-900">Budget Summary</h3>
              <p className="text-sm text-gray-600 mt-1">
                {request.issue} - {request.property}
              </p>
            </div>
            <button
              onClick={onClose}
              className="p-2 hover:bg-gray-100 rounded-full transition-colors"
            >
              <X className="w-5 h-5 text-gray-500" />
            </button>
          </div>
        </div>

        <div className="p-6 space-y-6">
          {/* Overall Budget Status */}
          <div className={`p-6 rounded-lg border-2 ${
            isOverBudget ? 'bg-red-50 border-red-300' :
            isUnderBudget ? 'bg-green-50 border-green-300' :
            'bg-blue-50 border-blue-300'
          }`}>
            <div className="flex items-center justify-between mb-4">
              <div className="flex items-center gap-3">
                {isOverBudget && <TrendingUp className="w-8 h-8 text-red-600" />}
                {isUnderBudget && <TrendingDown className="w-8 h-8 text-green-600" />}
                {isOnBudget && <DollarSign className="w-8 h-8 text-blue-600" />}
                <div>
                  <h4 className="text-lg font-bold text-gray-900">
                    {isOverBudget && 'Over Budget'}
                    {isUnderBudget && 'Under Budget'}
                    {isOnBudget && 'On Budget'}
                  </h4>
                  <p className="text-sm text-gray-600">
                    {isOverBudget && 'Actual costs exceeded the estimate'}
                    {isUnderBudget && 'Great! Costs were less than estimated'}
                    {isOnBudget && 'Costs matched the estimate exactly'}
                  </p>
                </div>
              </div>
              <div className="text-right">
                <div className={`text-3xl font-bold ${
                  isOverBudget ? 'text-red-600' :
                  isUnderBudget ? 'text-green-600' :
                  'text-blue-600'
                }`}>
                  {isOverBudget && '+'}
                  {isUnderBudget && '-'}
                  KSH {Math.abs(variance).toLocaleString()}
                </div>
                <div className="text-sm text-gray-600 mt-1">
                  {Math.abs(percentageVariance).toFixed(1)}% {isOverBudget ? 'over' : isUnderBudget ? 'under' : 'variance'}
                </div>
              </div>
            </div>
          </div>

          {/* Cost Comparison */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="p-4 bg-blue-50 border border-blue-200 rounded-lg">
              <h5 className="font-semibold text-gray-900 mb-3 flex items-center gap-2">
                <DollarSign className="w-5 h-5 text-blue-600" />
                Estimated Cost
              </h5>
              <div className="text-2xl font-bold text-blue-600 mb-3">
                KSH {estimatedCost.toLocaleString()}
              </div>
              {costBreakdown && costBreakdown.length > 0 && (
                <div className="space-y-2">
                  <p className="text-xs font-semibold text-gray-700">Breakdown:</p>
                  {costBreakdown.map((item, index) => (
                    <div key={index} className="flex justify-between text-sm">
                      <span className="text-gray-600">
                        {item.item} ({item.quantity}x)
                      </span>
                      <span className="font-semibold text-gray-900">
                        KSH {item.total.toLocaleString()}
                      </span>
                    </div>
                  ))}
                </div>
              )}
            </div>

            <div className="p-4 bg-green-50 border border-green-200 rounded-lg">
              <h5 className="font-semibold text-gray-900 mb-3 flex items-center gap-2">
                <DollarSign className="w-5 h-5 text-green-600" />
                Actual Cost
              </h5>
              <div className="text-2xl font-bold text-green-600 mb-3">
                KSH {actualCost.toLocaleString()}
              </div>
              {actualCostBreakdown && actualCostBreakdown.length > 0 && (
                <div className="space-y-2">
                  <p className="text-xs font-semibold text-gray-700">Breakdown:</p>
                  {actualCostBreakdown.map((item, index) => (
                    <div key={index} className="flex justify-between text-sm">
                      <span className="text-gray-600">
                        {item.item} ({item.quantity}x)
                      </span>
                      <span className="font-semibold text-gray-900">
                        KSH {item.total.toLocaleString()}
                      </span>
                    </div>
                  ))}
                </div>
              )}
            </div>
          </div>

          {/* Duration Comparison */}
          {(estimatedDuration || actualDuration) && (
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {estimatedDuration && (
                <div className="p-4 bg-purple-50 border border-purple-200 rounded-lg">
                  <h5 className="font-semibold text-gray-900 mb-2 flex items-center gap-2">
                    <Clock className="w-5 h-5 text-purple-600" />
                    Estimated Duration
                  </h5>
                  <div className="text-lg font-bold text-purple-600">
                    {estimatedDuration}
                  </div>
                </div>
              )}
              {actualDuration && (
                <div className="p-4 bg-orange-50 border border-orange-200 rounded-lg">
                  <h5 className="font-semibold text-gray-900 mb-2 flex items-center gap-2">
                    <Clock className="w-5 h-5 text-orange-600" />
                    Actual Duration
                  </h5>
                  <div className="text-lg font-bold text-orange-600">
                    {actualDuration}
                  </div>
                </div>
              )}
            </div>
          )}

          {/* Completion Notes */}
          {completionNotes && (
            <div className="p-4 bg-gray-50 border border-gray-200 rounded-lg">
              <h5 className="font-semibold text-gray-900 mb-2 flex items-center gap-2">
                <AlertCircle className="w-5 h-5 text-gray-600" />
                Completion Notes
              </h5>
              <p className="text-sm text-gray-700 whitespace-pre-wrap">
                {completionNotes}
              </p>
            </div>
          )}

          {/* Variance Details */}
          <div className="p-4 bg-gray-100 border border-gray-300 rounded-lg">
            <h5 className="font-semibold text-gray-900 mb-3">Budget Analysis</h5>
            <div className="grid grid-cols-2 gap-4 text-sm">
              <div>
                <span className="text-gray-600">Total Estimated:</span>
                <div className="font-semibold text-gray-900">
                  KSH {estimatedCost.toLocaleString()}
                </div>
              </div>
              <div>
                <span className="text-gray-600">Total Actual:</span>
                <div className="font-semibold text-gray-900">
                  KSH {actualCost.toLocaleString()}
                </div>
              </div>
              <div>
                <span className="text-gray-600">Variance Amount:</span>
                <div className={`font-semibold ${
                  isOverBudget ? 'text-red-600' :
                  isUnderBudget ? 'text-green-600' :
                  'text-blue-600'
                }`}>
                  {isOverBudget && '+'}
                  {isUnderBudget && '-'}
                  KSH {Math.abs(variance).toLocaleString()}
                </div>
              </div>
              <div>
                <span className="text-gray-600">Variance Percentage:</span>
                <div className={`font-semibold ${
                  isOverBudget ? 'text-red-600' :
                  isUnderBudget ? 'text-green-600' :
                  'text-blue-600'
                }`}>
                  {Math.abs(percentageVariance).toFixed(1)}%
                </div>
              </div>
            </div>
          </div>

          {/* Close Button */}
          <div className="flex justify-end pt-4 border-t border-gray-200">
            <button
              onClick={onClose}
              className="px-6 py-2 bg-[#003366] text-white rounded-lg hover:bg-[#002244] transition font-medium"
            >
              Close
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};

export default BudgetSummaryModal;
