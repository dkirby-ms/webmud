import React, { useState, useRef, useEffect, KeyboardEvent } from 'react';
import { useGameService } from '../contexts/GameServiceContext';
import { MessageTypes } from '../lib/messageTypes';
import { StickToBottom } from 'use-stick-to-bottom';

interface CommandConsoleProps {
  playerId: string;
  disabled?: boolean;
}

interface GameMessage {
  id: string;
  text: string;
  type: 'system' | 'chat' | 'tell' | 'emote' | 'combat' | 'error' | 'help' | 'room';
  timestamp: Date;
  sender?: string;
}

const COMMON_COMMANDS = [
  'look', 'say', 'tell', 'north', 'south', 'east', 'west', 'up', 'down',
  'attack', 'kill', 'flee', 'help', 'smile', 'dance', 'wave', 'bow'
];

const MAX_MESSAGES = 500; // Limit messages to prevent performance issues

export function CommandConsole({ playerId, disabled = false }: CommandConsoleProps) {
  const { socket, connectionStatus } = useGameService();
  const [currentInput, setCurrentInput] = useState('');
  const [commandHistory, setCommandHistory] = useState<string[]>([]);
  const [historyIndex, setHistoryIndex] = useState(-1);
  const [messages, setMessages] = useState<GameMessage[]>([]);
  const [showSuggestions, setShowSuggestions] = useState(false);
  const [suggestions, setSuggestions] = useState<string[]>([]);
  const [selectedSuggestionIndex, setSelectedSuggestionIndex] = useState(-1);
  
  const inputRef = useRef<HTMLInputElement>(null);
  const lastGameMessageCountRef = useRef<number>(0);

  // Auto-scroll to bottom when new messages arrive - StickToBottom will handle this
  useEffect(() => {
    // StickToBottom component handles auto-scrolling, so we don't need manual scrolling
  }, [messages]);

  // Set up game service message listeners
  useEffect(() => {
    if (!socket) return;

    const handleChatMessage = (message: any) => {
      addMessage({
        text: `${message.senderName}: ${message.content}`,
        type: 'chat',
        sender: message.senderName
      });
    };

    const handleTellMessage = (message: any) => {
      addMessage({
        text: `${message.senderName} tells you: ${message.content}`,
        type: 'tell',
        sender: message.senderName
      });
    };

    const handleGameStateUpdate = (gameState: any) => {
      // Extract game messages from the game state update
      if (gameState.gameMessages && Array.isArray(gameState.gameMessages)) {
        // Add new messages that haven't been displayed yet
        const currentGameMessageCount = gameState.gameMessages.length;
        const lastCount = lastGameMessageCountRef.current;
        
        if (currentGameMessageCount > lastCount) {
          const newMessages = gameState.gameMessages.slice(lastCount);
          
          newMessages.forEach((msg: string) => {
            addMessage({
              text: msg,
              type: determineMessageType(msg)
            });
          });
          
          lastGameMessageCountRef.current = currentGameMessageCount;
        }
      }
    };

    const handleGameMessages = (gameMessages: string[]) => {
      gameMessages.forEach(msg => {
        addMessage({
          text: msg,
          type: determineMessageType(msg)
        });
      });
    };

    const handleRoomUpdate = (roomData: any) => {
      if (roomData.description) {
        addMessage({
          text: roomData.description,
          type: 'room'
        });
      }
      if (roomData.exits && roomData.exits.length > 0) {
        addMessage({
          text: `Exits: ${roomData.exits.join(', ')}`,
          type: 'system'
        });
      }
    };

    socket.on('chat:sent', handleChatMessage);
    socket.on('chat:tell', handleTellMessage);
    socket.on('game:state_update', handleGameStateUpdate);
    socket.on('game:messages', handleGameMessages);
    socket.on('game:room_update', handleRoomUpdate);

    return () => {
      socket.off('chat:sent', handleChatMessage);
      socket.off('chat:tell', handleTellMessage);
      socket.off('game:state_update', handleGameStateUpdate);
      socket.off('game:messages', handleGameMessages);
      socket.off('game:room_update', handleRoomUpdate);
    };
  }, [socket]);

  const addMessage = (messageData: Partial<GameMessage>) => {
    const message: GameMessage = {
      id: Date.now().toString() + Math.random().toString(36).substr(2, 9),
      timestamp: new Date(),
      type: 'system',
      ...messageData,
      text: messageData.text || ''
    };
    
    setMessages(prev => {
      const newMessages = [...prev, message];
      // Keep only the most recent MAX_MESSAGES to prevent performance issues
      if (newMessages.length > MAX_MESSAGES) {
        return newMessages.slice(-MAX_MESSAGES);
      }
      return newMessages;
    });
  };

  const determineMessageType = (text: string): GameMessage['type'] => {
    if (text.includes('tells you') || text.includes('You tell')) return 'tell';
    if (text.includes('says') || text.includes('You say')) return 'chat';
    if (text.includes('attacks') || text.includes('damage') || text.includes('dies')) return 'combat';
    if (text.includes('Available commands') || text.includes('Help')) return 'help';
    if (text.includes('smiles') || text.includes('waves') || text.includes('dances')) return 'emote';
    if (text.includes('don\'t understand') || text.includes('error')) return 'error';
    return 'system';
  };

  const sendCommand = (command: string) => {
    if (!socket || connectionStatus !== 'connected' || !command.trim()) return;

    // Add to command history
    setCommandHistory(prev => [command, ...prev.slice(0, 49)]); // Keep last 50 commands
    setHistoryIndex(-1);

    // Show the command in the console
    addMessage({
      text: `> ${command}`,
      type: 'system'
    });

    // Send command to game service
    socket.emit(MessageTypes.command.SEND_COMMAND, {
      command: command.trim(),
      playerId
    });
  };

  const handleInputChange = (value: string) => {
    setCurrentInput(value);
    
    // Handle command suggestions
    if (value.trim()) {
      const matchingSuggestions = COMMON_COMMANDS.filter(cmd =>
        cmd.toLowerCase().startsWith(value.toLowerCase())
      );
      setSuggestions(matchingSuggestions);
      setShowSuggestions(matchingSuggestions.length > 0);
      setSelectedSuggestionIndex(-1);
    } else {
      setShowSuggestions(false);
      setSuggestions([]);
    }
  };

  const handleKeyDown = (e: KeyboardEvent<HTMLInputElement>) => {
    if (e.key === 'Enter') {
      e.preventDefault();
      if (showSuggestions && selectedSuggestionIndex >= 0) {
        // Use selected suggestion
        const selectedSuggestion = suggestions[selectedSuggestionIndex];
        setCurrentInput(selectedSuggestion + ' ');
        setShowSuggestions(false);
        inputRef.current?.focus();
      } else {
        // Send command
        sendCommand(currentInput);
        setCurrentInput('');
        setShowSuggestions(false);
      }
    } else if (e.key === 'ArrowUp') {
      e.preventDefault();
      if (showSuggestions) {
        setSelectedSuggestionIndex(prev => 
          prev <= 0 ? suggestions.length - 1 : prev - 1
        );
      } else if (commandHistory.length > 0) {
        const newIndex = Math.min(historyIndex + 1, commandHistory.length - 1);
        setHistoryIndex(newIndex);
        setCurrentInput(commandHistory[newIndex] || '');
      }
    } else if (e.key === 'ArrowDown') {
      e.preventDefault();
      if (showSuggestions) {
        setSelectedSuggestionIndex(prev => 
          prev >= suggestions.length - 1 ? 0 : prev + 1
        );
      } else if (historyIndex >= 0) {
        const newIndex = historyIndex - 1;
        setHistoryIndex(newIndex);
        setCurrentInput(newIndex >= 0 ? commandHistory[newIndex] : '');
      }
    } else if (e.key === 'Escape') {
      setShowSuggestions(false);
      setHistoryIndex(-1);
    } else if (e.key === 'Tab') {
      e.preventDefault();
      if (suggestions.length > 0) {
        setCurrentInput(suggestions[0] + ' ');
        setShowSuggestions(false);
      }
    }
  };

  const handleSuggestionClick = (suggestion: string) => {
    setCurrentInput(suggestion + ' ');
    setShowSuggestions(false);
    inputRef.current?.focus();
  };

  const getMessageStyle = (type: GameMessage['type']) => {
    switch (type) {
      case 'chat':
        return 'text-blue-300';
      case 'tell':
        return 'text-purple-300';
      case 'emote':
        return 'text-yellow-300';
      case 'combat':
        return 'text-red-300';
      case 'error':
        return 'text-red-400';
      case 'help':
        return 'text-green-300';
      case 'room':
        return 'text-cyan-300';
      default:
        return 'text-gray-300';
    }
  };

  const formatTime = (date: Date) => {
    return date.toLocaleTimeString('en-US', { 
      hour12: false, 
      hour: '2-digit', 
      minute: '2-digit' 
    });
  };

  return (
    <div className="flex flex-col h-full bg-gray-900 text-white overflow-hidden">
      {/* Messages Area */}
      <div className="flex-1 min-h-0 relative">
        <StickToBottom 
          className="w-full h-full overflow-y-auto"
          resize="smooth"
          initial="smooth"
        >
          <StickToBottom.Content className="p-4 font-mono text-sm space-y-1">
            {messages.length === 0 && (
              <div className="text-gray-500 italic">
                Welcome to webMUD! Type commands to interact with the world.
                <br />
                Try typing "help" for available commands.
              </div>
            )}
            
            {messages.map((message) => (
              <div 
                key={message.id} 
                className={`flex ${getMessageStyle(message.type)}`}
              >
                <span className="text-gray-500 text-xs mr-2 select-none">
                  {formatTime(message.timestamp)}
                </span>
                <span className="flex-1 whitespace-pre-wrap break-words">
                  {message.text}
                </span>
              </div>
            ))}
          </StickToBottom.Content>
        </StickToBottom>
      </div>

      {/* Command Input Area */}
      <div className="border-t border-gray-700 p-4 relative flex-shrink-0">
        {/* Suggestions Dropdown */}
        {showSuggestions && suggestions.length > 0 && (
          <div className="absolute bottom-full left-4 right-4 mb-1 bg-gray-800 border border-gray-600 rounded-md shadow-lg max-h-32 overflow-y-auto z-10">
            {suggestions.map((suggestion, index) => (
              <div
                key={suggestion}
                className={`px-3 py-2 cursor-pointer text-sm ${
                  index === selectedSuggestionIndex 
                    ? 'bg-blue-600 text-white' 
                    : 'text-gray-300 hover:bg-gray-700'
                }`}
                onClick={() => handleSuggestionClick(suggestion)}
              >
                {suggestion}
              </div>
            ))}
          </div>
        )}

        {/* Input Field */}
        <div className="flex items-center">
          <span className="text-green-400 mr-2 font-mono">&gt;</span>
          <input
            ref={inputRef}
            type="text"
            value={currentInput}
            onChange={(e) => handleInputChange(e.target.value)}
            onKeyDown={handleKeyDown}
            placeholder={disabled ? "Not connected..." : "Enter command..."}
            disabled={disabled || connectionStatus !== 'connected'}
            className="flex-1 bg-transparent border-none outline-none text-white font-mono placeholder-gray-500 disabled:opacity-50"
            autoComplete="off"
            autoFocus
          />
        </div>

        {/* Connection Status */}
        <div className="text-xs text-gray-500 mt-2 flex justify-between">
          <span>
            Status: 
            <span className={`ml-1 ${
              connectionStatus === 'connected' ? 'text-green-400' : 
              connectionStatus === 'connecting' ? 'text-yellow-400' : 
              'text-red-400'
            }`}>
              {connectionStatus}
            </span>
          </span>
          <span>
            Use ↑/↓ for history, Tab for autocomplete, Esc to cancel
          </span>
        </div>
      </div>
    </div>
  );
}
