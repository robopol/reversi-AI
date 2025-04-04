// Constants
const BOARD_SIZE = 8;
const CELL_SIZE = 50;
const BOARD_COLOR = "#008000";
const BLACK_COLOR = "black";
const WHITE_COLOR = "white";
const HINT_COLOR = "rgba(255, 255, 0, 0.5)"; // Yellow with transparency
const LINE_WIDTH = 2;
const BORDER_WIDTH = 4;
const BORDER_COLOR = "white";
const DIRECTIONS = [
    [0, 1], [1, 0], [0, -1], [-1, 0],
    [1, 1], [1, -1], [-1, 1], [-1, -1]
];
const ANIMATION_DURATION = 500; // Animation duration in milliseconds
const ANIMATION_STEPS = 10; // Number of animation steps
const MIN_CELL_SIZE = 30; // Minimum cell size
const MAX_CELL_SIZE = 80; // Maximum cell size
const RESIZE_HANDLE_SIZE = 20; // Resize handle size

// Position weights matrix for evaluation function
const POSITION_WEIGHTS = [
    [100, -20, 10, 5, 5, 10, -20, 100],
    [-20, -50, -2, -2, -2, -2, -50, -20],
    [10, -2, 5, 1, 1, 5, -2, 10],
    [5, -2, 1, 0, 0, 1, -2, 5],
    [5, -2, 1, 0, 0, 1, -2, 5],
    [10, -2, 5, 1, 1, 5, -2, 10],
    [-20, -50, -2, -2, -2, -2, -50, -20],
    [100, -20, 10, 5, 5, 10, -20, 100]
];

let canvas = document.getElementById('gameCanvas');
let ctx = canvas.getContext('2d');
let stoneCountLabel = document.getElementById('stoneCount');
let statusLabel = document.getElementById('status');
let newGameButton = document.getElementById('newGameButton');
let depthInput = document.getElementById('depthInput');
let openingNameLabel = document.getElementById('openingName'); // Element for displaying the opening name

let board;
let currentPlayer;
let currentOpeningName = ""; // Variable for the current opening name
let animationInProgress = false; // Flag for ongoing animation
let animatingDiscs = []; // Array of discs currently animating
let isResizing = false; // Flag indicating if resizing is in progress
let currentCellSize = CELL_SIZE; // Current cell size

// Set canvas size once during initialization
let margin = 50;
let boardSizeWithMargin = BOARD_SIZE * currentCellSize + margin * 2;
canvas.width = boardSizeWithMargin;
canvas.height = boardSizeWithMargin;

// Global variable for search depth
let searchDepth = parseInt(depthInput.value);

// Update search depth when the input value changes
depthInput.addEventListener('change', function() {
    let depthValue = parseInt(this.value);
    if (isNaN(depthValue) || depthValue < 1) {
        this.value = 1;
        searchDepth = 1;
    } else if (depthValue > 10) {
        this.value = 10;
        searchDepth = 10;
    } else {
        searchDepth = depthValue;
    }
});

// Helper function to convert notation to indices
function notationToIndices(notation) {
    let colLetter = notation.charAt(0).toUpperCase();
    let rowNumber = parseInt(notation.substring(1));
    let col = colLetter.charCodeAt(0) - 'A'.charCodeAt(0);
    let row = rowNumber - 1;
    return [row, col];
}

// Helper function to convert indices to notation
function indicesToNotation(row, col) {
    let colLetter = String.fromCharCode('A'.charCodeAt(0) + col);
    let rowNumber = row + 1;
    return colLetter + rowNumber.toString();
}

// Helper function to rotate notation
function rotateNotation(notation, angle) {
    let [row, col] = notationToIndices(notation);
    let [newRow, newCol] = rotateCoordinates(row, col, angle);
    return indicesToNotation(newRow, newCol);
}

// Rotate coordinates by angle (0, 90, 180, 270 degrees)
function rotateCoordinates(row, col, angle) {
    switch (angle) {
        case 90:
            return [col, BOARD_SIZE - 1 - row];
        case 180:
            return [BOARD_SIZE - 1 - row, BOARD_SIZE - 1 - col];
        case 270:
            return [BOARD_SIZE - 1 - col, row];
        default:
            return [row, col];
    }
}

