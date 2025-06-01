// index.js for getActiveGames cloud function
const cloud = require('wx-server-sdk');

cloud.init({
  env: cloud.DYNAMIC_CURRENT_ENV
});

const db = cloud.database();
const activeGamesCollection = db.collection('active_games');

// Main function to get active multiplayer games
exports.main = async (event, context) => {
  try {
    const wxContext = cloud.getWXContext();
    const playerId = wxContext.OPENID;
    
    // Get all active games with status 'waiting'
    const activeGames = await activeGamesCollection
      .where({
        status: 'waiting'
      })
      .orderBy('created_at', 'desc')
      .get();
    
    // Format the response
    const games = activeGames.data.map(game => {
      return {
        id: game.game_id,
        creator: game.creator.name,
        createdAt: game.created_at,
        // Don't show join button for own games
        isOwnGame: game.creator.id === playerId
      };
    });
    
    return {
      success: true,
      games: games
    };
  } catch (error) {
    console.error('Error getting active games:', error);
    return {
      success: false,
      message: 'Error getting active games',
      error: error.message,
      games: []
    };
  }
};
