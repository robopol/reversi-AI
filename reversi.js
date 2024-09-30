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

// Set canvas size once during initialization
let margin = 50;
let boardSizeWithMargin = BOARD_SIZE * CELL_SIZE + margin * 2;
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
                tempBoard = makeMove(tempBoard, move.player, [row, col]);
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
            }
        }
    }
    return board;
}

function evaluateBoard(board, player) {
    let score = 0;
    for (let row = 0; row < BOARD_SIZE; row++) {
        for (let col = 0; col < BOARD_SIZE; col++) {
            if (board[row][col] === player) {
                score += POSITION_WEIGHTS[row][col];
            } else if (board[row][col] === -player) {
                score -= POSITION_WEIGHTS[row][col];
            }
        }
    }
    return score;
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

function drawBoard(board) {
    ctx.clearRect(0, 0, canvas.width, canvas.height);

    // Draw board background
    ctx.fillStyle = BOARD_COLOR;
    ctx.fillRect(margin, margin, BOARD_SIZE * CELL_SIZE, BOARD_SIZE * CELL_SIZE);
    
    // Draw internal grid lines
    ctx.strokeStyle = "darkgreen";
    ctx.lineWidth = LINE_WIDTH;

    // Vertical lines
    for (let i = 0; i <= BOARD_SIZE; i++) {
        let x = margin + i * CELL_SIZE;
        ctx.beginPath();
        ctx.moveTo(x, margin);
        ctx.lineTo(x, margin + BOARD_SIZE * CELL_SIZE);
        ctx.stroke();
    }

    // Horizontal lines
    for (let i = 0; i <= BOARD_SIZE; i++) {
        let y = margin + i * CELL_SIZE;
        ctx.beginPath();
        ctx.moveTo(margin, y);
        ctx.lineTo(margin + BOARD_SIZE * CELL_SIZE, y);
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
            let x = margin + col * CELL_SIZE;
            let y = margin + row * CELL_SIZE;

            // Stones
            if (board[row][col] !== 0) {
                ctx.beginPath();
                ctx.arc(x + CELL_SIZE / 2, y + CELL_SIZE / 2, CELL_SIZE / 2 - 5, 0, 2 * Math.PI);
                ctx.fillStyle = board[row][col] === 1 ? BLACK_COLOR : WHITE_COLOR;
                ctx.fill();

                // Highlight the last move with an orange border
                if (row === lastRow && col === lastCol) {
                    ctx.beginPath();
                    ctx.arc(x + CELL_SIZE / 2, y + CELL_SIZE / 2, CELL_SIZE / 2 - 5, 0, 2 * Math.PI);
                    ctx.strokeStyle = "orange";
                    ctx.lineWidth = 3;
                    ctx.stroke();
                }
            }
        }
    }

    // Draw possible moves for the player
    if (currentPlayer === 1) { // Show hints only for human player
        let possibleMoves = getPossibleMoves(board, currentPlayer);
        ctx.fillStyle = HINT_COLOR;
        for (let [row, col] of possibleMoves) {
            let x = margin + col * CELL_SIZE;
            let y = margin + row * CELL_SIZE;
            ctx.beginPath();
            ctx.arc(x + CELL_SIZE / 2, y + CELL_SIZE / 2, 5, 0, 2 * Math.PI);
            ctx.fill();
        }
    }

    // Draw row numbers and column letters
    ctx.fillStyle = "white";
    ctx.font = "16px Tahoma";
    for (let i = 0; i < BOARD_SIZE; i++) {
        // Row numbers
        ctx.fillText((i + 1).toString(), margin - 20, margin + i * CELL_SIZE + CELL_SIZE / 2 + 5);
        // Column letters
        ctx.fillText(String.fromCharCode(65 + i), margin + i * CELL_SIZE + CELL_SIZE / 2 - 5, margin - 20);
    }

    // Draw the white border last to ensure it appears on top
    ctx.strokeStyle = BORDER_COLOR;
    ctx.lineWidth = BORDER_WIDTH;
    ctx.strokeRect(margin, margin, BOARD_SIZE * CELL_SIZE, BOARD_SIZE * CELL_SIZE);
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
    return makeMove(board, player, move);
}

function playerMove(event) {
    if (currentPlayer !== 1) return; // Not player's turn

    let rect = canvas.getBoundingClientRect();
    let x = event.clientX - rect.left;
    let y = event.clientY - rect.top;
    let col = Math.floor((x - margin) / CELL_SIZE);
    let row = Math.floor((y - margin) / CELL_SIZE);
    if (isOnBoard(row, col) && isValidMove(board, currentPlayer, row, col)) {
        board = makeMoveWithHistory(board, currentPlayer, [row, col]);
        updateStoneCount();
        updateOpeningName(); // Update opening name after player's move
        switchPlayer();
    } else {
        console.log(`Invalid move: (row=${row}, col=${col})`);
    }
}

