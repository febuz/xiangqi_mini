// Enhanced AI implementation for Xiangqi (Chinese Chess)
// Supports multiple difficulty levels: easy, medium, hard

// Piece values for evaluation
const PIECE_VALUES = {
  'general': 10000,
  'advisor': 200,
  'elephant': 250,
  'horse': 500,
  'chariot': 900,
  'cannon': 450,
  'soldier': 100
};

// Position bonuses for different pieces (more sophisticated in medium/hard)
const POSITION_BONUSES = {
  'soldier': [
    [0, 0, 0, 0, 0, 0, 0, 0, 0],
    [0, 0, 0, 0, 0, 0, 0, 0, 0],
    [0, 0, 0, 0, 0, 0, 0, 0, 0],
    [0, 0, 0, 0, 0, 0, 0, 0, 0],
    [0, 0, 0, 0, 0, 0, 0, 0, 0],
    [5, 10, 15, 20, 20, 20, 15, 10, 5],
    [20, 30, 40, 50, 50, 50, 40, 30, 20],
    [30, 40, 50, 60, 60, 60, 50, 40, 30],
    [40, 50, 60, 70, 70, 70, 60, 50, 40],
    [90, 90, 90, 90, 90, 90, 90, 90, 90]
  ],
  'horse': [
    [0, 10, 20, 30, 40, 30, 20, 10, 0],
    [10, 40, 50, 60, 70, 60, 50, 40, 10],
    [20, 50, 70, 80, 80, 80, 70, 50, 20],
    [30, 60, 80, 90, 90, 90, 80, 60, 30],
    [40, 70, 80, 90, 90, 90, 80, 70, 40],
    [40, 70, 80, 90, 90, 90, 80, 70, 40],
    [30, 60, 70, 80, 80, 80, 70, 60, 30],
    [20, 50, 60, 70, 70, 70, 60, 50, 20],
    [10, 40, 50, 60, 60, 60, 50, 40, 10],
    [0, 10, 20, 30, 30, 30, 20, 10, 0]
  ],
  'cannon': [
    [40, 30, 20, 10, 0, 10, 20, 30, 40],
    [30, 40, 30, 20, 10, 20, 30, 40, 30],
    [20, 30, 40, 30, 20, 30, 40, 30, 20],
    [10, 20, 30, 40, 50, 40, 30, 20, 10],
    [0, 10, 20, 30, 40, 30, 20, 10, 0],
    [0, 10, 20, 30, 40, 30, 20, 10, 0],
    [10, 20, 30, 40, 50, 40, 30, 20, 10],
    [20, 30, 40, 30, 20, 30, 40, 30, 20],
    [30, 40, 30, 20, 10, 20, 30, 40, 30],
    [40, 30, 20, 10, 0, 10, 20, 30, 40]
  ],
  'chariot': [
    [40, 40, 40, 40, 40, 40, 40, 40, 40],
    [50, 50, 50, 50, 50, 50, 50, 50, 50],
    [30, 40, 40, 40, 40, 40, 40, 40, 30],
    [30, 40, 40, 40, 40, 40, 40, 40, 30],
    [30, 40, 40, 40, 40, 40, 40, 40, 30],
    [30, 40, 40, 40, 40, 40, 40, 40, 30],
    [30, 40, 40, 40, 40, 40, 40, 40, 30],
    [30, 40, 40, 40, 40, 40, 40, 40, 30],
    [30, 40, 40, 40, 40, 40, 40, 40, 30],
    [30, 30, 30, 30, 30, 30, 30, 30, 30]
  ]
};

// Enhanced AI class with difficulty levels
class XiangqiAI {
  constructor(difficulty = 'medium') {
    this.difficulty = difficulty.toLowerCase();
    this.maxDepth = this.getDepthByDifficulty();
  }

  // Set search depth based on difficulty
  getDepthByDifficulty() {
    switch (this.difficulty) {
      case 'easy': return 1;
      case 'medium': return 2;
      case 'hard': return 3;
      default: return 2; // Default to medium
    }
  }

