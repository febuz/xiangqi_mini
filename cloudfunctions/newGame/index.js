// index.js for newGame cloud function
const cloud = require('wx-server-sdk');

cloud.init({
  env: cloud.DYNAMIC_CURRENT_ENV
});

const db = cloud.database();
const gamesCollection = db.collection('games');

// Main function to create a new game
exports.main = async (event, context) => {
  try {
    const { ai_enabled = false, ai_difficulty = 'medium', ai_color = 'black' } = event;
    
    // Create initial game state
    const gameState = {
      current_player: 'red',
      game_over: false,
      winner: null,
      ai_enabled: ai_enabled,
      ai_difficulty: ai_difficulty,
      ai_color: ai_color,
      multiplayer: false,
      players: {
        red: null,
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
      ]
    };
    
    // Add the game to the database
    const result = await gamesCollection.add({
      data: gameState
    });
    
    // If AI is enabled and AI plays first (red), make the first move
    if (ai_enabled && ai_color === 'red') {
      // Make AI move (this would be implemented in a real app)
      // For now, we'll just simulate a basic AI move - moving a soldier forward
      const aiPiece = gameState.pieces.find(p => p.type === 'soldier' && p.color === 'red' && p.col === 4);
      if (aiPiece) {
        aiPiece.row = 5; // Move forward one step
        gameState.current_player = 'black'; // Switch to player's turn
        
        // Update the game state in the database
        await gamesCollection.doc(result._id).update({
          data: gameState
        });
      }
    }
    
    return {
      success: true,
      game_id: result._id,
      game: gameState
    };
  } catch (error) {
    console.error('Error creating new game:', error);
    return {
      success: false,
      message: 'Error creating new game',
      error: error.message
    };
  }
}
