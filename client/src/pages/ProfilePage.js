import React from 'react';
import { useAuth } from '../contexts/AuthContext';

const ProfilePage = () => {
  const { user } = useAuth();
  
  return (
    <div className="space-y-6">
      <h1 className="text-2xl font-bold text-gray-900">Profile</h1>
      
      <div className="card">
        <div className="flex items-center space-x-4 mb-6">
          {user?.profilePicture ? (
            <img
              src={user.profilePicture}
              alt={`${user.firstName} ${user.lastName}`}
              className="w-16 h-16 rounded-full"
            />
          ) : (
            <div className="w-16 h-16 rounded-full bg-gray-300 flex items-center justify-center">
              <span className="text-xl font-medium text-gray-700">
                {user?.firstName?.[0]}{user?.lastName?.[0]}
              </span>
            </div>
          )}
          <div>
            <h2 className="text-xl font-semibold text-gray-900">
              {user?.firstName} {user?.lastName}
            </h2>
            <p className="text-gray-600 capitalize">{user?.role}</p>
            <p className="text-gray-500">{user?.email}</p>
          </div>
        </div>
        
        <div className="text-center py-8">
          <h3 className="text-lg font-medium text-gray-900 mb-2">Profile Management Coming Soon</h3>
          <p className="text-gray-600">Profile editing functionality will be implemented in the next phase.</p>
        </div>
      </div>
    </div>
  );
};

export default ProfilePage;