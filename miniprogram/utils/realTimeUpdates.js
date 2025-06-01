// Implementation of real-time game updates using cloud database subscriptions
// This file should be included in the miniprogram/utils directory

// realTimeUpdates.js
const setupGameSubscription = (gameId, callback) => {
  if (!gameId) {
    console.error('No game ID provided for subscription');
    return null;
  }
  
  const db = wx.cloud.database();
  
  // Create a watcher for the specific game document
  const watcher = db.collection('games')
    .doc(gameId)
    .watch({
      onChange: function(snapshot) {
        console.log('Game data updated:', snapshot);
        
        // If there's valid data, pass it to the callback
        if (snapshot && snapshot.docs && snapshot.docs.length > 0) {
          callback(snapshot.docs[0]);
        } else if (snapshot && snapshot.docChanges && snapshot.docChanges.length > 0) {
          // Alternative format depending on the database implementation
          const updatedDocs = snapshot.docChanges.filter(change => 
            change.dataType === 'update' || change.dataType === 'init'
          );
          
          if (updatedDocs.length > 0 && updatedDocs[0].doc) {
            callback(updatedDocs[0].doc);
          }
        }
      },
      onError: function(err) {
        console.error('Watch error:', err);
      }
    });
  
  return watcher;
};

// Setup subscription for active games in the lobby
const setupLobbySubscription = (callback) => {
  const db = wx.cloud.database();
  
  // Create a watcher for active games with 'waiting' status
  const watcher = db.collection('active_games')
    .where({
      status: 'waiting'
    })
    .watch({
      onChange: function(snapshot) {
        console.log('Lobby data updated:', snapshot);
        
        // Format the games data and pass to callback
        if (snapshot && snapshot.docs) {
          const games = snapshot.docs.map(game => {
            return {
              id: game.game_id,
              creator: game.creator.name,
              createdAt: game.created_at,
              // Don't show join button for own games - this will be handled in the UI
              isOwnGame: false // Will be updated in the UI component
            };
          });
          
          callback(games);
        }
      },
      onError: function(err) {
        console.error('Lobby watch error:', err);
      }
    });
  
  return watcher;
};

// Close a subscription when no longer needed
const closeSubscription = (watcher) => {
  if (watcher) {
    watcher.close();
    return true;
  }
  return false;
};

module.exports = {
  setupGameSubscription,
  setupLobbySubscription,
  closeSubscription
};
