import React from "react";

// Placeholder list of online players
const onlinePlayers = ["Player1", "Player2", "Player3"];

export default function PlayersPanel() {
  return (
    <div className="w-60 p-4 bg-gray-800 text-white">
      <h2 className="text-lg font-bold mb-2">Online Players</h2>
      <ul>
        {onlinePlayers.map(player => (
          <li key={player} className="mb-1">{player}</li>
        ))}
      </ul>
    </div>
  );
}
