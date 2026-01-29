"use client";

import React from 'react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';

export default function TestPage() {
  const [backendStatus, setBackendStatus] = React.useState<'loading' | 'success' | 'error'>('loading');
  const [aiEngineStatus, setAiEngineStatus] = React.useState<'loading' | 'success' | 'error'>('loading');
  const [testResults, setTestResults] = React.useState<any[]>([]);

  React.useEffect(() => {
    testConnections();
  }, []);

  const testConnections = async () => {
    // Test Backend
    try {
      const response = await fetch('http://localhost:3000/health');
      if (response.ok) {
        setBackendStatus('success');
        setTestResults(prev => [...prev, { service: 'Backend', status: 'Connected' }]);
      } else {
        setBackendStatus('error');
        setTestResults(prev => [...prev, { service: 'Backend', status: 'Error' }]);
      }
    } catch (error) {
      setBackendStatus('error');
      setTestResults(prev => [...prev, { service: 'Backend', status: 'Offline' }]);
    }

    // Test AI Engine
    try {
      const response = await fetch('http://localhost:5000/health');
      if (response.ok) {
        setAiEngineStatus('success');
        setTestResults(prev => [...prev, { service: 'AI Engine', status: 'Connected' }]);
      } else {
        setAiEngineStatus('error');
        setTestResults(prev => [...prev, { service: 'AI Engine', status: 'Error' }]);
      }
    } catch (error) {
      setAiEngineStatus('error');
      setTestResults(prev => [...prev, { service: 'AI Engine', status: 'Offline' }]);
    }
  };

  const getStatusBadge = (status: string) => {
    const baseClasses = "px-2 py-1 rounded text-sm font-medium";
    switch (status) {
      case 'Connected':
        return <span className={`${baseClasses} bg-green-100 text-green-800`}>✅ {status}</span>;
      case 'Error':
        return <span className={`${baseClasses} bg-red-100 text-red-800`}>❌ {status}</span>;
      case 'Offline':
        return <span className={`${baseClasses} bg-gray-100 text-gray-800`}>⚪ {status}</span>;
      default:
        return <span className={`${baseClasses} bg-gray-100 text-gray-800`}>{status}</span>;
    }
  };

  return (
    <div className="container mx-auto p-6 max-w-4xl">
      <div className="space-y-6">
        <Card>
          <CardHeader>
            <CardTitle>🧪 HealthBridge AI - Integration Test</CardTitle>
            <CardDescription>
              Testing Next.js frontend integration with backend and AI engine
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <Card>
                <CardHeader className="pb-3">
                  <CardTitle className="text-lg">Backend Status</CardTitle>
                </CardHeader>
                <CardContent>
                  {getStatusBadge(backendStatus === 'success' ? 'Connected' : backendStatus === 'error' ? 'Error' : 'Loading')}
                  <p className="text-sm text-gray-600 mt-2">Node.js API Server</p>
                </CardContent>
              </Card>

              <Card>
                <CardHeader className="pb-3">
                  <CardTitle className="text-lg">AI Engine Status</CardTitle>
                </CardHeader>
                <CardContent>
                  {getStatusBadge(aiEngineStatus === 'success' ? 'Connected' : aiEngineStatus === 'error' ? 'Error' : 'Loading')}
                  <p className="text-sm text-gray-600 mt-2">Python ML Server</p>
                </CardContent>
              </Card>
            </div>

            <Button onClick={testConnections} variant="outline">
              🔄 Refresh Status
            </Button>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>Test Results</CardTitle>
          </CardHeader>
          <CardContent>
            {testResults.length === 0 ? (
              <p className="text-gray-500">Running tests...</p>
            ) : (
              <div className="space-y-3">
                {testResults.map((result, index) => (
                  <div key={index} className="flex items-center justify-between p-3 border rounded-lg">
                    <span className="font-medium">{result.service}</span>
                    {getStatusBadge(result.status)}
                  </div>
                ))}
              </div>
            )}
          </CardContent>
        </Card>

        <div className="text-center space-y-4">
          <h3 className="text-lg font-semibold">🚀 Next.js App Working!</h3>
          <div className="flex justify-center gap-4">
            <Button asChild>
              <a href="/">Landing Page</a>
            </Button>
            <Button variant="outline" asChild>
              <a href="/citizen/dashboard">Dashboard</a>
            </Button>
          </div>
        </div>
      </div>
    </div>
  );
}