// Create a visual demo image for the intersection-based rendering
const fs = require('fs');
const { createCanvas } = require('canvas');

// Create a canvas for the demo image
const width = 800;
const height = 900;
const canvas = createCanvas(width, height);
const ctx = canvas.getContext('2d');

// Board dimensions
const boardWidth = width * 0.9;
const boardHeight = boardWidth * 9/8;
const cellSize = boardWidth / 8;

// Draw the board
function drawBoard() {
  // Clear canvas
  ctx.fillStyle = '#ffffff';
  ctx.fillRect(0, 0, width, height);
  
  // Draw title
  ctx.fillStyle = '#000000';
  ctx.font = 'bold 24px Arial';
  ctx.textAlign = 'center';
  ctx.fillText('Xiangqi (Chinese Chess) - Traditional Intersection Placement', width/2, 40);
  
  // Draw board background
  ctx.fillStyle = '#e8c887';
  ctx.fillRect((width - boardWidth)/2, 80, boardWidth, boardHeight);
  
  // Draw grid lines
  ctx.lineWidth = 1;
  ctx.strokeStyle = '#000000';
  
  // Draw horizontal lines
  for (let i = 0; i < 10; i++) {
    ctx.beginPath();
    ctx.moveTo((width - boardWidth)/2, 80 + i * cellSize);
    ctx.lineTo((width - boardWidth)/2 + boardWidth, 80 + i * cellSize);
    ctx.stroke();
  }
  
  // Draw vertical lines
  for (let i = 0; i < 9; i++) {
    ctx.beginPath();
    ctx.moveTo((width - boardWidth)/2 + i * cellSize, 80);
    ctx.lineTo((width - boardWidth)/2 + i * cellSize, 80 + boardHeight);
    ctx.stroke();
  }
  
  // Draw palace diagonals
  // Top palace (black)
  ctx.beginPath();
  ctx.moveTo((width - boardWidth)/2 + 3 * cellSize, 80);
  ctx.lineTo((width - boardWidth)/2 + 5 * cellSize, 80 + 2 * cellSize);
  ctx.stroke();
  
  ctx.beginPath();
  ctx.moveTo((width - boardWidth)/2 + 5 * cellSize, 80);
  ctx.lineTo((width - boardWidth)/2 + 3 * cellSize, 80 + 2 * cellSize);
  ctx.stroke();
  
  // Bottom palace (red)
  ctx.beginPath();
  ctx.moveTo((width - boardWidth)/2 + 3 * cellSize, 80 + 7 * cellSize);
  ctx.lineTo((width - boardWidth)/2 + 5 * cellSize, 80 + 9 * cellSize);
  ctx.stroke();
  
  ctx.beginPath();
  ctx.moveTo((width - boardWidth)/2 + 5 * cellSize, 80 + 7 * cellSize);
  ctx.lineTo((width - boardWidth)/2 + 3 * cellSize, 80 + 9 * cellSize);
  ctx.stroke();
  
  // Draw river text
  ctx.font = `${cellSize * 0.8}px Arial`;
  ctx.fillStyle = '#333333';
  ctx.textAlign = 'center';
  ctx.textBaseline = 'middle';
  ctx.fillText('楚', (width - boardWidth)/2 + cellSize * 1.5, 80 + cellSize * 4.5);
  ctx.fillText('河', (width - boardWidth)/2 + cellSize * 3.5, 80 + cellSize * 4.5);
  ctx.fillText('漢', (width - boardWidth)/2 + cellSize * 5.5, 80 + cellSize * 4.5);
  ctx.fillText('界', (width - boardWidth)/2 + cellSize * 7.5, 80 + cellSize * 4.5);
}

// Draw pieces on intersections
function drawPieces() {
  const pieces = [
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
  ];
  
  // Add some example moves to demonstrate intersection placement
  // Move red soldier forward
  pieces.find(p => p.type === 'soldier' && p.color === 'red' && p.col === 4).row = 5;
  
  // Move black soldier forward
  pieces.find(p => p.type === 'soldier' && p.color === 'black' && p.col === 4).row = 4;
  
  // Move red horse
  pieces.find(p => p.type === 'horse' && p.color === 'red' && p.col === 1).row = 7;
  pieces.find(p => p.type === 'horse' && p.color === 'red' && p.col === 1).col = 2;
  
  // Move black horse
  pieces.find(p => p.type === 'horse' && p.color === 'black' && p.col === 1).row = 2;
  pieces.find(p => p.type === 'horse' && p.color === 'black' && p.col === 1).col = 2;
  
  // Draw pieces on intersections
  pieces.forEach(piece => {
    const x = (width - boardWidth)/2 + piece.col * cellSize;
    const y = 80 + piece.row * cellSize;
    const radius = cellSize * 0.4;
    
    // Draw piece background
    ctx.beginPath();
    ctx.arc(x, y, radius, 0, 2 * Math.PI);
    ctx.fillStyle = piece.color === 'red' ? '#f44336' : '#212121';
    ctx.fill();
    ctx.lineWidth = 2;
    ctx.strokeStyle = piece.color === 'red' ? '#b71c1c' : '#000000';
    ctx.stroke();
    
    // Draw piece text
    ctx.font = `${radius * 1.2}px Arial`;
    ctx.fillStyle = '#ffffff';
    ctx.textAlign = 'center';
    ctx.textBaseline = 'middle';
    
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
  
  // Add explanation text
  ctx.fillStyle = '#000000';
  ctx.font = '16px Arial';
  ctx.textAlign = 'center';
  ctx.fillText('Note: In traditional Xiangqi, pieces are placed on the intersections of the lines, not within squares', width/2, 80 + boardHeight + 40);
  ctx.fillText('This demo shows the correct placement with some example moves already made', width/2, 80 + boardHeight + 70);
}

// Draw the demo
drawBoard();
drawPieces();

// Save the demo image
const buffer = canvas.toBuffer('image/png');
fs.writeFileSync('/home/ubuntu/xiangqi_wechat/miniprogram/images/intersection_demo.png', buffer);

console.log('Demo image created successfully!');
