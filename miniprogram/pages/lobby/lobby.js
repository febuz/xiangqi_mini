// lobby.js
const app = getApp()

Page({
  data: {
    activeGames: [],
    errorMessage: '',
    userInfo: null
  },

  onLoad: function() {
    // Get user info from global data
    this.setData({
      userInfo: app.globalData.userInfo
    });
    
    // Load active games
    this.loadActiveGames();
  },
  
  onShow: function() {
    // Refresh games list when page is shown
    this.loadActiveGames();
  },
  
  loadActiveGames: function() {
    // In a real app, this would call the backend API
    // For now, we'll simulate with a cloud function call
    wx.cloud.callFunction({
      name: 'getActiveGames',
      success: res => {
        this.setData({
          activeGames: res.result.games || [],
          errorMessage: ''
        });
      },
      fail: err => {
        console.error('Failed to load active games:', err);
        this.setData({
          errorMessage: 'Failed to load active games. Please try again.'
        });
      }
    });
  },
  
  createGame: function() {
    // Check if user is logged in
    if (!this.data.userInfo) {
      this.setData({
        errorMessage: 'Please login to create a game'
      });
      return;
    }
    
    // In a real app, this would call the backend API
    // For now, we'll simulate with a cloud function call
    wx.cloud.callFunction({
      name: 'createMultiplayerGame',
      data: {
        creator: this.data.userInfo.nickName
      },
      success: res => {
        const gameId = res.result.game_id;
        
        // Navigate to game page with the new game ID
        wx.navigateTo({
          url: `/pages/index/index?gameId=${gameId}&isMultiplayer=true&playerColor=red`
        });
      },
      fail: err => {
        console.error('Failed to create game:', err);
        this.setData({
          errorMessage: 'Failed to create game. Please try again.'
        });
      }
    });
  },
  
  joinGame: function(e) {
    // Check if user is logged in
    if (!this.data.userInfo) {
      this.setData({
        errorMessage: 'Please login to join a game'
      });
      return;
    }
    
    const gameId = e.currentTarget.dataset.gameId;
    
    // In a real app, this would call the backend API
    // For now, we'll simulate with a cloud function call
    wx.cloud.callFunction({
      name: 'joinMultiplayerGame',
      data: {
        gameId: gameId,
        player: this.data.userInfo.nickName
      },
      success: res => {
        if (res.result.success) {
          // Navigate to game page with the joined game ID
          wx.navigateTo({
            url: `/pages/index/index?gameId=${gameId}&isMultiplayer=true&playerColor=black`
          });
        } else {
          this.setData({
            errorMessage: res.result.message || 'Failed to join game'
          });
        }
      },
      fail: err => {
        console.error('Failed to join game:', err);
        this.setData({
          errorMessage: 'Failed to join game. Please try again.'
        });
      }
    });
  },
  
  goBack: function() {
    wx.navigateBack();
  }
})