  // Main function to get the best move
  getBestMove(gameState) {
    const aiColor = gameState.current_player;
    const validMoves = this.getAllValidMoves(gameState, aiColor);
    
    if (validMoves.length === 0) {
      return null;
    }
    
    // For easy difficulty, just make random moves with minimal evaluation
    if (this.difficulty === 'easy') {
      return this.getEasyMove(gameState, validMoves);
    }
    
    // For medium and hard, use minimax with different depths
    let bestScore = -Infinity;
    let bestMove = null;
    
    for (const move of validMoves) {
      // Make a deep copy of the game state
      const newState = this.simulateMove(gameState, move);
      
      // Evaluate the move using minimax
      const score = this.minimax(
        newState, 
        this.maxDepth - 1, 
        -Infinity, 
        Infinity, 
        false, 
        aiColor
      );
      
      if (score > bestScore) {
        bestScore = score;
        bestMove = move;
      }
    }
    
    return bestMove;
  }
  
  // Easy difficulty: Mostly random moves with basic capture prioritization
  getEasyMove(gameState, validMoves) {
    // 60% chance to make a capturing move if available
    const capturingMoves = validMoves.filter(move => {
      const targetPiece = gameState.pieces.find(
        p => p.row === move.toRow && p.col === move.toCol
      );
      return targetPiece !== undefined;
    });
    
    if (capturingMoves.length > 0 && Math.random() < 0.6) {
      return capturingMoves[Math.floor(Math.random() * capturingMoves.length)];
    }
    
    // Otherwise make a random move
    return validMoves[Math.floor(Math.random() * validMoves.length)];
  }
  
  // Minimax algorithm with alpha-beta pruning
  minimax(gameState, depth, alpha, beta, isMaximizing, aiColor) {
    // Terminal conditions
    if (depth === 0 || gameState.game_over) {
      return this.evaluateBoard(gameState, aiColor);
    }
    
    const currentPlayer = isMaximizing ? aiColor : (aiColor === 'red' ? 'black' : 'red');
    const validMoves = this.getAllValidMoves(gameState, currentPlayer);
    
    if (validMoves.length === 0) {
      // No valid moves, could be checkmate or stalemate
      return isMaximizing ? -9000 : 9000;
    }
    
    if (isMaximizing) {
      let maxEval = -Infinity;
      for (const move of validMoves) {
        const newState = this.simulateMove(gameState, move);
        const eval = this.minimax(newState, depth - 1, alpha, beta, false, aiColor);
        maxEval = Math.max(maxEval, eval);
        alpha = Math.max(alpha, eval);
        if (beta <= alpha) break; // Alpha-beta pruning
      }
      return maxEval;
    } else {
      let minEval = Infinity;
      for (const move of validMoves) {
        const newState = this.simulateMove(gameState, move);
        const eval = this.minimax(newState, depth - 1, alpha, beta, true, aiColor);
        minEval = Math.min(minEval, eval);
        beta = Math.min(beta, eval);
        if (beta <= alpha) break; // Alpha-beta pruning
      }
      return minEval;
    }
  }
  
  // Evaluate the board state
  evaluateBoard(gameState, aiColor) {
    const opponentColor = aiColor === 'red' ? 'black' : 'red';
    let score = 0;
    
    // Check for checkmate or check
    if (gameState.game_over) {
      if (gameState.winner === aiColor) {
        return 9000; // AI wins
      } else if (gameState.winner === opponentColor) {
        return -9000; // AI loses
      }
    }
    
    // Evaluate material advantage
    for (const piece of gameState.pieces) {
      const pieceValue = PIECE_VALUES[piece.type];
      const multiplier = piece.color === aiColor ? 1 : -1;
      
      // Add basic piece value
      score += pieceValue * multiplier;
      
      // Add position bonuses for medium and hard difficulties
      if (this.difficulty !== 'easy' && POSITION_BONUSES[piece.type]) {
        let row = piece.row;
        let col = piece.col;
        
        // Flip the board for black's perspective
        if (piece.color === 'black') {
          row = 9 - row;
        }
        
        if (POSITION_BONUSES[piece.type][row] && 
            POSITION_BONUSES[piece.type][row][col] !== undefined) {
          score += POSITION_BONUSES[piece.type][row][col] * multiplier * 0.1;
        }
      }
    }
    
    // Additional evaluations for hard difficulty
    if (this.difficulty === 'hard') {
      // Mobility (number of valid moves)
      const aiMoves = this.getAllValidMoves(gameState, aiColor).length;
      const opponentMoves = this.getAllValidMoves(gameState, opponentColor).length;
      score += (aiMoves - opponentMoves) * 5;
      
      // Control of center
      score += this.evaluateCenterControl(gameState, aiColor);
      
      // Piece development and coordination
      score += this.evaluatePieceDevelopment(gameState, aiColor);
    }
    
    return score;
  }
  
