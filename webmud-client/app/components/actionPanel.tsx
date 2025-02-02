"use client"
import React, { useState, useEffect, useRef } from 'react';
import ScrollToBottom from 'react-scroll-to-bottom';

interface ActionPanelProps {
    messages: string[];
}

export default function ActionPanel({ messages }: ActionPanelProps) {
    return (
        <div className="actionPanel">
            <ScrollToBottom className="scrollContainer">
                {messages?.map((msg, i) => (
                    <div key={i} className="message">
                        {msg}
                    </div>
                ))}
            </ScrollToBottom>
        </div>
    );
}