// Build the opening book from the provided openings
const openingBook = buildOpeningBook([
    // Each opening is an object with a name and moves
    {
        name: 'Perpendicular Opening',
        moves: [
            { player: 1, notation: 'E6' },
            { player: -1, notation: 'F4' }
        ]
    },
    {
        name: 'Tiger',
        moves: [
            { player: 1, notation: 'E6' },
            { player: -1, notation: 'F4' },
            { player: 1, notation: 'C3' },
            { player: -1, notation: 'C4' },
            { player: 1, notation: 'D3' }
        ]
    },
    {
        name: 'Aubrey, Tanaka',
        moves: [
            { player: 1, notation: 'E6' },
            { player: -1, notation: 'F4' },
            { player: 1, notation: 'C3' },
            { player: -1, notation: 'C4' },
            { player: 1, notation: 'D3' },
            { player: -1, notation: 'C2' }
        ]
    },
    {
        name: 'Brightwell',
        moves: [
            { player: 1, notation: 'E6' },
            { player: -1, notation: 'F4' },
            { player: 1, notation: 'C3' },
            { player: -1, notation: 'C4' },
            { player: 1, notation: 'D3' },
            { player: -1, notation: 'D6' },
            { player: 1, notation: 'C5' }
        ]
    },
    {
        name: 'Rose-BILL',
        moves: [
            { player: 1, notation: 'E6' },
            { player: -1, notation: 'F4' },
            { player: 1, notation: 'C3' },
            { player: -1, notation: 'C4' },
            { player: 1, notation: 'D3' },
            { player: -1, notation: 'D6' },
            { player: 1, notation: 'E3' },
            { player: -1, notation: 'C2' },
            { player: 1, notation: 'B3' }
        ]
    },
    {
        name: 'Tamenori**',
        moves: [
            { player: 1, notation: 'E6' },
            { player: -1, notation: 'F4' },
            { player: 1, notation: 'C3' },
            { player: -1, notation: 'C4' },
            { player: 1, notation: 'D3' },
            { player: -1, notation: 'D6' },
            { player: 1, notation: 'E3' },
            { player: -1, notation: 'C2' },
            { player: 1, notation: 'B3' },
            { player: -1, notation: 'F5' }
        ]
    },
    {
        name: 'Ishii**',
        moves: [
            { player: 1, notation: 'E6' },
            { player: -1, notation: 'F4' },
            { player: 1, notation: 'C3' },
            { player: -1, notation: 'C4' },
            { player: 1, notation: 'D3' },
            { player: -1, notation: 'D6' },
            { player: 1, notation: 'E3' },
            { player: -1, notation: 'D2' },
            { player: 1, notation: 'E2' },
            { player: -1, notation: 'F3' },
            { player: 1, notation: 'C6' },
            { player: -1, notation: 'F5' },
            { player: 1, notation: 'C5' }
        ]
    },
    {
        name: 'Mainline Tiger**',
        moves: [
            { player: 1, notation: 'E6' },
            { player: -1, notation: 'F4' },
            { player: 1, notation: 'C3' },
            { player: -1, notation: 'C4' },
            { player: 1, notation: 'D3' },
            { player: -1, notation: 'D6' },
            { player: 1, notation: 'E3' },
            { player: -1, notation: 'D2' },
            { player: 1, notation: 'E2' },
            { player: -1, notation: 'F3' },
            { player: 1, notation: 'C6' },
            { player: -1, notation: 'F5' },
            { player: 1, notation: 'C5' },
            { player: -1, notation: 'F7' },
            { player: 1, notation: 'F6' },
            { player: -1, notation: 'E7' },
            { player: 1, notation: 'G4' },
            { player: -1, notation: 'C7' }
        ]
    },
    {
        name: 'Leader\'s Tiger',
        moves: [
            { player: 1, notation: 'E6' },
            { player: -1, notation: 'F4' },
            { player: 1, notation: 'C3' },
            { player: -1, notation: 'C4' },
            { player: 1, notation: 'D3' },
            { player: -1, notation: 'D6' },
            { player: 1, notation: 'F5' }
        ]
    },
    {
        name: 'Stephenson',
        moves: [
            { player: 1, notation: 'E6' },
            { player: -1, notation: 'F4' },
            { player: 1, notation: 'C3' },
            { player: -1, notation: 'C4' },
            { player: 1, notation: 'D3' },
            { player: -1, notation: 'D6' },
            { player: 1, notation: 'F6' }
        ]
    },
    // Continue adding the rest of the openings in the same format...
]);

function buildOpeningBook(openingsList) {
    let book = [];
    for (let opening of openingsList) {
        let rotations = [0, 90, 180, 270];
        for (let angle of rotations) {
            let rotatedOpening = {
                name: opening.name,
                angle: angle,
                moves: opening.moves.map(move => {
                    let rotatedNotation = rotateNotation(move.notation, angle);
                    return { player: move.player, notation: rotatedNotation };
                }),
                boards: [] // To store the board states after each move
            };

            // Generate board states for this rotated opening
            let tempBoard = generateInitialBoard();
            for (let move of rotatedOpening.moves) {
                let [row, col] = notationToIndices(move.notation);
                let moveResult = makeMove(tempBoard, move.player, [row, col]);
                tempBoard = moveResult.board;
                // Deep copy the board and store it
                rotatedOpening.boards.push(JSON.parse(JSON.stringify(tempBoard)));
            }

            book.push(rotatedOpening);
        }
    }
    return book;
}

// Helper function to rotate the entire board
function rotateBoard(board, angle) {
    let newBoard = [];
    for (let row = 0; row < BOARD_SIZE; row++) {
        newBoard.push(new Array(BOARD_SIZE).fill(0));
    }

    for (let row = 0; row < BOARD_SIZE; row++) {
        for (let col = 0; col < BOARD_SIZE; col++) {
            let [newRow, newCol] = rotateCoordinates(row, col, angle);
            newBoard[newRow][newCol] = board[row][col];
        }
    }

    return newBoard;
}

// Helper function to compare two boards
function boardsAreEqual(board1, board2) {
    for (let row = 0; row < BOARD_SIZE; row++) {
        for (let col = 0; col < BOARD_SIZE; col++) {
            if (board1[row][col] !== board2[row][col]) {
                return false;
            }
        }
    }
    return true;
}

function generateInitialBoard() {
    let board = [];
    for (let i = 0; i < BOARD_SIZE; i++) {
        board.push(new Array(BOARD_SIZE).fill(0));
    }
    board[3][3] = -1;
    board[3][4] = 1;
    board[4][3] = 1;
    board[4][4] = -1;
    return board;
}

function isOnBoard(row, col) {
    return row >= 0 && row < BOARD_SIZE && col >= 0 && col < BOARD_SIZE;
}

function isValidMove(board, player, row, col) {
    if (!isOnBoard(row, col) || board[row][col] !== 0) {
        return false;
    }
    let opponent = -player;
    for (let dir of DIRECTIONS) {
        let r = row + dir[0];
        let c = col + dir[1];
        let hasOpponentDisk = false;
        while (isOnBoard(r, c) && board[r][c] === opponent) {
            hasOpponentDisk = true;
            r += dir[0];
            c += dir[1];
        }
        if (isOnBoard(r, c) && board[r][c] === player && hasOpponentDisk) {
            return true;
        }
    }
    return false;
}

function getPossibleMoves(board, player) {
    let possibleMoves = [];
    for (let row = 0; row < BOARD_SIZE; row++) {
        for (let col = 0; col < BOARD_SIZE; col++) {
            if (isValidMove(board, player, row, col)) {
                possibleMoves.push([row, col]);
            }
        }
    }
    return possibleMoves;
}

