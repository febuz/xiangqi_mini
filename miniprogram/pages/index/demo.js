// Demo script to showcase intersection-based piece rendering
const demoGame = {
  setupDemo: function() {
    // Create a demo game state with pieces positioned on intersections
    const demoGameState = {
      current_player: 'red',
      game_over: false,
      winner: null,
      pieces: [
        // Red pieces (bottom)
        { type: 'chariot', color: 'red', row: 9, col: 0 },
        { type: 'horse', color: 'red', row: 9, col: 1 },
        { type: 'elephant', color: 'red', row: 9, col: 2 },
        { type: 'advisor', color: 'red', row: 9, col: 3 },
        { type: 'general', color: 'red', row: 9, col: 4 },
        { type: 'advisor', color: 'red', row: 9, col: 5 },
        { type: 'elephant', color: 'red', row: 9, col: 6 },
        { type: 'horse', color: 'red', row: 9, col: 7 },
        { type: 'chariot', color: 'red', row: 9, col: 8 },
        { type: 'cannon', color: 'red', row: 7, col: 1 },
        { type: 'cannon', color: 'red', row: 7, col: 7 },
        { type: 'soldier', color: 'red', row: 6, col: 0 },
        { type: 'soldier', color: 'red', row: 6, col: 2 },
        { type: 'soldier', color: 'red', row: 6, col: 4 },
        { type: 'soldier', color: 'red', row: 6, col: 6 },
        { type: 'soldier', color: 'red', row: 6, col: 8 },
        
        // Black pieces (top)
        { type: 'chariot', color: 'black', row: 0, col: 0 },
        { type: 'horse', color: 'black', row: 0, col: 1 },
        { type: 'elephant', color: 'black', row: 0, col: 2 },
        { type: 'advisor', color: 'black', row: 0, col: 3 },
        { type: 'general', color: 'black', row: 0, col: 4 },
        { type: 'advisor', color: 'black', row: 0, col: 5 },
        { type: 'elephant', color: 'black', row: 0, col: 6 },
        { type: 'horse', color: 'black', row: 0, col: 7 },
        { type: 'chariot', color: 'black', row: 0, col: 8 },
        { type: 'cannon', color: 'black', row: 2, col: 1 },
        { type: 'cannon', color: 'black', row: 2, col: 7 },
        { type: 'soldier', color: 'black', row: 3, col: 0 },
        { type: 'soldier', color: 'black', row: 3, col: 2 },
        { type: 'soldier', color: 'black', row: 3, col: 4 },
        { type: 'soldier', color: 'black', row: 3, col: 6 },
        { type: 'soldier', color: 'black', row: 3, col: 8 }
      ]
    };
    
    // Add some example moves to demonstrate intersection placement
    const demoMoves = [
      // Move red soldier forward
      { fromRow: 6, fromCol: 4, toRow: 5, toCol: 4 },
      // Move black soldier forward
      { fromRow: 3, fromCol: 4, toRow: 4, toCol: 4 },
      // Move red horse
      { fromRow: 9, fromCol: 1, toRow: 7, toCol: 2 },
      // Move black horse
      { fromRow: 0, fromCol: 1, toRow: 2, toCol: 2 }
    ];
    
    return {
      gameState: demoGameState,
      moves: demoMoves
    };
  },
  
  // Function to generate a visual representation of the board with pieces on intersections
  generateBoardImage: function(ctx, boardSize, cellSize, gameState) {
    // Clear canvas
    ctx.clearRect(0, 0, boardSize.width, boardSize.height);
    
    // Draw board background
    ctx.setFillStyle('#e8c887');
    ctx.fillRect(0, 0, boardSize.width, boardSize.height);
    
    // Draw grid lines
    ctx.setLineWidth(1);
    ctx.setStrokeStyle('#000');
    
    // Draw horizontal lines
    for (let i = 0; i < 10; i++) {
      ctx.beginPath();
      ctx.moveTo(0, i * cellSize);
      ctx.lineTo(boardSize.width, i * cellSize);
      ctx.stroke();
    }
    
    // Draw vertical lines
    for (let i = 0; i < 9; i++) {
      ctx.beginPath();
      ctx.moveTo(i * cellSize, 0);
      ctx.lineTo(i * cellSize, boardSize.height);
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
    
    // Draw pieces on intersections
    gameState.pieces.forEach(piece => {
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
      
      // Use traditional Chinese characters with different characters for red and black
      let symbol = '';
      if (piece.color === 'red') {
        switch (piece.type) {
          case 'general': symbol = '帥'; break;
          case 'advisor': symbol = '仕'; break;
          case 'elephant': symbol = '相'; break;
          case 'horse': symbol = '傌'; break;
          case 'chariot': symbol = '俥'; break;
          case 'cannon': symbol = '炮'; break;
          case 'soldier': symbol = '兵'; break;
        }
      } else {
        switch (piece.type) {
          case 'general': symbol = '將'; break;
          case 'advisor': symbol = '士'; break;
          case 'elephant': symbol = '象'; break;
          case 'horse': symbol = '馬'; break;
          case 'chariot': symbol = '車'; break;
          case 'cannon': symbol = '砲'; break;
          case 'soldier': symbol = '卒'; break;
        }
      }
      
      ctx.fillText(symbol, x, y);
    });
    
    ctx.draw();
  },
  
  // Function to animate a demo move
  animateMove: function(ctx, boardSize, cellSize, gameState, fromRow, fromCol, toRow, toCol) {
    // Find the piece to move
    const pieceIndex = gameState.pieces.findIndex(p => p.row === fromRow && p.col === fromCol);
    if (pieceIndex === -1) return;
    
    const piece = gameState.pieces[pieceIndex];
    const startX = fromCol * cellSize;
    const startY = fromRow * cellSize;
    const endX = toCol * cellSize;
    const endY = toRow * cellSize;
    
    // Animation frames
    const frames = 20;
    let currentFrame = 0;
    
    const animate = () => {
      if (currentFrame <= frames) {
        // Calculate current position
        const progress = currentFrame / frames;
        const x = startX + (endX - startX) * progress;
        const y = startY + (endY - startY) * progress;
        
        // Update piece position temporarily for drawing
        const originalRow = piece.row;
        const originalCol = piece.col;
        piece.row = fromRow + (toRow - fromRow) * progress;
        piece.col = fromCol + (toCol - fromCol) * progress;
        
        // Redraw board
        this.generateBoardImage(ctx, boardSize, cellSize, gameState);
        
        // Restore original position for next frame
        piece.row = originalRow;
        piece.col = originalCol;
        
        currentFrame++;
        setTimeout(animate, 50);
      } else {
        // Update piece position permanently
        piece.row = toRow;
        piece.col = toCol;
        
        // Check if there's a piece to capture
        const captureIndex = gameState.pieces.findIndex(p => p.row === toRow && p.col === toCol && p !== piece);
        if (captureIndex !== -1) {
          gameState.pieces.splice(captureIndex, 1);
        }
        
        // Redraw board with final position
        this.generateBoardImage(ctx, boardSize, cellSize, gameState);
      }
    };
    
    animate();
  }
};

module.exports = demoGame;