function aiMove() {
    let possibleMoves = getPossibleMoves(board, currentPlayer);
    if (possibleMoves.length > 0) {
        let openingMoveObj = getOpeningMove();
        let move;
        if (openingMoveObj) {
            // Use the move from the opening book
            move = openingMoveObj.move;
            currentOpeningName = openingMoveObj.openingName;
            console.log(`AI selects move from opening book: ${indicesToNotation(move[0], move[1])}`);
        } else {
            // Switch to heuristic if no opening move is found
            move = minimaxRoot(board, currentPlayer, searchDepth);
            currentOpeningName = ""; // No opening being used
            console.log(`AI selects move using minimax: ${indicesToNotation(move[0], move[1])}`);
        }
        if (move && isValidMove(board, currentPlayer, move[0], move[1])) {
            board = makeMoveWithHistory(board, currentPlayer, move);
            updateStoneCount();
            drawBoard(board); // Ensure the board is redrawn after AI move
            updateOpeningName(); // Update opening name after AI's move
            switchPlayer();
        } else {
            console.log("AI could not find a valid move.");
            switchPlayer();
        }
    } else {
        // AI has no valid moves
        switchPlayer();
    }
}

function getOpeningMove() {
    for (let opening of openingBook) {
        // Rotate the current board to match the rotation of the opening
        let rotatedCurrentBoard = rotateBoard(board, opening.angle);

        // Compare the rotated current board with the opening's boards
        for (let i = 0; i < opening.boards.length; i++) {
            if (boardsAreEqual(rotatedCurrentBoard, opening.boards[i])) {
                // If there is a next move in the opening
                if (i + 1 < opening.moves.length && opening.moves[i + 1].player === currentPlayer) {
                    let nextMoveNotation = opening.moves[i + 1].notation;
                    let [row, col] = notationToIndices(nextMoveNotation);

                    // Rotate the move back to match the original board orientation
                    let [originalRow, originalCol] = rotateCoordinates(row, col, (360 - opening.angle) % 360);

                    let openingName = opening.name;
                    return { move: [originalRow, originalCol], openingName };
                }
            }
        }
    }
    return null;
}

function getCurrentOpeningName() {
    for (let opening of openingBook) {
        // Rotate the current board to match the rotation of the opening
        let rotatedCurrentBoard = rotateBoard(board, opening.angle);

        // Compare the rotated current board with the opening's boards
        for (let i = 0; i < opening.boards.length; i++) {
            if (boardsAreEqual(rotatedCurrentBoard, opening.boards[i])) {
                return opening.name;
            }
        }
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

// Minimax algorithm with alpha-beta pruning
function minimax(board, player, depth, alpha, beta, maximizingPlayer) {
    if (depth === 0 || isGameOver(board)) {
        return evaluateBoard(board, currentPlayer);
    }
    let possibleMoves = getPossibleMoves(board, player);
    if (possibleMoves.length === 0) {
        // Pass turn if no moves available
        return minimax(board, -player, depth - 1, alpha, beta, !maximizingPlayer);
    }

    if (maximizingPlayer) {
        let maxEval = -Infinity;
        for (let move of possibleMoves) {
            let newBoard = makeMove(board, player, move);
            let eval = minimax(newBoard, -player, depth - 1, alpha, beta, false);
            maxEval = Math.max(maxEval, eval);
            alpha = Math.max(alpha, eval);
            if (beta <= alpha) {
                break; // Beta cutoff
            }
        }
        return maxEval;
    } else {
        let minEval = Infinity;
        for (let move of possibleMoves) {
            let newBoard = makeMove(board, player, move);
            let eval = minimax(newBoard, -player, depth - 1, alpha, beta, true);
            minEval = Math.min(minEval, eval);
            beta = Math.min(beta, eval);
            if (beta <= alpha) {
                break; // Alpha cutoff
            }
        }
        return minEval;
    }
}

function minimaxRoot(board, player, depth) {
    let possibleMoves = getPossibleMoves(board, player);
    let bestMove = null;
    let bestValue = -Infinity;
    for (let move of possibleMoves) {
        let newBoard = makeMove(board, player, move);
        let eval = minimax(newBoard, -player, depth - 1, -Infinity, Infinity, false);
        if (eval > bestValue) {
            bestValue = eval;
            bestMove = move;
        }
    }
    return bestMove;
}

function isGameOver(board) {
    return getPossibleMoves(board, 1).length === 0 && getPossibleMoves(board, -1).length === 0;
}

canvas.addEventListener('click', playerMove);
newGameButton.addEventListener('click', newGame);
newGame();
