// index.js
const app = getApp()

Page({
  data: {
    currentPlayer: 'Red',
    gameStatus: '',
    isMultiplayer: false,
    gameId: '',
    playerColor: '',
    opponentStatus: 'Waiting for opponent...',
    showAIModal: false,
    aiDifficultyOptions: ['Easy', 'Medium', 'Hard'],
    aiDifficultyIndex: 1, // Default to Medium
    playerColorOptions: ['Red (First)', 'Black (Second)'],
    playerColorIndex: 0, // Default to Red
    boardSize: {width: 0, height: 0},
    cellSize: 0,
    pieces: [],
    selectedPiece: null,
    validMoves: [],
    gameState: null
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
      cellSize: cellSize
    });
    
    // Start a new game
    this.newGame();
  },

  onReady: function() {
    // Initialize the canvas when ready
    this.initCanvas();
  },

  initCanvas: function() {
    const ctx = wx.createCanvasContext('boardCanvas');
    this.ctx = ctx;
    this.drawBoard();
    this.drawPieces();
  },

  drawBoard: function() {
    const {width, height} = this.data.boardSize;
    const cellSize = this.data.cellSize;
    const ctx = this.ctx;
    
    // Clear canvas
    ctx.clearRect(0, 0, width, height);
    
    // Draw board background
    ctx.setFillStyle('#e8c887');
    ctx.fillRect(0, 0, width, height);
    
    // Draw grid lines
    ctx.setLineWidth(1);
    ctx.setStrokeStyle('#000');
    
    // Draw horizontal lines (9 lines for 8 cells)
    for (let i = 0; i < 10; i++) {
      ctx.beginPath();
      ctx.moveTo(0, i * cellSize);
      ctx.lineTo(width, i * cellSize);
      ctx.stroke();
    }
    
    // Draw vertical lines (8 lines for 9 cells)
    for (let i = 0; i < 9; i++) {
      ctx.beginPath();
      ctx.moveTo(i * cellSize, 0);
      ctx.lineTo(i * cellSize, height);
      ctx.stroke();
    }
    
    // Draw palace diagonals
    // Top palace (black)
    ctx.beginPath();
    ctx.moveTo(3 * cellSize, 0);
    ctx.lineTo(5 * cellSize, 2 * cellSize);
    ctx.stroke();
    
    ctx.beginPath();
    ctx.moveTo(5 * cellSize, 0);
    ctx.lineTo(3 * cellSize, 2 * cellSize);
    ctx.stroke();
    
    // Bottom palace (red)
    ctx.beginPath();
    ctx.moveTo(3 * cellSize, 7 * cellSize);
    ctx.lineTo(5 * cellSize, 9 * cellSize);
    ctx.stroke();
    
    ctx.beginPath();
    ctx.moveTo(5 * cellSize, 7 * cellSize);
    ctx.lineTo(3 * cellSize, 9 * cellSize);
    ctx.stroke();
    
    // Draw river text
    ctx.setFontSize(cellSize * 0.8);
    ctx.setFillStyle('#333');
    ctx.setTextAlign('center');
    ctx.setTextBaseline('middle');
    ctx.fillText('楚', cellSize * 1.5, cellSize * 4.5);
    ctx.fillText('河', cellSize * 3.5, cellSize * 4.5);
    ctx.fillText('漢', cellSize * 5.5, cellSize * 4.5);
    ctx.fillText('界', cellSize * 7.5, cellSize * 4.5);
    
    ctx.draw(true);
  },

  drawPieces: function() {
    if (!this.data.gameState) return;
    
    const cellSize = this.data.cellSize;
    const ctx = this.ctx;
    const pieces = this.data.gameState.pieces;
    const selectedPiece = this.data.selectedPiece;
    const validMoves = this.data.validMoves;
    
    // Draw valid move indicators
    ctx.setFillStyle('rgba(0, 255, 0, 0.3)');
    validMoves.forEach(move => {
      // Draw on intersections instead of cell centers
      ctx.beginPath();
      ctx.arc(move[1] * cellSize, move[0] * cellSize, cellSize * 0.4, 0, 2 * Math.PI);
      ctx.fill();
    });
    
    // Draw pieces
    pieces.forEach(piece => {
      // Place pieces on intersections instead of cell centers
      const x = piece.col * cellSize;
      const y = piece.row * cellSize;
      const radius = cellSize * 0.4;
      
      // Draw piece background
      ctx.beginPath();
      ctx.arc(x, y, radius, 0, 2 * Math.PI);
      ctx.setFillStyle(piece.color === 'red' ? '#f44336' : '#212121');
      ctx.fill();
      ctx.setLineWidth(2);
      ctx.setStrokeStyle(piece.color === 'red' ? '#b71c1c' : '#000');
      ctx.stroke();
      
      // Draw piece text
      ctx.setFontSize(radius * 1.2);
      ctx.setFillStyle('#fff');
      ctx.setTextAlign('center');
      ctx.setTextBaseline('middle');
      ctx.fillText(this.getPieceSymbol(piece.type, piece.color), x, y);
      
      // Highlight selected piece
      if (selectedPiece && selectedPiece.row === piece.row && selectedPiece.col === piece.col) {
        ctx.setLineWidth(3);
        ctx.setStrokeStyle('rgba(255, 255, 0, 0.8)');
        ctx.beginPath();
        ctx.arc(x, y, radius + 2, 0, 2 * Math.PI);
        ctx.stroke();
      }
    });
    
    ctx.draw(true);
  },

  getPieceSymbol: function(type, color) {
    // Use traditional Chinese characters with different characters for red and black
    if (color === 'red') {
      switch (type) {
        case 'general': return '帥';
        case 'advisor': return '仕';
        case 'elephant': return '相';
        case 'horse': return '傌';
        case 'chariot': return '俥';
        case 'cannon': return '炮';
        case 'soldier': return '兵';
        default: return '';
      }
    } else {
      switch (type) {
        case 'general': return '將';
        case 'advisor': return '士';
        case 'elephant': return '象';
        case 'horse': return '馬';
        case 'chariot': return '車';
        case 'cannon': return '砲';
        case 'soldier': return '卒';
        default: return '';
      }
    }
  },

  onBoardTouch: function(e) {
    if (this.data.gameState.game_over) return;
    
    // In multiplayer mode, only allow moves on your turn
    if (this.data.isMultiplayer && 
        this.data.playerColor && 
        this.data.gameState.current_player !== this.data.playerColor) {
      return;
    }
    
    const touch = e.touches[0];
    const cellSize = this.data.cellSize;
    
    // Convert touch coordinates to nearest intersection
    // Find the closest intersection point
    const col = Math.round(touch.x / cellSize);
    const row = Math.round(touch.y / cellSize);
    
    // Ensure coordinates are within board boundaries
    if (col < 0 || col > 8 || row < 0 || row > 9) {
      return;
    }
    
    // If a piece is already selected
    if (this.data.selectedPiece) {
      const fromRow = this.data.selectedPiece.row;
      const fromCol = this.data.selectedPiece.col;
      
      // Check if the touched intersection is a valid move
      const isValidMove = this.data.validMoves.some(move => move[0] === row && move[1] === col);
      
      if (isValidMove) {
        // Make the move
        this.makeMove(fromRow, fromCol, row, col);
        this.clearSelection();
      } else {
        // If clicking on another piece of the same color, select that piece instead
        const pieceAtPosition = this.getPieceAtPosition(row, col);
        if (pieceAtPosition && pieceAtPosition.color === this.data.gameState.current_player) {
          this.clearSelection();
          this.selectPiece(pieceAtPosition);
        } else {
          this.clearSelection();
        }
      }
    } else {
      // If no piece is selected, try to select a piece
      const pieceAtPosition = this.getPieceAtPosition(row, col);
      if (pieceAtPosition && pieceAtPosition.color === this.data.gameState.current_player) {
        this.selectPiece(pieceAtPosition);
      }
    }
  },

  getPieceAtPosition: function(row, col) {
    return this.data.gameState.pieces.find(piece => piece.row === row && piece.col === col);
  },

  selectPiece: function(piece) {
    this.setData({
      selectedPiece: piece
    });
    
    // Get valid moves for the selected piece
    this.getValidMoves(piece.row, piece.col);
  },

  clearSelection: function() {
    this.setData({
      selectedPiece: null,
      validMoves: []
    });
    
    this.drawBoard();
    this.drawPieces();
  },

  getValidMoves: function(row, col) {
    // In a real app, this would call the backend API
    // For now, we'll simulate with a cloud function call
    wx.cloud.callFunction({
      name: 'getValidMoves',
      data: {
        row: row,
        col: col,
        gameId: this.data.gameId
      },
      success: res => {
        this.setData({
          validMoves: res.result.moves
        });
        this.drawBoard();
        this.drawPieces();
      },
      fail: err => {
        console.error('Failed to get valid moves:', err);
      }
    });
  },

  makeMove: function(fromRow, fromCol, toRow, toCol) {
    // In a real app, this would call the backend API
    // For now, we'll simulate with a cloud function call
    wx.cloud.callFunction({
      name: 'makeMove',
      data: {
        fromRow: fromRow,
        fromCol: fromCol,
        toRow: toRow,
        toCol: toCol,
        gameId: this.data.gameId
      },
      success: res => {
        this.updateGameState(res.result.game);
      },
      fail: err => {
        console.error('Failed to make move:', err);
      }
    });
  },

  updateGameState: function(gameState) {
    this.setData({
      gameState: gameState,
      currentPlayer: gameState.current_player.charAt(0).toUpperCase() + gameState.current_player.slice(1)
    });
    
    if (gameState.game_over) {
      this.setData({
        gameStatus: `Game Over! ${gameState.winner.charAt(0).toUpperCase() + gameState.winner.slice(1)} wins!`
      });
    } else {
      this.setData({
        gameStatus: ''
      });
    }
    
    this.drawBoard();
    this.drawPieces();
  },

  newGame: function() {
    // In a real app, this would call the backend API
    // For now, we'll simulate with a cloud function call
    wx.cloud.callFunction({
      name: 'newGame',
      data: {},
      success: res => {
        this.setData({
          gameId: res.result.game_id,
          isMultiplayer: false,
          showAIModal: false
        });
        this.updateGameState(res.result.game);
      },
      fail: err => {
        console.error('Failed to start new game:', err);
      }
    });
  },

  showAIOptions: function() {
    this.setData({
      showAIModal: true
    });
  },

  hideAIOptions: function() {
    this.setData({
      showAIModal: false
    });
  },

  setAIDifficulty: function(e) {
    this.setData({
      aiDifficultyIndex: e.detail.value
    });
  },

  setPlayerColor: function(e) {
    this.setData({
      playerColorIndex: e.detail.value
    });
  },

  startAIGame: function() {
    const difficulties = ['easy', 'medium', 'hard'];
    const colors = ['red', 'black'];
    
    const aiDifficulty = difficulties[this.data.aiDifficultyIndex];
    const playerColor = colors[this.data.playerColorIndex];
    const aiColor = playerColor === 'red' ? 'black' : 'red';
    
    // In a real app, this would call the backend API
    // For now, we'll simulate with a cloud function call
    wx.cloud.callFunction({
      name: 'newGame',
      data: {
        ai_enabled: true,
        ai_difficulty: aiDifficulty,
        ai_color: aiColor
      },
      success: res => {
        this.setData({
          gameId: res.result.game_id,
          isMultiplayer: false,
          showAIModal: false,
          playerColor: playerColor
        });
        this.updateGameState(res.result.game);
      },
      fail: err => {
        console.error('Failed to start AI game:', err);
      }
    });
  },

  goToLobby: function() {
    wx.navigateTo({
      url: '/pages/lobby/lobby'
    });
  }
})
