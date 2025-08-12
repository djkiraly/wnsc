import React from 'react';
import { useParams } from 'react-router-dom';

const EventDetailPage = () => {
  const { id } = useParams();
  
  return (
    <div className="space-y-6">
      <h1 className="text-2xl font-bold text-gray-900">Event Details</h1>
      
      <div className="card">
        <div className="text-center py-12">
          <h3 className="text-lg font-medium text-gray-900 mb-2">Event Detail View</h3>
          <p className="text-gray-600">Viewing event ID: {id}</p>
          <p className="text-gray-600">Detailed event view will be implemented in the next phase.</p>
        </div>
      </div>
    </div>
  );
};

export default EventDetailPage;