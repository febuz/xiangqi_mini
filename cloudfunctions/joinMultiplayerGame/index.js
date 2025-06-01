// index.js for joinMultiplayerGame cloud function
const cloud = require('wx-server-sdk');

cloud.init({
  env: cloud.DYNAMIC_CURRENT_ENV
});

const db = cloud.database();
const gamesCollection = db.collection('games');
const activeGamesCollection = db.collection('active_games');

// Main function to join an existing multiplayer game
exports.main = async (event, context) => {
  try {
    const { gameId, player } = event;
    const wxContext = cloud.getWXContext();
    const playerId = wxContext.OPENID;
    
    // Get the game state from database
    const gameDoc = await gamesCollection.doc(gameId).get();
    if (!gameDoc.data) {
      return {
        success: false,
        message: 'Game not found'
      };
    }
    
    const gameState = gameDoc.data;
    
    // Check if the game is multiplayer and waiting for a second player
    if (!gameState.multiplayer) {
      return {
        success: false,
        message: 'This is not a multiplayer game'
      };
    }
    
    if (gameState.players.black) {
      return {
        success: false,
        message: 'Game is already full'
      };
    }
    
    // Check if the player is trying to join their own game
    if (gameState.players.red && gameState.players.red.id === playerId) {
      return {
        success: false,
        message: 'You cannot join your own game'
      };
    }
    
    // Update the game state with the second player
    gameState.players.black = {
      id: playerId,
      name: player || 'Player 2'
    };
    
    gameState.last_updated = new Date();
    
    // Update the game in the database
    await gamesCollection.doc(gameId).update({
      data: gameState
    });
    
    // Update the active game status
    const activeGames = await activeGamesCollection.where({
      game_id: gameId
    }).get();
    
    if (activeGames.data && activeGames.data.length > 0) {
      await activeGamesCollection.doc(activeGames.data[0]._id).update({
        data: {
          status: 'in_progress',
          opponent: {
            id: playerId,
            name: player || 'Player 2'
          }
        }
      });
    }
    
    return {
      success: true,
      game_id: gameId,
      game: gameState
    };
  } catch (error) {
    console.error('Error joining multiplayer game:', error);
    return {
      success: false,
      message: 'Error joining multiplayer game',
      error: error.message
    };
  }
}
