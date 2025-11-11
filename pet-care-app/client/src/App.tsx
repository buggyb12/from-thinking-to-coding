import { useState, useEffect } from 'react';

function App() {
  const [backendStatus, setBackendStatus] = useState<string>('Checking...');

  useEffect(() => {
    // Test backend connection
    fetch('/api/health')
      .then(res => res.json())
      .then(data => {
        if (data.status === 'ok') {
          setBackendStatus('✅ Connected');
        } else {
          setBackendStatus('⚠️ Unexpected response');
        }
      })
      .catch(() => {
        setBackendStatus('❌ Not connected');
      });
  }, []);

  return (
    <div className="min-h-screen bg-gradient-to-br from-primary-500 to-primary-700 flex items-center justify-center p-4">
      <div className="bg-white rounded-2xl shadow-2xl p-8 max-w-md w-full">
        <div className="text-center">
          <div className="text-6xl mb-4">🐾</div>
          <h1 className="text-4xl font-bold text-gray-800 mb-2">
            Pet Care App
          </h1>
          <p className="text-gray-600 mb-6">
            Gamified Pet Care Management
          </p>

          <div className="bg-gray-50 rounded-lg p-4 mb-6">
            <p className="text-sm text-gray-600 mb-2">Backend Status:</p>
            <p className="text-lg font-semibold">{backendStatus}</p>
          </div>

          <div className="space-y-2 text-left text-sm text-gray-600">
            <p>✅ Phase 0: Project Setup</p>
            <p>✅ React + TypeScript + Tailwind</p>
            <p>✅ Express + PostgreSQL</p>
            <p>✅ PWA Configuration</p>
          </div>

          <div className="mt-6 pt-6 border-t border-gray-200">
            <p className="text-xs text-gray-500">
              Ready for Phase 1: User Authentication
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}

export default App;
