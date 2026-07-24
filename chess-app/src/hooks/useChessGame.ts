import { useState, useCallback, useEffect } from 'react';
import { Chess, type Square } from 'chess.js';
import { getBestAiMove, type AiLevel } from '../utils/chessAi';

export type GameMode = 'beginner' | 'intermediate' | 'expert' | 'ai-easy' | 'ai-medium' | 'ai-hard';

export const safeClone = (game: Chess) => {
    const clone = new Chess();
    try {
        clone.load(game.fen());
        return clone;
    } catch (e) {
        clone.clear();
        for (let i = 0; i < 8; i++) {
            for (let j = 1; j <= 8; j++) {
                const sq = `${String.fromCharCode(97 + i)}${j}` as Square;
                const p = game.get(sq);
                if (p) clone.put(p, sq);
            }
        }
        safeChangeTurn(clone, game.turn());
        return clone;
    }
};

export const safeChangeTurn = (game: Chess, newTurn: 'w' | 'b') => {
    if (game.turn() === newTurn) return;
    try {
        const tokens = game.fen().split(' ');
        tokens[1] = newTurn;
        tokens[3] = '-';
        game.load(tokens.join(' '));
    } catch (e) {
        // Fallback: move a piece of the CURRENT turn to reach the NEW turn.
        const currentTurn = game.turn();

        // Remove all kings temporarily to avoid check constraints during the dummy move
        const kings: { sq: Square, p: { type: string, color: string } }[] = [];
        const files = ['a', 'b', 'c', 'd', 'e', 'f', 'g', 'h'];
        for (let f of files) {
            for (let r = 1; r <= 8; r++) {
                const sq = `${f}${r}` as Square;
                const p = game.get(sq);
                if (p && p.type === 'k') {
                    kings.push({ sq, p: { ...p } });
                    game.remove(sq);
                }
            }
        }

        const startSq = currentTurn === 'w' ? 'a2' : 'a7';
        const endSq = currentTurn === 'w' ? 'a3' : 'a6';
        const origStart = game.get(startSq as Square);
        const origEnd = game.get(endSq as Square);

        game.put({ type: 'p', color: currentTurn }, startSq as Square);
        game.remove(endSq as Square);
        try {
            game.move(endSq);
        } catch (err) { }
        game.remove(endSq as Square);

        if (origStart) game.put(origStart, startSq as Square);
        else game.remove(startSq as Square);
        if (origEnd) game.put(origEnd, endSq as Square);

        // Restore kings
        kings.forEach(k => game.put(k.p as any, k.sq));
    }
};

export const getPseudoLegalMoves = (game: Chess, square: Square) => {
    const piece = game.get(square);
    if (!piece) return [];

    // Clone the game to calculate moves safely
    const g = safeClone(game);

    // Ensure it's the piece's turn to get its moves
    if (g.turn() !== piece.color) {
        safeChangeTurn(g, piece.color);
    }

    // To allow pieces to move even if their king is in check 
    // (pseudo-legal learning), we temporarily replace ANY OTHER king on the board
    // with a pawn to ignore check constraints during move generation.
    const files = ['a', 'b', 'c', 'd', 'e', 'f', 'g', 'h'];
    for (let f of files) {
        for (let r = 1; r <= 8; r++) {
            const sq = `${f}${r}` as Square;
            const p = g.get(sq);
            if (p && p.type === 'k' && sq !== square) {
                g.remove(sq);
                g.put({ type: 'p', color: p.color }, sq);
            }
        }
    }

    try {
        const moves = g.moves({ square, verbose: true });
        return moves.map(m => m.to as Square);
    } catch (e: any) {
        return [];
    }
};

const loadFENIntoGame = (game: Chess, fen: string) => {
    try {
        game.load(fen);
    } catch (e) {
        game.clear();
        const [pieces, turn] = fen.split(' ');
        const rows = pieces.split('/');
        for (let r = 0; r < 8; r++) {
            let fileIdx = 0;
            for (const char of rows[r]) {
                if (/\d/.test(char)) {
                    fileIdx += parseInt(char);
                } else {
                    const color = char === char.toUpperCase() ? 'w' : 'b';
                    const type = char.toLowerCase();
                    const sq = `${String.fromCharCode(97 + fileIdx)}${8 - r}` as Square;
                    game.put({ type: type as any, color }, sq);
                    fileIdx++;
                }
            }
        }
        safeChangeTurn(game, turn as 'w' | 'b');
    }
};

