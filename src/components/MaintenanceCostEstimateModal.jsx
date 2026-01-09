import { X, Plus, Minus } from 'lucide-react';

const MaintenanceCostEstimateModal = ({
  isOpen,
  request,
  estimateData,
  onClose,
  onEstimateDataChange,
  onAddBreakdownItem,
  onRemoveBreakdownItem,
  onBreakdownChange,
  onSubmit
}) => {
  if (!isOpen || !request) return null;

  const totalCost = estimateData.costBreakdown.reduce((sum, item) => sum + (item.total || 0), 0);

  return (
    <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
      <div className="bg-white rounded-xl w-full max-w-3xl max-h-[90vh] overflow-y-auto">
        <div className="p-6 border-b border-gray-200">
          <div className="flex items-center justify-between">
            <div>
              <h3 className="text-xl font-bold text-gray-900">Add Cost Estimate</h3>
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
          {/* Cost Breakdown Section */}
          <div>
            <div className="flex items-center justify-between mb-3">
              <label className="block text-sm font-semibold text-gray-900">
                Cost Breakdown
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
              {estimateData.costBreakdown.map((item, index) => (
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
                    {estimateData.costBreakdown.length > 1 && (
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

            {/* Total Cost Display */}
            <div className="mt-4 p-4 bg-blue-50 border border-blue-200 rounded-lg">
              <div className="flex items-center justify-between">
                <span className="text-lg font-semibold text-gray-900">Total Estimated Cost:</span>
                <span className="text-2xl font-bold text-[#003366]">
                  KSH {totalCost.toLocaleString()}
                </span>
              </div>
            </div>
          </div>

          {/* Estimated Duration */}
          <div>
            <label className="block text-sm font-semibold text-gray-900 mb-2">
              Estimated Duration
            </label>
            <input
              type="text"
              placeholder="e.g., 2 hours, 3 days"
              value={estimateData.estimatedDuration}
              onChange={(e) => onEstimateDataChange({ ...estimateData, estimatedDuration: e.target.value })}
              className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
            />
          </div>

          {/* Notes */}
          <div>
            <label className="block text-sm font-semibold text-gray-900 mb-2">
              Notes (Optional)
            </label>
            <textarea
              rows="3"
              placeholder="Additional notes or details about the estimate..."
              value={estimateData.estimateNotes}
              onChange={(e) => onEstimateDataChange({ ...estimateData, estimateNotes: e.target.value })}
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
              className="flex-1 px-4 py-2 bg-[#003366] text-white rounded-lg hover:bg-[#002244] transition font-medium"
            >
              Submit Estimate
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};

export default MaintenanceCostEstimateModal;
