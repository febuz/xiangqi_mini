// index.js for createMultiplayerGame cloud function
const cloud = require('wx-server-sdk');

cloud.init({
  env: cloud.DYNAMIC_CURRENT_ENV
});

const db = cloud.database();
const gamesCollection = db.collection('games');
const activeGamesCollection = db.collection('active_games');

// Main function to create a new multiplayer game
exports.main = async (event, context) => {
  try {
    const { creator } = event;
    const wxContext = cloud.getWXContext();
    const creatorId = wxContext.OPENID;
    
    // Create initial game state
    const gameState = {
      current_player: 'red',
      game_over: false,
      winner: null,
      ai_enabled: false,
      multiplayer: true,
      players: {
        red: {
          id: creatorId,
          name: creator || 'Player 1'
        },
        black: null
      },
      pieces: [
        // Red pieces (bottom)
        { type: 'chariot', color: 'red', row: 9, col: 0 },
        { type: 'horse', color: 'red', row: 9, col: 1 },
        { type: 'elephant', color: 'red', row: 9, col: 2 },
        { type: 'advisor', color: 'red', row: 9, col: 3 },
        { type: 'general', color: 'red', row: 9, col: 4 },
        { type: 'advisor', color: 'red', row: 9, col: 5 },
        { type: 'elephant', color: 'red', row: 9, col: 6 },
        { type: 'horse', color: 'red', row: 9, col: 7 },
        { type: 'chariot', color: 'red', row: 9, col: 8 },
        { type: 'cannon', color: 'red', row: 7, col: 1 },
        { type: 'cannon', color: 'red', row: 7, col: 7 },
        { type: 'soldier', color: 'red', row: 6, col: 0 },
        { type: 'soldier', color: 'red', row: 6, col: 2 },
        { type: 'soldier', color: 'red', row: 6, col: 4 },
        { type: 'soldier', color: 'red', row: 6, col: 6 },
        { type: 'soldier', color: 'red', row: 6, col: 8 },
        
        // Black pieces (top)
        { type: 'chariot', color: 'black', row: 0, col: 0 },
        { type: 'horse', color: 'black', row: 0, col: 1 },
        { type: 'elephant', color: 'black', row: 0, col: 2 },
        { type: 'advisor', color: 'black', row: 0, col: 3 },
        { type: 'general', color: 'black', row: 0, col: 4 },
        { type: 'advisor', color: 'black', row: 0, col: 5 },
        { type: 'elephant', color: 'black', row: 0, col: 6 },
        { type: 'horse', color: 'black', row: 0, col: 7 },
        { type: 'chariot', color: 'black', row: 0, col: 8 },
        { type: 'cannon', color: 'black', row: 2, col: 1 },
        { type: 'cannon', color: 'black', row: 2, col: 7 },
        { type: 'soldier', color: 'black', row: 3, col: 0 },
        { type: 'soldier', color: 'black', row: 3, col: 2 },
        { type: 'soldier', color: 'black', row: 3, col: 4 },
        { type: 'soldier', color: 'black', row: 3, col: 6 },
        { type: 'soldier', color: 'black', row: 3, col: 8 }
      ],
      created_at: new Date(),
      last_updated: new Date()
    };
    
    // Add the game to the database
    const result = await gamesCollection.add({
      data: gameState
    });
    
    // Add to active games list
    await activeGamesCollection.add({
      data: {
        game_id: result._id,
        creator: {
          id: creatorId,
          name: creator || 'Player 1'
        },
        status: 'waiting',
        created_at: new Date()
      }
    });
    
    return {
      success: true,
      game_id: result._id,
      game: gameState
    };
  } catch (error) {
    console.error('Error creating multiplayer game:', error);
    return {
      success: false,
      message: 'Error creating multiplayer game',
      error: error.message
    };
  }
}