  // Evaluate control of the center (for hard difficulty)
  evaluateCenterControl(gameState, aiColor) {
    const opponentColor = aiColor === 'red' ? 'black' : 'red';
    const centerSquares = [
      {row: 4, col: 3}, {row: 4, col: 4}, {row: 4, col: 5},
      {row: 5, col: 3}, {row: 5, col: 4}, {row: 5, col: 5}
    ];
    
    let score = 0;
    
    for (const square of centerSquares) {
      // Check if a piece is on this square
      const piece = gameState.pieces.find(
        p => p.row === square.row && p.col === square.col
      );
      
      if (piece) {
        score += piece.color === aiColor ? 10 : -10;
      }
      
      // Check which pieces can move to this square
      const aiAttackers = this.countAttackers(gameState, square, aiColor);
      const opponentAttackers = this.countAttackers(gameState, square, opponentColor);
      
      score += (aiAttackers - opponentAttackers) * 5;
    }
    
    return score;
  }
  
  // Count how many pieces of a color can move to a specific square
  countAttackers(gameState, square, color) {
    let count = 0;
    
    for (const piece of gameState.pieces) {
      if (piece.color === color) {
        const moves = this.getValidMovesForPiece(gameState, piece);
        if (moves.some(move => move.toRow === square.row && move.toCol === square.col)) {
          count++;
        }
      }
    }
    
    return count;
  }
  
  // Evaluate piece development and coordination (for hard difficulty)
  evaluatePieceDevelopment(gameState, aiColor) {
    let score = 0;
    const pieces = gameState.pieces.filter(p => p.color === aiColor);
    
    // Encourage development of pieces from starting positions
    for (const piece of pieces) {
      if (piece.type === 'horse' || piece.type === 'elephant' || piece.type === 'advisor') {
        // Check if piece has moved from starting position
        const hasMoved = this.hasPieceMovedFromStart(piece);
        if (hasMoved) {
          score += 10;
        }
      }
    }
    
    // Evaluate piece coordination (pieces supporting each other)
    score += this.evaluatePieceCoordination(gameState, pieces);
    
    return score;
  }
  
  // Check if a piece has moved from its starting position
  hasPieceMovedFromStart(piece) {
    if (piece.color === 'red') {
      if (piece.type === 'horse' && (piece.row !== 9 || (piece.col !== 1 && piece.col !== 7))) {
        return true;
      }
      if (piece.type === 'elephant' && (piece.row !== 9 || (piece.col !== 2 && piece.col !== 6))) {
        return true;
      }
      if (piece.type === 'advisor' && (piece.row !== 9 || (piece.col !== 3 && piece.col !== 5))) {
        return true;
      }
    } else { // black
      if (piece.type === 'horse' && (piece.row !== 0 || (piece.col !== 1 && piece.col !== 7))) {
        return true;
      }
      if (piece.type === 'elephant' && (piece.row !== 0 || (piece.col !== 2 && piece.col !== 6))) {
        return true;
      }
      if (piece.type === 'advisor' && (piece.row !== 0 || (piece.col !== 3 && piece.col !== 5))) {
        return true;
      }
    }
    return false;
  }
  
  // Evaluate how well pieces support each other
  evaluatePieceCoordination(gameState, pieces) {
    let score = 0;
    
    // Check for pairs of pieces that support each other
    for (let i = 0; i < pieces.length; i++) {
      for (let j = i + 1; j < pieces.length; j++) {
        const piece1 = pieces[i];
        const piece2 = pieces[j];
        
        // Chariot and cannon coordination
        if ((piece1.type === 'chariot' && piece2.type === 'cannon') ||
            (piece1.type === 'cannon' && piece2.type === 'chariot')) {
          if (piece1.row === piece2.row || piece1.col === piece2.col) {
            score += 15;
          }
        }
        
        // Horse and chariot coordination
        if ((piece1.type === 'horse' && piece2.type === 'chariot') ||
            (piece1.type === 'chariot' && piece2.type === 'horse')) {
          if (Math.abs(piece1.row - piece2.row) <= 2 && 
              Math.abs(piece1.col - piece2.col) <= 2) {
            score += 10;
          }
        }
        
        // Soldier coordination (soldiers side by side)
        if (piece1.type === 'soldier' && piece2.type === 'soldier') {
          if ((Math.abs(piece1.row - piece2.row) === 1 && piece1.col === piece2.col) ||
              (Math.abs(piece1.col - piece2.col) === 1 && piece1.row === piece2.row)) {
            score += 5;
          }
        }
      }
    }
    
    return score;
  }
  
