import React, { useState } from 'react';
import { Copy as CopyIcon, Trash as DeleteIcon, Plus as AddIcon } from 'lucide-react';

interface ApiToken {
  id: string;
  name: string;
  token: string;
  createdAt: string;
}

interface ConnectedService {
  id: string;
  name: string;
  status: 'connected' | 'disconnected';
  lastSync?: string;
}

const AppConfiguration: React.FC = () => {
  const [apiTokens, setApiTokens] = useState<ApiToken[]>([
    {
      id: '1',
      name: 'Development Token',
      token: 'dev-token-xyz',
      createdAt: '2025-06-03',
    },
  ]);

  const [connectedServices, setConnectedServices] = useState<ConnectedService[]>([
    {
      id: '1',
      name: 'Google',
      status: 'connected',
      lastSync: '2025-06-03T15:30:00Z',
    },
    {
      id: '2',
      name: 'Facebook',
      status: 'disconnected',
    },
  ]);

  const [newTokenDialog, setNewTokenDialog] = useState(false);
  const [newTokenName, setNewTokenName] = useState('');

  const handleCopyToken = (token: string) => {
    navigator.clipboard.writeText(token);
    // You might want to show a notification here
  };

  const handleDeleteToken = (id: string) => {
    setApiTokens((prev) => prev.filter((token) => token.id !== id));
  };

  const handleCreateToken = () => {
    if (newTokenName) {
      const newToken: ApiToken = {
        id: Date.now().toString(),
        name: newTokenName,
        token: `token-${Math.random().toString(36).substr(2, 9)}`,
        createdAt: new Date().toISOString().split('T')[0],
      };
      setApiTokens((prev) => [...prev, newToken]);
      setNewTokenDialog(false);
      setNewTokenName('');
    }
  };

  const handleServiceConnection = (serviceId: string) => {
    setConnectedServices((prev) =>
      prev.map((service) =>
        service.id === serviceId
          ? {
              ...service,
              status:
                service.status === 'connected' ? 'disconnected' : 'connected',
              lastSync:
                service.status === 'disconnected'
                  ? new Date().toISOString()
                  : undefined,
            }
          : service
      )
    );
  };

  return (
    <div className="space-y-8">
      <div className="space-y-6">
        {/* API Tokens Section */}
        <div className="bg-white rounded-lg shadow-md p-6">
          <div className="flex justify-between items-center mb-4">
            <h2 className="text-xl font-semibold">API Tokens</h2>
            <button
              onClick={() => setNewTokenDialog(true)}
              className="flex items-center gap-2 px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700 transition-colors"
            >
              <AddIcon className="w-4 h-4" />
              Generate New Token
            </button>
          </div>
          <div className="divide-y divide-gray-200">
            {apiTokens.map((token) => (
              <div key={token.id} className="py-4 flex justify-between items-center">
                <div>
                  <h3 className="font-medium">{token.name}</h3>
                  <p className="text-sm text-gray-500">Created on {token.createdAt}</p>
                </div>
                <div className="flex gap-2">
                  <button
                    onClick={() => handleCopyToken(token.token)}
                    className="p-2 text-gray-500 hover:text-gray-700 transition-colors"
                  >
                    <CopyIcon className="w-5 h-5" />
                  </button>
                  <button
                    onClick={() => handleDeleteToken(token.id)}
                    className="p-2 text-gray-500 hover:text-red-600 transition-colors"
                  >
                    <DeleteIcon className="w-5 h-5" />
                  </button>
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* Connected Services Section */}
        <div className="bg-white rounded-lg shadow-md p-6">
          <h2 className="text-xl font-semibold mb-4">Connected Services</h2>
          <div className="divide-y divide-gray-200">
            {connectedServices.map((service) => (
              <div key={service.id} className="py-4 flex justify-between items-center">
                <div>
                  <h3 className="font-medium">{service.name}</h3>
                  {service.lastSync && (
                    <p className="text-sm text-gray-500">
                      Last synced: {new Date(service.lastSync).toLocaleString()}
                    </p>
                  )}
                </div>
                <button
                  onClick={() => handleServiceConnection(service.id)}
                  className={`px-3 py-1 rounded-full text-sm font-medium ${
                    service.status === 'connected'
                      ? 'bg-green-100 text-green-800'
                      : 'bg-gray-100 text-gray-800'
                  }`}
                >
                  {service.status === 'connected' ? 'Connected' : 'Disconnected'}
                </button>
              </div>
            ))}
          </div>
        </div>

        {/* Plan Information */}
        <div className="bg-white rounded-lg shadow-md p-6">
          <h2 className="text-xl font-semibold mb-4">Plan Information</h2>
          <p className="text-lg mb-2">
            Current Plan: <span className="font-semibold">Professional</span>
          </p>
          <p className="text-gray-600">
            Your plan includes API access, unlimited connected services, and
            priority support.
          </p>
        </div>
      </div>

      {/* New Token Dialog */}
      {newTokenDialog && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4">
          <div className="bg-white rounded-lg p-6 w-full max-w-md">
            <h2 className="text-xl font-semibold mb-4">Generate New API Token</h2>
            <input
              type="text"
              placeholder="Token Name"
              value={newTokenName}
              onChange={(e) => setNewTokenName(e.target.value)}
              className="w-full px-3 py-2 border border-gray-300 rounded-md mb-4 focus:outline-none focus:ring-2 focus:ring-blue-500"
            />
            <div className="flex justify-end gap-2">
              <button
                onClick={() => setNewTokenDialog(false)}
                className="px-4 py-2 text-gray-600 hover:text-gray-800 transition-colors"
              >
                Cancel
              </button>
              <button
                onClick={handleCreateToken}
                className="px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700 transition-colors"
              >
                Generate
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default AppConfiguration;
