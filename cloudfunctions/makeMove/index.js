// index.js for makeMove cloud function
const cloud = require('wx-server-sdk');

cloud.init({
  env: cloud.DYNAMIC_CURRENT_ENV
});

const db = cloud.database();
const gamesCollection = db.collection('games');

// Main function to make a move
exports.main = async (event, context) => {
  try {
    const { fromRow, fromCol, toRow, toCol, gameId } = event;
    
    // Get the game state from database
    const gameDoc = await gamesCollection.doc(gameId).get();
    if (!gameDoc.data) {
      return {
        success: false,
        message: 'Game not found'
      };
    }
    
    const gameState = gameDoc.data;
    
    // Check if game is already over
    if (gameState.game_over) {
      return {
        success: false,
        message: 'Game is already over',
        game: gameState
      };
    }
    
    // Find the piece at the specified position
    const pieceIndex = gameState.pieces.findIndex(p => p.row === fromRow && p.col === fromCol);
    if (pieceIndex === -1) {
      return {
        success: false,
        message: 'No piece at specified position',
        game: gameState
      };
    }
    
    const piece = gameState.pieces[pieceIndex];
    
    // Check if it's this piece's turn
    if (piece.color !== gameState.current_player) {
      return {
        success: false,
        message: 'Not this player\'s turn',
        game: gameState
      };
    }
    
    // Get valid moves for the piece
    const validMoves = getValidMovesForPiece(piece, gameState.pieces);
    
    // Check if the move is valid
    const isValidMove = validMoves.some(move => move[0] === toRow && move[1] === toCol);
    if (!isValidMove) {
      return {
        success: false,
        message: 'Invalid move',
        game: gameState
      };
    }
    
    // Check if the move would leave the player's general in check
    if (wouldBeInCheckAfterMove(piece, toRow, toCol, gameState)) {
      return {
        success: false,
        message: 'Move would leave your general in check',
        game: gameState
      };
    }
    
    // Check if there's a piece at the destination (capture)
    const capturedPieceIndex = gameState.pieces.findIndex(p => p.row === toRow && p.col === toCol);
    if (capturedPieceIndex !== -1) {
      // Remove the captured piece
      gameState.pieces.splice(capturedPieceIndex, 1);
    }
    
    // Move the piece
    piece.row = toRow;
    piece.col = toCol;
    
    // Switch player turn
    gameState.current_player = gameState.current_player === 'red' ? 'black' : 'red';
    
    // Check if the move puts the opponent's general in check or checkmate
    const opponentColor = gameState.current_player;
    const isInCheck = isGeneralInCheck(opponentColor, gameState.pieces);
    
    if (isInCheck) {
      // Check if it's checkmate
      const isCheckmate = isGeneralInCheckmate(opponentColor, gameState.pieces);
      
      if (isCheckmate) {
        gameState.game_over = true;
        gameState.winner = piece.color;
      }
    }
    
    // If AI is enabled and it's AI's turn, make AI move
    if (gameState.ai_enabled && gameState.current_player === gameState.ai_color && !gameState.game_over) {
      // Make AI move (this would be implemented in a real app)
      // For now, we'll just simulate a basic AI move
      const aiMove = makeAIMove(gameState);
      if (aiMove) {
        const { fromPiece, toRow: aiToRow, toCol: aiToCol } = aiMove;
        
        // Check if there's a piece at the destination (capture)
        const aiCapturedPieceIndex = gameState.pieces.findIndex(p => p.row === aiToRow && p.col === aiToCol);
        if (aiCapturedPieceIndex !== -1) {
          // Remove the captured piece
          gameState.pieces.splice(aiCapturedPieceIndex, 1);
        }
        
        // Move the AI piece
        fromPiece.row = aiToRow;
        fromPiece.col = aiToCol;
        
        // Switch player turn back to human
        gameState.current_player = gameState.current_player === 'red' ? 'black' : 'red';
        
        // Check if the AI move puts the opponent's general in check or checkmate
        const humanColor = gameState.current_player;
        const isHumanInCheck = isGeneralInCheck(humanColor, gameState.pieces);
        
        if (isHumanInCheck) {
          // Check if it's checkmate
          const isHumanCheckmate = isGeneralInCheckmate(humanColor, gameState.pieces);
          
          if (isHumanCheckmate) {
            gameState.game_over = true;
            gameState.winner = gameState.ai_color;
          }
        }
      }
    }
    
    // Update the game state in the database
    await gamesCollection.doc(gameId).update({
      data: gameState
    });
    
    return {
      success: true,
      game: gameState
    };
  } catch (error) {
    console.error('Error making move:', error);
    return {
      success: false,
      message: 'Error making move',
      error: error.message
    };
  }
};

