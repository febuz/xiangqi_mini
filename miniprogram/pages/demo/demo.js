// demo.js
const demoGame = require('../index/demo.js');

Page({
  data: {
    boardSize: {width: 0, height: 0},
    cellSize: 0,
    demoState: null,
    isPlaying: false
  },

  onLoad: function() {
    // Get system info to set board size
    const systemInfo = wx.getSystemInfoSync();
    const boardWidth = systemInfo.windowWidth * 0.9;
    // Maintain 9:10 ratio for Xiangqi board
    // We need 8 cells horizontally and 9 cells vertically for intersections
    const boardHeight = boardWidth * 9/8; 
    const cellSize = boardWidth / 8;
    
    this.setData({
      boardSize: {width: boardWidth, height: boardHeight},
      cellSize: cellSize,
      demoState: demoGame.setupDemo()
    });
  },

  onReady: function() {
    // Initialize the canvas when ready
    this.ctx = wx.createCanvasContext('demoCanvas');
    this.showInitialPosition();
  },

  showInitialPosition: function() {
    if (this.data.isPlaying) return;
    
    // Draw the initial board position
    demoGame.generateBoardImage(
      this.ctx, 
      this.data.boardSize, 
      this.data.cellSize, 
      this.data.demoState.gameState
    );
  },

  playDemoMoves: function() {
    if (this.data.isPlaying) return;
    
    this.setData({
      isPlaying: true
    });
    
    // Reset to initial position
    const gameState = this.data.demoState.gameState;
    const moves = this.data.demoState.moves;
    
    // Play each move with a delay
    let moveIndex = 0;
    
    const playNextMove = () => {
      if (moveIndex < moves.length) {
        const move = moves[moveIndex];
        
        demoGame.animateMove(
          this.ctx,
          this.data.boardSize,
          this.data.cellSize,
          gameState,
          move.fromRow,
          move.fromCol,
          move.toRow,
          move.toCol
        );
        
        moveIndex++;
        setTimeout(playNextMove, 2000); // Wait 2 seconds between moves
      } else {
        this.setData({
          isPlaying: false
        });
      }
    };
    
    playNextMove();
  },

  goBack: function() {
    wx.navigateBack();
  }
})
