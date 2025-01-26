import React, { useState, useEffect } from 'react';
const [connectionStatus, setConnectionStatus] = useState('Disconnected');

const sendMessage = () => {
    if (messageInput.trim() !== '') {
      const message = {
        text: messageInput,
        timestamp: new Date().toISOString(),
      };
      socket.send(JSON.stringify(message));
      setMessageInput('');
    }
  };
  
export const WebSocketConsole = ({ url }) => {
    const [messages, setMessages] = useState([]);
    const [ws, setWs] = useState(null);

    useEffect(() => {
        const socket = new WebSocket(url);
        setWs(socket);

        socket.onmessage = (event) => {
            setMessages((prevMessages) => [...prevMessages, event.data]);
        };

        socket.onerror = (error) => {
            console.error('WebSocket error:', error);
        };

        socket.onclose = () => {
            console.log('WebSocket connection closed');
        };

        return () => {
            socket.close();
        };
    }, [url]);

    return (
        <div className="websocket-console">
            <h3>WebSocket Console</h3>
            <div className="messages">
                {messages.map((message, index) => (
                    <div key={index} className="message">
                        {message}
                    </div>
                ))}
            </div>
        </div>
    );
};
