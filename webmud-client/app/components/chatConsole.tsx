"use client"
import React, { useState, useEffect, useRef } from 'react';
import ScrollToBottom from 'react-scroll-to-bottom';
import styles from './chatConsole.module.css'
import { useSocket } from '../contexts/SocketContext';

export default function ChatConsole({ }: SocketConsoleProps) {
  const { socket } = useSocket();
  const [messages, setMessages] = useState([]);
  const [input, setInput] = useState('');
  const messageEndRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (!socket) return;

    const handleIncomingMessage = (data: any) => {
      console.log('Incoming message:', data);
      setMessages(prev => [...prev, data]);
    };

    const handleIncomingBroadcast = (data: any) => {
      console.log('Incoming broadcast:', data);
      setMessages(prev => [...prev, data]);
    };

    socket.on('message', handleIncomingMessage);
    socket.on('broadcast', handleIncomingBroadcast);
    
    return () => {
      socket.off('message', handleIncomingMessage);
      socket.off('broadcast', handleIncomingBroadcast);
    };
  }, [socket]);

  useEffect(() => {
    messageEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages]);

  const handleSendMessage = () => {
    if (input.trim() && socket) {
      // Emit the message to the server
      socket.emit('message', input);
      //setMessages([...messages, input]);
      setMessages(prev => [...prev, input]);
      setInput('');
    }
  };

  return (
    <div className={styles.chatContainer}>
      <ScrollToBottom className={styles.messagesContainer}>
        {messages.map((msg, index) => (
          <div key={index} className={styles.message}>
            {msg}
          </div>
        ))}
        <div ref={messageEndRef} />
      </ScrollToBottom>
      <div className={styles.inputContainer}>
        <input
          type="text"
          value={input}
          onChange={(e) => setInput(e.target.value)}
          onKeyDown={(e) => e.key === 'Enter' && handleSendMessage()}
          placeholder="Type a message..."
        />
        <button onClick={handleSendMessage}>Send</button>
      </div>
    </div>
  );
}