// Function to make an AI move
function makeAIMove(gameState) {
  const aiColor = gameState.ai_color;
  const aiPieces = gameState.pieces.filter(p => p.color === aiColor);
  
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
        toCol: move[1]
      });
    });
  }
  
  // If no legal moves, return null
  if (allMoves.length === 0) {
    return null;
  }
  
  // For a simple AI, just choose a random move
  // In a real implementation, you would evaluate moves based on the AI difficulty
  const randomIndex = Math.floor(Math.random() * allMoves.length);
  return allMoves[randomIndex];
}

// Function to determine if a general is in checkmate
function isGeneralInCheckmate(color, pieces) {
  // If the general is not in check, it's not checkmate
  if (!isGeneralInCheck(color, pieces)) {
    return false;
  }
  
  // Get all pieces of the specified color
  const colorPieces = pieces.filter(p => p.color === color);
  
  // For each piece, check if any legal move can get out of check
  for (const piece of colorPieces) {
    const validMoves = getValidMovesForPiece(piece, pieces);
    
    // Check if any move would get out of check
    for (const move of validMoves) {
      if (!wouldBeInCheckAfterMove(piece, move[0], move[1], { pieces })) {
        return false; // Found a move that gets out of check
      }
    }
  }
  
  // If no move can get out of check, it's checkmate
  return true;
}

// Function to determine if a move would leave the player's general in check
function wouldBeInCheckAfterMove(piece, toRow, toCol, gameState) {
  // Create a deep copy of the game state
  const simulatedState = JSON.parse(JSON.stringify(gameState));
  const simulatedPieces = simulatedState.pieces;
  
  // Find the piece in the simulated state
  const simulatedPiece = simulatedPieces.find(p => 
    p.row === piece.row && p.col === piece.col && p.type === piece.type && p.color === piece.color
  );
  
  // Find any piece at the destination position (capture)
  const capturedPieceIndex = simulatedPieces.findIndex(p => p.row === toRow && p.col === toCol);
  let capturedPiece = null;
  
  // Remove captured piece if any
  if (capturedPieceIndex >= 0) {
    capturedPiece = simulatedPieces.splice(capturedPieceIndex, 1)[0];
  }
  
  // Move the piece
  simulatedPiece.row = toRow;
  simulatedPiece.col = toCol;
  
  // Check if the player's general is in check after the move
  const isInCheck = isGeneralInCheck(piece.color, simulatedPieces);
  
  // Restore captured piece if any
  if (capturedPiece) {
    simulatedPieces.push(capturedPiece);
  }
  
  return isInCheck;
}

// Function to check if a general is in check
function isGeneralInCheck(color, pieces) {
  // Find the general
  const general = pieces.find(p => p.type === 'general' && p.color === color);
  if (!general) return false;
  
  // Check if any opponent piece can capture the general
  return pieces.some(piece => {
    if (piece.color === color) return false; // Skip pieces of the same color
    
    const validMoves = getValidMovesForPiece(piece, pieces);
    return validMoves.some(move => move[0] === general.row && move[1] === general.col);
  });
}

