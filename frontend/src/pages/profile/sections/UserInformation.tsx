import React, { useState, useRef } from 'react';
import { Camera } from 'lucide-react';

interface UserData {
  firstName: string;
  lastName: string;
  email: string;
  phone?: string;
  street?: string;
  city?: string;
  state?: string;
  zipCode?: string;
  avatar?: string;
}

const UserInformation: React.FC = () => {
  // TODO: In a real application, this state would be initialized with data fetched
  // from an API or from the authentication context, especially for an "edit" profile form.
  const [userData, setUserData] = useState<UserData>({
    firstName: '', // Example: 'Jane'
    lastName: '',  // Example: 'Doe'
    email: '',     // Example: 'jane.doe@example.com' (often non-editable or special verification)
    phone: '',
    street: '',
    city: '',
    state: '',
    zipCode: '',
    // avatar: 'url_to_existing_avatar.jpg' // Pre-fill if avatar exists
  });
  const fileInputRef = useRef<HTMLInputElement>(null);

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => {
    const { name, value } = e.target;
    setUserData((prev) => ({
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
      // Here you would typically upload the file to your server
      // For now, we'll just create a local URL
      const reader = new FileReader();
      reader.onloadend = () => {
        setUserData((prev) => ({
          ...prev,
          avatar: reader.result as string,
        }));
      };
      reader.readAsDataURL(file);
    }
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    // Here you would typically send the data to your API
    console.log('Saving user information:', userData);
  };

  return (
    <form onSubmit={handleSubmit} className="max-w-3xl mx-auto space-y-8">
      <h2 className="text-2xl font-semibold text-gray-900 mb-6">Personal Information</h2>
      
      {/* Avatar Section */}
      <div className="flex flex-col items-center space-y-4 mb-8">
        <div className="relative group">
          <div
            onClick={handleAvatarClick}
            className="w-32 h-32 rounded-full bg-gray-100 flex items-center justify-center cursor-pointer overflow-hidden border-2 border-gray-300 shadow-sm transition-all duration-300 hover:border-indigo-500"
          >
            {userData.avatar ? (
              <img
                src={userData.avatar}
                alt="Profile"
                className="w-full h-full object-cover"
              />
            ) : (
              <div className="text-4xl font-medium text-gray-500">
                {userData.firstName ? userData.firstName[0].toUpperCase() : <Camera size={40} className="text-gray-400" />}
              </div>
            )}
          </div>
          <button
            type="button"
            onClick={handleAvatarClick}
            title="Change profile picture"
            className="absolute bottom-1 right-1 p-2 bg-indigo-600 text-white rounded-full shadow-md transform transition-all duration-300 hover:bg-indigo-700 hover:scale-110 focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:ring-offset-2"
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
        />
        <p className="text-sm text-gray-500">Click avatar or camera icon to change</p>
      </div>

      {/* Form Fields */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
        <div className="space-y-2">
          <label htmlFor="firstName" className="block text-sm font-semibold text-gray-800">
            First Name <span className="text-indigo-500">*</span>
          </label>
          <input
            required
            id="firstName"
            name="firstName"
            type="text"
            value={userData.firstName}
            onChange={handleInputChange}
            className="w-full px-4 py-3 bg-white rounded-lg border border-gray-300 focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 transition-all duration-200 hover:border-indigo-300"
            placeholder="Enter your first name"
          />
        </div>

        <div className="space-y-2">
          <label htmlFor="lastName" className="block text-sm font-semibold text-gray-800">
            Last Name <span className="text-indigo-500">*</span>
          </label>
          <input
            required
            id="lastName"
            name="lastName"
            type="text"
            value={userData.lastName}
            onChange={handleInputChange}
            className="w-full px-4 py-3 bg-white rounded-lg border border-gray-300 focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 transition-all duration-200 hover:border-indigo-300"
            placeholder="Enter your last name"
          />
        </div>

        <div className="md:col-span-2 space-y-2">
          <label htmlFor="email" className="block text-sm font-semibold text-gray-800">
            Email <span className="text-indigo-500">*</span>
          </label>
          <input
            required
            id="email"
            name="email"
            type="email"
            value={userData.email}
            onChange={handleInputChange}
            disabled
            className="w-full px-4 py-3 rounded-lg border border-gray-300 bg-gray-100 cursor-not-allowed text-gray-500"
          />
          <p className="text-sm text-gray-500 italic">
            Email changes require verification through settings
          </p>
        </div>

        <div className="md:col-span-2 space-y-2">
          <label htmlFor="phone" className="block text-sm font-semibold text-gray-800">
            Phone Number
          </label>
          <input
            id="phone"
            name="phone"
            type="tel"
            value={userData.phone}
            onChange={handleInputChange}
            className="w-full px-4 py-3 bg-white rounded-lg border border-gray-300 focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 transition-all duration-200 hover:border-indigo-300"
            placeholder="Enter your phone number"
          />
        </div>

        <div className="md:col-span-2 space-y-2">
          <label htmlFor="street" className="block text-sm font-semibold text-gray-800">
            Street Address
          </label>
          <input
            id="street"
            name="street"
            type="text"
            value={userData.street}
            onChange={handleInputChange}
            className="w-full px-4 py-3 bg-white rounded-lg border border-gray-300 focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 transition-all duration-200 hover:border-indigo-300"
            placeholder="e.g., 123 Main St"
          />
        </div>

        <div className="space-y-2">
          <label htmlFor="city" className="block text-sm font-semibold text-gray-800">
            City
          </label>
          <input
            id="city"
            name="city"
            type="text"
            value={userData.city}
            onChange={handleInputChange}
            className="w-full px-4 py-3 bg-white rounded-lg border border-gray-300 focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 transition-all duration-200 hover:border-indigo-300"
            placeholder="e.g., Anytown"
          />
        </div>

        <div className="space-y-2">
          <label htmlFor="state" className="block text-sm font-semibold text-gray-800">
            State / Province
          </label>
          <input
            id="state"
            name="state"
            type="text"
            value={userData.state}
            onChange={handleInputChange}
            className="w-full px-4 py-3 bg-white rounded-lg border border-gray-300 focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 transition-all duration-200 hover:border-indigo-300"
            placeholder="e.g., CA"
          />
        </div>
        
        <div className="space-y-2">
          <label htmlFor="zipCode" className="block text-sm font-semibold text-gray-800">
            Zip / Postal Code
          </label>
          <input
            id="zipCode"
            name="zipCode"
            type="text"
            value={userData.zipCode}
            onChange={handleInputChange}
            className="w-full px-4 py-3 bg-white rounded-lg border border-gray-300 focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 transition-all duration-200 hover:border-indigo-300"
            placeholder="e.g., 90210"
          />
        </div>
      </div>

      {/* Submit Button */}
      <div className="pt-6">
        <button
          type="submit"
          className="w-full px-6 py-3 bg-indigo-600 text-white text-lg font-semibold rounded-lg hover:bg-indigo-700 transition-colors duration-200 focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:ring-offset-2"
        >
          Save Changes
        </button>
      </div>
    </form>
  );
};

export default UserInformation;
