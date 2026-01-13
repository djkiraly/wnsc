'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { useRecaptcha } from '@/hooks/useRecaptcha';
import { Send, Loader2, CheckCircle, AlertCircle } from 'lucide-react';

interface EventSubmissionFormProps {
  recaptchaSiteKey: string | null;
}

const EVENT_CATEGORIES = [
  'Basketball',
  'Baseball',
  'Softball',
  'Soccer',
  'Football',
  'Volleyball',
  'Track & Field',
  'Swimming',
  'Golf',
  'Tennis',
  'Wrestling',
  'Cross Country',
  'Cycling',
  'Running/Marathon',
  'Multi-Sport',
  'Other',
];

export default function EventSubmissionForm({ recaptchaSiteKey }: EventSubmissionFormProps) {
  const router = useRouter();
  const { isReady, executeRecaptcha } = useRecaptcha(recaptchaSiteKey);

  const [formData, setFormData] = useState({
    title: '',
    description: '',
    category: '',
    startDate: '',
    startTime: '',
    endDate: '',
    endTime: '',
    location: '',
    venueName: '',
    submitterName: '',
    submitterEmail: '',
    submitterPhone: '',
    organization: '',
    expectedAttendees: '',
    additionalNotes: '',
  });

  const [status, setStatus] = useState<'idle' | 'submitting' | 'success' | 'error'>('idle');
  const [errorMessage, setErrorMessage] = useState('');

  const handleChange = (
    e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement>
  ) => {
    const { name, value } = e.target;
    setFormData((prev) => ({ ...prev, [name]: value }));
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setStatus('submitting');
    setErrorMessage('');

    try {
      // Get reCAPTCHA token
      const recaptchaToken = await executeRecaptcha('submit_event');

      // Combine date and time
      const startDateTime = new Date(`${formData.startDate}T${formData.startTime}`);
      const endDateTime = new Date(`${formData.endDate}T${formData.endTime}`);

      // Validate dates
      if (endDateTime < startDateTime) {
        setStatus('error');
        setErrorMessage('End date/time must be after start date/time');
        return;
      }

      const response = await fetch('/api/event-submissions', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          ...formData,
          startDate: startDateTime.toISOString(),
          endDate: endDateTime.toISOString(),
          recaptchaToken,
        }),
      });

      const data = await response.json();

      if (response.ok) {
        setStatus('success');
        // Reset form
        setFormData({
          title: '',
          description: '',
          category: '',
          startDate: '',
          startTime: '',
          endDate: '',
          endTime: '',
          location: '',
          venueName: '',
          submitterName: '',
          submitterEmail: '',
          submitterPhone: '',
          organization: '',
          expectedAttendees: '',
          additionalNotes: '',
        });
      } else {
        setStatus('error');
        setErrorMessage(data.error || 'Failed to submit event. Please try again.');
      }
    } catch (error) {
      setStatus('error');
      setErrorMessage('An unexpected error occurred. Please try again.');
    }
  };

  if (status === 'success') {
    return (
      <div className="text-center py-8">
        <CheckCircle className="h-16 w-16 text-green-500 mx-auto mb-4" />
        <h3 className="text-xl font-semibold text-gray-900 mb-2">
          Event Submitted Successfully!
        </h3>
        <p className="text-gray-600 mb-6">
          Thank you for your submission. Our team will review your event and contact you
          within 5-7 business days.
        </p>
        <button
          onClick={() => setStatus('idle')}
          className="btn btn-primary"
        >
          Submit Another Event
        </button>
      </div>
    );
  }

  return (
    <form onSubmit={handleSubmit} className="space-y-6">
      {status === 'error' && (
        <div className="p-4 bg-red-50 border border-red-200 rounded-lg flex items-start gap-3">
          <AlertCircle className="h-5 w-5 text-red-500 flex-shrink-0 mt-0.5" />
          <div>
            <p className="font-medium text-red-800">Error</p>
            <p className="text-sm text-red-700">{errorMessage}</p>
          </div>
        </div>
      )}

      {/* Event Information */}
      <div>
        <h3 className="text-lg font-medium text-gray-900 mb-4">Event Information</h3>
        <div className="space-y-4">
          <div>
            <label htmlFor="title" className="label">
              Event Title <span className="text-red-500">*</span>
            </label>
            <input
              type="text"
              id="title"
              name="title"
              value={formData.title}
              onChange={handleChange}
              required
              className="input"
              placeholder="e.g., Annual Youth Basketball Tournament"
            />
          </div>

          <div>
            <label htmlFor="description" className="label">
              Event Description <span className="text-red-500">*</span>
            </label>
            <textarea
              id="description"
              name="description"
              value={formData.description}
              onChange={handleChange}
              required
              rows={4}
              className="textarea"
              placeholder="Describe your event, including format, target audience, and what makes it special..."
            />
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <label htmlFor="category" className="label">
                Sport Category <span className="text-red-500">*</span>
              </label>
              <select
                id="category"
                name="category"
                value={formData.category}
                onChange={handleChange}
                required
                className="input"
              >
                <option value="">Select a category</option>
                {EVENT_CATEGORIES.map((cat) => (
                  <option key={cat} value={cat}>
                    {cat}
                  </option>
                ))}
              </select>
            </div>

            <div>
              <label htmlFor="expectedAttendees" className="label">
                Expected Attendees
              </label>
              <select
                id="expectedAttendees"
                name="expectedAttendees"
                value={formData.expectedAttendees}
                onChange={handleChange}
                className="input"
              >
                <option value="">Select range</option>
                <option value="1-50">1-50</option>
                <option value="51-100">51-100</option>
                <option value="101-250">101-250</option>
                <option value="251-500">251-500</option>
                <option value="501-1000">501-1000</option>
                <option value="1000+">1000+</option>
              </select>
            </div>
          </div>
        </div>
      </div>

      {/* Date & Time */}
      <div>
        <h3 className="text-lg font-medium text-gray-900 mb-4">Date & Time</h3>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div>
            <label htmlFor="startDate" className="label">
              Start Date <span className="text-red-500">*</span>
            </label>
            <input
              type="date"
              id="startDate"
              name="startDate"
              value={formData.startDate}
              onChange={handleChange}
              required
              className="input"
              min={new Date().toISOString().split('T')[0]}
            />
          </div>

          <div>
            <label htmlFor="startTime" className="label">
              Start Time <span className="text-red-500">*</span>
            </label>
            <input
              type="time"
              id="startTime"
              name="startTime"
              value={formData.startTime}
              onChange={handleChange}
              required
              className="input"
            />
          </div>

          <div>
            <label htmlFor="endDate" className="label">
              End Date <span className="text-red-500">*</span>
            </label>
            <input
              type="date"
              id="endDate"
              name="endDate"
              value={formData.endDate}
              onChange={handleChange}
              required
              className="input"
              min={formData.startDate || new Date().toISOString().split('T')[0]}
            />
          </div>

          <div>
            <label htmlFor="endTime" className="label">
              End Time <span className="text-red-500">*</span>
            </label>
            <input
              type="time"
              id="endTime"
              name="endTime"
              value={formData.endTime}
              onChange={handleChange}
              required
              className="input"
            />
          </div>
        </div>
      </div>

      {/* Location */}
      <div>
        <h3 className="text-lg font-medium text-gray-900 mb-4">Location</h3>
        <div className="space-y-4">
          <div>
            <label htmlFor="location" className="label">
              City/Area <span className="text-red-500">*</span>
            </label>
            <input
              type="text"
              id="location"
              name="location"
              value={formData.location}
              onChange={handleChange}
              required
              className="input"
              placeholder="e.g., Scottsbluff, NE"
            />
          </div>

          <div>
            <label htmlFor="venueName" className="label">
              Venue Name
            </label>
            <input
              type="text"
              id="venueName"
              name="venueName"
              value={formData.venueName}
              onChange={handleChange}
              className="input"
              placeholder="e.g., Scottsbluff High School Gymnasium"
            />
          </div>
        </div>
      </div>

      {/* Contact Information */}
      <div>
        <h3 className="text-lg font-medium text-gray-900 mb-4">Your Contact Information</h3>
        <div className="space-y-4">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <label htmlFor="submitterName" className="label">
                Your Name <span className="text-red-500">*</span>
              </label>
              <input
                type="text"
                id="submitterName"
                name="submitterName"
                value={formData.submitterName}
                onChange={handleChange}
                required
                className="input"
              />
            </div>

            <div>
              <label htmlFor="organization" className="label">
                Organization
              </label>
              <input
                type="text"
                id="organization"
                name="organization"
                value={formData.organization}
                onChange={handleChange}
                className="input"
                placeholder="e.g., Scottsbluff Youth Sports League"
              />
            </div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <label htmlFor="submitterEmail" className="label">
                Email Address <span className="text-red-500">*</span>
              </label>
              <input
                type="email"
                id="submitterEmail"
                name="submitterEmail"
                value={formData.submitterEmail}
                onChange={handleChange}
                required
                className="input"
              />
            </div>

            <div>
              <label htmlFor="submitterPhone" className="label">
                Phone Number
              </label>
              <input
                type="tel"
                id="submitterPhone"
                name="submitterPhone"
                value={formData.submitterPhone}
                onChange={handleChange}
                className="input"
                placeholder="(308) 555-1234"
              />
            </div>
          </div>
        </div>
      </div>

      {/* Additional Notes */}
      <div>
        <label htmlFor="additionalNotes" className="label">
          Additional Notes
        </label>
        <textarea
          id="additionalNotes"
          name="additionalNotes"
          value={formData.additionalNotes}
          onChange={handleChange}
          rows={3}
          className="textarea"
          placeholder="Any additional information you'd like to share about your event..."
        />
      </div>

      {/* reCAPTCHA Notice */}
      {recaptchaSiteKey && (
        <p className="text-xs text-gray-500">
          This site is protected by reCAPTCHA and the Google{' '}
          <a
            href="https://policies.google.com/privacy"
            target="_blank"
            rel="noopener noreferrer"
            className="text-primary hover:underline"
          >
            Privacy Policy
          </a>{' '}
          and{' '}
          <a
            href="https://policies.google.com/terms"
            target="_blank"
            rel="noopener noreferrer"
            className="text-primary hover:underline"
          >
            Terms of Service
          </a>{' '}
          apply.
        </p>
      )}

      {/* Submit Button */}
      <div className="flex justify-end">
        <button
          type="submit"
          disabled={status === 'submitting' || (recaptchaSiteKey !== null && !isReady)}
          className="btn btn-primary"
        >
          {status === 'submitting' ? (
            <>
              <Loader2 className="h-4 w-4 mr-2 animate-spin" />
              Submitting...
            </>
          ) : (
            <>
              <Send className="h-4 w-4 mr-2" />
              Submit Event
            </>
          )}
        </button>
      </div>
    </form>
  );
}