// Function to get valid moves for a piece based on its type
function getValidMovesForPiece(piece, allPieces) {
  switch (piece.type) {
    case 'general':
      return getGeneralMoves(piece, allPieces);
    case 'advisor':
      return getAdvisorMoves(piece, allPieces);
    case 'elephant':
      return getElephantMoves(piece, allPieces);
    case 'horse':
      return getHorseMoves(piece, allPieces);
    case 'chariot':
      return getChariotMoves(piece, allPieces);
    case 'cannon':
      return getCannonMoves(piece, allPieces);
    case 'soldier':
      return getSoldierMoves(piece, allPieces);
    default:
      return [];
  }
}

// Helper function to check if a position is within the board
function isOnBoard(row, col) {
  return row >= 0 && row <= 9 && col >= 0 && col <= 8;
}

// Helper function to check if a position is occupied by a piece of the same color
function isOccupiedBySameColor(row, col, color, pieces) {
  return pieces.some(p => p.row === row && p.col === col && p.color === color);
}

// Helper function to check if a position is occupied by any piece
function isOccupied(row, col, pieces) {
  return pieces.some(p => p.row === row && p.col === col);
}

// Helper function to check if a position is within the palace
function isInPalace(row, col, color) {
  if (color === 'red') {
    return row >= 7 && row <= 9 && col >= 3 && col <= 5;
  } else {
    return row >= 0 && row <= 2 && col >= 3 && col <= 5;
  }
}

// Implementation of move rules for each piece type
// These functions are the same as in getValidMoves cloud function
function getGeneralMoves(piece, allPieces) {
  const { row, col, color } = piece;
  const moves = [];
  
  // General can move one step horizontally or vertically within the palace
  const directions = [[-1, 0], [1, 0], [0, -1], [0, 1]];
  
  for (const [dRow, dCol] of directions) {
    const newRow = row + dRow;
    const newCol = col + dCol;
    
    if (isInPalace(newRow, newCol, color) && !isOccupiedBySameColor(newRow, newCol, color, allPieces)) {
      moves.push([newRow, newCol]);
    }
  }
  
  // Check for flying general rule (direct confrontation with enemy general)
  const oppositeColor = color === 'red' ? 'black' : 'red';
  const enemyGeneral = allPieces.find(p => p.type === 'general' && p.color === oppositeColor);
  
  if (enemyGeneral && enemyGeneral.col === col) {
    let piecesBetween = false;
    const minRow = Math.min(row, enemyGeneral.row);
    const maxRow = Math.max(row, enemyGeneral.row);
    
    for (let r = minRow + 1; r < maxRow; r++) {
      if (isOccupied(r, col, allPieces)) {
        piecesBetween = true;
        break;
      }
    }
    
    if (!piecesBetween) {
      moves.push([enemyGeneral.row, enemyGeneral.col]);
    }
  }
  
  return moves;
}

function getAdvisorMoves(piece, allPieces) {
  const { row, col, color } = piece;
  const moves = [];
  
  // Advisor can move one step diagonally within the palace
  const directions = [[-1, -1], [-1, 1], [1, -1], [1, 1]];
  
  for (const [dRow, dCol] of directions) {
    const newRow = row + dRow;
    const newCol = col + dCol;
    
    if (isInPalace(newRow, newCol, color) && !isOccupiedBySameColor(newRow, newCol, color, allPieces)) {
      moves.push([newRow, newCol]);
    }
  }
  
  return moves;
}

function getElephantMoves(piece, allPieces) {
  const { row, col, color } = piece;
  const moves = [];
  
  // Elephant moves exactly two points diagonally and cannot cross the river
  const directions = [[-2, -2], [-2, 2], [2, -2], [2, 2]];
  
  for (const [dRow, dCol] of directions) {
    const newRow = row + dRow;
    const newCol = col + dCol;
    const blockRow = row + dRow/2;
    const blockCol = col + dCol/2;
    
    // Check if the move is on the board and doesn't cross the river
    const crossesRiver = (color === 'red' && newRow < 5) || (color === 'black' && newRow > 4);
    
    if (isOnBoard(newRow, newCol) && !crossesRiver && 
        !isOccupied(blockRow, blockCol, allPieces) && 
        !isOccupiedBySameColor(newRow, newCol, color, allPieces)) {
      moves.push([newRow, newCol]);
    }
  }
  
  return moves;
}

