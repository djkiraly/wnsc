import React from 'react';

const EventsPage = () => {
  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <h1 className="text-2xl font-bold text-gray-900">Events</h1>
        <button className="btn-primary">Create Event</button>
      </div>
      
      <div className="card">
        <div className="text-center py-12">
          <h3 className="text-lg font-medium text-gray-900 mb-2">Events Coming Soon</h3>
          <p className="text-gray-600">Event management functionality will be implemented in the next phase.</p>
        </div>
      </div>
    </div>
  );
};

export default EventsPage;