function makeMove(board, player, move) {
    board = board.map(row => row.slice()); // Deep copy
    let [row, col] = move;
    board[row][col] = player;
    let opponent = -player;
    let flippedDiscs = []; // List of flipped discs
    
    for (let dir of DIRECTIONS) {
        let disksToFlip = [];
        let r = row + dir[0];
        let c = col + dir[1];
        while (isOnBoard(r, c) && board[r][c] === opponent) {
            disksToFlip.push([r, c]);
            r += dir[0];
            c += dir[1];
        }
        if (isOnBoard(r, c) && board[r][c] === player) {
            for (let [flipR, flipC] of disksToFlip) {
                board[flipR][flipC] = player;
                flippedDiscs.push([flipR, flipC]);
            }
        }
    }
    
    return { board, flippedDiscs };
}

// Enhanced evaluation function
function evaluateBoard(board, player) {
    let score = 0;
    let opponent = -player;
    let emptySquares = countEmptySquares(board);

    // Change strategy depending on the game phase
    if (emptySquares <= 10) {
        // Endgame phase - use special function
        return evaluateBoardEndgame(board, player);
    } else {
        // Mid/early game phase - priority is position and mobility
        
        // Positional weights
        for (let row = 0; row < BOARD_SIZE; row++) {
            for (let col = 0; col < BOARD_SIZE; col++) {
                if (board[row][col] === player) {
                    score += POSITION_WEIGHTS[row][col];
                } else if (board[row][col] === opponent) {
                    score -= POSITION_WEIGHTS[row][col];
                }
            }
        }

        // Mobility (number of possible moves) - improved evaluation
        let playerMoves = getPossibleMoves(board, player).length;
        let opponentMoves = getPossibleMoves(board, opponent).length;
        
        // Total mobility - how many moves the player has
        if (playerMoves + opponentMoves > 0) {
            score += 10 * (playerMoves - opponentMoves) / (playerMoves + opponentMoves);
        }

        // Potential mobility - how many empty squares are adjacent to opponent's discs
        let playerPotentialMobility = countPotentialMobility(board, player);
        let opponentPotentialMobility = countPotentialMobility(board, opponent);
        
        if (playerPotentialMobility + opponentPotentialMobility > 0) {
            score += 5 * (playerPotentialMobility - opponentPotentialMobility) / 
                    (playerPotentialMobility + opponentPotentialMobility);
        }

        // Stability (occupied corners)
        let corners = [
            [0, 0],
            [0, BOARD_SIZE - 1],
            [BOARD_SIZE - 1, 0],
            [BOARD_SIZE - 1, BOARD_SIZE - 1]
        ];
        let playerCorners = 0;
        let opponentCorners = 0;
        for (let [row, col] of corners) {
            if (board[row][col] === player) playerCorners++;
            else if (board[row][col] === opponent) opponentCorners++;
        }
        score += 25 * (playerCorners - opponentCorners);

        return score;
    }
}

function countStones(board) {
    let countBlack = 0;
    let countWhite = 0;
    for (let row of board) {
        for (let cell of row) {
            if (cell === 1) countBlack++;
            if (cell === -1) countWhite++;
        }
    }
    return [countBlack, countWhite];
}

function drawBoard(board, animating = false) {
    ctx.clearRect(0, 0, canvas.width, canvas.height);

    // Draw board background
    ctx.fillStyle = BOARD_COLOR;
    ctx.fillRect(margin, margin, BOARD_SIZE * currentCellSize, BOARD_SIZE * currentCellSize);
    
    // Draw internal grid lines
    ctx.strokeStyle = "darkgreen";
    ctx.lineWidth = LINE_WIDTH;

    // Vertical lines
    for (let i = 0; i <= BOARD_SIZE; i++) {
        let x = margin + i * currentCellSize;
        ctx.beginPath();
        ctx.moveTo(x, margin);
        ctx.lineTo(x, margin + BOARD_SIZE * currentCellSize);
        ctx.stroke();
    }

    // Horizontal lines
    for (let i = 0; i <= BOARD_SIZE; i++) {
        let y = margin + i * currentCellSize;
        ctx.beginPath();
        ctx.moveTo(margin, y);
        ctx.lineTo(margin + BOARD_SIZE * currentCellSize, y);
        ctx.stroke();
    }

    // Determine the last move
    let lastRow = -1;
    let lastCol = -1;
    if (moveHistory.length > 0) {
        let lastMove = moveHistory[moveHistory.length - 1];
        [lastRow, lastCol] = notationToIndices(lastMove.notation);
    }

    // Draw stones
    for (let row = 0; row < BOARD_SIZE; row++) {
        for (let col = 0; col < BOARD_SIZE; col++) {
            let x = margin + col * currentCellSize;
            let y = margin + row * currentCellSize;

            // Discs
            if (board[row][col] !== 0) {
                // Check if this disc is animating
                let isAnimating = false;
                let animationProgress = 0;
                let targetColor = board[row][col];
                
                if (animating) {
                    for (let disc of animatingDiscs) {
                        if (disc.row === row && disc.col === col) {
                            isAnimating = true;
                            animationProgress = disc.progress;
                            break;
                        }
                    }
                }
                
                if (isAnimating) {
                    // Draw animated disc
                    drawAnimatedDisc(x, y, targetColor, animationProgress);
                } else {
                    // Standard disc drawing
                    ctx.beginPath();
                        ctx.arc(x + currentCellSize / 2, y + currentCellSize / 2, currentCellSize / 2 - 5, 0, 2 * Math.PI);
                    ctx.fillStyle = board[row][col] === 1 ? BLACK_COLOR : WHITE_COLOR;
                    ctx.fill();

                    // Highlight the last move with an orange border
                    if (row === lastRow && col === lastCol) {
                        ctx.beginPath();
                            ctx.arc(x + currentCellSize / 2, y + currentCellSize / 2, currentCellSize / 2 - 5, 0, 2 * Math.PI);
                        ctx.strokeStyle = "orange";
                        ctx.lineWidth = 3;
                        ctx.stroke();
                    }
                }
            }
        }
    }

    // Draw possible moves for the player
    if (currentPlayer === 1 && !animationInProgress) { // Show hints only for human player and not during animation
        let possibleMoves = getPossibleMoves(board, currentPlayer);
        ctx.fillStyle = HINT_COLOR;
        for (let [row, col] of possibleMoves) {
            let x = margin + col * currentCellSize;
            let y = margin + row * currentCellSize;
            ctx.beginPath();
            ctx.arc(x + currentCellSize / 2, y + currentCellSize / 2, 5, 0, 2 * Math.PI);
            ctx.fill();
        }
    }

    // Draw row numbers and column letters
    ctx.fillStyle = "white";
    ctx.font = "16px Tahoma";
    for (let i = 0; i < BOARD_SIZE; i++) {
        // Row numbers
        ctx.fillText((i + 1).toString(), margin - 20, margin + i * currentCellSize + currentCellSize / 2 + 5);
        // Column letters
        ctx.fillText(String.fromCharCode(65 + i), margin + i * currentCellSize + currentCellSize / 2 - 5, margin - 20);
    }

    // Draw the white border last to ensure it appears on top
    ctx.strokeStyle = BORDER_COLOR;
    ctx.lineWidth = BORDER_WIDTH;
    ctx.strokeRect(margin, margin, BOARD_SIZE * currentCellSize, BOARD_SIZE * currentCellSize);
    
    // Draw resize handle
    drawResizeHandle();
}

