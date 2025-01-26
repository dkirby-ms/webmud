import React, { useState, useEffect } from 'react';

export const WebSocketConsole = ({ url }) => {
    const [messages, setMessages] = useState([]);
    const [messageInput, setMessageInput] = useState('');
    const [ws, setWs] = useState(null);
    const [connectionStatus, setConnectionStatus] = useState('Disconnected');
    const socket = new WebSocket(url);

    useEffect(() => {
        socket.onopen = () => {
            console.log('WebSocket connection established.');
          };
        
          socket.onmessage = (event) => {
            const receivedMessage = JSON.parse(event.data);
            setMessages([...messages, receivedMessage]);
          };
        
          return () => {
            socket.close();
          };
    }, [messages]);

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

    return (
        <div className="App">
            <div className="chat-container">
                <div className="chat-messages">
                    {messages.map((message, index) => (
                        <div key={index} className="message">
                            {message}
                        </div>
                    ))}
                </div>
                <div className="chat-input">
                    <input
                        type="text"
                        placeholder="Type your message..."
                        value={messageInput}
                        onChange={(e) => setMessageInput(e.target.value)}
                    />
                    <button onClick={sendMessage}>Send</button>
                </div>
            </div>
        </div>
    );
};
