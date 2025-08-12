import React from 'react';
import { Link } from 'react-router-dom';
import { useAuth } from '../contexts/AuthContext';
import { CalendarDaysIcon, UserGroupIcon, CheckCircleIcon } from '@heroicons/react/24/outline';

const HomePage = () => {
  const { isAuthenticated, user } = useAuth();

  const features = [
    {
      icon: CalendarDaysIcon,
      title: 'Event Management',
      description: 'Create, manage, and participate in sports events and tournaments across West Nebraska.'
    },
    {
      icon: CheckCircleIcon,
      title: 'Task Coordination',
      description: 'Organize and track tasks related to events, ensuring nothing falls through the cracks.'
    },
    {
      icon: UserGroupIcon,
      title: 'Member Network',
      description: 'Connect with other sports enthusiasts and organizations in the region.'
    }
  ];

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 to-indigo-100">
      {/* Header */}
      <header className="bg-white shadow-sm">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between items-center py-6">
            <div className="flex items-center">
              <h1 className="text-2xl font-bold text-gray-900">
                West Nebraska Sports Council
              </h1>
            </div>
            <div className="flex items-center space-x-4">
              {isAuthenticated ? (
                <div className="flex items-center space-x-4">
                  <span className="text-gray-700">
                    Welcome, {user?.firstName}!
                  </span>
                  <Link to="/dashboard" className="btn-primary">
                    Dashboard
                  </Link>
                </div>
              ) : (
                <Link to="/login" className="btn-primary">
                  Sign In
                </Link>
              )}
            </div>
          </div>
        </div>
      </header>

      {/* Hero Section */}
      <section className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-16">
        <div className="text-center">
          <h2 className="text-4xl font-bold text-gray-900 sm:text-6xl">
            Building Sports
            <span className="text-blue-600 block">Communities</span>
          </h2>
          <p className="mt-6 text-xl text-gray-600 max-w-3xl mx-auto">
            The West Nebraska Sports Council brings together athletes, organizers, and sports 
            enthusiasts to create memorable events and foster community through sports.
          </p>
          <div className="mt-10 flex justify-center space-x-4">
            {!isAuthenticated ? (
              <>
                <Link to="/login" className="btn-primary text-lg px-8 py-3">
                  Get Started
                </Link>
                <a href="#features" className="btn-secondary text-lg px-8 py-3">
                  Learn More
                </a>
              </>
            ) : (
              <Link to="/dashboard" className="btn-primary text-lg px-8 py-3">
                Go to Dashboard
              </Link>
            )}
          </div>
        </div>
      </section>

      {/* Features Section */}
      <section id="features" className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-16">
        <div className="text-center mb-16">
          <h3 className="text-3xl font-bold text-gray-900 mb-4">
            Everything You Need
          </h3>
          <p className="text-lg text-gray-600 max-w-2xl mx-auto">
            Our platform provides comprehensive tools for managing sports events, 
            coordinating tasks, and building community connections.
          </p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
          {features.map((feature, index) => (
            <div key={index} className="card text-center">
              <div className="flex justify-center mb-4">
                <feature.icon className="h-12 w-12 text-blue-600" />
              </div>
              <h4 className="text-xl font-semibold text-gray-900 mb-3">
                {feature.title}
              </h4>
              <p className="text-gray-600">
                {feature.description}
              </p>
            </div>
          ))}
        </div>
      </section>

      {/* CTA Section */}
      <section className="bg-blue-600 py-16">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 text-center">
          <h3 className="text-3xl font-bold text-white mb-4">
            Ready to Get Started?
          </h3>
          <p className="text-xl text-blue-100 mb-8 max-w-2xl mx-auto">
            Join the West Nebraska Sports Council today and become part of 
            our growing community of sports enthusiasts.
          </p>
          {!isAuthenticated && (
            <Link to="/login" className="bg-white text-blue-600 font-semibold px-8 py-3 rounded-lg hover:bg-gray-50 transition-colors">
              Sign In with Google
            </Link>
          )}
        </div>
      </section>

      {/* Footer */}
      <footer className="bg-gray-800 text-white py-8">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center">
            <h4 className="text-lg font-semibold mb-2">West Nebraska Sports Council</h4>
            <p className="text-gray-400">
              Building stronger communities through sports
            </p>
            <p className="text-gray-500 text-sm mt-4">
              © 2024 West Nebraska Sports Council. All rights reserved.
            </p>
          </div>
        </div>
      </footer>
    </div>
  );
};

export default HomePage;