// Function to draw an animated disc
function drawAnimatedDisc(x, y, targetColor, progress) {
    const centerX = x + currentCellSize / 2;
    const centerY = y + currentCellSize / 2;
    const radius = currentCellSize / 2 - 5;
    
    ctx.save();
    ctx.translate(centerX, centerY);
    
    // Calculate scale factor for "flip" effect
    const scaleX = Math.cos(progress * Math.PI);
    ctx.scale(scaleX, 1);
    
    // Determine color based on animation phase and target color
    let color;
    if (progress < 0.5) {
        // First half of animation - show original color
        color = targetColor === 1 ? WHITE_COLOR : BLACK_COLOR;
    } else {
        // Second half of animation - show target color
        color = targetColor === 1 ? BLACK_COLOR : WHITE_COLOR;
    }
    
    // Draw disc
    ctx.beginPath();
    ctx.arc(0, 0, radius, 0, 2 * Math.PI);
    ctx.fillStyle = color;
    ctx.fill();
    
    ctx.restore();
}

// Keep track of move history
let moveHistory = []; // Initialize as an array of move objects

// Update move history when a move is made
function recordMove(player, move) {
    let notation = indicesToNotation(move[0], move[1]);
    moveHistory.push({ player, notation });
}

function makeMoveWithHistory(board, player, move) {
    recordMove(player, move);
    
    // Get move results including flipped discs
    let moveResult = makeMove(board, player, move);
    
    // If animation is not in progress, start it
    if (!animationInProgress) {
        animateFlippingDiscs(moveResult.flippedDiscs, player, moveResult.board);
    }
    
    return moveResult.board;
}

function playerMove(event) {
    // If resizing is in progress, ignore click for move
    if (isResizing) return;
    
    if (currentPlayer !== 1 || animationInProgress) return; // Not player's turn or animation in progress

    let rect = canvas.getBoundingClientRect();
    
    // Calculate ratio between logical and visual canvas dimensions
    // canvas.width/height are logical dimensions set in JS
    // rect.width/height are actual visual dimensions on screen
    const scaleX = canvas.width / rect.width;
    const scaleY = canvas.height / rect.height;
    
    // Get coordinates of click relative to visual canvas
    let clickX = event.clientX - rect.left;
    let clickY = event.clientY - rect.top;

    // Convert visual coordinates of click to logical coordinates on canvas
    let logicalX = clickX * scaleX;
    let logicalY = clickY * scaleY;
    
    // Check if we clicked the resize handle (use logical coordinates)
    // Also recalculate handle size to logical pixels if margin was also scaled
    // However, isInResizeHandle probably uses visual coords, correct if needed.
    // For now, keep the original isInResizeHandle logic if it works.
    // CURRENT isInResizeHandle uses visual coordinates, which is correct as the handle is a visual element.
    // Therefore, check the resize handle using the original clickX, clickY.
    if (isInResizeHandle(clickX, clickY)) {
        return;
    }
    
    // Calculate row and column from LOGICAL coordinates
    let col = Math.floor((logicalX - margin) / currentCellSize);
    let row = Math.floor((logicalY - margin) / currentCellSize);
    
    if (isOnBoard(row, col) && isValidMove(board, currentPlayer, row, col)) {
        board = makeMoveWithHistory(board, currentPlayer, [row, col]);
        // Note: Stone count, opening, and player switch updates are performed after animation completes
    } else {
        console.log(`Invalid move calculation: (logicalX=${logicalX.toFixed(2)}, logicalY=${logicalY.toFixed(2)}) -> (row=${row}, col=${col})`);
    }
}

function aiMove() {
    if (animationInProgress) {
        // If animation is in progress, postpone AI move
        setTimeout(aiMove, 100);
        return;
    }
    
    let possibleMoves = getPossibleMoves(board, currentPlayer);
    if (possibleMoves.length > 0) {
        let openingMoveObj = getOpeningMove();
        let move;
        let endgameResult = "";
        
        // Count empty squares on the board
        let emptySquares = countEmptySquares(board);
        
        if (openingMoveObj) {
            // Use the move from the opening book
            move = openingMoveObj.move;
            currentOpeningName = openingMoveObj.openingName;
            console.log(`AI selects move from opening book: ${indicesToNotation(move[0], move[1])}`);
        } else if (emptySquares <= 12) {
            // Towards the end of the game - increase search depth or calculate to the end
            // For <= 12 empty squares, calculate all combinations to the end of the game
            console.log(`Endgame with ${emptySquares} empty squares - calculating to the end`);
            
            // Set sufficient depth to reach the end of the game
            let endgameDepth = emptySquares + 1;
            
            // Get the best move and its evaluation
            let moveResult = minimaxRootWithEvaluation(board, currentPlayer, endgameDepth);
            move = moveResult.move;
            let moveValue = moveResult.value;
            
            // Create a message about the result prediction
            if (moveValue > 9000) {
                endgameResult = "AI predicts victory";
            } else if (moveValue < -9000) {
                endgameResult = "AI predicts loss";
            } else if (Math.abs(moveValue) < 100) {
                endgameResult = "AI predicts draw";
            } else if (moveValue > 0) {
                endgameResult = "AI predicts likely win";
            } else {
                endgameResult = "AI predicts likely loss";
            }
            
            currentOpeningName = ""; // No opening being used
            console.log(`AI selects optimal endgame move: ${indicesToNotation(move[0], move[1])}`);
        } else {
            // Switch to heuristic if no opening move is found
            move = minimaxRoot(board, currentPlayer, searchDepth);
            currentOpeningName = ""; // No opening being used
            console.log(`AI selects move using minimax: ${indicesToNotation(move[0], move[1])}`);
        }
        
        if (move && isValidMove(board, currentPlayer, move[0], move[1])) {
            board = makeMoveWithHistory(board, currentPlayer, move);
            
            // If we have an endgame prediction, display it
            if (endgameResult) {
                statusLabel.textContent = endgameResult;
            }
            
            // Note: Stone count, opening, and player switch updates are performed after animation completes
        } else {
            console.log("AI could not find a valid move.");
            switchPlayer();
        }
    } else {
        // AI has no valid moves
        switchPlayer();
    }
}

