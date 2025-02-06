"use client"
import React, { useState, useEffect } from 'react';
import axios from 'axios';
import { signIn, signOut, useSession } from 'next-auth/react';
import styles from './connectionBar.module.css'
import { useGameService } from "../contexts/GameServiceContext";

export default function ConnectionBar() {
  const { data: session, status } = useSession();
  const [servers, setServers] = useState([]);
  const [selectedServer, setSelectedServer] = useState('');
  const { socket, serverAddress, connectionStatus, connect, disconnect } = useGameService();
  
  // monitor the server list if user is authenticated
  useEffect(() => {
    if (status === 'authenticated') {
      axios.get('/api/servers')
        .then(res => setServers(res.data))
        .catch(err => console.error('Error fetching servers:', err));
    }
  }, [status]);

  useEffect(() =>  {

  });

  const handleLogin = () => {
    signIn(); // signin using next-auth with configured AADB2C provider
  };

  const handleLogout = () => {
    signOut();
  };

  // Connect to the selected server on the websocket server address
  const handleConnect = () => {
    const server = servers.find(({ id }) => id === selectedServer);
    if (server) {
      connect(server.uri); // connect to the server using SocketContext's exposed connect method
    }
  };

  const handleDisconnect = () => {
    // ...existing code...
    disconnect();
  };

  const isConnected = ()  => {
    return connectionStatus === 'connected';
  }
 
  return (
    <div className={styles.connectionBar}>
      {status !== 'authenticated' ? (
        <button onClick={handleLogin}>Log In</button>
      ) : (
        <div className={styles.loggedInWrapper}>
          <div className={styles.leftSection}>
            Logged in as: <span className={styles.userName}>{session?.user?.name}</span>
            <button onClick={handleLogout} className={styles.logoutButton}>Log Out</button>
          </div>
          <div className={styles.rightSection}>
            {!isConnected() ? (
              <>
                <select
                  value={selectedServer}
                  onChange={(e) => setSelectedServer(e.target.value)}
                  className={styles.serverSelect}
                >
                  <option value="" disabled>Select a server</option>
                  {servers.map(server => (
                    <option key={server.id} value={server.id}>{server.name}</option>
                  ))}
                </select>
                <button onClick={handleConnect} disabled={!selectedServer} className={styles.connectButton}>Connect</button>
              </>
            ) : (
              <>
                Status:&nbsp;<span className={styles.connectionStatus}><span className={styles.connectedIndicator}>●</span> {selectedServer}</span>
                <button onClick={handleDisconnect} className={styles.disconnectButton}>Disconnect</button>
              </>
            )}
          </div>
        </div>
      )}
    </div>
  );
}