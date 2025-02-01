"use client"
import React, { useState, useEffect } from 'react';
import axios from 'axios';
// ...existing code...
import { signIn, signOut, useSession } from 'next-auth/react';

export default function ConnectionBar() {
  const { data: session, status } = useSession();
  const [servers, setServers] = useState([]);
  const [selectedServer, setSelectedServer] = useState('');
  const [isConnected, setIsConnected] = useState(false);

  useEffect(() => {
    if (status === 'authenticated') {
      axios.get('/api/servers')
        .then(res => setServers(res.data))
        .catch(err => console.error('Error fetching servers:', err));
    }
  }, [status]);

  const handleLogin = () => {
    signIn('azure-ad-b2c');
  };

  const handleLogout = () => {
    signOut();
  };

  const handleConnect = () => {

    setIsConnected(true);
  };

  const handleDisconnect = () => {
    // ...existing code...
    setIsConnected(false);
  };

  return (
    <div style={{ background: '#333', padding: '0.5rem', color: '#eee' }}>
      {status !== 'authenticated' ? (
        <button onClick={handleLogin}>Log In</button>
      ) : (
        <>
          <span style={{ marginRight: '1rem' }}>Logged in as: {session?.user?.name}</span>
          <button onClick={handleLogout} style={{ marginRight: '1rem' }}>Log Out</button>
          {!isConnected ? (
            <>
              <select
                value={selectedServer}
                onChange={(e) => setSelectedServer(e.target.value)}
                style={{ marginRight: '0.5rem' }}
              >
                <option value="" disabled>Select a server</option>
                {servers.map(server => (
                  <option key={server.id} value={server.id}>{server.name}</option>
                ))}
              </select>
              <button onClick={handleConnect} disabled={!selectedServer}>Connect</button>
            </>
          ) : (
            <>
              <span style={{ marginRight: '0.5rem' }}>Connected to {selectedServer}</span>
              <button onClick={handleDisconnect}>Disconnect</button>
            </>
          )}
        </>
      )}
    </div>
  );
}