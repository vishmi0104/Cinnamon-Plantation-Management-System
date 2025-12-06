import React, { useState } from 'react';
import { FaTruck, FaTimes, FaReply, FaCheckCircle } from 'react-icons/fa';

const DeliveryResponseModal = ({ isOpen, onClose, issue, onSave }) => {
  const initialFormState = {
    responseText: '',
    status: 'In Progress',
    actionTaken: '',
  };

  const [formData, setFormData] = useState(initialFormState);
  const [formErrors, setFormErrors] = useState({});
  const [isSubmitting, setIsSubmitting] = useState(false);

  React.useEffect(() => {
    if (isOpen) {
      resetForm();
    }
  }, [isOpen]);

  const resetForm = () => {
    setFormData(initialFormState);
    setFormErrors({});
  };

  const validateForm = () => {
    const errors = {};
    if (!formData.responseText) errors.responseText = 'Response text is required';
    if (formData.responseText && formData.responseText.trim().length < 5) {
      errors.responseText = 'Response text must be at least 5 characters long';
    }
    if (!formData.status) errors.status = 'Status is required';
    return errors;
  };

  const handleInputChange = (e) => {
    const { name, value } = e.target;
    
    // Filter text fields to only allow letters, spaces, and basic punctuation
    let filteredValue = value;
    if (name === 'responseText' || name === 'actionTaken') {
      filteredValue = value.replace(/[^a-zA-Z\s.,!?'"-]/g, '');
    }
    
    setFormData((prev) => ({ ...prev, [name]: filteredValue }));
    // Clear error when field is changed
    if (formErrors[name]) {
      setFormErrors((prev) => ({ ...prev, [name]: undefined }));
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    const errors = validateForm();
    setFormErrors(errors);
    
    if (Object.keys(errors).length === 0 && issue) {
      setIsSubmitting(true);
      try {
        const responseData = {
          deliveryIssueId: issue._id,
          responseText: formData.responseText,
          status: formData.status,
          actionTaken: formData.actionTaken,
          respondedBy: 'Support Manager', // Add the responder information
        };

        await onSave(responseData);
        resetForm();
        onClose();
      } catch (error) {
        console.error('Error saving response:', error);
      } finally {
        setIsSubmitting(false);
      }
    }
  };

  if (!isOpen || !issue) return null;

  return (
    <div className="fixed inset-0 z-50 overflow-y-auto">
      <div className="flex items-center justify-center min-h-screen px-4 pt-4 pb-20 text-center sm:block sm:p-0">
        <div className="fixed inset-0 transition-opacity" aria-hidden="true">
          <div className="absolute inset-0 bg-gray-900 opacity-75"></div>
        </div>

        <span className="hidden sm:inline-block sm:align-middle sm:h-screen" aria-hidden="true">&#8203;</span>

        <div className="inline-block align-bottom bg-white rounded-2xl text-left overflow-hidden shadow-xl transform transition-all sm:my-8 sm:align-middle sm:max-w-2xl sm:w-full">
          <div className="bg-gradient-to-r from-[#d87706] to-[#b55309] px-6 py-4 relative">
            <div className="absolute inset-0 bg-[url('data:image/svg+xml;base64,PHN2ZyB3aWR0aD0iNjAiIGhlaWdodD0iNjAiIHZpZXdCb3g9IjAgMCA2MCA2MCIgeG1sbnM9Imh0dHA6Ly93d3cudzMub3JnLzIwMDAvc3ZnIj48ZyBmaWxsPSJub25lIiBmaWxsLXJ1bGU9ImV2ZW5vZGQiPjxnIGZpbGw9IiNmZmZmZmYiIGZpbGwtb3BhY2l0eT0iMC4wNSI+PHBhdGggZD0iTTM2IDM0aDR2MWgtNHYtMXptMCAyaDR2LTFoLTR2MXptMCAyaDR2LTFoLTR2MXptMCAyaDR2LTFoLTR2MXptMCAyaDR2LTFoLTR2MXptMCAyaDR2LTFoLTR2MXptMCAyaDR2LTFoLTR2MXptMCAyaDR2LTFoLTR2MXptLTE4LTE2aDR2MWgtNHYtMXptMCAyaDR2LTFoLTR2MXptMCAyaDR2LTFoLTR2MXptMCAyaDR2LTFoLTR2MXptMCAyaDR2LTFoLTR2MXptMCAyaDR2LTFoLTR2MXptMCAyaDR2LTFoLTR2MXptMCAyaDR2LTFoLTR2MXptOS0xMmg0djFoLTR2LTF6bTAgMmg0di0xaC00djF6bTAgMmg0di0xaC00djF6bTAgMmg0di0xaC00djF6bTAgMmg0di0xaC00djF6bTAgMmg0di0xaC00djF6bTAgMmg0di0xaC00djF6bTAgMmg0di0xaC00djF6Ii8+PC9nPjwvZz48L3N2Zz4=')] opacity-30"></div>
            <div className="flex justify-between items-center relative z-10">
              <div className="flex items-center gap-3">
                <div className="p-2 bg-white/20 rounded-lg shadow-sm backdrop-blur-sm">
                  <FaTruck className="text-white text-xl" />
                </div>
                <h3 className="text-xl font-bold text-white">
                  Respond to Delivery Issue #{issue.deliveryIssueId}
                </h3>
              </div>
              <button
                type="button"
                className="p-2 text-white hover:bg-white/20 rounded-full transition-colors"
                onClick={onClose}
              >
                <FaTimes />
              </button>
            </div>
          </div>

          {/* Issue Details Section */}
          <div className="bg-gradient-to-r from-[#d87706]/10 to-[#b55309]/10 p-6 border-b border-[#d87706]/20">
            <div className="bg-white rounded-lg p-4 shadow-sm border border-indigo-100">
              <h4 className="text-sm font-bold text-[#d87706] uppercase tracking-wider mb-3">Issue Details</h4>
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <p className="text-xs font-medium text-[#d87706] uppercase mb-1">Order ID</p>
                  <p className="text-sm font-bold text-gray-900">#{issue.orderId}</p>
                </div>
                <div>
                  <p className="text-xs font-medium text-[#d87706] uppercase mb-1">Issue Type</p>
                  <p className="text-sm font-bold text-gray-900">{issue.issueType}</p>
                </div>
                <div>
                  <p className="text-xs font-medium text-[#d87706] uppercase mb-1">Delivery Person</p>
                  <p className="text-sm font-bold text-gray-900">{issue.deliveryPerson}</p>
                </div>
                <div>
                  <p className="text-xs font-medium text-[#d87706] uppercase mb-1">Reported Date</p>
                  <p className="text-sm font-bold text-gray-900">{new Date(issue.createdAt).toLocaleDateString()}</p>
                </div>
                <div className="col-span-2">
                  <p className="text-xs font-medium text-[#d87706] uppercase mb-1">Description</p>
                  <p className="text-sm text-gray-700 bg-[#d87706]/10 p-3 rounded-md border border-[#d87706]/20">{issue.description}</p>
                </div>
              </div>
            </div>
          </div>

          {/* Response Form */}
          <div className="bg-white">
            <form onSubmit={handleSubmit} className="p-6">
              {/* Form Container */}
              <div className="bg-gradient-to-r from-[#d87706]/10 to-[#b55309]/10 p-6 rounded-2xl border border-[#d87706]/20 shadow-sm mb-6">
                <h4 className="text-lg font-semibold text-[#d87706] mb-6 flex items-center gap-2">
                  <FaReply className="text-[#d87706]" />
                  Support Response
                </h4>
                
                <div className="space-y-6">
                <div>
                  <label htmlFor="status" className="block text-sm font-medium text-gray-700 mb-1">
                    Status*
                  </label>
                  <select
                    id="status"
                    name="status"
                    value={formData.status}
                    onChange={handleInputChange}
                    className={`mt-1 block w-full pl-3 pr-10 py-2 text-base border-gray-300 focus:outline-none focus:ring-[#d87706] focus:border-[#d87706] rounded-md shadow-sm ${
                      formErrors.status ? 'border-red-300' : ''
                    }`}
                    required
                  >
                    <option value="In Progress">In Progress</option>
                    <option value="Resolved">Resolved</option>
                    <option value="Pending">Pending</option>
                  </select>
                  {formErrors.status && (
                    <p className="mt-1 text-sm text-red-600">{formErrors.status}</p>
                  )}
                </div>

                <div>
                  <label htmlFor="responseText" className="block text-sm font-medium text-gray-700 mb-1">
                    Response*
                  </label>
                  <textarea
                    id="responseText"
                    name="responseText"
                    value={formData.responseText}
                    onChange={handleInputChange}
                    rows={4}
                    className={`mt-1 block w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-[#d87706] focus:border-[#d87706] ${
                      formErrors.responseText ? 'border-red-300' : ''
                    }`}
                    placeholder="Enter your response to this issue (letters, spaces, and basic punctuation only)"
                    required
                  />
                  <div className="flex justify-between items-center mt-2">
                    <p className="text-xs text-gray-500 font-medium">{formData.responseText.length} characters (minimum 5)</p>
                    <div className={`w-3 h-3 rounded-full shadow-sm ${formData.responseText.trim().length >= 5 ? 'bg-emerald-400' : 'bg-red-400'}`}></div>
                  </div>
                  <p className="text-xs text-gray-400 mt-1">Only letters, spaces, and basic punctuation (.,!?'"-) are allowed</p>
                  {formErrors.responseText && (
                    <p className="mt-1 text-sm text-red-600">{formErrors.responseText}</p>
                  )}
                </div>

                <div>
                  <label htmlFor="actionTaken" className="block text-sm font-medium text-gray-700 mb-1">
                    Action Taken (Optional)
                  </label>
                  <textarea
                    id="actionTaken"
                    name="actionTaken"
                    value={formData.actionTaken}
                    onChange={handleInputChange}
                    rows={3}
                    className="mt-1 block w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-[#d87706] focus:border-[#d87706]"
                    placeholder="Describe any actions taken to address this issue (letters, spaces, and basic punctuation only)"
                  />
                  <p className="text-xs text-gray-400 mt-1">Only letters, spaces, and basic punctuation (.,!?'"-) are allowed</p>
                </div>
                
                </div>
              </div>

              <div className="flex justify-end gap-3 pt-5 border-t border-gray-200">
                  <button
                    type="button"
                    onClick={onClose}
                    className="py-2 px-4 border border-gray-300 rounded-md shadow-sm text-sm font-medium text-gray-700 bg-white hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-[#d87706] transition-colors"
                  >
                    Cancel
                  </button>
                  <button
                    type="submit"
                    disabled={isSubmitting || !formData.responseText.trim() || formData.responseText.trim().length < 5}
                    className={`inline-flex items-center py-2 px-4 border border-transparent rounded-md shadow-sm text-sm font-medium text-white bg-[#d87706] hover:bg-[#b55309] focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-[#d87706] transition-colors ${
                      isSubmitting || !formData.responseText.trim() || formData.responseText.trim().length < 5 ? 'opacity-70 cursor-not-allowed' : ''
                    }`}
                  >
                    <FaReply className="mr-2" />
                    {isSubmitting ? 'Submitting...' : 'Submit Response'}
                  </button>
                </div>
            </form>
          </div>
        </div>
      </div>
    </div>
  );
};

export default DeliveryResponseModal;