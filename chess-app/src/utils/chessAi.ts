import { Chess, type Square } from 'chess.js';

export type AiLevel = 'easy' | 'medium' | 'hard';

// Piece material values
const PIECE_VALUES: Record<string, number> = {
    p: 100,
    n: 320,
    b: 330,
    r: 500,
    q: 900,
    k: 20000,
};

// Piece Square Tables (PST) - evaluated from White's perspective (index 0 is a8, index 63 is h1)
const PAWN_PST = [
    0,  0,  0,  0,  0,  0,  0,  0,
   50, 50, 50, 50, 50, 50, 50, 50,
   10, 10, 20, 30, 30, 20, 10, 10,
    5,  5, 10, 27, 27, 10,  5,  5,
    0,  0,  0, 25, 25,  0,  0,  0,
    5, -5,-10,  0,  0,-10, -5,  5,
    5, 10, 10,-25,-25, 10, 10,  5,
    0,  0,  0,  0,  0,  0,  0,  0
];

const KNIGHT_PST = [
  -50,-40,-30,-30,-30,-30,-40,-50,
  -40,-20,  0,  0,  0,  0,-20,-40,
  -30,  0, 10, 15, 15, 10,  0,-30,
  -30,  5, 15, 20, 20, 15,  5,-30,
  -30,  0, 15, 20, 20, 15,  0,-30,
  -30,  5, 10, 15, 15, 10,  5,-30,
  -40,-20,  0,  5,  5,  0,-20,-40,
  -50,-40,-30,-30,-30,-30,-40,-50
];

const BISHOP_PST = [
  -20,-10,-10,-10,-10,-10,-10,-20,
  -10,  0,  0,  0,  0,  0,  0,-10,
  -10,  0,  5, 10, 10,  5,  0,-10,
  -10,  5,  5, 10, 10,  5,  5,-10,
  -10,  0, 10, 10, 10, 10,  0,-10,
  -10, 10, 10, 10, 10, 10, 10,-10,
  -10,  5,  0,  0,  0,  0,  5,-10,
  -20,-10,-10,-10,-10,-10,-10,-20
];

const ROOK_PST = [
    0,  0,  0,  0,  0,  0,  0,  0,
    5, 10, 10, 10, 10, 10, 10,  5,
   -5,  0,  0,  0,  0,  0,  0, -5,
   -5,  0,  0,  0,  0,  0,  0, -5,
   -5,  0,  0,  0,  0,  0,  0, -5,
   -5,  0,  0,  0,  0,  0,  0, -5,
   -5,  0,  0,  0,  0,  0,  0, -5,
    0,  0,  0,  5,  5,  0,  0,  0
];

const QUEEN_PST = [
  -20,-10,-10, -5, -5,-10,-10,-20,
  -10,  0,  0,  0,  0,  0,  0,-10,
  -10,  0,  5,  5,  5,  5,  0,-10,
   -5,  0,  5,  5,  5,  5,  0, -5,
    0,  0,  5,  5,  5,  5,  0, -5,
  -10,  5,  5,  5,  5,  5,  0,-10,
  -10,  0,  5,  0,  0,  0,  0,-10,
  -20,-10,-10, -5, -5,-10,-10,-20
];

const KING_MIDDLEGAME_PST = [
  -30,-40,-40,-50,-50,-40,-40,-30,
  -30,-40,-40,-50,-50,-40,-40,-30,
  -30,-40,-40,-50,-50,-40,-40,-30,
  -30,-40,-40,-50,-50,-40,-40,-30,
  -20,-30,-30,-40,-40,-30,-30,-20,
  -10,-20,-20,-20,-20,-20,-20,-10,
   20, 20,  0,  0,  0,  0, 20, 20,
   20, 30, 10,  0,  0, 10, 30, 20
];

function getSquareIndex(sq: Square): number {
    const file = sq.charCodeAt(0) - 97; // a=0..h=7
    const rank = 8 - parseInt(sq[1], 10); // 8=0..1=7
    return rank * 8 + file;
}

function getFlippedSquareIndex(sq: Square): number {
    const file = sq.charCodeAt(0) - 97;
    const rank = parseInt(sq[1], 10) - 1; // 1=0..8=7
    return rank * 8 + file;
}

function getPiecePst(type: string, sq: Square, color: 'w' | 'b'): number {
    const idx = color === 'w' ? getSquareIndex(sq) : getFlippedSquareIndex(sq);
    switch (type) {
        case 'p': return PAWN_PST[idx];
        case 'n': return KNIGHT_PST[idx];
        case 'b': return BISHOP_PST[idx];
        case 'r': return ROOK_PST[idx];
        case 'q': return QUEEN_PST[idx];
        case 'k': return KING_MIDDLEGAME_PST[idx];
        default: return 0;
    }
}

/**
 * Evaluates board position from Black's perspective.
 * Positive score = Black is winning.
 * Negative score = White is winning.
 */
