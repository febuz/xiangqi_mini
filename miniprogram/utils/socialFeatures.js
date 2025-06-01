// Social features implementation for WeChat mini-game
// This file should be included in the miniprogram/utils directory

// socialFeatures.js
const app = getApp();

// Share current game with friends
const shareGame = (gameId, playerColor) => {
  return {
    title: 'Join my Xiangqi (Chinese Chess) game!',
    path: `/pages/index/index?gameId=${gameId}&isMultiplayer=true&playerColor=${playerColor === 'red' ? 'black' : 'red'}`,
    imageUrl: '/images/share_image.png', // This should be added to the assets
    success: function(res) {
      console.log('Game shared successfully:', res);
    },
    fail: function(err) {
      console.error('Failed to share game:', err);
    }
  };
};

// Invite a friend to play
const inviteFriend = (gameId) => {
  wx.showShareMenu({
    withShareTicket: true,
    menus: ['shareAppMessage', 'shareTimeline']
  });
  
  // You can also use wx.openCustomerServiceChat to open a chat window
  // or use wx.navigateToMiniProgram to navigate to WeChat's friend selection
  
  return {
    title: 'Let\'s play Xiangqi (Chinese Chess) together!',
    path: `/pages/lobby/lobby?inviteGameId=${gameId}`,
    imageUrl: '/images/invite_image.png', // This should be added to the assets
    success: function(res) {
      console.log('Invitation sent successfully:', res);
    },
    fail: function(err) {
      console.error('Failed to send invitation:', err);
    }
  };
};

// Share game result with friends
const shareGameResult = (winner, gameId) => {
  return {
    title: `I just ${winner === app.globalData.userInfo.nickName ? 'won' : 'played'} a game of Xiangqi (Chinese Chess)!`,
    path: `/pages/index/index?gameId=${gameId}&viewOnly=true`,
    imageUrl: '/images/result_image.png', // This should be added to the assets
    success: function(res) {
      console.log('Game result shared successfully:', res);
    },
    fail: function(err) {
      console.error('Failed to share game result:', err);
    }
  };
};

// Share app to WeChat Moments (Timeline)
const shareToTimeline = () => {
  return {
    title: 'Play Xiangqi (Chinese Chess) with friends!',
    query: '',
    imageUrl: '/images/timeline_image.png', // This should be added to the assets
  };
};

module.exports = {
  shareGame,
  inviteFriend,
  shareGameResult,
  shareToTimeline
};
