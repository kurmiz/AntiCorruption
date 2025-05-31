import React from 'react';
import { Eye } from 'lucide-react';

const ReportDetails: React.FC = () => {
  return (
    <div className="space-y-6">
      <div className="bg-white rounded-lg shadow-md p-8 text-center">
        <Eye className="h-16 w-16 text-gray-400 mx-auto mb-4" />
        <h2 className="text-2xl font-bold text-gray-900 mb-2">Report Details</h2>
        <p className="text-gray-600">
          This page will display detailed information about a specific report.
        </p>
      </div>
    </div>
  );
};

export default ReportDetails;
