// Enhanced AI implementation for makeMove cloud function
function makeAIMove(gameState) {
  const aiColor = gameState.ai_color;
  const aiDifficulty = gameState.ai_difficulty || 'medium';
  const aiPieces = gameState.pieces.filter(p => p.color === aiColor);
  const opponentColor = aiColor === 'red' ? 'black' : 'red';
  
  // For each AI piece, get valid moves
  let allMoves = [];
  
  for (const piece of aiPieces) {
    const validMoves = getValidMovesForPiece(piece, gameState.pieces);
    
    // Filter out moves that would leave the AI's general in check
    const legalMoves = validMoves.filter(move => {
      return !wouldBeInCheckAfterMove(piece, move[0], move[1], gameState);
    });
    
    // Add each legal move to the list of all possible moves
    legalMoves.forEach(move => {
      allMoves.push({
        fromPiece: piece,
        toRow: move[0],
        toCol: move[1],
        score: 0 // Will be calculated based on difficulty
      });
    });
  }
  
  // If no legal moves, return null
  if (allMoves.length === 0) {
    return null;
  }
  
  // Score moves based on AI difficulty
  switch (aiDifficulty) {
    case 'easy':
      // For easy difficulty, just choose a random move
      const randomIndex = Math.floor(Math.random() * allMoves.length);
      return allMoves[randomIndex];
      
    case 'medium':
      // For medium difficulty, prioritize captures and checks
      for (const move of allMoves) {
        // Check if this move captures an opponent piece
        const capturedPiece = gameState.pieces.find(p => 
          p.row === move.toRow && p.col === move.toCol && p.color === opponentColor
        );
        
        if (capturedPiece) {
          // Assign score based on piece value
          switch (capturedPiece.type) {
            case 'general': move.score += 1000; break;
            case 'chariot': move.score += 90; break;
            case 'horse': move.score += 40; break;
            case 'cannon': move.score += 40; break;
            case 'elephant': move.score += 20; break;
            case 'advisor': move.score += 20; break;
            case 'soldier': move.score += 10; break;
          }
        }
        
        // Check if this move puts opponent in check
        const simulatedState = simulateMove(gameState, move.fromPiece, move.toRow, move.toCol);
        if (isGeneralInCheck(opponentColor, simulatedState.pieces)) {
          move.score += 50;
        }
      }
      
      // Add some randomness to medium difficulty (70% best move, 30% random)
      if (Math.random() < 0.7) {
        // Sort moves by score and pick the best one
        allMoves.sort((a, b) => b.score - a.score);
        return allMoves[0];
      } else {
        // Pick a random move
        const randomIndex = Math.floor(Math.random() * allMoves.length);
        return allMoves[randomIndex];
      }
      
    case 'hard':
      // For hard difficulty, use more advanced evaluation
      for (const move of allMoves) {
        // Check if this move captures an opponent piece
        const capturedPiece = gameState.pieces.find(p => 
          p.row === move.toRow && p.col === move.toCol && p.color === opponentColor
        );
        
        if (capturedPiece) {
          // Assign score based on piece value
          switch (capturedPiece.type) {
            case 'general': move.score += 1000; break;
            case 'chariot': move.score += 90; break;
            case 'horse': move.score += 40; break;
            case 'cannon': move.score += 40; break;
            case 'elephant': move.score += 20; break;
            case 'advisor': move.score += 20; break;
            case 'soldier': move.score += 10; break;
          }
        }
        
        // Simulate the move
        const simulatedState = simulateMove(gameState, move.fromPiece, move.toRow, move.toCol);
        
        // Check if this move puts opponent in check
        if (isGeneralInCheck(opponentColor, simulatedState.pieces)) {
          move.score += 50;
          
          // Check if it's checkmate
          if (isGeneralInCheckmate(opponentColor, simulatedState.pieces)) {
            move.score += 500;
          }
        }
        
        // Evaluate piece positioning
        move.score += evaluatePosition(move.fromPiece, move.toRow, move.toCol, simulatedState);
        
        // Evaluate piece safety
        move.score += evaluateSafety(move.fromPiece, move.toRow, move.toCol, simulatedState);
      }
      
      // Sort moves by score and pick the best one
      allMoves.sort((a, b) => b.score - a.score);
      return allMoves[0];
      
    default:
      // Default to medium difficulty
      const defaultIndex = Math.floor(Math.random() * allMoves.length);
      return allMoves[defaultIndex];
  }
}