export function useChessGame() {
    const [game, setGame] = useState(new Chess());
    const [mode, setModeState] = useState<GameMode>('beginner');
    const [learningRole, setLearningRole] = useState<string | null>(null);
    const [history, setHistory] = useState<string[]>([]);
    const [isAiThinking, setIsAiThinking] = useState(false);

    const setMode = useCallback((newMode: GameMode) => {
        setModeState(newMode);
        setIsAiThinking(false);
        if (newMode === 'expert') {
            const newGame = new Chess();
            newGame.clear();
            const pieces = [
                ...Array(8).fill({ type: 'p', color: 'w' }),
                ...Array(8).fill({ type: 'p', color: 'b' }),
                { type: 'r', color: 'w' }, { type: 'r', color: 'w' },
                { type: 'r', color: 'b' }, { type: 'r', color: 'b' },
                { type: 'n', color: 'w' }, { type: 'n', color: 'w' },
                { type: 'n', color: 'b' }, { type: 'n', color: 'b' },
                { type: 'b', color: 'w' }, { type: 'b', color: 'w' },
                { type: 'b', color: 'b' }, { type: 'b', color: 'b' },
                { type: 'q', color: 'w' }, { type: 'q', color: 'b' },
                { type: 'k', color: 'w' }, { type: 'k', color: 'b' },
            ];
            const pawnSquares: Square[] = [];
            const otherSquares: Square[] = [];
            for (let i = 0; i < 8; i++) {
                for (let j = 1; j <= 8; j++) {
                    const sq = `${String.fromCharCode(97 + i)}${j}` as Square;
                    if (j > 1 && j < 8) pawnSquares.push(sq);
                    otherSquares.push(sq);
                }
            }
            pawnSquares.sort(() => Math.random() - 0.5);
            otherSquares.sort(() => Math.random() - 0.5);
            const taken = new Set();
            for (let i = 0; i < 16; i++) { // pawns
                let j = 0; while (taken.has(pawnSquares[j])) j++;
                taken.add(pawnSquares[j]);
                newGame.put(pieces[i], pawnSquares[j]);
            }
            for (let i = 16; i < 32; i++) { // other
                let j = 0; while (taken.has(otherSquares[j])) j++;
                taken.add(otherSquares[j]);
                newGame.put(pieces[i], otherSquares[j]);
            }
            setGame(newGame);
            setHistory([]);
        } else {
            setGame(new Chess());
            setHistory([]);
        }
    }, [learningRole, game]);

    // Handle Machine AI moves when playing in an AI mode and it's Black's turn
    useEffect(() => {
        if (!mode.startsWith('ai-') || game.turn() !== 'b' || game.isGameOver() || learningRole) {
            return;
        }

        const aiLevel = mode.replace('ai-', '') as AiLevel;
        setIsAiThinking(true);

        const timer = setTimeout(() => {
            // Nested setTimeout to ensure React updates UI to "thinking" state before running search
            setTimeout(() => {
                try {
                    const aiMove = getBestAiMove(game, aiLevel);
                    if (aiMove) {
                        const gameCopy = safeClone(game);
                        gameCopy.move(aiMove);
                        setHistory(prev => [...prev, game.fen()]);
                        setGame(gameCopy);
                    }
                } catch (err) {
                    console.error("AI move calculation error:", err);
                } finally {
                    setIsAiThinking(false);
                }
            }, 50);
        }, 200);

        return () => clearTimeout(timer);
    }, [game.fen(), mode, learningRole]);

    useEffect(() => {
        if (learningRole) {
            const newGame = new Chess();
            newGame.clear();
            if (learningRole === 'Pawn') {
                if (mode === 'expert') {
                    const pawns = [...Array(8).fill({ type: 'p', color: 'w' }), ...Array(8).fill({ type: 'p', color: 'b' })];
                    const squares: Square[] = [];
                    for (let i = 0; i < 8; i++) { for (let j = 1; j <= 8; j++) { squares.push(`${String.fromCharCode(97 + i)}${j}` as Square); } }
                    squares.sort(() => Math.random() - 0.5);
                    pawns.forEach((p, idx) => newGame.put(p as any, squares[idx]));
                } else {
                    for (let i = 0; i < 8; i++) {
                        const file = String.fromCharCode(97 + i);
                        newGame.put({ type: 'p', color: 'w' }, `${file}2` as Square);
                        newGame.put({ type: 'p', color: 'b' }, `${file}7` as Square);
                    }
                }
            } else {
                if (mode === 'expert') {
                    const pieceTypes: Record<string, any[]> = {
                        'Knight': [{ type: 'n', color: 'w' }, { type: 'n', color: 'w' }, { type: 'n', color: 'b' }, { type: 'n', color: 'b' }],
                        'Bishop': [{ type: 'b', color: 'w' }, { type: 'b', color: 'w' }, { type: 'b', color: 'b' }, { type: 'b', color: 'b' }],
                        'Rook': [{ type: 'r', color: 'w' }, { type: 'r', color: 'w' }, { type: 'r', color: 'b' }, { type: 'r', color: 'b' }],
                        'Queen': [{ type: 'q', color: 'w' }, { type: 'q', color: 'b' }],
                        'King': [{ type: 'k', color: 'w' }, { type: 'k', color: 'b' }],
                    };
                    const pieces = pieceTypes[learningRole] || [];
                    const squares: Square[] = [];
                    for (let i = 0; i < 8; i++) { for (let j = 1; j <= 8; j++) { squares.push(`${String.fromCharCode(97 + i)}${j}` as Square); } }
                    squares.sort(() => Math.random() - 0.5);
                    pieces.forEach((p, idx) => newGame.put(p as any, squares[idx]));
                } else {
                    newGame.clear();
                    const pieceTypes: Record<string, { type: string, squares: string[] }> = {
                        'Knight': { type: 'n', squares: ['b1', 'g1', 'b8', 'g8'] },
                        'Bishop': { type: 'b', squares: ['c1', 'f1', 'c8', 'f8'] },
                        'Rook': { type: 'r', squares: ['a1', 'h1', 'a8', 'h8'] },
                        'Queen': { type: 'q', squares: ['d1', 'd8'] },
                        'King': { type: 'k', squares: ['e1', 'e8'] },
                    };
                    const roleInfo = pieceTypes[learningRole];
                    if (roleInfo) {
                        roleInfo.squares.forEach(sq => {
                            const color = sq.endsWith('1') ? 'w' : 'b';
                            newGame.put({ type: roleInfo.type as any, color }, sq as Square);
                        });
                    }
                }
            }
            setGame(newGame);
            setHistory([]);
            setIsAiThinking(false);
        } else if (mode !== 'expert') {
            setGame(new Chess());
            setHistory([]);
            setIsAiThinking(false);
        }
    }, [learningRole, mode]);

    const resetGame = useCallback(() => {
        setIsAiThinking(false);
        if (learningRole === 'Pawn') {
            const newGame = new Chess();
            newGame.clear();
            if (mode === 'expert') {
                const pawns = [...Array(8).fill({ type: 'p', color: 'w' }), ...Array(8).fill({ type: 'p', color: 'b' })];
                const squares: Square[] = [];
                for (let i = 0; i < 8; i++) { for (let j = 1; j <= 8; j++) { squares.push(`${String.fromCharCode(97 + i)}${j}` as Square); } }
                squares.sort(() => Math.random() - 0.5);
                pawns.forEach((p, idx) => newGame.put(p as any, squares[idx]));
            } else {
                for (let i = 0; i < 8; i++) {
                    const file = String.fromCharCode(97 + i);
                    newGame.put({ type: 'p', color: 'w' }, `${file}2` as Square);
                    newGame.put({ type: 'p', color: 'b' }, `${file}7` as Square);
                }
            }
            setGame(newGame);
            setHistory([]);
        } else if (learningRole) {
            const newGame = new Chess();
            newGame.clear();
            if (mode === 'expert') {
                const pieceTypes: Record<string, any[]> = {
                    'Knight': [{ type: 'n', color: 'w' }, { type: 'n', color: 'w' }, { type: 'n', color: 'b' }, { type: 'n', color: 'b' }],
                    'Bishop': [{ type: 'b', color: 'w' }, { type: 'b', color: 'w' }, { type: 'b', color: 'b' }, { type: 'b', color: 'b' }],
                    'Rook': [{ type: 'r', color: 'w' }, { type: 'r', color: 'w' }, { type: 'r', color: 'b' }, { type: 'r', color: 'b' }],
                    'Queen': [{ type: 'q', color: 'w' }, { type: 'q', color: 'b' }],
                    'King': [{ type: 'k', color: 'w' }, { type: 'k', color: 'b' }],
                };
                const pieces = pieceTypes[learningRole] || [];
                const squares: Square[] = [];
                for (let i = 0; i < 8; i++) { for (let j = 1; j <= 8; j++) { squares.push(`${String.fromCharCode(97 + i)}${j}` as Square); } }
                squares.sort(() => Math.random() - 0.5);
                pieces.forEach((p, idx) => newGame.put(p as any, squares[idx]));
            } else {
                newGame.clear();
                const pieceTypes: Record<string, { type: string, squares: string[] }> = {
                    'Knight': { type: 'n', squares: ['b1', 'g1', 'b8', 'g8'] },
                    'Bishop': { type: 'b', squares: ['c1', 'f1', 'c8', 'f8'] },
                    'Rook': { type: 'r', squares: ['a1', 'h1', 'a8', 'h8'] },
                    'Queen': { type: 'q', squares: ['d1', 'd8'] },
                    'King': { type: 'k', squares: ['e1', 'e8'] },
                };
                const roleInfo = pieceTypes[learningRole];
                if (roleInfo) {
                    roleInfo.squares.forEach(sq => {
                        const color = sq.endsWith('1') ? 'w' : 'b';
                        newGame.put({ type: roleInfo.type as any, color }, sq as Square);
                    });
                }
            }
            setGame(newGame);
            setHistory([]);
        } else if (mode === 'expert') {
            const newGame = new Chess();
            newGame.clear();
            const pieces = [
                ...Array(8).fill({ type: 'p', color: 'w' }), ...Array(8).fill({ type: 'p', color: 'b' }),
                { type: 'r', color: 'w' }, { type: 'r', color: 'w' }, { type: 'r', color: 'b' }, { type: 'r', color: 'b' },
                { type: 'n', color: 'w' }, { type: 'n', color: 'w' }, { type: 'n', color: 'b' }, { type: 'n', color: 'b' },
                { type: 'b', color: 'w' }, { type: 'b', color: 'w' }, { type: 'b', color: 'b' }, { type: 'b', color: 'b' },
                { type: 'q', color: 'w' }, { type: 'q', color: 'b' }, { type: 'k', color: 'w' }, { type: 'k', color: 'b' },
            ];
            const pawnSquares: Square[] = [];
            const otherSquares: Square[] = [];
            for (let i = 0; i < 8; i++) {
                for (let j = 1; j <= 8; j++) {
                    const sq = `${String.fromCharCode(97 + i)}${j}` as Square;
                    if (j > 1 && j < 8) pawnSquares.push(sq);
                    otherSquares.push(sq);
                }
            }
            pawnSquares.sort(() => Math.random() - 0.5);
            otherSquares.sort(() => Math.random() - 0.5);
            const taken = new Set();
            for (let i = 0; i < 16; i++) { // pawns
                let j = 0; while (taken.has(pawnSquares[j])) j++;
                taken.add(pawnSquares[j]);
                newGame.put(pieces[i] as any, pawnSquares[j]);
            }
            for (let i = 16; i < 32; i++) { // other
                let j = 0; while (taken.has(otherSquares[j])) j++;
                taken.add(otherSquares[j]);
                newGame.put(pieces[i] as any, otherSquares[j]);
            }
            setGame(newGame);
            setHistory([]);
        } else {
            setGame(new Chess());
            setHistory([]);
        }
    }, [learningRole, mode]);

    const undoMove = useCallback(() => {
        if (history.length === 0 || isAiThinking) return;

        const isAiMode = mode.startsWith('ai-');
        const prevHistory = [...history];

        if (isAiMode && prevHistory.length >= 2) {
            prevHistory.pop(); // Pop Machine's move
            const targetFen = prevHistory.pop(); // Pop User's move
            if (targetFen) {
                const newGame = new Chess();
                loadFENIntoGame(newGame, targetFen);
                setHistory(prevHistory);
                setGame(newGame);
                return;
            }
        }

        const lastFen = prevHistory.pop();
        if (!lastFen) return;

        const newGame = new Chess();
        loadFENIntoGame(newGame, lastFen);

        setHistory(prevHistory);
        setGame(newGame);
    }, [history, isAiThinking, mode]);

    const makeMove = useCallback((source: Square, target: Square): boolean => {
        if (isAiThinking) return false;

        try {
            const gameCopy = safeClone(game);
            const piece = gameCopy.get(source);

            // Enforce alternating turns
            if (piece) {
                if (gameCopy.turn() !== piece.color) {
                    return false;
                }

                // In AI mode, User can only move White pieces
                if (mode.startsWith('ai-') && piece.color !== 'w') {
                    return false;
                }

                // Extra check removal if we are in expert mode or learning a specific role
                if (mode === 'expert' || learningRole) {
                    let move = null;
                    try {
                        move = gameCopy.move({ from: source, to: target, promotion: 'q' });
                    } catch (err) { }

                    if (!move) {
                        gameCopy.remove(source);
                        gameCopy.put(piece, target);
                        safeChangeTurn(gameCopy, piece.color === 'w' ? 'b' : 'w');
                        setHistory(prev => [...prev, game.fen()]);
                        setGame(gameCopy);
                        return true;
                    } else {
                        setHistory(prev => [...prev, game.fen()]);
                        setGame(gameCopy);
                        return true;
                    }
                }
            }

            const move = gameCopy.move({
                from: source,
                to: target,
                promotion: 'q' // always promote to queen for simplicity
            });

            if (move) {
                setHistory(prev => [...prev, game.fen()]);
                setGame(gameCopy);
                return true;
            }
        } catch (e) {
            return false;
        }
        return false;
    }, [game, mode, learningRole, isAiThinking]);

    return {
        game,
        setGame,
        mode,
        setMode,
        learningRole,
        setLearningRole,
        resetGame,
        undoMove,
        makeMove,
        isAiThinking
    };
}
