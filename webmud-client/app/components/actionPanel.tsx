"use client"
import React, { useState, useEffect, useRef } from 'react';
import styles from './actionPanel.module.css';

interface ActionPanelProps {
    messages: string[];
    className: string;
}

export default function ActionPanel({ messages }: ActionPanelProps) {
    return (
        <div className={styles.actionPanel}>
            <div
                style={{
                    display: 'grid',
                    gridTemplateColumns: '2fr 3fr 2fr',
                    gridTemplateRows: '3fr 5fr 3fr',
                    gap: '8px',
                }}
            >
                <div style={{ backgroundColor: '#ccc' }}>Cell 1</div>
                <div style={{ backgroundColor: '#bbb' }}>Cell 2</div>
                <div style={{ backgroundColor: '#ccc' }}>Cell 3</div>
                <div style={{ backgroundColor: '#bbb' }}>Cell 4</div>
                <div style={{ backgroundColor: '#999' }}>Center Cell</div>
                <div style={{ backgroundColor: '#bbb' }}>Cell 6</div>
                <div style={{ backgroundColor: '#ccc' }}>Cell 7</div>
                <div style={{ backgroundColor: '#bbb' }}>Cell 8</div>
                <div style={{ backgroundColor: '#ccc' }}>Cell 9</div>
            </div>
        </div>
    );
}