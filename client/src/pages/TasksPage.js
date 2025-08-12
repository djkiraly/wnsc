import React from 'react';

const TasksPage = () => {
  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <h1 className="text-2xl font-bold text-gray-900">Tasks</h1>
        <button className="btn-primary">Create Task</button>
      </div>
      
      <div className="card">
        <div className="text-center py-12">
          <h3 className="text-lg font-medium text-gray-900 mb-2">Tasks Coming Soon</h3>
          <p className="text-gray-600">Task management functionality will be implemented in the next phase.</p>
        </div>
      </div>
    </div>
  );
};

export default TasksPage;