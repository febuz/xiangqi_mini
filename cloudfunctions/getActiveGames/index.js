// Cloud function for getting active multiplayer games
// This function retrieves all active multiplayer games that are open for joining

// Main function handler
exports.main = async (event, context) => {
  try {
    const wxContext = cloud.getWXContext();
    const db = cloud.database();
    const _ = db.command;
    
    // Get all active games that are waiting for a second player
    const gamesCollection = db.collection('games');
    const result = await gamesCollection.where({
      multiplayer: true,
      'players.black.id': null, // Black player slot is empty
      game_over: false
    }).get();
    
    // Format the response
    const activeGames = result.data.map(game => {
      return {
        game_id: game._id,
        creator: game.players.red.name || 'Unknown Player',
        created_at: game.created_at,
        moves_count: game.moves ? game.moves.length : 0
      };
    });
    
    return {
      success: true,
      games: activeGames
    };
  } catch (error) {
    console.error('Error getting active games:', error);
    return {
      success: false,
      error: error.message
    };
  }
};
