"use client"
import React, { useState, useEffect, useRef } from 'react';
import ScrollToBottom from 'react-scroll-to-bottom';
import styles from './chatConsole.module.css'
interface SocketConsoleProps {
  messages: string[];
}

export default function ChatConsole({ }: SocketConsoleProps) {
    const [messages, setMessages] = useState([]);
    const [input, setInput] = useState('');
    const messageEndRef = useRef(null);

  useEffect(() => {
    messageEndRef.current?.scrollIntoView({ behavior: 'smooth' });  
  }, [messages]);

  const handleSendMessage = () => {
    if (input.trim()) {
      setMessages([...messages, input]);
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