// Function to count empty squares on the board
function countEmptySquares(board) {
    let count = 0;
    for (let row = 0; row < BOARD_SIZE; row++) {
        for (let col = 0; col < BOARD_SIZE; col++) {
            if (board[row][col] === 0) {
                count++;
            }
        }
    }
    return count;
}

function getOpeningMove() {
    let bestOpening = null;
    let bestMoveIndex = -1;
    let maxRemainingMoves = -1;

    for (let opening of openingBook) {
        // Rotate the current board to match the rotation of the opening
        let rotatedCurrentBoard = rotateBoard(board, opening.angle);

        // Compare the rotated current board with the opening's boards
        for (let i = 0; i < opening.boards.length; i++) {
            if (boardsAreEqual(rotatedCurrentBoard, opening.boards[i])) {
                // If there is a next move in the opening
                if (i + 1 < opening.moves.length && opening.moves[i + 1].player === currentPlayer) {
                    // Calculate remaining moves in this opening after the current position
                    let remainingMoves = opening.moves.length - (i + 1);
                    
                    // If this opening has more remaining moves than our current best
                    if (remainingMoves > maxRemainingMoves) {
                        maxRemainingMoves = remainingMoves;
                        bestOpening = opening;
                        bestMoveIndex = i + 1;
                    }
                }
            }
        }
    }

    // If we found an opening with a next move
    if (bestOpening && bestMoveIndex !== -1) {
        let nextMoveNotation = bestOpening.moves[bestMoveIndex].notation;
                    let [row, col] = notationToIndices(nextMoveNotation);

                    // Rotate the move back to match the original board orientation
        let [originalRow, originalCol] = rotateCoordinates(row, col, (360 - bestOpening.angle) % 360);

        let openingName = bestOpening.name;
                    return { move: [originalRow, originalCol], openingName };
                }
    
    return null;
}

function getCurrentOpeningName() {
    let bestOpening = null;
    let bestMoveIndex = -1;
    let maxRemainingMoves = -1;

    for (let opening of openingBook) {
        // Rotate the current board to match the rotation of the opening
        let rotatedCurrentBoard = rotateBoard(board, opening.angle);

        // Compare the rotated current board with the opening's boards
        for (let i = 0; i < opening.boards.length; i++) {
            if (boardsAreEqual(rotatedCurrentBoard, opening.boards[i])) {
                // Calculate remaining moves in this opening
                let remainingMoves = opening.moves.length - (i + 1);
                
                // If this opening has more remaining moves than our current best
                if (remainingMoves > maxRemainingMoves) {
                    maxRemainingMoves = remainingMoves;
                    bestOpening = opening;
                }
            }
        }
    }

    if (bestOpening) {
        return bestOpening.name;
    }
    return null;
}

function updateOpeningName() {
    currentOpeningName = getCurrentOpeningName();
    if (currentOpeningName) {
        openingNameLabel.textContent = `Opening: ${currentOpeningName}`;
    } else {
        openingNameLabel.textContent = 'Opening: None';
    }
}

function switchPlayer() {
    currentPlayer = -currentPlayer;
    if (getPossibleMoves(board, currentPlayer).length === 0) {
        currentPlayer = -currentPlayer; // Switch back
        if (getPossibleMoves(board, currentPlayer).length === 0) {
            gameOver();
            return;
        } else {
            statusLabel.textContent = currentPlayer === 1 ? "Your turn (AI has no moves)" : "AI's turn (You have no moves)";
        }
    } else {
        statusLabel.textContent = currentPlayer === 1 ? "Your turn" : "AI's turn";
    }
    drawBoard(board);

    // Update opening name display
    updateOpeningName();

    // If it's AI's turn, call aiMove
    if (currentPlayer === -1) {
        setTimeout(aiMove, 500);
    }
}

function updateStoneCount() {
    let [blackCount, whiteCount] = countStones(board);
    stoneCountLabel.textContent = `Black: ${blackCount}    White: ${whiteCount}`;
}

// Get reference to the new radio buttons
let startingPlayerSelection = document.getElementsByName('startingPlayer');

// Updated newGame function
function newGame() {
    board = generateInitialBoard();
    moveHistory = []; // Reset move history
    currentOpeningName = ""; // Reset opening name
    updateStoneCount();
    updateOpeningName();
    drawBoard(board);
    
    // Determine who starts
    let startingPlayer = 'player'; // Default value
    for (let option of startingPlayerSelection) {
        if (option.checked) {
            startingPlayer = option.value;
            break;
        }
    }

    if (startingPlayer === 'player') {
        currentPlayer = 1; // Player starts
        statusLabel.textContent = "Your turn";
    } else {
        currentPlayer = -1; // AI starts
        statusLabel.textContent = "AI's turn";
        setTimeout(aiMove, 500); // Trigger AI move with a slight delay
    }

    // Update opening name if AI makes the first move
    if (currentPlayer === -1) {
        updateOpeningName();
    }
}

function gameOver() {
    let [blackCount, whiteCount] = countStones(board);
    let winner = "";
    if (blackCount > whiteCount) {
        winner = "You win!";
    } else if (whiteCount > blackCount) {
        winner = "AI wins!";
    } else {
        winner = "It's a tie!";
    }
    statusLabel.textContent = winner;
    drawBoard(board); // Ensure final board state is displayed
}

