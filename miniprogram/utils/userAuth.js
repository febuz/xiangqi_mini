// WeChat user authentication integration
// This file should be included in the miniprogram/utils directory

// userAuth.js
const app = getApp();

// Initialize user authentication
const initUserAuth = () => {
  return new Promise((resolve, reject) => {
    // Check if user is already logged in
    if (app.globalData.userInfo) {
      resolve(app.globalData.userInfo);
      return;
    }
    
    // First, try to get login status
    wx.getSetting({
      success: res => {
        if (res.authSetting['scope.userInfo']) {
          // User has already authorized, get user info
          wx.getUserInfo({
            success: userInfoRes => {
              // Save user info to global data
              app.globalData.userInfo = userInfoRes.userInfo;
              
              // Get openid from server
              getOpenId().then(() => {
                resolve(userInfoRes.userInfo);
              }).catch(err => {
                console.error('Failed to get openid:', err);
                reject(err);
              });
            },
            fail: err => {
              console.error('Failed to get user info:', err);
              reject(err);
            }
          });
        } else {
          // User has not authorized yet
          resolve(null);
        }
      },
      fail: err => {
        console.error('Failed to get setting:', err);
        reject(err);
      }
    });
  });
};

// Get user's openid from server
const getOpenId = () => {
  return new Promise((resolve, reject) => {
    // Call login to get code
    wx.login({
      success: loginRes => {
        if (loginRes.code) {
          // Use cloud function to get openid
          wx.cloud.callFunction({
            name: 'login',
            data: {
              code: loginRes.code
            },
            success: res => {
              app.globalData.openid = res.result.openid;
              resolve(res.result.openid);
            },
            fail: err => {
              console.error('Failed to call login function:', err);
              reject(err);
            }
          });
        } else {
          console.error('Login failed:', loginRes.errMsg);
          reject(new Error(loginRes.errMsg));
        }
      },
      fail: err => {
        console.error('wx.login failed:', err);
        reject(err);
      }
    });
  });
};

// Handle user login button click
const handleUserLogin = (e) => {
  return new Promise((resolve, reject) => {
    if (e.detail.userInfo) {
      // User granted authorization
      app.globalData.userInfo = e.detail.userInfo;
      
      // Get openid
      getOpenId().then(() => {
        resolve(e.detail.userInfo);
      }).catch(err => {
        console.error('Failed to get openid after login:', err);
        reject(err);
      });
    } else {
      // User denied authorization
      reject(new Error('User denied authorization'));
    }
  });
};

// Check if user is logged in
const isUserLoggedIn = () => {
  return !!app.globalData.userInfo;
};

// Get current user info
const getUserInfo = () => {
  return app.globalData.userInfo;
};

// Get current user openid
const getOpenIdSync = () => {
  return app.globalData.openid;
};

module.exports = {
  initUserAuth,
  handleUserLogin,
  isUserLoggedIn,
  getUserInfo,
  getOpenIdSync
};
