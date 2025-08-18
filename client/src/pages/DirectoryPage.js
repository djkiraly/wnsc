import React, { useState, useEffect } from 'react';
import {
  MagnifyingGlassIcon,
  BookOpenIcon,
  PlusIcon,
  PencilIcon,
  TrashIcon,
  EllipsisVerticalIcon,
  BuildingOfficeIcon,
  UserIcon,
  EnvelopeIcon,
  PhoneIcon,
  MapPinIcon,
  GlobeAltIcon,
  DocumentArrowUpIcon,
  DocumentArrowDownIcon,
  XMarkIcon,
  CheckCircleIcon,
  ExclamationTriangleIcon
} from '@heroicons/react/24/outline';
import { useAuth } from '../contexts/AuthContext';
import ContactForm from '../components/ContactForm';

const DirectoryPage = () => {
  const [contacts, setContacts] = useState([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [typeFilter, setTypeFilter] = useState('all');
  const [showAddModal, setShowAddModal] = useState(false);
  const [selectedContact, setSelectedContact] = useState(null);
  const [showEditModal, setShowEditModal] = useState(false);
  const [showDropdown, setShowDropdown] = useState(null);
  const [showImportModal, setShowImportModal] = useState(false);
  const [importFile, setImportFile] = useState(null);
  const [importing, setImporting] = useState(false);
  const [importResult, setImportResult] = useState(null);
  const [showQuickAdd, setShowQuickAdd] = useState(false);
  const [quickAddData, setQuickAddData] = useState({
    contact_name: '',
    organization: '',
    email: '',
    phone: '',
    city: '',
    state: '',
    contact_type: 'contact'
  });
  const [addingQuick, setAddingQuick] = useState(false);
  const { user } = useAuth();

  // Fetch contacts on component mount
  useEffect(() => {
    fetchContacts();
  }, [searchTerm, typeFilter]);

  const fetchContacts = async () => {
    try {
      setLoading(true);
      const params = new URLSearchParams();
      if (searchTerm) params.append('search', searchTerm);
      if (typeFilter !== 'all') params.append('type', typeFilter);

      const response = await fetch(`/api/directory?${params.toString()}`, {
        credentials: 'include'
      });
      const data = await response.json();
      
      if (data.success) {
        setContacts(data.contacts);
      } else {
        console.error('Failed to fetch contacts:', data.message);
      }
    } catch (error) {
      console.error('Error fetching contacts:', error);
    } finally {
      setLoading(false);
    }
  };

  const deleteContact = async (contactId) => {
    if (!window.confirm('Are you sure you want to delete this contact?')) {
      return;
    }

    try {
      const response = await fetch(`/api/directory/${contactId}`, {
        method: 'DELETE',
        credentials: 'include'
      });
      
      const data = await response.json();
      
      if (data.success) {
        setContacts(contacts.filter(contact => contact.id !== contactId));
        setShowDropdown(null);
      } else {
        console.error('Failed to delete contact:', data.message);
      }
    } catch (error) {
      console.error('Error deleting contact:', error);
    }
  };

  const addContact = async (contactData) => {
    try {
      const response = await fetch('/api/directory', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        credentials: 'include',
        body: JSON.stringify(contactData)
      });
      
      const data = await response.json();
      
      if (data.success) {
        // Add the new contact to the list
        setContacts([...contacts, { 
          ...data.contact, 
          added_by_first_name: user.firstName,
          added_by_last_name: user.lastName
        }]);
        setShowAddModal(false);
      } else {
        throw new Error(data.message);
      }
    } catch (error) {
      console.error('Error adding contact:', error);
      throw error;
    }
  };

  const updateContact = async (contactData) => {
    try {
      const response = await fetch(`/api/directory/${selectedContact.id}`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
        },
        credentials: 'include',
        body: JSON.stringify(contactData)
      });
      
      const data = await response.json();
      
      if (data.success) {
        // Update the contact in the list
        setContacts(contacts.map(contact => 
          contact.id === selectedContact.id 
            ? { ...data.contact, added_by_first_name: contact.added_by_first_name, added_by_last_name: contact.added_by_last_name }
            : contact
        ));
        setShowEditModal(false);
        setSelectedContact(null);
      } else {
        throw new Error(data.message);
      }
    } catch (error) {
      console.error('Error updating contact:', error);
      throw error;
    }
  };

  const handleFileChange = (event) => {
    const file = event.target.files[0];
    if (file) {
      if (file.type === 'text/csv' || file.name.toLowerCase().endsWith('.csv')) {
        setImportFile(file);
        setImportResult(null);
      } else {
        alert('Please select a CSV file.');
        event.target.value = '';
      }
    }
  };

  const downloadTemplate = async () => {
    try {
      const response = await fetch('/api/directory/import/template', {
        credentials: 'include'
      });
      
      if (response.ok) {
        const blob = await response.blob();
        const url = window.URL.createObjectURL(blob);
        const a = document.createElement('a');
        a.href = url;
        a.download = 'directory_import_template.csv';
        document.body.appendChild(a);
        a.click();
        window.URL.revokeObjectURL(url);
        document.body.removeChild(a);
      } else {
        throw new Error('Failed to download template');
      }
    } catch (error) {
      console.error('Error downloading template:', error);
      alert('Failed to download template');
    }
  };

  const handleImport = async () => {
    if (!importFile) {
      alert('Please select a CSV file to import.');
      return;
    }

    setImporting(true);
    setImportResult(null);

    try {
      const formData = new FormData();
      formData.append('csvFile', importFile);

      const response = await fetch('/api/directory/import', {
        method: 'POST',
        credentials: 'include',
        body: formData
      });

      const data = await response.json();
      setImportResult(data);

      if (data.success) {
        // Refresh the contacts list
        fetchContacts();
        setImportFile(null);
        // Reset file input
        const fileInput = document.querySelector('input[type="file"]');
        if (fileInput) fileInput.value = '';
      }
    } catch (error) {
      console.error('Error importing CSV:', error);
      setImportResult({
        success: false,
        message: 'Failed to import CSV file',
        error: error.message
      });
    } finally {
      setImporting(false);
    }
  };

  const closeImportModal = () => {
    setShowImportModal(false);
    setImportFile(null);
    setImportResult(null);
    const fileInput = document.querySelector('input[type="file"]');
    if (fileInput) fileInput.value = '';
  };

  const handleQuickAdd = async () => {
    if (!quickAddData.contact_name.trim()) {
      alert('Contact name is required');
      return;
    }

    setAddingQuick(true);
    try {
      await addContact(quickAddData);
      setQuickAddData({
        contact_name: '',
        organization: '',
        email: '',
        phone: '',
        city: '',
        state: '',
        contact_type: 'contact'
      });
      setShowQuickAdd(false);
    } catch (error) {
      alert('Failed to add contact: ' + error.message);
    } finally {
      setAddingQuick(false);
    }
  };

  const cancelQuickAdd = () => {
    setShowQuickAdd(false);
    setQuickAddData({
      contact_name: '',
      organization: '',
      email: '',
      phone: '',
      city: '',
      state: '',
      contact_type: 'contact'
    });
  };

  const getContactTypeIcon = (type) => {
    switch (type) {
      case 'organization': return BuildingOfficeIcon;
      case 'vendor': return BuildingOfficeIcon;
      case 'sponsor': return BuildingOfficeIcon;
      case 'partner': return BuildingOfficeIcon;
      default: return UserIcon;
    }
  };

  const getContactTypeColor = (type) => {
    switch (type) {
      case 'organization': return 'bg-blue-100 text-blue-800';
      case 'vendor': return 'bg-green-100 text-green-800';
      case 'sponsor': return 'bg-purple-100 text-purple-800';
      case 'partner': return 'bg-yellow-100 text-yellow-800';
      default: return 'bg-gray-100 text-gray-800';
    }
  };

  const formatPhone = (phone) => {
    if (!phone) return '';
    // Simple phone formatting - you can enhance this
    const cleaned = phone.replace(/\D/g, '');
    if (cleaned.length === 10) {
      return `(${cleaned.slice(0, 3)}) ${cleaned.slice(3, 6)}-${cleaned.slice(6)}`;
    }
    return phone;
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center py-12">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
        <span className="ml-2 text-gray-600">Loading directory...</span>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div className="flex items-center space-x-3">
          <BookOpenIcon className="h-8 w-8 text-blue-600" />
          <div>
            <h1 className="text-2xl font-bold text-gray-900">Directory</h1>
            <p className="text-gray-600">Manage contacts and organizations</p>
          </div>
        </div>
        <div className="flex items-center space-x-3">
          <button
            className="btn-secondary flex items-center"
            onClick={() => setShowImportModal(true)}
          >
            <DocumentArrowUpIcon className="h-5 w-5 mr-2" />
            Import CSV
          </button>
          <button
            className="btn-secondary flex items-center"
            onClick={() => setShowQuickAdd(!showQuickAdd)}
          >
            <PlusIcon className="h-5 w-5 mr-2" />
            Quick Add
          </button>
          <button
            className="btn-primary flex items-center"
            onClick={() => setShowAddModal(true)}
          >
            <PlusIcon className="h-5 w-5 mr-2" />
            Add Contact
          </button>
        </div>
      </div>

      {/* Search and Filters */}
      <div className="bg-white p-6 rounded-lg shadow-sm border">
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          {/* Search */}
          <div className="md:col-span-2">
            <div className="relative">
              <MagnifyingGlassIcon className="absolute left-3 top-1/2 transform -translate-y-1/2 h-5 w-5 text-gray-400" />
              <input
                type="text"
                placeholder="Search contacts by name, organization, email, or phone..."
                className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
              />
            </div>
          </div>

          {/* Type Filter */}
          <div>
            <select
              className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
              value={typeFilter}
              onChange={(e) => setTypeFilter(e.target.value)}
            >
              <option value="all">All Types</option>
              <option value="contact">Contact</option>
              <option value="organization">Organization</option>
              <option value="vendor">Vendor</option>
              <option value="sponsor">Sponsor</option>
              <option value="partner">Partner</option>
            </select>
          </div>
        </div>
      </div>

      {/* Stats */}
      <div className="bg-white p-4 rounded-lg shadow-sm border">
        <div className="text-sm text-gray-600">
          Showing {contacts.length} contacts
        </div>
      </div>

      {/* Contacts Table */}
      <div className="bg-white rounded-lg shadow-sm border overflow-hidden">
        <div className="overflow-x-auto">
          <table className="min-w-full divide-y divide-gray-200">
            <thead className="bg-gray-50">
              <tr>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Contact
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Organization
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Contact Info
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Location
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Type
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Added By
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Last Modified
                </th>
                <th className="relative px-6 py-3">
                  <span className="sr-only">Actions</span>
                </th>
              </tr>
            </thead>
            <tbody className="bg-white divide-y divide-gray-200">
              {/* Quick Add Row */}
              {showQuickAdd && (
                <tr className="bg-blue-50 border-l-4 border-blue-500">
                  {/* Contact */}
                  <td className="px-6 py-4 whitespace-nowrap">
                    <input
                      type="text"
                      placeholder="Contact name *"
                      className="w-full text-sm border border-gray-300 rounded px-2 py-1 focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                      value={quickAddData.contact_name}
                      onChange={(e) => setQuickAddData({...quickAddData, contact_name: e.target.value})}
                    />
                  </td>

                  {/* Organization */}
                  <td className="px-6 py-4 whitespace-nowrap">
                    <input
                      type="text"
                      placeholder="Organization"
                      className="w-full text-sm border border-gray-300 rounded px-2 py-1 focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                      value={quickAddData.organization}
                      onChange={(e) => setQuickAddData({...quickAddData, organization: e.target.value})}
                    />
                  </td>

                  {/* Contact Info */}
                  <td className="px-6 py-4 whitespace-nowrap">
                    <div className="space-y-1">
                      <input
                        type="email"
                        placeholder="Email"
                        className="w-full text-sm border border-gray-300 rounded px-2 py-1 focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                        value={quickAddData.email}
                        onChange={(e) => setQuickAddData({...quickAddData, email: e.target.value})}
                      />
                      <input
                        type="tel"
                        placeholder="Phone"
                        className="w-full text-sm border border-gray-300 rounded px-2 py-1 focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                        value={quickAddData.phone}
                        onChange={(e) => setQuickAddData({...quickAddData, phone: e.target.value})}
                      />
                    </div>
                  </td>

                  {/* Location */}
                  <td className="px-6 py-4 whitespace-nowrap">
                    <div className="space-y-1">
                      <input
                        type="text"
                        placeholder="City"
                        className="w-full text-sm border border-gray-300 rounded px-2 py-1 focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                        value={quickAddData.city}
                        onChange={(e) => setQuickAddData({...quickAddData, city: e.target.value})}
                      />
                      <input
                        type="text"
                        placeholder="State"
                        className="w-full text-sm border border-gray-300 rounded px-2 py-1 focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                        value={quickAddData.state}
                        onChange={(e) => setQuickAddData({...quickAddData, state: e.target.value})}
                      />
                    </div>
                  </td>

                  {/* Type */}
                  <td className="px-6 py-4 whitespace-nowrap">
                    <select
                      className="w-full text-sm border border-gray-300 rounded px-2 py-1 focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                      value={quickAddData.contact_type}
                      onChange={(e) => setQuickAddData({...quickAddData, contact_type: e.target.value})}
                    >
                      <option value="contact">Contact</option>
                      <option value="organization">Organization</option>
                      <option value="vendor">Vendor</option>
                      <option value="sponsor">Sponsor</option>
                      <option value="partner">Partner</option>
                    </select>
                  </td>

                  {/* Added By */}
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                    {user.first_name} {user.last_name}
                  </td>

                  {/* Last Modified */}
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                    -
                  </td>

                  {/* Actions */}
                  <td className="px-6 py-4 whitespace-nowrap text-right text-sm font-medium">
                    <div className="flex items-center space-x-2">
                      <button
                        onClick={handleQuickAdd}
                        disabled={addingQuick}
                        className="text-green-600 hover:text-green-500 disabled:opacity-50"
                      >
                        {addingQuick ? (
                          <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-green-600"></div>
                        ) : (
                          <CheckCircleIcon className="h-5 w-5" />
                        )}
                      </button>
                      <button
                        onClick={cancelQuickAdd}
                        className="text-red-600 hover:text-red-500"
                      >
                        <XMarkIcon className="h-5 w-5" />
                      </button>
                    </div>
                  </td>
                </tr>
              )}

              {contacts.map((contact) => {
                const TypeIcon = getContactTypeIcon(contact.contact_type);
                return (
                  <tr key={contact.id} className="hover:bg-gray-50">
                    {/* Contact */}
                    <td className="px-6 py-4 whitespace-nowrap">
                      <div className="flex items-center">
                        <div className="flex-shrink-0 h-8 w-8">
                          <div className="h-8 w-8 rounded-full bg-gray-100 flex items-center justify-center">
                            <TypeIcon className="h-4 w-4 text-gray-600" />
                          </div>
                        </div>
                        <div className="ml-4">
                          <div className="text-sm font-medium text-gray-900">
                            {contact.contact_name}
                          </div>
                          {contact.title && (
                            <div className="text-sm text-gray-500">
                              {contact.title}
                            </div>
                          )}
                        </div>
                      </div>
                    </td>

                    {/* Organization */}
                    <td className="px-6 py-4 whitespace-nowrap">
                      <div className="text-sm text-gray-900">
                        {contact.organization || '-'}
                      </div>
                    </td>

                    {/* Contact Info */}
                    <td className="px-6 py-4 whitespace-nowrap">
                      <div className="space-y-1">
                        {contact.email && (
                          <div className="text-sm">
                            <a 
                              href={`mailto:${contact.email}`}
                              className="text-blue-600 hover:text-blue-500"
                            >
                              {contact.email}
                            </a>
                          </div>
                        )}
                        {contact.phone && (
                          <div className="text-sm">
                            <a 
                              href={`tel:${contact.phone}`}
                              className="text-blue-600 hover:text-blue-500"
                            >
                              {formatPhone(contact.phone)}
                            </a>
                          </div>
                        )}
                        {contact.website && (
                          <div className="text-sm">
                            <a 
                              href={contact.website.startsWith('http') ? contact.website : `https://${contact.website}`}
                              target="_blank"
                              rel="noopener noreferrer"
                              className="text-blue-600 hover:text-blue-500"
                            >
                              Website
                            </a>
                          </div>
                        )}
                      </div>
                    </td>

                    {/* Location */}
                    <td className="px-6 py-4 whitespace-nowrap">
                      <div className="text-sm text-gray-900">
                        {contact.city || contact.state ? (
                          <div>
                            {contact.city}{contact.city && contact.state && ', '}{contact.state}
                          </div>
                        ) : '-'}
                      </div>
                      {contact.address && (
                        <div className="text-sm text-gray-500 truncate max-w-xs">
                          {contact.address}
                        </div>
                      )}
                    </td>

                    {/* Type */}
                    <td className="px-6 py-4 whitespace-nowrap">
                      <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${getContactTypeColor(contact.contact_type)}`}>
                        {contact.contact_type}
                      </span>
                    </td>

                    {/* Added By */}
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                      {contact.added_by_first_name} {contact.added_by_last_name}
                    </td>

                    {/* Last Modified */}
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                      <div>
                        {contact.updated_at ? new Date(contact.updated_at).toLocaleDateString() : '-'}
                      </div>
                      {contact.modified_by_first_name && (
                        <div className="text-xs text-gray-400">
                          by {contact.modified_by_first_name} {contact.modified_by_last_name}
                        </div>
                      )}
                    </td>

                    {/* Actions */}
                    <td className="px-6 py-4 whitespace-nowrap text-right text-sm font-medium">
                      <div className="relative">
                        <button
                          className="text-gray-400 hover:text-gray-600 p-1"
                          onClick={() => setShowDropdown(showDropdown === contact.id ? null : contact.id)}
                        >
                          <EllipsisVerticalIcon className="h-5 w-5" />
                        </button>
                        
                        {showDropdown === contact.id && (
                          <div className="absolute right-0 mt-2 w-48 bg-white rounded-md shadow-lg z-10 border">
                            <div className="py-1">
                              <button
                                className="block w-full text-left px-4 py-2 text-sm text-gray-700 hover:bg-gray-100"
                                onClick={() => {
                                  setSelectedContact(contact);
                                  setShowEditModal(true);
                                  setShowDropdown(null);
                                }}
                              >
                                <PencilIcon className="h-4 w-4 inline mr-2" />
                                Edit Contact
                              </button>
                              <button
                                className="block w-full text-left px-4 py-2 text-sm text-red-700 hover:bg-red-50"
                                onClick={() => deleteContact(contact.id)}
                              >
                                <TrashIcon className="h-4 w-4 inline mr-2" />
                                Delete Contact
                              </button>
                            </div>
                          </div>
                        )}
                      </div>
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      </div>

      {contacts.length === 0 && (
        <div className="text-center py-12">
          <BookOpenIcon className="mx-auto h-12 w-12 text-gray-400" />
          <h3 className="mt-2 text-sm font-medium text-gray-900">No contacts found</h3>
          <p className="mt-1 text-sm text-gray-500">
            {searchTerm || typeFilter !== 'all' 
              ? 'Try adjusting your search or filter criteria.'
              : 'Get started by adding your first contact.'
            }
          </p>
          {!searchTerm && typeFilter === 'all' && (
            <div className="mt-6">
              <button
                className="btn-primary"
                onClick={() => setShowAddModal(true)}
              >
                <PlusIcon className="h-5 w-5 mr-2" />
                Add Contact
              </button>
            </div>
          )}
        </div>
      )}

      {/* Contact Forms */}
      <ContactForm
        isOpen={showAddModal}
        onClose={() => setShowAddModal(false)}
        onSave={addContact}
        title="Add New Contact"
      />

      <ContactForm
        isOpen={showEditModal}
        onClose={() => {
          setShowEditModal(false);
          setSelectedContact(null);
        }}
        onSave={updateContact}
        contact={selectedContact}
        title="Edit Contact"
      />

      {/* Import Modal */}
      {showImportModal && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-white rounded-lg p-6 w-full max-w-md mx-4">
            <div className="flex items-center justify-between mb-4">
              <h2 className="text-lg font-semibold text-gray-900">Import Contacts from CSV</h2>
              <button
                onClick={closeImportModal}
                className="text-gray-400 hover:text-gray-600"
              >
                <XMarkIcon className="h-6 w-6" />
              </button>
            </div>

            <div className="space-y-4">
              {/* Template Download */}
              <div className="bg-blue-50 p-4 rounded-lg">
                <div className="flex items-start">
                  <DocumentArrowDownIcon className="h-5 w-5 text-blue-600 mt-0.5 mr-3 flex-shrink-0" />
                  <div className="flex-1">
                    <h3 className="text-sm font-medium text-blue-900">Need a template?</h3>
                    <p className="text-sm text-blue-700 mt-1">
                      Download our CSV template with sample data and proper column headers.
                    </p>
                    <button
                      onClick={downloadTemplate}
                      className="mt-2 text-sm text-blue-600 hover:text-blue-500 font-medium"
                    >
                      Download Template
                    </button>
                  </div>
                </div>
              </div>

              {/* File Upload */}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Select CSV File
                </label>
                <input
                  type="file"
                  accept=".csv"
                  onChange={handleFileChange}
                  className="block w-full text-sm text-gray-500 file:mr-4 file:py-2 file:px-4 file:rounded-lg file:border-0 file:text-sm file:font-medium file:bg-blue-50 file:text-blue-700 hover:file:bg-blue-100"
                />
                {importFile && (
                  <p className="mt-2 text-sm text-gray-600">
                    Selected: {importFile.name} ({(importFile.size / 1024).toFixed(1)} KB)
                  </p>
                )}
              </div>

              {/* CSV Format Info */}
              <div className="bg-gray-50 p-4 rounded-lg">
                <h4 className="text-sm font-medium text-gray-900 mb-2">Expected Columns:</h4>
                <div className="text-xs text-gray-600 space-y-1">
                  <div><strong>contact_name</strong> (required) - Full name</div>
                  <div><strong>organization</strong> - Company/Organization</div>
                  <div><strong>title</strong> - Job title</div>
                  <div><strong>email</strong> - Email address</div>
                  <div><strong>phone</strong> - Phone number</div>
                  <div><strong>address</strong> - Street address</div>
                  <div><strong>city</strong> - City</div>
                  <div><strong>state</strong> - State/Province</div>
                  <div><strong>zip_code</strong> - ZIP/Postal code</div>
                  <div><strong>website</strong> - Website URL</div>
                  <div><strong>notes</strong> - Additional notes</div>
                  <div><strong>contact_type</strong> - contact, organization, vendor, sponsor, or partner</div>
                </div>
              </div>

              {/* Import Result */}
              {importResult && (
                <div className={`p-4 rounded-lg ${importResult.success ? 'bg-green-50' : 'bg-red-50'}`}>
                  <div className="flex items-start">
                    {importResult.success ? (
                      <CheckCircleIcon className="h-5 w-5 text-green-600 mt-0.5 mr-3 flex-shrink-0" />
                    ) : (
                      <ExclamationTriangleIcon className="h-5 w-5 text-red-600 mt-0.5 mr-3 flex-shrink-0" />
                    )}
                    <div className="flex-1">
                      <h4 className={`text-sm font-medium ${importResult.success ? 'text-green-900' : 'text-red-900'}`}>
                        {importResult.success ? 'Import Successful!' : 'Import Failed'}
                      </h4>
                      <p className={`text-sm mt-1 ${importResult.success ? 'text-green-700' : 'text-red-700'}`}>
                        {importResult.message}
                      </p>
                      {importResult.success && (
                        <p className="text-sm text-green-700 mt-1">
                          Imported {importResult.importedCount} out of {importResult.totalRows} contacts.
                        </p>
                      )}
                      {importResult.errors && importResult.errors.length > 0 && (
                        <div className="mt-2">
                          <p className="text-sm text-red-700 font-medium">Errors:</p>
                          <ul className="text-xs text-red-600 mt-1 space-y-1 max-h-32 overflow-y-auto">
                            {importResult.errors.slice(0, 10).map((error, index) => (
                              <li key={index}>• {error}</li>
                            ))}
                            {importResult.errors.length > 10 && (
                              <li className="text-red-500">... and {importResult.errors.length - 10} more errors</li>
                            )}
                          </ul>
                        </div>
                      )}
                    </div>
                  </div>
                </div>
              )}

              {/* Action Buttons */}
              <div className="flex justify-end space-x-3 pt-4">
                <button
                  onClick={closeImportModal}
                  className="px-4 py-2 text-sm font-medium text-gray-700 bg-white border border-gray-300 rounded-lg hover:bg-gray-50"
                >
                  Cancel
                </button>
                <button
                  onClick={handleImport}
                  disabled={!importFile || importing}
                  className="px-4 py-2 text-sm font-medium text-white bg-blue-600 rounded-lg hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed flex items-center"
                >
                  {importing ? (
                    <>
                      <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white mr-2"></div>
                      Importing...
                    </>
                  ) : (
                    <>
                      <DocumentArrowUpIcon className="h-4 w-4 mr-2" />
                      Import Contacts
                    </>
                  )}
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default DirectoryPage; 