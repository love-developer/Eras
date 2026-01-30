import React from 'react';

export function AppLoader() {
  React.useEffect(() => {
    console.log('✅ AppLoader mounted - React is working');
    console.log('📱 User Agent:', navigator.userAgent);
    console.log('🌐 Window size:', window.innerWidth, 'x', window.innerHeight);
    console.log('💾 LocalStorage available:', typeof localStorage !== 'undefined');
    console.log('🔧 React version:', React.version);
  }, []);

  return (
    <div className="min-h-screen bg-gradient-to-br from-purple-50 to-pink-50 flex items-center justify-center p-4">
      <div className="text-center space-y-4 max-w-md">
        {/* Spinning wheel with gradient - no visible border box */}
        <div className="w-16 h-16 mx-auto animate-spin">
          <svg viewBox="0 0 64 64" fill="none" xmlns="http://www.w3.org/2000/svg">
            <defs>
              <linearGradient id="spinnerGradient" x1="0%" y1="0%" x2="100%" y2="100%">
                <stop offset="0%" stopColor="#a855f7" />
                <stop offset="50%" stopColor="#3b82f6" />
                <stop offset="100%" stopColor="#ec4899" />
              </linearGradient>
            </defs>
            {/* Circular arc - no box, just the wheel */}
            <path
              d="M 32,4 A 28,28 0 0,1 60,32"
              stroke="url(#spinnerGradient)"
              strokeWidth="6"
              strokeLinecap="round"
              fill="none"
            />
            <path
              d="M 60,32 A 28,28 0 0,1 32,60"
              stroke="url(#spinnerGradient)"
              strokeWidth="4"
              strokeLinecap="round"
              fill="none"
              opacity="0.4"
            />
          </svg>
        </div>
        <h1 className="text-2xl font-bold text-gray-800">Loading Eras...</h1>
        <p className="text-sm text-gray-600">
          If this screen persists, please check your browser console for errors.
        </p>
        <div className="mt-4 p-4 bg-white rounded-lg shadow-sm text-left text-xs space-y-1">
          <p className="font-mono text-gray-700">🔍 Diagnostics:</p>
          <p className="font-mono text-gray-600">React: {React.version}</p>
          <p className="font-mono text-gray-600">Width: {window.innerWidth}px</p>
          <p className="font-mono text-gray-600 break-all">UA: {navigator.userAgent.substring(0, 50)}...</p>
        </div>
      </div>
    </div>
  );
}