  // Get all valid moves for a given game state and color
  getAllValidMoves(gameState, color) {
    const moves = [];
    const pieces = gameState.pieces.filter(p => p.color === color);
    
    for (const piece of pieces) {
      const pieceMoves = this.getValidMovesForPiece(gameState, piece);
      moves.push(...pieceMoves);
    }
    
    return moves;
  }
  
  // Get valid moves for a specific piece
  getValidMovesForPiece(gameState, piece) {
    // This would call the actual game logic to get valid moves
    // For now, we'll use a simplified implementation
    
    const moves = [];
    const { row, col, type, color } = piece;
    
    // Different movement patterns based on piece type
    switch (type) {
      case 'soldier':
        this.getSoldierMoves(gameState, row, col, color, moves);
        break;
      case 'horse':
        this.getHorseMoves(gameState, row, col, color, moves);
        break;
      case 'elephant':
        this.getElephantMoves(gameState, row, col, color, moves);
        break;
      case 'advisor':
        this.getAdvisorMoves(gameState, row, col, color, moves);
        break;
      case 'general':
        this.getGeneralMoves(gameState, row, col, color, moves);
        break;
      case 'chariot':
        this.getChariotMoves(gameState, row, col, color, moves);
        break;
      case 'cannon':
        this.getCannonMoves(gameState, row, col, color, moves);
        break;
    }
    
    return moves.map(m => ({
      fromRow: row,
      fromCol: col,
      toRow: m.row,
      toCol: m.col
    }));
  }
  
  // Simulate a move and return the new game state
  simulateMove(gameState, move) {
    // Create a deep copy of the game state
    const newState = JSON.parse(JSON.stringify(gameState));
    
    // Find the piece to move
    const pieceIndex = newState.pieces.findIndex(
      p => p.row === move.fromRow && p.col === move.fromCol
    );
    
    if (pieceIndex === -1) return newState;
    
    // Check if there's a piece to capture
    const captureIndex = newState.pieces.findIndex(
      p => p.row === move.toRow && p.col === move.toCol
    );
    
    // Remove captured piece if any
    if (captureIndex !== -1) {
      newState.pieces.splice(captureIndex, 1);
    }
    
    // Move the piece
    newState.pieces[pieceIndex].row = move.toRow;
    newState.pieces[pieceIndex].col = move.toCol;
    
    // Switch current player
    newState.current_player = newState.current_player === 'red' ? 'black' : 'red';
    
    return newState;
  }
  
  // Movement pattern implementations for each piece type
  // These are simplified versions - the actual game would have more complete rules
  
  getSoldierMoves(gameState, row, col, color, moves) {
    const directions = [];
    
    // Red soldiers move up (decreasing row)
    if (color === 'red') {
      directions.push({row: -1, col: 0}); // Forward
      
      // If crossed the river (row < 5), can move horizontally
      if (row < 5) {
        directions.push({row: 0, col: -1}); // Left
        directions.push({row: 0, col: 1});  // Right
      }
    } 
    // Black soldiers move down (increasing row)
    else {
      directions.push({row: 1, col: 0}); // Forward
      
      // If crossed the river (row > 4), can move horizontally
      if (row > 4) {
        directions.push({row: 0, col: -1}); // Left
        directions.push({row: 0, col: 1});  // Right
      }
    }
    
    for (const dir of directions) {
      const newRow = row + dir.row;
      const newCol = col + dir.col;
      
      // Check if the move is within the board
      if (newRow >= 0 && newRow <= 9 && newCol >= 0 && newCol <= 8) {
        // Check if the destination is empty or has an enemy piece
        const pieceAtDest = gameState.pieces.find(
          p => p.row === newRow && p.col === newCol
        );
        
        if (!pieceAtDest || pieceAtDest.color !== color) {
          moves.push({row: newRow, col: newCol});
        }
      }
    }
  }
  