export function evaluateBoard(game: Chess): number {
    if (game.isCheckmate()) {
        // If it's White's turn and White is checkmated, Black won (+100000)
        return game.turn() === 'w' ? 100000 : -100000;
    }
    if (game.isDraw() || game.isStalemate()) {
        return 0;
    }

    let score = 0;
    const board = game.board();

    for (let r = 0; r < 8; r++) {
        for (let c = 0; c < 8; c++) {
            const piece = board[r][c];
            if (piece) {
                const sq = `${String.fromCharCode(97 + c)}${8 - r}` as Square;
                const mat = PIECE_VALUES[piece.type] || 0;
                const pst = getPiecePst(piece.type, sq, piece.color);
                const totalVal = mat + pst;

                if (piece.color === 'b') {
                    score += totalVal;
                } else {
                    score -= totalVal;
                }
            }
        }
    }
    return score;
}

/**
 * Sorts moves for better Alpha-Beta pruning performance (MVV-LVA)
 */
function sortMoves(moves: ReturnType<Chess['moves']>) {
    return (moves as any[]).sort((a, b) => {
        let scoreA = 0;
        let scoreB = 0;

        if (a.captured) {
            scoreA += 10 * (PIECE_VALUES[a.captured] || 0) - (PIECE_VALUES[a.piece] || 0);
        }
        if (b.captured) {
            scoreB += 10 * (PIECE_VALUES[b.captured] || 0) - (PIECE_VALUES[b.piece] || 0);
        }

        if (a.san && a.san.includes('+')) scoreA += 50;
        if (b.san && b.san.includes('+')) scoreB += 50;

        return scoreB - scoreA;
    });
}

/**
 * Quiescence search for Tactical depth in Hard mode (searches capture moves)
 */
function quiescence(game: Chess, alpha: number, beta: number, isMaximizing: boolean, depthLimit = 2): number {
    const standPat = evaluateBoard(game);

    if (depthLimit === 0) return standPat;

    if (isMaximizing) {
        if (standPat >= beta) return beta;
        if (standPat > alpha) alpha = standPat;

        const captures = sortMoves(game.moves({ verbose: true }).filter(m => m.captured));
        for (const move of captures) {
            game.move(move);
            const score = quiescence(game, alpha, beta, false, depthLimit - 1);
            game.undo();
            if (score >= beta) return beta;
            if (score > alpha) alpha = score;
        }
        return alpha;
    } else {
        if (standPat <= alpha) return alpha;
        if (standPat < beta) beta = standPat;

        const captures = sortMoves(game.moves({ verbose: true }).filter(m => m.captured));
        for (const move of captures) {
            game.move(move);
            const score = quiescence(game, alpha, beta, true, depthLimit - 1);
            game.undo();
            if (score <= alpha) return alpha;
            if (score < beta) beta = score;
        }
        return beta;
    }
}

/**
 * Minimax algorithm with Alpha-Beta pruning
 */
function minimax(
    game: Chess,
    depth: number,
    alpha: number,
    beta: number,
    isMaximizing: boolean,
    useQuiescence: boolean
): number {
    if (depth === 0 || game.isGameOver()) {
        if (useQuiescence && !game.isGameOver()) {
            return quiescence(game, alpha, beta, isMaximizing);
        }
        return evaluateBoard(game);
    }

    const moves = sortMoves(game.moves({ verbose: true }));
    if (moves.length === 0) {
        return evaluateBoard(game);
    }

    if (isMaximizing) {
        let maxEval = -Infinity;
        for (const move of moves) {
            game.move(move);
            const evalVal = minimax(game, depth - 1, alpha, beta, false, useQuiescence);
            game.undo();
            maxEval = Math.max(maxEval, evalVal);
            alpha = Math.max(alpha, evalVal);
            if (beta <= alpha) break; // Beta cutoff
        }
        return maxEval;
    } else {
        let minEval = Infinity;
        for (const move of moves) {
            game.move(move);
            const evalVal = minimax(game, depth - 1, alpha, beta, true, useQuiescence);
            game.undo();
            minEval = Math.min(minEval, evalVal);
            beta = Math.min(beta, evalVal);
            if (beta <= alpha) break; // Alpha cutoff
        }
        return minEval;
    }
}

/**
 * Returns the best move for Black based on the specified AI level.
 */
export function getBestAiMove(game: Chess, level: AiLevel): { from: Square; to: Square; promotion?: string } | null {
    const legalMoves = game.moves({ verbose: true });
    if (legalMoves.length === 0) return null;

    // Easy AI: 70% random move, 30% shallow evaluation
    if (level === 'easy') {
        if (Math.random() < 0.7) {
            const randomMove = legalMoves[Math.floor(Math.random() * legalMoves.length)];
            return { from: randomMove.from, to: randomMove.to, promotion: randomMove.promotion };
        }
    }

    // Determine depth based on level
    const depth = level === 'easy' ? 1 : level === 'medium' ? 3 : 4;
    const useQuiescence = level === 'hard';

    let bestMove = legalMoves[0];
    let bestScore = -Infinity; // Machine is Black (Maximizing score)

    const sortedMoves = sortMoves(legalMoves);

    for (const move of sortedMoves) {
        game.move(move);
        // After Black moves, it's White's turn (Minimizing for Black)
        const score = minimax(game, depth - 1, -Infinity, Infinity, false, useQuiescence);
        game.undo();

        if (score > bestScore) {
            bestScore = score;
            bestMove = move;
        }
    }

    return {
        from: bestMove.from,
        to: bestMove.to,
        promotion: bestMove.promotion || 'q'
    };
}
