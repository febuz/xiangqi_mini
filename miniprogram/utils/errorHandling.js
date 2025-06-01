// Error handling and offline support implementation
// This file should be included in the miniprogram/utils directory

// errorHandling.js
const app = getApp();

// Network status monitoring
const setupNetworkStatusMonitor = () => {
  // Initial network status check
  wx.getNetworkType({
    success: res => {
      app.globalData.networkType = res.networkType;
      app.globalData.isOnline = res.networkType !== 'none';
      console.log('Initial network status:', app.globalData.isOnline ? 'online' : 'offline');
    }
  });
  
  // Listen for network status changes
  wx.onNetworkStatusChange(res => {
    app.globalData.networkType = res.networkType;
    app.globalData.isOnline = res.isConnected;
    console.log('Network status changed:', app.globalData.isOnline ? 'online' : 'offline');
    
    // Notify pages about network status change
    if (app.networkStatusCallback) {
      app.networkStatusCallback(res.isConnected);
    }
    
    // Show toast notification to user
    if (res.isConnected) {
      wx.showToast({
        title: 'Network connection restored',
        icon: 'success',
        duration: 2000
      });
      
      // Sync any pending data
      syncPendingData();
    } else {
      wx.showToast({
        title: 'Network connection lost',
        icon: 'none',
        duration: 2000
      });
    }
  });
};

// Check if device is online
const isOnline = () => {
  return app.globalData.isOnline;
};

// Save data locally when offline
const saveLocalData = (key, data) => {
  try {
    wx.setStorageSync(key, data);
    
    // Also save to pending sync queue if needed
    if (key.startsWith('pending_')) {
      const pendingQueue = wx.getStorageSync('pending_sync_queue') || [];
      pendingQueue.push(key);
      wx.setStorageSync('pending_sync_queue', pendingQueue);
    }
    
    return true;
  } catch (e) {
    console.error('Failed to save local data:', e);
    return false;
  }
};

// Get local data
const getLocalData = (key) => {
  try {
    return wx.getStorageSync(key);
  } catch (e) {
    console.error('Failed to get local data:', e);
    return null;
  }
};

// Sync pending data when back online
const syncPendingData = () => {
  if (!isOnline()) {
    return Promise.reject(new Error('Device is offline'));
  }
  
  return new Promise((resolve, reject) => {
    try {
      const pendingQueue = wx.getStorageSync('pending_sync_queue') || [];
      
      if (pendingQueue.length === 0) {
        resolve({ synced: 0 });
        return;
      }
      
      let syncPromises = [];
      
      pendingQueue.forEach(key => {
        const data = wx.getStorageSync(key);
        if (data) {
          // Determine what type of data this is and how to sync it
          if (key.startsWith('pending_move_')) {
            // Sync a pending move
            syncPromises.push(syncPendingMove(key, data));
          } else if (key.startsWith('pending_game_')) {
            // Sync a pending game creation
            syncPromises.push(syncPendingGame(key, data));
          }
          // Add more sync types as needed
        }
      });
      
      Promise.all(syncPromises)
        .then(results => {
          // Clear the pending queue
          wx.setStorageSync('pending_sync_queue', []);
          resolve({ synced: results.length });
        })
        .catch(err => {
          console.error('Error syncing some pending data:', err);
          reject(err);
        });
    } catch (e) {
      console.error('Failed to sync pending data:', e);
      reject(e);
    }
  });
};

// Sync a pending move
const syncPendingMove = (key, moveData) => {
  return new Promise((resolve, reject) => {
    wx.cloud.callFunction({
      name: 'makeMove',
      data: moveData,
      success: res => {
        // Remove from local storage once synced
        wx.removeStorageSync(key);
        resolve(res);
      },
      fail: err => {
        console.error('Failed to sync move:', err);
        reject(err);
      }
    });
  });
};

// Sync a pending game creation
const syncPendingGame = (key, gameData) => {
  return new Promise((resolve, reject) => {
    wx.cloud.callFunction({
      name: 'newGame',
      data: gameData,
      success: res => {
        // Remove from local storage once synced
        wx.removeStorageSync(key);
        resolve(res);
      },
      fail: err => {
        console.error('Failed to sync game creation:', err);
        reject(err);
      }
    });
  });
};

// Handle API call errors
const handleApiError = (error, fallbackAction) => {
  console.error('API error:', error);
  
  // Check if it's a network error
  if (!isOnline() || error.message.includes('network') || error.message.includes('timeout')) {
    wx.showToast({
      title: 'Network error. Action saved for later.',
      icon: 'none',
      duration: 2000
    });
    
    // Execute fallback action if provided
    if (typeof fallbackAction === 'function') {
      fallbackAction();
    }
    
    return { offline: true, message: 'Network error. Action saved for later.' };
  }
  
  // Other types of errors
  wx.showToast({
    title: 'An error occurred. Please try again.',
    icon: 'none',
    duration: 2000
  });
  
  return { offline: false, message: 'An error occurred. Please try again.' };
};

module.exports = {
  setupNetworkStatusMonitor,
  isOnline,
  saveLocalData,
  getLocalData,
  syncPendingData,
  handleApiError
};