// Helper function to evaluate the endgame position
function evaluateEndGamePosition(board, player) {
    let [blackCount, whiteCount] = countStones(board);
    let scoreDiff = blackCount - whiteCount;
    
    // From the perspective of the player whose turn it is
    if ((scoreDiff > 0 && player === 1) || (scoreDiff < 0 && player === -1)) {
        // Win for the current player
        return 10000 + Math.abs(scoreDiff);
    } else if ((scoreDiff < 0 && player === 1) || (scoreDiff > 0 && player === -1)) {
        // Loss for the current player
        return -10000 - Math.abs(scoreDiff);
    } else {
        // Draw
        return 0;
    }
}

function minimax(board, player, depth, alpha, beta, maximizingPlayer) {
    // When reaching search depth or end of game
    if (depth === 0 || isGameOver(board)) {
        if (isGameOver(board)) {
            // Precise evaluation in the final position is important here
            return evaluateEndGamePosition(board, player);
        }
        
        // When not at the end of the game, but reached maximum search depth
        let emptySquares = countEmptySquares(board);
        if (emptySquares <= 10) {
            // In the endgame phase, use precise evaluation with more emphasis on disc parity
            // and player mobility
            return evaluateBoardEndgame(board, player);
        } else {
            // In the midgame phase, use standard evaluation
            return evaluateBoard(board, player);
        }
    }
    
    let possibleMoves = getPossibleMoves(board, player);
    
    // If no moves are possible, pass turn to the other player
    if (possibleMoves.length === 0) {
        // If the other player also has no moves, the game ends
        if (getPossibleMoves(board, -player).length === 0) {
            // End the search and evaluate the final position
            return evaluateEndGamePosition(board, player);
        }
        
        // Pass turn to the other player
        return minimax(board, -player, depth - 1, alpha, beta, !maximizingPlayer);
    }

    // Sort moves by heuristic for better alpha-beta pruning
    // In the endgame phase and for medium depths, prioritize better sorting
    let emptySquares = countEmptySquares(board);
    if (depth > 3 || emptySquares <= 16) {
        possibleMoves.sort((a, b) => {
            let scoreA = quickMoveEvaluation(board, player, a);
            let scoreB = quickMoveEvaluation(board, player, b);
            return maximizingPlayer ? scoreB - scoreA : scoreA - scoreB;
        });
    }

    if (maximizingPlayer) {
        let maxEval = -Infinity;
        for (let move of possibleMoves) {
            let moveResult = makeMove(board, player, move);
            let newBoard = moveResult.board;
            let eval = minimax(newBoard, -player, depth - 1, alpha, beta, false);
            maxEval = Math.max(maxEval, eval);
            alpha = Math.max(alpha, eval);
            if (beta <= alpha) {
                break; // Beta pruning
            }
        }
        return maxEval;
    } else {
        let minEval = Infinity;
        for (let move of possibleMoves) {
            let moveResult = makeMove(board, player, move);
            let newBoard = moveResult.board;
            let eval = minimax(newBoard, -player, depth - 1, alpha, beta, true);
            minEval = Math.min(minEval, eval);
            beta = Math.min(beta, eval);
            if (beta <= alpha) {
                break; // Alpha pruning
            }
        }
        return minEval;
    }
}

// Special evaluation function for the endgame phase
function evaluateBoardEndgame(board, player) {
    let opponent = -player;
    let score = 0;
    
    // 1. Disc parity - difference in disc count (most important in endgame)
    let [blackCount, whiteCount] = countStones(board);
    let playerCount = player === 1 ? blackCount : whiteCount;
    let opponentCount = player === 1 ? whiteCount : blackCount;
    score += 100 * (playerCount - opponentCount);
    
    // 2. Mobility - key in every game phase
    let playerMoves = getPossibleMoves(board, player).length;
    let opponentMoves = getPossibleMoves(board, opponent).length;
    
    // Mobility is extra important in the endgame phase
    if (playerMoves + opponentMoves > 0) {
        let mobilityScore = 50.0 * (playerMoves - opponentMoves) / (playerMoves + opponentMoves);
        score += mobilityScore;
    }
    
    // 3. Stable discs - discs that can no longer be flipped
    let playerStableDiscs = countStableDiscs(board, player);
    let opponentStableDiscs = countStableDiscs(board, opponent);
    score += 150 * (playerStableDiscs - opponentStableDiscs);
    
    // 4. Corners are still important
    let corners = [
        [0, 0],
        [0, BOARD_SIZE - 1],
        [BOARD_SIZE - 1, 0],
        [BOARD_SIZE - 1, BOARD_SIZE - 1]
    ];
    
    let playerCorners = 0;
    let opponentCorners = 0;
    for (let [row, col] of corners) {
        if (board[row][col] === player) playerCorners++;
        else if (board[row][col] === opponent) opponentCorners++;
    }
    score += 250 * (playerCorners - opponentCorners);
    
    return score;
}

// Helper function to count potential mobility
function countPotentialMobility(board, player) {
    let opponent = -player;
    let count = 0;
    
    for (let row = 0; row < BOARD_SIZE; row++) {
        for (let col = 0; col < BOARD_SIZE; col++) {
            if (board[row][col] === 0) {  // Empty square
                // Check if at least one neighbor is an opponent's disc
                for (let dir of DIRECTIONS) {
                    let r = row + dir[0];
                    let c = col + dir[1];
                    if (isOnBoard(r, c) && board[r][c] === opponent) {
                        count++;
                        break;  // One neighbor is enough for each square
                    }
                }
            }
        }
    }
    
    return count;
}

