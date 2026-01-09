import { X, Plus, Minus } from 'lucide-react';

const MaintenanceCompleteWorkModal = ({
  isOpen,
  request,
  completionData,
  onClose,
  onCompletionDataChange,
  onAddBreakdownItem,
  onRemoveBreakdownItem,
  onBreakdownChange,
  onSubmit
}) => {
  if (!isOpen || !request) return null;

  const totalCost = completionData.actualCostBreakdown.reduce((sum, item) => sum + (item.total || 0), 0);

  return (
    <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
      <div className="bg-white rounded-xl w-full max-w-3xl max-h-[90vh] overflow-y-auto">
        <div className="p-6 border-b border-gray-200">
          <div className="flex items-center justify-between">
            <div>
              <h3 className="text-xl font-bold text-gray-900">Complete Maintenance Work</h3>
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
          {/* Estimated vs Actual Comparison */}
          {request.estimatedCost && (
            <div className="p-4 bg-blue-50 border border-blue-200 rounded-lg">
              <h4 className="font-semibold text-gray-900 mb-2">Original Estimate</h4>
              <div className="grid grid-cols-2 gap-4 text-sm">
                <div>
                  <span className="text-gray-600">Estimated Cost:</span>
                  <div className="font-semibold text-gray-900">
                    KSH {request.estimatedCost.toLocaleString()}
                  </div>
                </div>
                {request.estimatedDuration && (
                  <div>
                    <span className="text-gray-600">Estimated Duration:</span>
                    <div className="font-semibold text-gray-900">
                      {request.estimatedDuration}
                    </div>
                  </div>
                )}
              </div>
            </div>
          )}

          {/* Actual Cost Breakdown Section */}
          <div>
            <div className="flex items-center justify-between mb-3">
              <label className="block text-sm font-semibold text-gray-900">
                Actual Cost Breakdown
              </label>
              <button
                onClick={onAddBreakdownItem}
                className="px-3 py-1.5 bg-[#003366] text-white rounded-lg hover:bg-[#002244] transition text-sm flex items-center gap-1"
              >
                <Plus className="w-4 h-4" />
                Add Item
              </button>
            </div>

            <div className="space-y-3">
              {completionData.actualCostBreakdown.map((item, index) => (
                <div key={index} className="grid grid-cols-12 gap-2 items-start p-3 bg-gray-50 rounded-lg">
                  <div className="col-span-5">
                    <input
                      type="text"
                      placeholder="Item description"
                      value={item.item}
                      onChange={(e) => onBreakdownChange(index, 'item', e.target.value)}
                      className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 text-sm"
                    />
                  </div>
                  <div className="col-span-2">
                    <input
                      type="number"
                      placeholder="Qty"
                      value={item.quantity}
                      onChange={(e) => onBreakdownChange(index, 'quantity', e.target.value)}
                      className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 text-sm"
                      min="1"
                    />
                  </div>
                  <div className="col-span-2">
                    <input
                      type="number"
                      placeholder="Unit Cost"
                      value={item.unitCost}
                      onChange={(e) => onBreakdownChange(index, 'unitCost', e.target.value)}
                      className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 text-sm"
                      min="0"
                    />
                  </div>
                  <div className="col-span-2">
                    <input
                      type="text"
                      value={`KSH ${item.total.toLocaleString()}`}
                      readOnly
                      className="w-full px-3 py-2 bg-gray-100 border border-gray-300 rounded-lg text-sm font-semibold"
                    />
                  </div>
                  <div className="col-span-1 flex items-center justify-center">
                    {completionData.actualCostBreakdown.length > 1 && (
                      <button
                        onClick={() => onRemoveBreakdownItem(index)}
                        className="p-2 text-red-600 hover:bg-red-50 rounded-lg transition"
                      >
                        <Minus className="w-4 h-4" />
                      </button>
                    )}
                  </div>
                </div>
              ))}
            </div>

            {/* Total Actual Cost Display */}
            <div className="mt-4 p-4 bg-green-50 border border-green-200 rounded-lg">
              <div className="flex items-center justify-between mb-2">
                <span className="text-lg font-semibold text-gray-900">Total Actual Cost:</span>
                <span className="text-2xl font-bold text-green-600">
                  KSH {totalCost.toLocaleString()}
                </span>
              </div>
              {request.estimatedCost && totalCost > 0 && (
                <div className="pt-2 border-t border-green-300">
                  <div className="flex items-center justify-between text-sm">
                    <span className="text-gray-600">Variance from Estimate:</span>
                    <span className={`font-semibold ${
                      totalCost > request.estimatedCost ? 'text-red-600' : 'text-green-600'
                    }`}>
                      KSH {Math.abs(totalCost - request.estimatedCost).toLocaleString()}
                      {totalCost > request.estimatedCost ? ' over' : ' under'}
                    </span>
                  </div>
                </div>
              )}
            </div>
          </div>

          {/* Actual Duration */}
          <div>
            <label className="block text-sm font-semibold text-gray-900 mb-2">
              Actual Duration
            </label>
            <input
              type="text"
              placeholder="e.g., 2 hours, 3 days"
              value={completionData.actualDuration}
              onChange={(e) => onCompletionDataChange({ ...completionData, actualDuration: e.target.value })}
              className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
            />
          </div>

          {/* Completion Notes */}
          <div>
            <label className="block text-sm font-semibold text-gray-900 mb-2">
              Completion Notes
            </label>
            <textarea
              rows="3"
              placeholder="Describe the work completed, any issues encountered, etc..."
              value={completionData.completionNotes}
              onChange={(e) => onCompletionDataChange({ ...completionData, completionNotes: e.target.value })}
              className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
            />
          </div>

          {/* Action Buttons */}
          <div className="flex gap-3 pt-4 border-t border-gray-200">
            <button
              onClick={onClose}
              className="flex-1 px-4 py-2 border border-gray-300 text-gray-700 rounded-lg hover:bg-gray-50 transition font-medium"
            >
              Cancel
            </button>
            <button
              onClick={onSubmit}
              disabled={totalCost === 0}
              className="flex-1 px-4 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 transition font-medium disabled:opacity-50 disabled:cursor-not-allowed"
            >
              Complete Work
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};

export default MaintenanceCompleteWorkModal;
