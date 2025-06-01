// Game history and player statistics implementation
// This file should be included in the miniprogram/utils directory

// gameHistory.js
const app = getApp();

// Save game result to history
const saveGameResult = (gameState) => {
  return new Promise((resolve, reject) => {
    if (!app.globalData.openid) {
      reject(new Error('User not logged in'));
      return;
    }
    
    const db = wx.cloud.database();
    const gameHistoryCollection = db.collection('game_history');
    
    // Create history record
    const historyRecord = {
      user_id: app.globalData.openid,
      game_id: gameState._id,
      date: new Date(),
      opponent: gameState.multiplayer ? 
        (gameState.players.red.id === app.globalData.openid ? 
          gameState.players.black.name : gameState.players.red.name) : 
        (gameState.ai_enabled ? 'AI (' + gameState.ai_difficulty + ')' : 'Self'),
      player_color: gameState.multiplayer ? 
        (gameState.players.red.id === app.globalData.openid ? 'red' : 'black') : 
        (gameState.ai_enabled ? 
          (gameState.ai_color === 'red' ? 'black' : 'red') : 'both'),
      result: gameState.game_over ? 
        (gameState.winner === 
          (gameState.players.red.id === app.globalData.openid ? 'red' : 'black') ? 
          'win' : 'loss') : 'incomplete',
      moves_count: gameState.moves ? gameState.moves.length : 0
    };
    
    // Add to database
    gameHistoryCollection.add({
      data: historyRecord
    }).then(res => {
      console.log('Game history saved:', res);
      
      // Update player statistics
      updatePlayerStats(historyRecord.result).then(() => {
        resolve(res);
      }).catch(err => {
        console.error('Failed to update player stats:', err);
        reject(err);
      });
    }).catch(err => {
      console.error('Failed to save game history:', err);
      reject(err);
    });
  });
};

// Update player statistics
const updatePlayerStats = (result) => {
  return new Promise((resolve, reject) => {
    if (!app.globalData.openid) {
      reject(new Error('User not logged in'));
      return;
    }
    
    const db = wx.cloud.database();
    const playerStatsCollection = db.collection('player_stats');
    
    // Get current stats
    playerStatsCollection.where({
      user_id: app.globalData.openid
    }).get().then(res => {
      let stats;
      
      if (res.data && res.data.length > 0) {
        // Update existing stats
        stats = res.data[0];
        stats.games_played += 1;
        
        if (result === 'win') {
          stats.games_won += 1;
        } else if (result === 'loss') {
          stats.games_lost += 1;
        } else {
          stats.games_drawn += 1;
        }
        
        stats.win_rate = (stats.games_won / stats.games_played) * 100;
        stats.last_updated = new Date();
        
        // Update in database
        playerStatsCollection.doc(stats._id).update({
          data: {
            games_played: stats.games_played,
            games_won: stats.games_won,
            games_lost: stats.games_lost,
            games_drawn: stats.games_drawn,
            win_rate: stats.win_rate,
            last_updated: stats.last_updated
          }
        }).then(() => {
          resolve(stats);
        }).catch(err => {
          console.error('Failed to update player stats:', err);
          reject(err);
        });
      } else {
        // Create new stats
        stats = {
          user_id: app.globalData.openid,
          user_name: app.globalData.userInfo ? app.globalData.userInfo.nickName : 'Unknown',
          games_played: 1,
          games_won: result === 'win' ? 1 : 0,
          games_lost: result === 'loss' ? 1 : 0,
          games_drawn: result === 'draw' ? 1 : 0,
          win_rate: result === 'win' ? 100 : 0,
          created_at: new Date(),
          last_updated: new Date()
        };
        
        // Add to database
        playerStatsCollection.add({
          data: stats
        }).then(() => {
          resolve(stats);
        }).catch(err => {
          console.error('Failed to create player stats:', err);
          reject(err);
        });
      }
    }).catch(err => {
      console.error('Failed to get player stats:', err);
      reject(err);
    });
  });
};

// Get player's game history
const getGameHistory = (limit = 10) => {
  return new Promise((resolve, reject) => {
    if (!app.globalData.openid) {
      reject(new Error('User not logged in'));
      return;
    }
    
    const db = wx.cloud.database();
    const gameHistoryCollection = db.collection('game_history');
    
    gameHistoryCollection.where({
      user_id: app.globalData.openid
    }).orderBy('date', 'desc')
      .limit(limit)
      .get()
      .then(res => {
        resolve(res.data);
      }).catch(err => {
        console.error('Failed to get game history:', err);
        reject(err);
      });
  });
};

// Get player's statistics
const getPlayerStats = () => {
  return new Promise((resolve, reject) => {
    if (!app.globalData.openid) {
      reject(new Error('User not logged in'));
      return;
    }
    
    const db = wx.cloud.database();
    const playerStatsCollection = db.collection('player_stats');
    
    playerStatsCollection.where({
      user_id: app.globalData.openid
    }).get().then(res => {
      if (res.data && res.data.length > 0) {
        resolve(res.data[0]);
      } else {
        // No stats yet, return default
        const defaultStats = {
          user_id: app.globalData.openid,
          user_name: app.globalData.userInfo ? app.globalData.userInfo.nickName : 'Unknown',
          games_played: 0,
          games_won: 0,
          games_lost: 0,
          games_drawn: 0,
          win_rate: 0,
          created_at: new Date(),
          last_updated: new Date()
        };
        resolve(defaultStats);
      }
    }).catch(err => {
      console.error('Failed to get player stats:', err);
      reject(err);
    });
  });
};

module.exports = {
  saveGameResult,
  getGameHistory,
  getPlayerStats
};