// Function to count stable discs (cannot be flipped)
function countStableDiscs(board, player) {
    let stableBoard = Array(BOARD_SIZE).fill().map(() => Array(BOARD_SIZE).fill(false));
    let count = 0;
    
    // 1. First, mark occupied corners as stable
    let corners = [
        [0, 0],
        [0, BOARD_SIZE - 1],
        [BOARD_SIZE - 1, 0],
        [BOARD_SIZE - 1, BOARD_SIZE - 1]
    ];
    
    for (let [row, col] of corners) {
        if (board[row][col] === player) {
            stableBoard[row][col] = true;
            count++;
        }
    }
    
    // 2. Iteratively expand stable discs
    let changed = true;
    while (changed) {
        changed = false;
        
        for (let row = 0; row < BOARD_SIZE; row++) {
            for (let col = 0; col < BOARD_SIZE; col++) {
                if (board[row][col] === player && !stableBoard[row][col]) {
                    let stable = true;
                    
                    // A disc is stable if in each of the 4 directions (horizontal, vertical, 2 diagonals)
                    // there is either the edge of the board or another stable disc of the same color
                    
                    // Horizontal
                    if (!isStableInDirection(board, stableBoard, row, col, player, 0, 1) && 
                        !isStableInDirection(board, stableBoard, row, col, player, 0, -1)) {
                        stable = false;
                    }
                    
                    // Vertical
                    if (stable && !isStableInDirection(board, stableBoard, row, col, player, 1, 0) && 
                        !isStableInDirection(board, stableBoard, row, col, player, -1, 0)) {
                        stable = false;
                    }
                    
                    // Diagonal 1
                    if (stable && !isStableInDirection(board, stableBoard, row, col, player, 1, 1) && 
                        !isStableInDirection(board, stableBoard, row, col, player, -1, -1)) {
                        stable = false;
                    }
                    
                    // Diagonal 2
                    if (stable && !isStableInDirection(board, stableBoard, row, col, player, 1, -1) && 
                        !isStableInDirection(board, stableBoard, row, col, player, -1, 1)) {
                        stable = false;
                    }
                    
                    if (stable) {
                        stableBoard[row][col] = true;
                        count++;
                        changed = true;
                    }
                }
            }
        }
    }
    
    return count;
}

// Helper function for countStableDiscs
function isStableInDirection(board, stableBoard, row, col, player, rowDir, colDir) {
    let r = row + rowDir;
    let c = col + colDir;
    
    // If on the edge, it's stable in this direction
    if (!isOnBoard(r, c)) {
        return true;
    }
    
    // If there's a stable disc of the same color, it's stable in this direction
    if (board[r][c] === player && stableBoard[r][c]) {
        return true;
    }
    
    return false;
}

// Quick heuristic for sorting moves for alpha-beta pruning
function quickMoveEvaluation(board, player, move) {
    let [row, col] = move;
    let score = 0;
    
    // Corners are most important
    if ((row === 0 || row === 7) && (col === 0 || col === 7)) {
        return 1000; // Corner value is very high
    }
    
    // Squares next to corners are dangerous
    if ((row <= 1 || row >= 6) && (col <= 1 || col >= 6)) {
        // But not if we already occupy the corner
        let cornerRow = (row <= 1) ? 0 : 7;
        let cornerCol = (col <= 1) ? 0 : 7;
        if (board[cornerRow][cornerCol] !== player) {
            return -500; // Dangerous square
        }
    }
    
    // Edges are good, but not squares next to corners
    if ((row === 0 || row === 7 || col === 0 || col === 7) && 
        !((row <= 1 || row >= 6) && (col <= 1 || col >= 6))) {
        score += 150;
    }
    
    // Number of flipped discs has medium value
    let moveResult = makeMove(JSON.parse(JSON.stringify(board)), player, move);
    let newBoard = moveResult.board;
    let flippedCount = moveResult.flippedDiscs.length;
    score += flippedCount;
    
    // Mobility (number of moves after this move)
    let opponentMovesBefore = getPossibleMoves(board, -player).length;
    let opponentMovesAfter = getPossibleMoves(newBoard, -player).length;
    
    // Penalize moves that increase opponent's mobility
    score -= 2 * (opponentMovesAfter - opponentMovesBefore);
    
    // Add positional value
    score += POSITION_WEIGHTS[row][col];
    
    return score;
}

function isGameOver(board) {
    return getPossibleMoves(board, 1).length === 0 && getPossibleMoves(board, -1).length === 0;
}

// Universal function for minimaxRoot, which can return either just the move or an object {move, value}
function minimaxRoot(board, player, depth, returnEvaluation = false) {
    let possibleMoves = getPossibleMoves(board, player);
    let bestMove = null;
    let bestValue = -Infinity;
    
    // If we have no moves, return null or object {move: null, value: 0}
    if (possibleMoves.length === 0) {
        return returnEvaluation ? { move: null, value: 0 } : null;
    }
    
    // Sort moves by heuristic for better alpha-beta pruning
    possibleMoves.sort((a, b) => {
        let scoreA = quickMoveEvaluation(board, player, a);
        let scoreB = quickMoveEvaluation(board, player, b);
        return scoreB - scoreA; // Sorted from best to worst
    });
    
    // In the endgame phase, display the result prediction
    let isEndgame = countEmptySquares(board) <= 12;
    let moveEvaluations = [];
    
    for (let move of possibleMoves) {
        let moveResult = makeMove(board, player, move);
        let newBoard = moveResult.board;
        let moveValue = minimax(newBoard, -player, depth - 1, -Infinity, Infinity, false);
        
        if (isEndgame) {
            moveEvaluations.push({
                move: move,
                value: moveValue,
                notation: indicesToNotation(move[0], move[1])
            });
        }
        
        if (moveValue > bestValue) {
            bestValue = moveValue;
            bestMove = move;
        }
    }
    
    // For the endgame phase, display the expected result in the console
    if (isEndgame) {
        // Sort evaluations from best to worst
        moveEvaluations.sort((a, b) => b.value - a.value);
        
        console.log("=== Endgame - Predicted Results === ");
        for (let eval of moveEvaluations.slice(0, 3)) { // Display only top 3 moves
            let resultText;
            if (eval.value > 9000) {
                resultText = "Win";
            } else if (eval.value < -9000) {
                resultText = "Loss";
            } else if (eval.value === 0) {
                resultText = "Draw";
            } else if (eval.value > 0) {
                resultText = "Likely Win";
            } else {
                resultText = "Likely Loss";
            }
            console.log(`Move ${eval.notation}: ${resultText} (value: ${eval.value})`);
        }
        console.log("=====================================");
    }
    
    return returnEvaluation ? { move: bestMove, value: bestValue } : bestMove;
}

