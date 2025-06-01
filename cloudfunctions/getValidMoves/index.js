// index.js for getValidMoves cloud function
const cloud = require('wx-server-sdk');

cloud.init({
  env: cloud.DYNAMIC_CURRENT_ENV
});

const db = cloud.database();
const gamesCollection = db.collection('games');

// Main function to get valid moves for a piece
exports.main = async (event, context) => {
  try {
    const { row, col, gameId } = event;
    
    // Get the game state from database
    const gameDoc = await gamesCollection.doc(gameId).get();
    if (!gameDoc.data) {
      return {
        success: false,
        message: 'Game not found',
        moves: []
      };
    }
    
    const gameState = gameDoc.data;
    
    // Find the piece at the specified position
    const piece = gameState.pieces.find(p => p.row === row && p.col === col);
    if (!piece) {
      return {
        success: false,
        message: 'No piece at specified position',
        moves: []
      };
    }
    
    // Check if it's this piece's turn
    if (piece.color !== gameState.current_player) {
      return {
        success: false,
        message: 'Not this player\'s turn',
        moves: []
      };
    }
    
    // Get valid moves for the piece based on its type
    const validMoves = getValidMovesForPiece(piece, gameState.pieces);
    
    // Filter out moves that would put or leave the player's general in check
    const legalMoves = validMoves.filter(move => {
      return !wouldBeInCheckAfterMove(piece, move[0], move[1], gameState);
    });
    
    return {
      success: true,
      moves: legalMoves
    };
  } catch (error) {
    console.error('Error getting valid moves:', error);
    return {
      success: false,
      message: 'Error getting valid moves',
      error: error.message,
      moves: []
    };
  }
};

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
