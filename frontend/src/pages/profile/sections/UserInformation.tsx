import React, { useState, useRef, useEffect } from 'react';
import { Camera } from 'lucide-react';
import { useAuth } from '../../../contexts/AuthContext';
import type { User as GlobalUser } from '../../../types'; // Using GlobalUser for consistency

interface UserFormData { // Renamed to avoid conflict if we use GlobalUser directly for state
  firstName: string;
  lastName: string;
  email: string;
  phone?: string;
  street?: string;
  city?: string;
  state?: string;
  zipCode?: string;
  avatar?: string; // This will be a base64 string for preview, or URL from server
}

const UserInformation: React.FC = () => {
  const { user, updateUser, isLoading: authLoading } = useAuth();
  const [formData, setFormData] = useState<UserFormData>({
    firstName: '',
    lastName: '',
    email: '',
    phone: '',
    street: '',
    city: '',
    state: '',
    zipCode: '',
    avatar: '',
  });
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [submitStatus, setSubmitStatus] = useState<{ success: boolean; message: string } | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    if (user) {
      setFormData({
        firstName: user.firstName || '',
        lastName: user.lastName || '',
        email: user.email || '', // Email should ideally come from user context and be non-editable or verified
        phone: user.phone || '',
        // Assuming address details are not directly on the User object from AuthContext
        // If they are, map them here:
        // street: user.street || '',
        // city: user.city || '',
        // state: user.state || '',
        // zipCode: user.zipCode || '',
        avatar: user.avatar || '',
      });
    }
  }, [user]);

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => {
    const { name, value } = e.target;
    setFormData((prev) => ({
      ...prev,
      [name]: value,
    }));
  };

  const handleAvatarClick = () => {
    fileInputRef.current?.click();
  };

  const handleAvatarChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      // TODO: Implement actual file upload to a server.
      // For now, using FileReader to show a preview.
      const reader = new FileReader();
      reader.onloadend = () => {
        setFormData((prev) => ({
          ...prev,
          avatar: reader.result as string, // This is a base64 string
        }));
      };
      reader.readAsDataURL(file);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!user || authLoading || isSubmitting) return;

    setIsSubmitting(true);
    setSubmitStatus(null);

    // Prepare data for the API. The updateUser function expects Partial<GlobalUser>.
    // The current `formData.avatar` might be a base64 string if changed, or a URL if not.
    // The backend needs to handle this. If it's a base64 string, it should be uploaded.
    // For now, we'll send what we have.
    const updatePayload: Partial<GlobalUser> = {
      id: user.id, // Important: ensure ID is included for the update
      firstName: formData.firstName,
      lastName: formData.lastName,
      phone: formData.phone,
      // avatar: formData.avatar, // Handle avatar update carefully. If it's a base64 string, API needs to process it.
      // If it's a URL and hasn't changed, no need to send.
      // If it's a new base64 string, send it.
      // This logic might need refinement based on backend capabilities.
    };

    // Only include avatar if it's a new base64 string (local preview)
    if (formData.avatar && formData.avatar.startsWith('data:image')) {
      updatePayload.avatar = formData.avatar;
    }


    try {
      await updateUser(updatePayload);
      setSubmitStatus({ success: true, message: 'Profile updated successfully!' });
    } catch (error: any) {
      console.error('Failed to update profile:', error);
      setSubmitStatus({ success: false, message: error.message || 'Failed to update profile. Please try again.' });
    } finally {
      setIsSubmitting(false);
    }
  };
  
  if (authLoading && !user) {
    return <div className="text-center p-10">Loading user information...</div>;
  }

  return (
    <form onSubmit={handleSubmit} className="max-w-3xl mx-auto space-y-8">
      <h2 className="text-2xl font-semibold text-gray-900 dark:text-gray-100 mb-6">Personal Information</h2>

      {submitStatus && (
        <div className={`p-4 rounded-md ${submitStatus.success ? 'bg-green-100 border-green-400 text-green-700' : 'bg-red-100 border-red-400 text-red-700'}`} role="alert">
          {submitStatus.message}
        </div>
      )}
      
      {/* Avatar Section */}
      <div className="flex flex-col items-center space-y-4 mb-8">
        <div className="relative group">
          <div
            onClick={handleAvatarClick}
            className="w-32 h-32 rounded-full bg-gray-200 dark:bg-gray-700 flex items-center justify-center cursor-pointer overflow-hidden border-2 border-gray-300 dark:border-gray-600 shadow-sm transition-all duration-300 hover:border-indigo-500 dark:hover:border-indigo-400"
          >
            {formData.avatar ? (
              <img
                src={formData.avatar} // This could be a URL or a base64 string
                alt="Profile"
                className="w-full h-full object-cover"
              />
            ) : (
              <div className="text-4xl font-medium text-gray-500 dark:text-gray-400">
                {formData.firstName ? formData.firstName[0].toUpperCase() : <Camera size={40} className="text-gray-400 dark:text-gray-500" />}
              </div>
            )}
          </div>
          <button
            type="button"
            onClick={handleAvatarClick}
            title="Change profile picture"
            className="absolute bottom-1 right-1 p-2 bg-indigo-600 text-white rounded-full shadow-md transform transition-all duration-300 hover:bg-indigo-700 hover:scale-110 focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:ring-offset-2 dark:bg-indigo-500 dark:hover:bg-indigo-600 dark:focus:ring-indigo-400"
          >
            <Camera className="w-4 h-4" />
          </button>
        </div>
        <input
          type="file"
          ref={fileInputRef}
          onChange={handleAvatarChange}
          accept="image/*"
          className="hidden"
          disabled={isSubmitting}
        />
        <p className="text-sm text-gray-500 dark:text-gray-400">Click avatar or camera icon to change</p>
      </div>

      {/* Form Fields */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-x-6 gap-y-8">
        <div className="space-y-2">
          <label htmlFor="firstName" className="block text-sm font-semibold text-gray-800 dark:text-gray-200">
            First Name <span className="text-indigo-500 dark:text-indigo-400">*</span>
          </label>
          <input
            required
            id="firstName"
            name="firstName"
            type="text"
            value={formData.firstName}
            onChange={handleInputChange}
            className="w-full px-4 py-3 bg-white dark:bg-gray-800 dark:text-gray-100 rounded-lg border border-gray-300 dark:border-gray-600 focus:outline-none focus:ring-2 focus:ring-indigo-500 dark:focus:ring-indigo-400 focus:border-indigo-500 dark:focus:border-indigo-400 transition-all duration-200 hover:border-indigo-400 dark:hover:border-indigo-500"
            placeholder="Enter your first name"
            disabled={isSubmitting}
          />
        </div>

        <div className="space-y-2">
          <label htmlFor="lastName" className="block text-sm font-semibold text-gray-800 dark:text-gray-200">
            Last Name <span className="text-indigo-500 dark:text-indigo-400">*</span>
          </label>
          <input
            required
            id="lastName"
            name="lastName"
            type="text"
            value={formData.lastName}
            onChange={handleInputChange}
            className="w-full px-4 py-3 bg-white dark:bg-gray-800 dark:text-gray-100 rounded-lg border border-gray-300 dark:border-gray-600 focus:outline-none focus:ring-2 focus:ring-indigo-500 dark:focus:ring-indigo-400 focus:border-indigo-500 dark:focus:border-indigo-400 transition-all duration-200 hover:border-indigo-400 dark:hover:border-indigo-500"
            placeholder="Enter your last name"
            disabled={isSubmitting}
          />
        </div>

        <div className="md:col-span-2 space-y-2">
          <label htmlFor="email" className="block text-sm font-semibold text-gray-800 dark:text-gray-200">
            Email <span className="text-indigo-500 dark:text-indigo-400">*</span>
          </label>
          <input
            required
            id="email"
            name="email"
            type="email"
            value={formData.email}
            // onChange={handleInputChange} // Email is typically not changed here or requires verification
            readOnly // Changed from disabled to allow copying, but still prevent editing
            className="w-full px-4 py-3 rounded-lg border border-gray-300 dark:border-gray-600 bg-gray-100 dark:bg-gray-700 cursor-not-allowed text-gray-500 dark:text-gray-400"
          />
          <p className="text-sm text-gray-500 dark:text-gray-400 italic">
            Email changes require verification (not available on this form).
          </p>
        </div>

        <div className="md:col-span-2 space-y-2">
          <label htmlFor="phone" className="block text-sm font-semibold text-gray-800 dark:text-gray-200">
            Phone Number
          </label>
          <input
            id="phone"
            name="phone"
            type="tel"
            value={formData.phone}
            onChange={handleInputChange}
            className="w-full px-4 py-3 bg-white dark:bg-gray-800 dark:text-gray-100 rounded-lg border border-gray-300 dark:border-gray-600 focus:outline-none focus:ring-2 focus:ring-indigo-500 dark:focus:ring-indigo-400 focus:border-indigo-500 dark:focus:border-indigo-400 transition-all duration-200 hover:border-indigo-400 dark:hover:border-indigo-500"
            placeholder="Enter your phone number"
            disabled={isSubmitting}
          />
        </div>

        {/* Address fields are commented out as they are not part of the GlobalUser type from AuthContext directly */}
        {/* If these fields are needed, they should be added to the User type and backend handling */}
        {/*
        <div className="md:col-span-2 space-y-2">
          <label htmlFor="street" className="block text-sm font-semibold text-gray-800 dark:text-gray-200">
            Street Address
          </label>
          <input
            id="street"
            name="street"
            type="text"
            value={formData.street}
            onChange={handleInputChange}
            className="w-full px-4 py-3 bg-white dark:bg-gray-800 dark:text-gray-100 rounded-lg border border-gray-300 dark:border-gray-600 focus:outline-none focus:ring-2 focus:ring-indigo-500 dark:focus:ring-indigo-400 focus:border-indigo-500 dark:focus:border-indigo-400 transition-all duration-200 hover:border-indigo-400 dark:hover:border-indigo-500"
            placeholder="e.g., 123 Main St"
            disabled={isSubmitting}
          />
        </div>

        <div className="space-y-2">
          <label htmlFor="city" className="block text-sm font-semibold text-gray-800 dark:text-gray-200">
            City
          </label>
          <input
            id="city"
            name="city"
            type="text"
            value={formData.city}
            onChange={handleInputChange}
            className="w-full px-4 py-3 bg-white dark:bg-gray-800 dark:text-gray-100 rounded-lg border border-gray-300 dark:border-gray-600 focus:outline-none focus:ring-2 focus:ring-indigo-500 dark:focus:ring-indigo-400 focus:border-indigo-500 dark:focus:border-indigo-400 transition-all duration-200 hover:border-indigo-400 dark:hover:border-indigo-500"
            placeholder="e.g., Anytown"
            disabled={isSubmitting}
          />
        </div>

        <div className="space-y-2">
          <label htmlFor="state" className="block text-sm font-semibold text-gray-800 dark:text-gray-200">
            State / Province
          </label>
          <input
            id="state"
            name="state"
            type="text"
            value={formData.state}
            onChange={handleInputChange}
            className="w-full px-4 py-3 bg-white dark:bg-gray-800 dark:text-gray-100 rounded-lg border border-gray-300 dark:border-gray-600 focus:outline-none focus:ring-2 focus:ring-indigo-500 dark:focus:ring-indigo-400 focus:border-indigo-500 dark:focus:border-indigo-400 transition-all duration-200 hover:border-indigo-400 dark:hover:border-indigo-500"
            placeholder="e.g., CA"
            disabled={isSubmitting}
          />
        </div>
        
        <div className="space-y-2">
          <label htmlFor="zipCode" className="block text-sm font-semibold text-gray-800 dark:text-gray-200">
            Zip / Postal Code
          </label>
          <input
            id="zipCode"
            name="zipCode"
            type="text"
            value={formData.zipCode}
            onChange={handleInputChange}
            className="w-full px-4 py-3 bg-white dark:bg-gray-800 dark:text-gray-100 rounded-lg border border-gray-300 dark:border-gray-600 focus:outline-none focus:ring-2 focus:ring-indigo-500 dark:focus:ring-indigo-400 focus:border-indigo-500 dark:focus:border-indigo-400 transition-all duration-200 hover:border-indigo-400 dark:hover:border-indigo-500"
            placeholder="e.g., 90210"
            disabled={isSubmitting}
          />
        </div>
        */}
      </div>

      {/* Submit Button */}
      <div className="pt-6">
        <button
          type="submit"
          disabled={isSubmitting || authLoading}
          className="w-full px-6 py-3 bg-indigo-600 text-white text-lg font-semibold rounded-lg hover:bg-indigo-700 transition-colors duration-200 focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:ring-offset-2 disabled:opacity-50 disabled:cursor-not-allowed dark:bg-indigo-500 dark:hover:bg-indigo-600 dark:focus:ring-indigo-400 dark:disabled:bg-indigo-500/50"
        >
          {isSubmitting ? 'Saving...' : 'Save Changes'}
        </button>
      </div>
    </form>
  );
};

export default UserInformation;