function getHorseMoves(piece, allPieces) {
  const { row, col, color } = piece;
  const moves = [];
  
  // Horse moves one point orthogonally and then one point diagonally outward
  const directions = [
    [-1, 0, -2, -1], [-1, 0, -2, 1],  // Up then left/right
    [1, 0, 2, -1], [1, 0, 2, 1],      // Down then left/right
    [0, -1, -1, -2], [0, -1, 1, -2],  // Left then up/down
    [0, 1, -1, 2], [0, 1, 1, 2]       // Right then up/down
  ];
  
  for (const [dRow1, dCol1, dRow2, dCol2] of directions) {
    const blockRow = row + dRow1;
    const blockCol = col + dCol1;
    const newRow = row + dRow2;
    const newCol = col + dCol2;
    
    if (isOnBoard(newRow, newCol) && 
        !isOccupied(blockRow, blockCol, allPieces) && 
        !isOccupiedBySameColor(newRow, newCol, color, allPieces)) {
      moves.push([newRow, newCol]);
    }
  }
  
  return moves;
}

function getChariotMoves(piece, allPieces) {
  const { row, col, color } = piece;
  const moves = [];
  
  // Chariot moves any distance orthogonally (like a rook in chess)
  const directions = [[-1, 0], [1, 0], [0, -1], [0, 1]];
  
  for (const [dRow, dCol] of directions) {
    let newRow = row + dRow;
    let newCol = col + dCol;
    
    while (isOnBoard(newRow, newCol)) {
      if (isOccupied(newRow, newCol, allPieces)) {
        if (!isOccupiedBySameColor(newRow, newCol, color, allPieces)) {
          moves.push([newRow, newCol]); // Can capture enemy piece
        }
        break; // Can't move further in this direction
      }
      
      moves.push([newRow, newCol]);
      newRow += dRow;
      newCol += dCol;
    }
  }
  
  return moves;
}

function getCannonMoves(piece, allPieces) {
  const { row, col, color } = piece;
  const moves = [];
  
  // Cannon moves like chariot but needs a piece to jump over for captures
  const directions = [[-1, 0], [1, 0], [0, -1], [0, 1]];
  
  for (const [dRow, dCol] of directions) {
    let newRow = row + dRow;
    let newCol = col + dCol;
    let foundPlatform = false;
    
    while (isOnBoard(newRow, newCol)) {
      if (!foundPlatform) {
        if (isOccupied(newRow, newCol, allPieces)) {
          foundPlatform = true; // Found a piece to jump over
        } else {
          moves.push([newRow, newCol]); // Normal move without capture
        }
      } else {
        // After finding a platform, look for an enemy piece to capture
        if (isOccupied(newRow, newCol, allPieces)) {
          if (!isOccupiedBySameColor(newRow, newCol, color, allPieces)) {
            moves.push([newRow, newCol]); // Can capture enemy piece
          }
          break; // Can't move further in this direction
        }
      }
      
      newRow += dRow;
      newCol += dCol;
    }
  }
  
  return moves;
}

function getSoldierMoves(piece, allPieces) {
  const { row, col, color } = piece;
  const moves = [];
  
  // Determine if the soldier has crossed the river
  const crossedRiver = (color === 'red' && row < 5) || (color === 'black' && row > 4);
  
  // Soldier moves forward one point (different direction based on color)
  const forwardRow = color === 'red' ? row - 1 : row + 1;
  if (isOnBoard(forwardRow, col) && !isOccupiedBySameColor(forwardRow, col, color, allPieces)) {
    moves.push([forwardRow, col]);
  }
  
  // If crossed the river, can also move horizontally
  if (crossedRiver) {
    // Check left
    if (isOnBoard(row, col - 1) && !isOccupiedBySameColor(row, col - 1, color, allPieces)) {
      moves.push([row, col - 1]);
    }
    
    // Check right
    if (isOnBoard(row, col + 1) && !isOccupiedBySameColor(row, col + 1, color, allPieces)) {
      moves.push([row, col + 1]);
    }
  }
  
  return moves;
}
