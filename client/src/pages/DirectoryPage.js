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
  GlobeAltIcon
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
        <button
          className="btn-primary flex items-center"
          onClick={() => setShowAddModal(true)}
        >
          <PlusIcon className="h-5 w-5 mr-2" />
          Add Contact
        </button>
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

      {/* Contacts Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {contacts.map((contact) => {
          const TypeIcon = getContactTypeIcon(contact.contact_type);
          return (
            <div key={contact.id} className="bg-white rounded-lg shadow-sm border hover:shadow-md transition-shadow">
              <div className="p-6">
                {/* Header */}
                <div className="flex items-start justify-between mb-4">
                  <div className="flex items-center space-x-3">
                    <div className="flex-shrink-0">
                      <div className="h-10 w-10 rounded-full bg-gray-100 flex items-center justify-center">
                        <TypeIcon className="h-5 w-5 text-gray-600" />
                      </div>
                    </div>
                    <div className="flex-1 min-w-0">
                      <h3 className="text-lg font-medium text-gray-900 truncate">
                        {contact.contact_name}
                      </h3>
                      {contact.title && (
                        <p className="text-sm text-gray-500 truncate">{contact.title}</p>
                      )}
                    </div>
                  </div>
                  
                  <div className="flex items-center space-x-2">
                    <span className={`inline-flex items-center px-2 py-1 rounded-full text-xs font-medium ${getContactTypeColor(contact.contact_type)}`}>
                      {contact.contact_type}
                    </span>
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
                  </div>
                </div>

                {/* Organization */}
                {contact.organization && (
                  <div className="flex items-center text-sm text-gray-600 mb-2">
                    <BuildingOfficeIcon className="h-4 w-4 mr-2 flex-shrink-0" />
                    <span className="truncate">{contact.organization}</span>
                  </div>
                )}

                {/* Contact Info */}
                <div className="space-y-2">
                  {contact.email && (
                    <div className="flex items-center text-sm text-gray-600">
                      <EnvelopeIcon className="h-4 w-4 mr-2 flex-shrink-0" />
                      <a 
                        href={`mailto:${contact.email}`}
                        className="text-blue-600 hover:text-blue-500 truncate"
                      >
                        {contact.email}
                      </a>
                    </div>
                  )}
                  
                  {contact.phone && (
                    <div className="flex items-center text-sm text-gray-600">
                      <PhoneIcon className="h-4 w-4 mr-2 flex-shrink-0" />
                      <a 
                        href={`tel:${contact.phone}`}
                        className="text-blue-600 hover:text-blue-500"
                      >
                        {formatPhone(contact.phone)}
                      </a>
                    </div>
                  )}
                  
                  {(contact.address || contact.city || contact.state) && (
                    <div className="flex items-start text-sm text-gray-600">
                      <MapPinIcon className="h-4 w-4 mr-2 flex-shrink-0 mt-0.5" />
                      <div className="truncate">
                        {contact.address && <div>{contact.address}</div>}
                        {(contact.city || contact.state) && (
                          <div>
                            {contact.city}{contact.city && contact.state && ', '}{contact.state} {contact.zip_code}
                          </div>
                        )}
                      </div>
                    </div>
                  )}
                  
                  {contact.website && (
                    <div className="flex items-center text-sm text-gray-600">
                      <GlobeAltIcon className="h-4 w-4 mr-2 flex-shrink-0" />
                      <a 
                        href={contact.website.startsWith('http') ? contact.website : `https://${contact.website}`}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="text-blue-600 hover:text-blue-500 truncate"
                      >
                        {contact.website}
                      </a>
                    </div>
                  )}
                </div>

                {/* Notes */}
                {contact.notes && (
                  <div className="mt-3 pt-3 border-t border-gray-100">
                    <p className="text-sm text-gray-600 line-clamp-2">
                      {contact.notes}
                    </p>
                  </div>
                )}

                {/* Footer */}
                <div className="mt-4 pt-3 border-t border-gray-100 text-xs text-gray-500">
                  Added by {contact.added_by_first_name} {contact.added_by_last_name}
                </div>
              </div>
            </div>
          );
        })}
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
    </div>
  );
};

export default DirectoryPage; 