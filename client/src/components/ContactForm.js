import React, { useState, useEffect } from 'react';
import { XMarkIcon } from '@heroicons/react/24/outline';

const ContactForm = ({ 
  isOpen, 
  onClose, 
  onSave, 
  contact = null, 
  title = "Add New Contact" 
}) => {
  const [formData, setFormData] = useState({
    contact_name: '',
    organization: '',
    title: '',
    email: '',
    phone: '',
    address: '',
    city: '',
    state: '',
    zip_code: '',
    website: '',
    notes: '',
    contact_type: 'contact'
  });
  
  const [errors, setErrors] = useState({});
  const [saving, setSaving] = useState(false);

  // Initialize form data when contact changes
  useEffect(() => {
    if (contact) {
      setFormData({
        contact_name: contact.contact_name || '',
        organization: contact.organization || '',
        title: contact.title || '',
        email: contact.email || '',
        phone: contact.phone || '',
        address: contact.address || '',
        city: contact.city || '',
        state: contact.state || '',
        zip_code: contact.zip_code || '',
        website: contact.website || '',
        notes: contact.notes || '',
        contact_type: contact.contact_type || 'contact'
      });
    } else {
      // Reset form for new contact
      setFormData({
        contact_name: '',
        organization: '',
        title: '',
        email: '',
        phone: '',
        address: '',
        city: '',
        state: '',
        zip_code: '',
        website: '',
        notes: '',
        contact_type: 'contact'
      });
    }
    setErrors({});
  }, [contact]);

  const handleInputChange = (field, value) => {
    setFormData({ ...formData, [field]: value });
    // Clear error for this field when user starts typing
    if (errors[field]) {
      setErrors({ ...errors, [field]: '' });
    }
  };

  const validateForm = () => {
    const newErrors = {};

    // Required field validation
    if (!formData.contact_name?.trim()) {
      newErrors.contact_name = 'Contact name is required';
    }

    // Email validation
    if (formData.email && formData.email.trim() !== '') {
      const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
      if (!emailRegex.test(formData.email)) {
        newErrors.email = 'Invalid email format';
      }
    }

    // Phone validation
    if (formData.phone && formData.phone.trim() !== '') {
      const phoneRegex = /^[\d\s\-\+\(\)\.]+$/;
      if (!phoneRegex.test(formData.phone)) {
        newErrors.phone = 'Invalid phone number format';
      }
    }

    // Website validation
    if (formData.website && formData.website.trim() !== '') {
      const websiteRegex = /^(https?:\/\/)?([\da-z\.-]+)\.([a-z\.]{2,6})([\/\w \.-]*)*\/?$/;
      if (!websiteRegex.test(formData.website)) {
        newErrors.website = 'Invalid website URL format';
      }
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    
    if (!validateForm()) {
      return;
    }

    setSaving(true);
    try {
      await onSave(formData);
      onClose();
    } catch (error) {
      setErrors({ general: error.message || 'Failed to save contact' });
    } finally {
      setSaving(false);
    }
  };

  const handleClose = () => {
    setFormData({
      contact_name: '',
      organization: '',
      title: '',
      email: '',
      phone: '',
      address: '',
      city: '',
      state: '',
      zip_code: '',
      website: '',
      notes: '',
      contact_type: 'contact'
    });
    setErrors({});
    onClose();
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 bg-gray-600 bg-opacity-50 overflow-y-auto h-full w-full z-50">
      <div className="relative top-10 mx-auto p-5 border max-w-2xl shadow-lg rounded-md bg-white">
        <form onSubmit={handleSubmit}>
          {/* Header */}
          <div className="flex items-center justify-between mb-6">
            <h3 className="text-lg font-medium text-gray-900">{title}</h3>
            <button
              type="button"
              className="text-gray-400 hover:text-gray-600"
              onClick={handleClose}
            >
              <XMarkIcon className="h-6 w-6" />
            </button>
          </div>

          {/* Form Fields */}
          <div className="space-y-6">
            {/* Basic Information */}
            <div>
              <h4 className="text-sm font-medium text-gray-900 mb-3">Basic Information</h4>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Contact Name *
                  </label>
                  <input
                    type="text"
                    className={`w-full px-3 py-2 border rounded-md text-sm focus:ring-2 focus:ring-blue-500 focus:border-transparent ${
                      errors.contact_name ? 'border-red-300' : 'border-gray-300'
                    }`}
                    value={formData.contact_name}
                    onChange={(e) => handleInputChange('contact_name', e.target.value)}
                    placeholder="Full name or organization name"
                  />
                  {errors.contact_name && (
                    <p className="text-xs text-red-600 mt-1">{errors.contact_name}</p>
                  )}
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Contact Type
                  </label>
                  <select
                    className="w-full px-3 py-2 border border-gray-300 rounded-md text-sm focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                    value={formData.contact_type}
                    onChange={(e) => handleInputChange('contact_type', e.target.value)}
                  >
                    <option value="contact">Contact</option>
                    <option value="organization">Organization</option>
                    <option value="vendor">Vendor</option>
                    <option value="sponsor">Sponsor</option>
                    <option value="partner">Partner</option>
                  </select>
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Organization
                  </label>
                  <input
                    type="text"
                    className="w-full px-3 py-2 border border-gray-300 rounded-md text-sm focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                    value={formData.organization}
                    onChange={(e) => handleInputChange('organization', e.target.value)}
                    placeholder="Company or organization"
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Title/Position
                  </label>
                  <input
                    type="text"
                    className="w-full px-3 py-2 border border-gray-300 rounded-md text-sm focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                    value={formData.title}
                    onChange={(e) => handleInputChange('title', e.target.value)}
                    placeholder="Job title or position"
                  />
                </div>
              </div>
            </div>

            {/* Contact Information */}
            <div>
              <h4 className="text-sm font-medium text-gray-900 mb-3">Contact Information</h4>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Email
                  </label>
                  <input
                    type="email"
                    className={`w-full px-3 py-2 border rounded-md text-sm focus:ring-2 focus:ring-blue-500 focus:border-transparent ${
                      errors.email ? 'border-red-300' : 'border-gray-300'
                    }`}
                    value={formData.email}
                    onChange={(e) => handleInputChange('email', e.target.value)}
                    placeholder="email@example.com"
                  />
                  {errors.email && (
                    <p className="text-xs text-red-600 mt-1">{errors.email}</p>
                  )}
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Phone
                  </label>
                  <input
                    type="tel"
                    className={`w-full px-3 py-2 border rounded-md text-sm focus:ring-2 focus:ring-blue-500 focus:border-transparent ${
                      errors.phone ? 'border-red-300' : 'border-gray-300'
                    }`}
                    value={formData.phone}
                    onChange={(e) => handleInputChange('phone', e.target.value)}
                    placeholder="(555) 123-4567"
                  />
                  {errors.phone && (
                    <p className="text-xs text-red-600 mt-1">{errors.phone}</p>
                  )}
                </div>

                <div className="md:col-span-2">
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Website
                  </label>
                  <input
                    type="url"
                    className={`w-full px-3 py-2 border rounded-md text-sm focus:ring-2 focus:ring-blue-500 focus:border-transparent ${
                      errors.website ? 'border-red-300' : 'border-gray-300'
                    }`}
                    value={formData.website}
                    onChange={(e) => handleInputChange('website', e.target.value)}
                    placeholder="https://example.com"
                  />
                  {errors.website && (
                    <p className="text-xs text-red-600 mt-1">{errors.website}</p>
                  )}
                </div>
              </div>
            </div>

            {/* Address Information */}
            <div>
              <h4 className="text-sm font-medium text-gray-900 mb-3">Address</h4>
              <div className="space-y-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Street Address
                  </label>
                  <input
                    type="text"
                    className="w-full px-3 py-2 border border-gray-300 rounded-md text-sm focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                    value={formData.address}
                    onChange={(e) => handleInputChange('address', e.target.value)}
                    placeholder="123 Main Street"
                  />
                </div>

                <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                      City
                    </label>
                    <input
                      type="text"
                      className="w-full px-3 py-2 border border-gray-300 rounded-md text-sm focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                      value={formData.city}
                      onChange={(e) => handleInputChange('city', e.target.value)}
                      placeholder="City"
                    />
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                      State
                    </label>
                    <input
                      type="text"
                      className="w-full px-3 py-2 border border-gray-300 rounded-md text-sm focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                      value={formData.state}
                      onChange={(e) => handleInputChange('state', e.target.value)}
                      placeholder="State"
                    />
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                      ZIP Code
                    </label>
                    <input
                      type="text"
                      className="w-full px-3 py-2 border border-gray-300 rounded-md text-sm focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                      value={formData.zip_code}
                      onChange={(e) => handleInputChange('zip_code', e.target.value)}
                      placeholder="12345"
                    />
                  </div>
                </div>
              </div>
            </div>

            {/* Notes */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Notes
              </label>
              <textarea
                className="w-full px-3 py-2 border border-gray-300 rounded-md text-sm focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                rows="3"
                value={formData.notes}
                onChange={(e) => handleInputChange('notes', e.target.value)}
                placeholder="Additional notes about this contact..."
              />
            </div>
          </div>

          {/* Error Message */}
          {errors.general && (
            <div className="mt-4 p-3 bg-red-50 border border-red-200 rounded-md">
              <p className="text-sm text-red-600">{errors.general}</p>
            </div>
          )}

          {/* Action Buttons */}
          <div className="flex justify-end space-x-3 mt-6 pt-4 border-t border-gray-200">
            <button
              type="button"
              className="btn-secondary"
              onClick={handleClose}
              disabled={saving}
            >
              Cancel
            </button>
            <button
              type="submit"
              className="btn-primary flex items-center"
              disabled={saving}
            >
              {saving ? (
                <>
                  <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white mr-2"></div>
                  Saving...
                </>
              ) : (
                contact ? 'Update Contact' : 'Add Contact'
              )}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};

export default ContactForm; 