// Helper function to simulate a move
function simulateMove(gameState, piece, toRow, toCol) {
  // Create a deep copy of the game state
  const simulatedState = JSON.parse(JSON.stringify(gameState));
  const simulatedPieces = simulatedState.pieces;
  
  // Find the piece in the simulated state
  const simulatedPiece = simulatedPieces.find(p => 
    p.row === piece.row && p.col === piece.col && p.type === piece.type && p.color === piece.color
  );
  
  // Find any piece at the destination position (capture)
  const capturedPieceIndex = simulatedPieces.findIndex(p => p.row === toRow && p.col === toCol);
  
  // Remove captured piece if any
  if (capturedPieceIndex >= 0) {
    simulatedPieces.splice(capturedPieceIndex, 1);
  }
  
  // Move the piece
  simulatedPiece.row = toRow;
  simulatedPiece.col = toCol;
  
  return simulatedState;
}

// Evaluate piece positioning
function evaluatePosition(piece, toRow, toCol, gameState) {
  let score = 0;
  
  switch (piece.type) {
    case 'general':
      // Generals should stay in the palace
      if (isInPalace(toRow, toCol, piece.color)) {
        score += 10;
      }
      break;
      
    case 'chariot':
      // Chariots are strong on open files and ranks
      const openLines = countOpenLines(toRow, toCol, gameState.pieces);
      score += openLines * 5;
      break;
      
    case 'horse':
      // Horses are better in the center
      const centerDistance = Math.abs(toCol - 4) + Math.abs(toRow - 4.5);
      score += (9 - centerDistance) * 2;
      break;
      
    case 'cannon':
      // Cannons need platforms to capture
      const platforms = countPlatforms(toRow, toCol, gameState.pieces);
      score += platforms * 3;
      break;
      
    case 'soldier':
      // Soldiers are stronger across the river
      const crossedRiver = (piece.color === 'red' && toRow < 5) || (piece.color === 'black' && toRow > 4);
      if (crossedRiver) {
        score += 15;
        // Center soldiers are stronger
        score += (4 - Math.abs(toCol - 4)) * 2;
      }
      break;
  }
  
  return score;
}

// Count open lines (rows and columns) for a position
function countOpenLines(row, col, pieces) {
  let openLines = 0;
  
  // Check horizontal line
  let horizontalPieces = 0;
  for (let c = 0; c < 9; c++) {
    if (c !== col && pieces.some(p => p.row === row && p.col === c)) {
      horizontalPieces++;
    }
  }
  if (horizontalPieces < 4) openLines++;
  
  // Check vertical line
  let verticalPieces = 0;
  for (let r = 0; r < 10; r++) {
    if (r !== row && pieces.some(p => p.row === r && p.col === col)) {
      verticalPieces++;
    }
  }
  if (verticalPieces < 5) openLines++;
  
  return openLines;
}

// Count potential platforms for cannons
function countPlatforms(row, col, pieces) {
  let platforms = 0;
  
  // Check horizontal line
  let horizontalPieces = 0;
  for (let c = 0; c < 9; c++) {
    if (c !== col && pieces.some(p => p.row === row && p.col === c)) {
      horizontalPieces++;
    }
  }
  platforms += horizontalPieces;
  
  // Check vertical line
  let verticalPieces = 0;
  for (let r = 0; r < 10; r++) {
    if (r !== row && pieces.some(p => p.row === r && p.col === col)) {
      verticalPieces++;
    }
  }
  platforms += verticalPieces;
  
  return platforms;
}

// Evaluate piece safety
function evaluateSafety(piece, toRow, toCol, gameState) {
  let score = 0;
  const opponentColor = piece.color === 'red' ? 'black' : 'red';
  const opponentPieces = gameState.pieces.filter(p => p.color === opponentColor);
  
  // Check if the piece would be under attack after the move
  for (const opponentPiece of opponentPieces) {
    const opponentMoves = getValidMovesForPiece(opponentPiece, gameState.pieces);
    if (opponentMoves.some(move => move[0] === toRow && move[1] === toCol)) {
      // Piece would be under attack, reduce score based on piece value
      switch (piece.type) {
        case 'general': score -= 50; break;
        case 'chariot': score -= 30; break;
        case 'horse': score -= 15; break;
        case 'cannon': score -= 15; break;
        case 'elephant': score -= 10; break;
        case 'advisor': score -= 10; break;
        case 'soldier': score -= 5; break;
      }
    }
  }
  
  return score;
}
