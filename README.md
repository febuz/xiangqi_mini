# Xiangqi (Chinese Chess) WeChat Mini-Game Documentation

## Overview
This document provides comprehensive information about the Xiangqi (Chinese Chess) WeChat Mini-Game implementation. The mini-game offers a complete Chinese Chess experience with both single-player (against AI) and multiplayer modes.

## Features

### Core Game Features
- Complete Xiangqi (Chinese Chess) gameplay
- Valid move highlighting
- Check and checkmate detection
- Responsive design for various mobile devices

### AI Opponent
- Three difficulty levels: Easy, Medium, and Hard
- Strategic move evaluation based on difficulty
- Position evaluation and tactical considerations at higher difficulties

### Multiplayer
- Create and join multiplayer games
- Real-time game updates using cloud database subscriptions
- Lobby system to find active games

### User Features
- WeChat user authentication integration
- Game history and player statistics
- Social features (game sharing, friend invites)
- Offline support and error handling

## Project Structure

### Frontend (miniprogram)
- **app.js/app.json**: Main application configuration and initialization
- **pages/index**: Main game board and gameplay
- **pages/lobby**: Multiplayer lobby for finding and joining games
- **utils/**: Utility modules for various features
  - **realTimeUpdates.js**: Real-time game updates using cloud database subscriptions
  - **userAuth.js**: WeChat user authentication integration
  - **socialFeatures.js**: Game sharing and friend invites
  - **gameHistory.js**: Game history and player statistics
  - **errorHandling.js**: Error handling and offline support
  - **responsiveDesign.js**: Responsive design optimization

### Backend (cloudfunctions)
- **getValidMoves**: Returns valid moves for a selected piece
- **makeMove**: Processes a move and updates the game state
- **newGame**: Creates a new single-player game (with optional AI)
- **createMultiplayerGame**: Creates a new multiplayer game
- **joinMultiplayerGame**: Allows a player to join an existing multiplayer game
- **getActiveGames**: Returns a list of active multiplayer games

## Setup and Deployment

### Prerequisites
- WeChat Developer Tools
- WeChat Developer Account
- Cloud Development enabled

### Deployment Steps
1. Import the project into WeChat Developer Tools
2. Create a new cloud environment (if not already created)
3. Deploy all cloud functions
4. Upload and deploy the miniprogram

## Usage Guide

### Starting a New Game
1. Open the mini-game
2. Tap "New Game" to start a single-player game
3. Tap "AI Game" to play against the AI with selectable difficulty
4. Tap "Multiplayer" to access the lobby

### Playing Against AI
1. Select "AI Game" from the main menu
2. Choose difficulty level (Easy, Medium, Hard)
3. Select your color (Red plays first, Black plays second)
4. Make moves by selecting a piece and then selecting a valid destination

### Multiplayer Mode
1. Select "Multiplayer" from the main menu
2. Create a new game or join an existing one
3. Wait for an opponent to join (if creating a game)
4. Play begins when both players are connected

### Viewing Game History and Stats
1. Access the profile section
2. View game history showing past games and results
3. Check statistics including win rate and total games played

## Technical Implementation Details

### Real-time Updates
The game uses WeChat cloud database subscriptions to provide real-time updates for multiplayer games, ensuring both players see the current game state without manual refreshing.

### AI Implementation
The AI evaluates moves based on:
- Piece capture value
- Check and checkmate opportunities
- Piece positioning and safety
- Strategic considerations (varies by difficulty level)

### Offline Support
The game includes offline support that:
- Detects network status changes
- Saves moves locally when offline
- Syncs pending actions when connection is restored
- Provides appropriate user feedback

### Responsive Design
The UI adapts to different device sizes and orientations:
- Adjusts board size based on screen dimensions
- Optimizes layout for both portrait and landscape modes
- Scales font sizes and UI elements appropriately

## Future Enhancements
- Tournament mode
- Timed matches
- Puzzle challenges
- Opening book for AI
- Rating system for players

## Troubleshooting
- If the game doesn't load, check your network connection
- If multiplayer games aren't updating, try refreshing the page
- For any persistent issues, restart the mini-game

---

© 2025 Xiangqi Mini-Game. All rights reserved.
