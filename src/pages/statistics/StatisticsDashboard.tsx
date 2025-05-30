import React from 'react';
import { BarChart3 } from 'lucide-react';

const StatisticsDashboard: React.FC = () => {
  return (
    <div className="space-y-6">
      <div className="bg-white rounded-lg shadow-md p-8 text-center">
        <BarChart3 className="h-16 w-16 text-gray-400 mx-auto mb-4" />
        <h2 className="text-2xl font-bold text-gray-900 mb-2">Statistics Dashboard</h2>
        <p className="text-gray-600">
          This page will display comprehensive analytics and statistics about corruption reports.
        </p>
      </div>
    </div>
  );
};

export default StatisticsDashboard;
