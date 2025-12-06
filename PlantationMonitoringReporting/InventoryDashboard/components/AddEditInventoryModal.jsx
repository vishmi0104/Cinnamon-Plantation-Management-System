import React from "react";
import { FaTimes, FaCheck, FaExclamationTriangle } from "react-icons/fa";

const getFieldValidationStatus = (fieldName, value) => {
  if (!value) return 'invalid';
  
  switch (fieldName) {
    case 'name':
      return value.trim().length >= 3 ? 'valid' : 'invalid';
    case 'quantity':
      return parseFloat(value) > 0 ? 'valid' : 'invalid';
    case 'price':
      return parseFloat(value) > 0 ? 'valid' : 'invalid';
    case 'reorderLevel':
      return parseFloat(value) >= 0 ? 'valid' : 'invalid';
    default:
      return value ? 'valid' : 'invalid';
  }
};

const AddEditInventoryModal = ({
  isModalOpen,
  setModalOpen,
  selectedItem,
  formData,
  setFormData,
  errors,
  isSubmitting,
  handleSaveItem,
  validationStatus,
  handleItemNameInput,
  handleNumericInput,
  handleSupplierInput
}) => {
  if (!isModalOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
      <div className="absolute inset-0 bg-black opacity-30"></div>
      <div className="bg-white rounded-xl shadow-lg overflow-hidden max-w-2xl w-full z-10">
        {/* Modal Header */}
        <div className="bg-gradient-to-r from-orange-500 to-orange-600 p-3 sm:p-4">
          <h3 className="text-base sm:text-lg font-semibold text-white">
            {selectedItem ? "Edit Inventory Item" : "Add New Inventory Item"}
          </h3>
          <button
            onClick={() => setModalOpen(false)}
            className="absolute top-3 right-3 text-white"
            title="Close"
          >
            <FaTimes />
          </button>
        </div>

        {/* Modal Content */}
        <div className="p-3 sm:p-4">
          {/* Validation Summary */}
          {errors.submit && (
            <div className="mb-4 p-3 bg-yellow-50 border border-yellow-200 rounded-lg">
              <div className="flex items-center gap-2">
                <FaExclamationTriangle className="text-yellow-600 text-sm flex-shrink-0" />
                <p className="text-yellow-800 text-sm font-medium">{errors.submit}</p>
              </div>
            </div>
          )}

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Item Name *
              </label>
              <div className="relative">
                <input
                  type="text"
                  value={formData.name}
                  onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                  onKeyDown={handleItemNameInput}
                  className={`w-full p-2 border rounded-lg focus:ring-2 focus:ring-orange-500 focus:border-transparent text-sm pr-8 ${
                    errors.name ? 'border-red-300' :
                    getFieldValidationStatus('name', formData.name) === 'valid' ? 'border-green-300' :
                    'border-gray-300'
                  }`}
                  placeholder="Enter item name (e.g., Organic Cinnamon Bark)"
                  maxLength="100"
                  required
                />
                {formData.name && (
                  <div className="absolute right-2 top-1/2 transform -translate-y-1/2">
                    {errors.name ? (
                      <FaTimes className="text-red-500 text-xs" />
                    ) : getFieldValidationStatus('name', formData.name) === 'valid' ? (
                      <FaCheck className="text-green-500 text-xs" />
                    ) : null}
                  </div>
                )}
              </div>
              {errors.name && (
                <p className="mt-1 text-xs text-red-600">{errors.name}</p>
              )}
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Quantity *
              </label>
              <div className="relative">
                <input
                  type="number"
                  min="0.01"
                  max="999999"
                  step="0.01"
                  value={formData.quantity}
                  onChange={(e) => setFormData({ ...formData, quantity: e.target.value })}
                  onKeyDown={handleNumericInput}
                  className={`w-full p-2 border rounded-lg focus:ring-2 focus:ring-orange-500 focus:border-transparent text-sm pr-8 ${
                    errors.quantity ? 'border-red-300' :
                    getFieldValidationStatus('quantity', formData.quantity) === 'valid' ? 'border-green-300' :
                    'border-gray-300'
                  }`}
                  placeholder="0.00"
                  required
                />
                {formData.quantity && (
                  <div className="absolute right-8 top-1/2 transform -translate-y-1/2 text-sm text-gray-500">
                    {formData.unit || 'units'}
                  </div>
                )}
                {formData.quantity && (
                  <div className="absolute right-2 top-1/2 transform -translate-y-1/2">
                    {errors.quantity ? (
                      <FaTimes className="text-red-500 text-xs" />
                    ) : getFieldValidationStatus('quantity', formData.quantity) === 'valid' ? (
                      <FaCheck className="text-green-500 text-xs" />
                    ) : null}
                  </div>
                )}
              </div>
              {errors.quantity && (
                <p className="mt-1 text-xs text-red-600">{errors.quantity}</p>
              )}
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Unit *
              </label>
              <select
                value={formData.unit}
                onChange={(e) => setFormData({ ...formData, unit: e.target.value })}
                className="w-full p-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-orange-500 focus:border-transparent text-sm"
                required
              >
                <option value="">Select unit</option>
                <option value="kg">Kilograms (kg)</option>
                <option value="liters">Liters</option>
                <option value="pieces">Pieces</option>
                <option value="boxes">Boxes</option>
                <option value="bags">Bags</option>
              </select>
              {errors.unit && (
                <p className="mt-1 text-xs text-red-600">{errors.unit}</p>
              )}
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Category *
              </label>
              <select
                value={formData.category}
                onChange={(e) => setFormData({ ...formData, category: e.target.value })}
                className="w-full p-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-orange-500 focus:border-transparent text-sm"
                required
              >
                <option value="">Select category</option>
                <option value="harvest">Harvest</option>
                <option value="resource">Resource</option>
                <option value="final product">Final Product</option>
              </select>
              {errors.category && (
                <p className="mt-1 text-xs text-red-600">{errors.category}</p>
              )}
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Price *
              </label>
              <div className="relative">
                <input
                  type="number"
                  min="0.01"
                  max="999999"
                  step="0.01"
                  value={formData.price}
                  onChange={(e) => setFormData({ ...formData, price: e.target.value })}
                  onKeyDown={handleNumericInput}
                  className={`w-full p-2 border rounded-lg focus:ring-2 focus:ring-orange-500 focus:border-transparent pr-12 text-sm ${
                    errors.price ? 'border-red-300' :
                    getFieldValidationStatus('price', formData.price) === 'valid' ? 'border-green-300' :
                    'border-gray-300'
                  }`}
                  placeholder="0.00"
                  required
                />
                <span className="absolute right-8 top-1/2 transform -translate-y-1/2 text-sm text-gray-500">
                  $
                </span>
                {formData.price && (
                  <div className="absolute right-2 top-1/2 transform -translate-y-1/2">
                    {errors.price ? (
                      <FaTimes className="text-red-500 text-xs" />
                    ) : getFieldValidationStatus('price', formData.price) === 'valid' ? (
                      <FaCheck className="text-green-500 text-xs" />
                    ) : null}
                  </div>
                )}
              </div>
              {errors.price && (
                <p className="mt-1 text-xs text-red-600">{errors.price}</p>
              )}
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Supplier
              </label>
              <input
                type="text"
                value={formData.supplier}
                onChange={(e) => setFormData({ ...formData, supplier: e.target.value })}
                onKeyDown={handleSupplierInput}
                className="w-full p-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-orange-500 focus:border-transparent text-sm"
                placeholder="Enter supplier name (optional)"
                maxLength="100"
              />
              {errors.supplier && (
                <p className="mt-1 text-xs text-red-600">{errors.supplier}</p>
              )}
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Reorder Level *
              </label>
              <div className="relative">
                <input
                  type="number"
                  min="0"
                  max="999999"
                  step="0.01"
                  value={formData.reorderLevel}
                  onChange={(e) => setFormData({ ...formData, reorderLevel: e.target.value })}
                  onKeyDown={handleNumericInput}
                  className={`w-full p-2 border rounded-lg focus:ring-2 focus:ring-orange-500 focus:border-transparent text-sm pr-8 ${
                    errors.reorderLevel ? 'border-red-300' :
                    getFieldValidationStatus('reorderLevel', formData.reorderLevel) === 'valid' ? 'border-green-300' :
                    'border-gray-300'
                  }`}
                  placeholder="0.00"
                  required
                />
                {formData.reorderLevel && (
                  <div className="absolute right-2 top-1/2 transform -translate-y-1/2">
                    {errors.reorderLevel ? (
                      <FaTimes className="text-red-500 text-xs" />
                    ) : getFieldValidationStatus('reorderLevel', formData.reorderLevel) === 'valid' ? (
                      <FaCheck className="text-green-500 text-xs" />
                    ) : null}
                  </div>
                )}
              </div>
              {errors.reorderLevel && (
                <p className="mt-1 text-xs text-red-600">{errors.reorderLevel}</p>
              )}
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Manufacture Date *
              </label>
              <input
                type="date"
                min={new Date().toISOString().split('T')[0]}
                max={new Date().toISOString().split('T')[0]}
                value={formData.manufactureDate || new Date().toISOString().split('T')[0]}
                onChange={(e) => setFormData({ ...formData, manufactureDate: e.target.value })}
                className="w-full p-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-orange-500 focus:border-transparent text-sm"
              />
              {errors.manufactureDate && (
                <p className="mt-1 text-xs text-red-600">{errors.manufactureDate}</p>
              )}
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Expire Date *
              </label>
              <input
                type="date"
                min={formData.manufactureDate ? new Date(new Date(formData.manufactureDate).setDate(new Date(formData.manufactureDate).getDate() + 1)).toISOString().split('T')[0] : new Date(new Date().setDate(new Date().getDate() + 1)).toISOString().split('T')[0]}
                value={formData.expireDate}
                onChange={(e) => setFormData({ ...formData, expireDate: e.target.value })}
                className="w-full p-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-orange-500 focus:border-transparent text-sm"
              />
              {errors.expireDate && (
                <p className="mt-1 text-xs text-red-600">{errors.expireDate}</p>
              )}
            </div>
          </div>

          {/* Description */}
          <div className="mb-3">
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Description
            </label>
            <textarea
              value={formData.description}
              onChange={(e) => setFormData({ ...formData, description: e.target.value })}
              className="w-full p-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-orange-500 focus:border-transparent resize-none text-sm"
              rows="3"
              maxLength="500"
              placeholder="Describe the inventory item, its quality, origin, or special characteristics (optional but recommended)"
            ></textarea>
            <div className="flex justify-between mt-1">
              <div className="text-xs text-gray-500">
                {formData.description.length}/500 characters
              </div>
              {formData.description.trim().split(' ').filter(word => word.length > 0).length > 0 && (
                <div className="text-xs text-gray-500">
                  {formData.description.trim().split(' ').filter(word => word.length > 0).length} words
                </div>
              )}
            </div>
            {errors.description && (
              <p className="mt-1 text-xs text-red-600">{errors.description}</p>
            )}
          </div>
        </div>

        {/* Modal Footer */}
        <div className="flex justify-end gap-2 p-3">
          <button
            onClick={() => setModalOpen(false)}
            className="px-3 py-2 bg-gray-100 text-gray-700 rounded-lg font-medium shadow-sm hover:bg-gray-200 transition-all duration-200 text-sm"
          >
            Close
          </button>
          <button
            onClick={handleSaveItem}
            className="px-3 py-2 bg-gradient-to-r from-orange-500 to-orange-600 text-white rounded-lg font-medium shadow-lg hover:shadow-xl hover:from-orange-600 hover:to-orange-700 transform hover:scale-105 transition-all duration-200 text-sm"
          >
            {isSubmitting ? (
              <span className="flex items-center justify-center gap-2">
                <svg className="animate-spin h-4 w-4 text-white" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                  <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                  <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8v8H4zm16 0a8 8 0 01-8 8v-8h8z"></path>
                </svg>
                Saving...
              </span>
            ) : (
              "Save Item"
            )}
          </button>
        </div>

        {/* Form Completion Indicator */}
        <div className="px-3 pb-3">
          <div className="flex items-center justify-between text-xs text-gray-500">
            <span>Form Completion</span>
            <span>
              {[
                formData.name?.trim(),
                formData.quantity,
                formData.unit,
                formData.category,
                formData.price,
                formData.reorderLevel,
                formData.manufactureDate,
                formData.expireDate
              ].filter(Boolean).length}/8 required fields
            </span>
          </div>
          <div className="w-full bg-gray-200 rounded-full h-1 mt-1">
            <div
              className="bg-gradient-to-r from-orange-500 to-orange-600 h-1 rounded-full transition-all duration-300"
              style={{
                width: `${([
                  formData.name?.trim(),
                  formData.quantity,
                  formData.unit,
                  formData.category,
                  formData.price,
                  formData.reorderLevel,
                  formData.manufactureDate,
                  formData.expireDate
                ].filter(Boolean).length / 8) * 100}%`
              }}
            ></div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default AddEditInventoryModal;