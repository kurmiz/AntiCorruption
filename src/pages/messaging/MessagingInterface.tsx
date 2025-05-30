import React from 'react';
import { MessageSquare } from 'lucide-react';

const MessagingInterface: React.FC = () => {
  return (
    <div className="space-y-6">
      <div className="bg-white rounded-lg shadow-md p-8 text-center">
        <MessageSquare className="h-16 w-16 text-gray-400 mx-auto mb-4" />
        <h2 className="text-2xl font-bold text-gray-900 mb-2">Messaging Interface</h2>
        <p className="text-gray-600">
          This page will provide real-time messaging between users and police officers.
        </p>
      </div>
    </div>
  );
};

export default MessagingInterface;