// Function for backward compatibility
function minimaxRootWithEvaluation(board, player, depth) {
    return minimaxRoot(board, player, depth, true);
}

// Function to animate disc flipping
function animateFlippingDiscs(flippedDiscs, player, newBoard) {
    if (flippedDiscs.length === 0) {
        return; // No discs to animate
    }
    
    // Set the ongoing animation flag
    animationInProgress = true;
    
    // Initialize the list of animated discs
    animatingDiscs = flippedDiscs.map(disc => ({
        row: disc[0],
        col: disc[1],
        progress: 0,
        player: player
    }));
    
    // Animation start time
    const startTime = Date.now();
    
    // Function to update animation
    function updateAnimation() {
        // Calculate animation progress
        const elapsedTime = Date.now() - startTime;
        const overallProgress = Math.min(elapsedTime / ANIMATION_DURATION, 1);
        
        // Update progress for each disc
        for (let disc of animatingDiscs) {
            disc.progress = overallProgress;
        }
        
        // Draw board with animation
        drawBoard(newBoard, true);
        
        // Continue animation if not completed
        if (overallProgress < 1) {
            requestAnimationFrame(updateAnimation);
        } else {
            // End animation
            animatingDiscs = [];
            animationInProgress = false;
            drawBoard(newBoard);
            
            // When animation is complete, update stone count
            updateStoneCount();
            
            // If it's an AI endgame message, show the result message for a longer time
            let isAIEndgameMessage = (currentPlayer === -1 && statusLabel.textContent.startsWith("AI predicts")); // Check for English prefix
            
            // Transfer updates to the main game flow
            updateOpeningName();
            
            // If it's an AI endgame message, postpone its change
            if (isAIEndgameMessage) {
                setTimeout(() => {
                    switchPlayer();
                }, 2000); // Wait 2 seconds for the player to see the prediction
            } else {
                switchPlayer();
            }
        }
    }
    
    // Start animation
    requestAnimationFrame(updateAnimation);
}

// Function to resize the game board
function resizeCanvas(newCellSize) {
    if (newCellSize < MIN_CELL_SIZE || newCellSize > MAX_CELL_SIZE) {
        return; // Ignore changes outside allowed limits
    }
    
    currentCellSize = newCellSize;
    boardSizeWithMargin = BOARD_SIZE * currentCellSize + margin * 2;
    canvas.width = boardSizeWithMargin;
    canvas.height = boardSizeWithMargin;
    
    // Redraw the game board with new dimensions
    drawBoard(board);
}

// Check if the mouse is in the resize handle area
// This function should work with VISUAL coordinates, as the handle is visual
function isInResizeHandle(x, y) {
    // Use rect.width and rect.height for visual dimensions
    let rect = canvas.getBoundingClientRect(); 
    return (x >= rect.width - RESIZE_HANDLE_SIZE && 
            y >= rect.height - RESIZE_HANDLE_SIZE);
}

// Handle resize start
function handleResizeStart(event) {
    let rect = canvas.getBoundingClientRect();
    let x = event.clientX - rect.left;
    let y = event.clientY - rect.top;
    
    if (isInResizeHandle(x, y)) {
        isResizing = true;
        event.preventDefault(); // Prevent default mouse behavior
    }
}

// Handle mouse move during resize
function handleResizeMove(event) {
    if (!isResizing) return;
    
    let rect = canvas.getBoundingClientRect();
    let x = event.clientX - rect.left;
    let y = event.clientY - rect.top;
    
    // Calculate new cell size based on mouse position
    let newSize = Math.round((x - margin * 2) / BOARD_SIZE);
    resizeCanvas(newSize);
    
    event.preventDefault();
}

// Handle resize end
function handleResizeEnd(event) {
    isResizing = false;
}

// Draw resize indicator in the bottom right corner
function drawResizeHandle() {
    ctx.fillStyle = "rgba(200, 200, 200, 0.5)";
    ctx.beginPath();
    ctx.moveTo(canvas.width - RESIZE_HANDLE_SIZE, canvas.height);
    ctx.lineTo(canvas.width, canvas.height - RESIZE_HANDLE_SIZE);
    ctx.lineTo(canvas.width, canvas.height);
    ctx.closePath();
    ctx.fill();
    
    // Arrows indicating resize
    ctx.strokeStyle = "black";
    ctx.lineWidth = 2;
    
    // Diagonal arrow
    ctx.beginPath();
    ctx.moveTo(canvas.width - RESIZE_HANDLE_SIZE + 5, canvas.height - 5);
    ctx.lineTo(canvas.width - 5, canvas.height - RESIZE_HANDLE_SIZE + 5);
    ctx.stroke();
    
    // Arrow - head 1
    ctx.beginPath();
    ctx.moveTo(canvas.width - 5, canvas.height - RESIZE_HANDLE_SIZE + 5);
    ctx.lineTo(canvas.width - 5, canvas.height - RESIZE_HANDLE_SIZE + 10);
    ctx.lineTo(canvas.width - 10, canvas.height - RESIZE_HANDLE_SIZE + 5);
    ctx.closePath();
    ctx.fill();
    
    // Arrow - head 2
    ctx.beginPath();
    ctx.moveTo(canvas.width - RESIZE_HANDLE_SIZE + 5, canvas.height - 5);
    ctx.lineTo(canvas.width - RESIZE_HANDLE_SIZE + 10, canvas.height - 5);
    ctx.lineTo(canvas.width - RESIZE_HANDLE_SIZE + 5, canvas.height - 10);
    ctx.closePath();
    ctx.fill();
}

// Initialize event listeners for resize
canvas.addEventListener('mousedown', handleResizeStart);
canvas.addEventListener('mousemove', handleResizeMove);
canvas.addEventListener('mouseup', handleResizeEnd);
canvas.addEventListener('mouseleave', handleResizeEnd);

canvas.addEventListener('click', playerMove);
newGameButton.addEventListener('click', newGame);
newGame();
