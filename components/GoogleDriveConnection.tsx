'use client';

import { useEffect, useState } from 'react';
import { useToast } from '@/hooks/use-toast';

export default function GoogleDriveConnection() {
  const { toast } = useToast();
  const [connected, setConnected] = useState<boolean | null>(null);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    checkConnection();
  }, []);

  const checkConnection = async () => {
    try {
      const response = await fetch('/api/auth/google/status');
      if (response.status === 401) {
        // Not authenticated - don't show connection status
        setConnected(false);
        return;
      }
      const data = await response.json();
      setConnected(data.connected ?? false);
    } catch (error) {
      setConnected(false);
    }
  };

  const handleConnect = async () => {
    setLoading(true);
    try {
      const response = await fetch('/api/auth/google');
      const data = await response.json();
      
      if (data.authUrl) {
        window.location.href = data.authUrl;
      } else {
        throw new Error('Failed to get auth URL');
      }
    } catch (err) {
      toast({
        title: 'Connection Failed',
        description: err instanceof Error ? err.message : 'Failed to connect to Google Drive',
        variant: 'destructive',
      });
      setLoading(false);
    }
  };

  const handleDisconnect = async () => {
    if (!confirm('Are you sure you want to disconnect Google Drive?')) {
      return;
    }

    setLoading(true);
    try {
      const response = await fetch('/api/auth/google/disconnect', {
        method: 'POST',
      });

      if (response.ok) {
        setConnected(false);
        toast({
          title: 'Disconnected',
          description: 'Google Drive has been disconnected',
        });
      } else {
        throw new Error('Failed to disconnect');
      }
    } catch (err) {
      toast({
        title: 'Error',
        description: err instanceof Error ? err.message : 'Failed to disconnect',
        variant: 'destructive',
      });
    } finally {
      setLoading(false);
    }
  };

  if (connected === null) {
    return (
      <div className="bg-zinc-50 dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-800 rounded-lg p-4 transition-colors">
        <div className="text-zinc-600 dark:text-zinc-400 text-sm transition-colors">Checking connection...</div>
      </div>
    );
  }

  return (
    <div className="bg-zinc-50 dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-800 rounded-lg p-4 mb-6 transition-colors">
      <div className="flex items-center justify-between">
        <div>
          <h3 className="text-sm font-medium text-zinc-900 dark:text-zinc-200 mb-1 transition-colors">
            Google Drive Connection
          </h3>
          <p className="text-xs text-zinc-600 dark:text-zinc-400 transition-colors">
            {connected
              ? 'Connected - Photos will be uploaded to your Drive'
              : 'Not connected - Connect to use Google Drive storage'}
          </p>
        </div>
        <div>
          {connected ? (
            <button
              onClick={handleDisconnect}
              disabled={loading}
              className="px-4 py-2 bg-zinc-100 dark:bg-zinc-800 hover:bg-zinc-200 dark:hover:bg-zinc-700 text-zinc-900 dark:text-zinc-100 rounded-md text-sm font-medium transition-colors disabled:opacity-50 border border-zinc-300 dark:border-zinc-700"
            >
              {loading ? 'Disconnecting...' : 'Disconnect'}
            </button>
          ) : (
            <button
              onClick={handleConnect}
              disabled={loading}
              className="px-4 py-2 bg-zinc-900 dark:bg-zinc-700 hover:bg-zinc-800 dark:hover:bg-zinc-600 text-white dark:text-zinc-100 rounded-md text-sm font-medium transition-colors disabled:opacity-50 border border-zinc-800 dark:border-zinc-600"
            >
              {loading ? 'Connecting...' : 'Connect Drive'}
            </button>
          )}
        </div>
      </div>
    </div>
  );
}
