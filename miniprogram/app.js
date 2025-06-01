// app.js
App({
  onLaunch: function() {
    // Initialize global game data
    this.globalData = {
      userInfo: null,
      gameState: null,
      currentPlayer: 'red',
      gameId: null,
      isMultiplayer: false,
      isAIEnabled: false,
      aiDifficulty: 'medium',
      aiColor: 'black'
    }
    
    // Initialize WeChat login
    wx.login({
      success: res => {
        // Send code to backend for session establishment
        if (res.code) {
          // TODO: Send to backend when implemented
          console.log('Login successful, code:', res.code);
        } else {
          console.error('Login failed:', res.errMsg);
        }
      }
    });
    
    // Get user info if authorized
    wx.getSetting({
      success: res => {
        if (res.authSetting['scope.userInfo']) {
          wx.getUserInfo({
            success: res => {
              this.globalData.userInfo = res.userInfo;
              
              // If userInfoReadyCallback has been defined
              if (this.userInfoReadyCallback) {
                this.userInfoReadyCallback(res);
              }
            }
          });
        }
      }
    });
  }
})
