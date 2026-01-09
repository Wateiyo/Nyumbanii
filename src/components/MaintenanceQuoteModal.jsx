import { X, Plus, Minus } from 'lucide-react';

const MaintenanceQuoteModal = ({
  isOpen,
  request,
  quoteData,
  onClose,
  onQuoteDataChange,
  onAddItemizedCost,
  onRemoveItemizedCost,
  onItemizedCostChange,
  onSubmit
}) => {
  if (!isOpen || !request) return null;

  const totalAmount = quoteData.itemizedCosts.reduce((sum, item) => {
    const cost = parseFloat(item.cost) || 0;
    return sum + cost;
  }, 0);

  return (
    <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
      <div className="bg-white rounded-xl w-full max-w-3xl max-h-[90vh] overflow-y-auto">
        <div className="p-6 border-b border-gray-200">
          <div className="flex items-center justify-between">
            <div>
              <h3 className="text-xl font-bold text-gray-900">Submit Vendor Quote</h3>
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
          {/* Estimated Cost Reference */}
          {request.estimatedCost && (
            <div className="p-4 bg-blue-50 border border-blue-200 rounded-lg">
              <h4 className="font-semibold text-gray-900 mb-2">Your Estimate</h4>
              <div className="text-sm">
                <span className="text-gray-600">Estimated Cost:</span>
                <div className="font-semibold text-gray-900">
                  KSH {request.estimatedCost.toLocaleString()}
                </div>
              </div>
            </div>
          )}

          {/* Vendor Information */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-semibold text-gray-900 mb-2">
                Vendor Name *
              </label>
              <input
                type="text"
                placeholder="e.g., ABC Plumbing Services"
                value={quoteData.vendorName}
                onChange={(e) => onQuoteDataChange({ ...quoteData, vendorName: e.target.value })}
                className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
              />
            </div>

            <div>
              <label className="block text-sm font-semibold text-gray-900 mb-2">
                Quote Number
              </label>
              <input
                type="text"
                placeholder="e.g., Q-2024-001"
                value={quoteData.quoteNumber}
                onChange={(e) => onQuoteDataChange({ ...quoteData, quoteNumber: e.target.value })}
                className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
              />
            </div>

            <div>
              <label className="block text-sm font-semibold text-gray-900 mb-2">
                Vendor Contact *
              </label>
              <input
                type="tel"
                placeholder="e.g., +254 712 345 678"
                value={quoteData.vendorContact}
                onChange={(e) => onQuoteDataChange({ ...quoteData, vendorContact: e.target.value })}
                className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
              />
            </div>

            <div>
              <label className="block text-sm font-semibold text-gray-900 mb-2">
                Vendor Email
              </label>
              <input
                type="email"
                placeholder="e.g., contact@vendor.com"
                value={quoteData.vendorEmail}
                onChange={(e) => onQuoteDataChange({ ...quoteData, vendorEmail: e.target.value })}
                className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
              />
            </div>

            <div>
              <label className="block text-sm font-semibold text-gray-900 mb-2">
                Valid Until
              </label>
              <input
                type="date"
                value={quoteData.validUntil}
                onChange={(e) => onQuoteDataChange({ ...quoteData, validUntil: e.target.value })}
                className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
              />
            </div>
          </div>

          {/* Itemized Costs */}
          <div>
            <div className="flex items-center justify-between mb-3">
              <label className="block text-sm font-semibold text-gray-900">
                Itemized Costs *
              </label>
              <button
                onClick={onAddItemizedCost}
                className="px-3 py-1.5 bg-[#003366] text-white rounded-lg hover:bg-[#002244] transition text-sm flex items-center gap-1"
              >
                <Plus className="w-4 h-4" />
                Add Item
              </button>
            </div>

            <div className="space-y-3">
              {quoteData.itemizedCosts.map((cost, index) => (
                <div key={index} className="grid grid-cols-12 gap-2 items-start p-3 bg-gray-50 rounded-lg">
                  <div className="col-span-8">
                    <input
                      type="text"
                      placeholder="Item description"
                      value={cost.item}
                      onChange={(e) => onItemizedCostChange(index, 'item', e.target.value)}
                      className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 text-sm"
                    />
                  </div>
                  <div className="col-span-3">
                    <input
                      type="number"
                      placeholder="Cost (KSH)"
                      value={cost.cost}
                      onChange={(e) => onItemizedCostChange(index, 'cost', e.target.value)}
                      className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 text-sm"
                      min="0"
                    />
                  </div>
                  <div className="col-span-1 flex items-center justify-center">
                    {quoteData.itemizedCosts.length > 1 && (
                      <button
                        onClick={() => onRemoveItemizedCost(index)}
                        className="p-2 text-red-600 hover:bg-red-50 rounded-lg transition"
                      >
                        <Minus className="w-4 h-4" />
                      </button>
                    )}
                  </div>
                </div>
              ))}
            </div>

            {/* Total Quote Amount Display */}
            <div className="mt-4 p-4 bg-purple-50 border border-purple-200 rounded-lg">
              <div className="flex items-center justify-between">
                <span className="text-lg font-semibold text-gray-900">Total Quote Amount:</span>
                <span className="text-2xl font-bold text-purple-600">
                  KSH {totalAmount.toLocaleString()}
                </span>
              </div>
              {request.estimatedCost && totalAmount > 0 && (
                <div className="pt-2 mt-2 border-t border-purple-300">
                  <div className="flex items-center justify-between text-sm">
                    <span className="text-gray-600">Variance from Your Estimate:</span>
                    <span className={`font-semibold ${
                      totalAmount > request.estimatedCost ? 'text-red-600' : 'text-green-600'
                    }`}>
                      KSH {Math.abs(totalAmount - request.estimatedCost).toLocaleString()}
                      {totalAmount > request.estimatedCost ? ' over' : ' under'}
                    </span>
                  </div>
                </div>
              )}
            </div>
          </div>

          {/* Description */}
          <div>
            <label className="block text-sm font-semibold text-gray-900 mb-2">
              Quote Description / Notes
            </label>
            <textarea
              rows="3"
              placeholder="Additional details about the quote, terms, conditions, etc..."
              value={quoteData.description}
              onChange={(e) => onQuoteDataChange({ ...quoteData, description: e.target.value })}
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
              disabled={!quoteData.vendorName || !quoteData.vendorContact || totalAmount === 0}
              className="flex-1 px-4 py-2 bg-purple-600 text-white rounded-lg hover:bg-purple-700 transition font-medium disabled:opacity-50 disabled:cursor-not-allowed"
            >
              Submit Quote
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};

export default MaintenanceQuoteModal;
