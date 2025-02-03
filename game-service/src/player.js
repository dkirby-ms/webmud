function connectPlayer(server, data, socket, players) {
    const { playerId, playerName, playerLevel } = data;
    players[playerId] = { socket, playerName, playerLevel };
    console.log(`Player ${playerId} connected with name ${playerName} and level ${playerLevel}`);
    server.emi
    // Additional registration logic using someLibrary
}

function disconnectPlayer(socket, players) {
    for (const playerId in players) {
        if (players[playerId].socket === socket) {
            delete players[playerId];
            console.log(`Player ${playerId} disconnected`);
            break;
        }
    }
}

module.exports = connectPlayer, disconnectPlayer;