  getHorseMoves(gameState, row, col, color, moves) {
    // Horse moves in an L shape: 2 steps in one direction, then 1 step perpendicular
    const possibleMoves = [
      {row: row-2, col: col-1}, {row: row-2, col: col+1},
      {row: row-1, col: col-2}, {row: row-1, col: col+2},
      {row: row+1, col: col-2}, {row: row+1, col: col+2},
      {row: row+2, col: col-1}, {row: row+2, col: col+1}
    ];
    
    // Check for blocking pieces (horse leg)
    const blockingPositions = [
      {move: {row: row-2, col: col-1}, block: {row: row-1, col: col}},
      {move: {row: row-2, col: col+1}, block: {row: row-1, col: col}},
      {move: {row: row-1, col: col-2}, block: {row: row, col: col-1}},
      {move: {row: row-1, col: col+2}, block: {row: row, col: col+1}},
      {move: {row: row+1, col: col-2}, block: {row: row, col: col-1}},
      {move: {row: row+1, col: col+2}, block: {row: row, col: col+1}},
      {move: {row: row+2, col: col-1}, block: {row: row+1, col: col}},
      {move: {row: row+2, col: col+1}, block: {row: row+1, col: col}}
    ];
    
    for (const bp of blockingPositions) {
      const move = bp.move;
      const block = bp.block;
      
      // Check if the move is within the board
      if (move.row >= 0 && move.row <= 9 && move.col >= 0 && move.col <= 8) {
        // Check if the horse's leg is blocked
        const blockingPiece = gameState.pieces.find(
          p => p.row === block.row && p.col === block.col
        );
        
        if (!blockingPiece) {
          // Check if the destination is empty or has an enemy piece
          const pieceAtDest = gameState.pieces.find(
            p => p.row === move.row && p.col === move.col
          );
          
          if (!pieceAtDest || pieceAtDest.color !== color) {
            moves.push({row: move.row, col: move.col});
          }
        }
      }
    }
  }
  
  getElephantMoves(gameState, row, col, color, moves) {
    // Elephant moves diagonally by 2 points
    const possibleMoves = [
      {row: row-2, col: col-2}, {row: row-2, col: col+2},
      {row: row+2, col: col-2}, {row: row+2, col: col+2}
    ];
    
    // Check for blocking pieces (elephant eye)
    const blockingPositions = [
      {move: {row: row-2, col: col-2}, block: {row: row-1, col: col-1}},
      {move: {row: row-2, col: col+2}, block: {row: row-1, col: col+1}},
      {move: {row: row+2, col: col-2}, block: {row: row+1, col: col-1}},
      {move: {row: row+2, col: col+2}, block: {row: row+1, col: col+1}}
    ];
    
    for (const bp of blockingPositions) {
      const move = bp.move;
      const block = bp.block;
      
      // Check if the move is within the board and doesn't cross the river
      if (move.row >= 0 && move.row <= 9 && move.col >= 0 && move.col <= 8) {
        // Elephants can't cross the river
        if ((color === 'red' && move.row >= 5) || (color === 'black' && move.row <= 4)) {
          // Check if the elephant's eye is blocked
          const blockingPiece = gameState.pieces.find(
            p => p.row === block.row && p.col === block.col
          );
          
          if (!blockingPiece) {
            // Check if the destination is empty or has an enemy piece
            const pieceAtDest = gameState.pieces.find(
              p => p.row === move.row && p.col === move.col
            );
            
            if (!pieceAtDest || pieceAtDest.color !== color) {
              moves.push({row: move.row, col: move.col});
            }
          }
        }
      }
    }
  }
  
  getAdvisorMoves(gameState, row, col, color, moves) {
    // Advisor moves diagonally by 1 point within the palace
    const possibleMoves = [
      {row: row-1, col: col-1}, {row: row-1, col: col+1},
      {row: row+1, col: col-1}, {row: row+1, col: col+1}
    ];
    
    for (const move of possibleMoves) {
      // Check if the move is within the palace
      if (this.isInsidePalace(move.row, move.col, color)) {
        // Check if the destination is empty or has an enemy piece
        const pieceAtDest = gameState.pieces.find(
          p => p.row === move.row && p.col === move.col
        );
        
        if (!pieceAtDest || pieceAtDest.color !== color) {
          moves.push({row: move.row, col: move.col});
        }
      }
    }
  }
  
