"use client"
import React, { useState, useEffect, useRef } from 'react';
import styles from './chatConsole.module.css'
import { useSocket } from '../contexts/SocketContext';
import { StickToBottom, useStickToBottomContext } from 'use-stick-to-bottom';

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

    socket.on('message', handleIncomingMessage);
    
    return () => {
      socket.off('message', handleIncomingMessage);
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
      <div>
      <StickToBottom className="h-[50vh] relative"  resize="smooth" initial="smooth">
        <StickToBottom.Content className="flex flex-col gap-4">
          {messages.map((msg, index) => (
            <div key={index} className={styles.message}>
              {msg}
            </div>
          ))}
          <div ref={messageEndRef} />
        </StickToBottom.Content>
      </StickToBottom>
      </div>
      <div className={styles.inputContainer}>
        <input
          type="text"
          value={input}
          onChange={(e) => setInput(e.target.value)}
          onKeyDown={(e) => e.key === 'Enter' && handleSendMessage()}
          placeholder="Type a message..."
        />
        <button className={styles.sendButton} onClick={handleSendMessage}>Send</button>
      </div>
    </div>
  );
}
