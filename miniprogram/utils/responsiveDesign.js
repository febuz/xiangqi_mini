// Responsive design optimization for WeChat mini-game
// This file should be included in the miniprogram/utils directory

// responsiveDesign.js
const app = getApp();

// Initialize responsive design settings
const initResponsiveDesign = () => {
  // Get system info
  const systemInfo = wx.getSystemInfoSync();
  
  // Store device information in global data
  app.globalData.deviceInfo = {
    windowWidth: systemInfo.windowWidth,
    windowHeight: systemInfo.windowHeight,
    pixelRatio: systemInfo.pixelRatio,
    screenWidth: systemInfo.screenWidth,
    screenHeight: systemInfo.screenHeight,
    platform: systemInfo.platform,
    brand: systemInfo.brand,
    model: systemInfo.model,
    isIOS: systemInfo.platform === 'ios',
    isAndroid: systemInfo.platform === 'android',
    statusBarHeight: systemInfo.statusBarHeight,
    safeArea: systemInfo.safeArea || null
  };
  
  // Calculate responsive units
  calculateResponsiveUnits(systemInfo);
  
  return app.globalData.deviceInfo;
};

// Calculate responsive units based on device size
const calculateResponsiveUnits = (systemInfo) => {
  const windowWidth = systemInfo.windowWidth;
  
  // Base design width (standard WeChat design is 750rpx)
  const designWidth = 750;
  
  // Calculate responsive units
  app.globalData.responsiveUnits = {
    // 1rpx in px
    rpxToPx: windowWidth / designWidth,
    // Base unit for spacing (4% of screen width)
    baseSpacing: Math.round(windowWidth * 0.04),
    // Font sizes
    fontSizes: {
      small: Math.max(24 * (windowWidth / designWidth), 12),
      medium: Math.max(28 * (windowWidth / designWidth), 14),
      large: Math.max(32 * (windowWidth / designWidth), 16),
      xlarge: Math.max(40 * (windowWidth / designWidth), 20)
    },
    // Board sizing
    boardSize: {
      width: windowWidth * 0.9,
      height: windowWidth * 0.9 * 10/9, // Maintain 9:10 ratio for Xiangqi board
      cellSize: windowWidth * 0.9 / 9
    }
  };
  
  return app.globalData.responsiveUnits;
};

// Get responsive board size
const getResponsiveBoardSize = () => {
  if (!app.globalData.responsiveUnits) {
    initResponsiveDesign();
  }
  
  return app.globalData.responsiveUnits.boardSize;
};

// Get responsive font size
const getResponsiveFontSize = (size = 'medium') => {
  if (!app.globalData.responsiveUnits) {
    initResponsiveDesign();
  }
  
  return app.globalData.responsiveUnits.fontSizes[size] || app.globalData.responsiveUnits.fontSizes.medium;
};

// Convert rpx to px
const rpxToPx = (rpx) => {
  if (!app.globalData.responsiveUnits) {
    initResponsiveDesign();
  }
  
  return rpx * app.globalData.responsiveUnits.rpxToPx;
};

// Get responsive spacing
const getResponsiveSpacing = (multiplier = 1) => {
  if (!app.globalData.responsiveUnits) {
    initResponsiveDesign();
  }
  
  return app.globalData.responsiveUnits.baseSpacing * multiplier;
};

// Check if device is in portrait or landscape mode
const isPortrait = () => {
  if (!app.globalData.deviceInfo) {
    initResponsiveDesign();
  }
  
  return app.globalData.deviceInfo.windowHeight > app.globalData.deviceInfo.windowWidth;
};

// Adjust layout for orientation
const getOrientationAdjustedLayout = () => {
  const portrait = isPortrait();
  
  return {
    isPortrait: portrait,
    boardContainerStyle: portrait ? 
      'width: 90%; margin: 0 auto;' : 
      'width: 60%; float: left; margin-left: 5%;',
    controlsContainerStyle: portrait ? 
      'width: 90%; margin: 20rpx auto;' : 
      'width: 30%; float: right; margin-right: 5%;'
  };
};

module.exports = {
  initResponsiveDesign,
  getResponsiveBoardSize,
  getResponsiveFontSize,
  rpxToPx,
  getResponsiveSpacing,
  isPortrait,
  getOrientationAdjustedLayout
};