  getGeneralMoves(gameState, row, col, color, moves) {
    // General moves one point horizontally or vertically within the palace
    const possibleMoves = [
      {row: row-1, col: col}, {row: row+1, col: col},
      {row: row, col: col-1}, {row: row, col: col+1}
    ];
    
    for (const move of possibleMoves) {
      // Check if the move is within the palace
      if (this.isInsidePalace(move.row, move.col, color)) {
        // Check if the destination is empty or has an enemy piece
        const pieceAtDest = gameState.pieces.find(
          p => p.row === move.row && p.col === move.col
        );
        
        if (!pieceAtDest || pieceAtDest.color !== color) {
          moves.push({row: move.row, col: move.col});
        }
      }
    }
    
    // Flying general rule: check if the general can capture the opposing general
    this.checkFlyingGeneral(gameState, row, col, color, moves);
  }
  
  checkFlyingGeneral(gameState, row, col, color, moves) {
    // Find the opposing general
    const opposingGeneral = gameState.pieces.find(
      p => p.type === 'general' && p.color !== color
    );
    
    if (opposingGeneral && opposingGeneral.col === col) {
      // Check if there are any pieces between the two generals
      let hasObstacle = false;
      const minRow = Math.min(row, opposingGeneral.row);
      const maxRow = Math.max(row, opposingGeneral.row);
      
      for (let r = minRow + 1; r < maxRow; r++) {
        if (gameState.pieces.some(p => p.row === r && p.col === col)) {
          hasObstacle = true;
          break;
        }
      }
      
      // If no obstacles, the general can capture the opposing general
      if (!hasObstacle) {
        moves.push({row: opposingGeneral.row, col: opposingGeneral.col});
      }
    }
  }
  
  getChariotMoves(gameState, row, col, color, moves) {
    // Chariot moves any number of points horizontally or vertically
    this.getRookLikeMoves(gameState, row, col, color, moves, false);
  }
  
  getCannonMoves(gameState, row, col, color, moves) {
    // Cannon moves like a chariot but needs a piece to jump over for captures
    this.getRookLikeMoves(gameState, row, col, color, moves, true);
  }
  
  getRookLikeMoves(gameState, row, col, color, moves, isCannon) {
    // Check in all four directions: up, right, down, left
    const directions = [
      {rowDir: -1, colDir: 0}, // Up
      {rowDir: 0, colDir: 1},  // Right
      {rowDir: 1, colDir: 0},  // Down
      {rowDir: 0, colDir: -1}  // Left
    ];
    
    for (const dir of directions) {
      let r = row + dir.rowDir;
      let c = col + dir.colDir;
      let jumpedOver = false;
      
      while (r >= 0 && r <= 9 && c >= 0 && c <= 8) {
        const pieceAtPos = gameState.pieces.find(p => p.row === r && p.col === c);
        
        if (pieceAtPos) {
          if (isCannon) {
            if (!jumpedOver) {
              // First piece encountered - cannon needs to jump over it
              jumpedOver = true;
            } else {
              // Second piece encountered - can capture if it's an enemy
              if (pieceAtPos.color !== color) {
                moves.push({row: r, col: c});
              }
              break;
            }
          } else {
            // Chariot can capture the first piece it encounters if it's an enemy
            if (pieceAtPos.color !== color) {
              moves.push({row: r, col: c});
            }
            break;
          }
        } else if (!isCannon || !jumpedOver) {
          // Empty square - chariot can always move here
          // Cannon can only move here if it hasn't jumped yet
          moves.push({row: r, col: c});
        }
        
        r += dir.rowDir;
        c += dir.colDir;
      }
    }
  }
  
  // Helper function to check if a position is inside the palace
  isInsidePalace(row, col, color) {
    if (col < 3 || col > 5) return false;
    
    if (color === 'red') {
      return row >= 7 && row <= 9;
    } else {
      return row >= 0 && row <= 2;
    }
  }
}

module.exports = XiangqiAI;
