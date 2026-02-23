import { useState, useCallback, useEffect } from 'react';
import { Chess, type Square } from 'chess.js';

export type GameMode = 'beginner' | 'intermediate' | 'expert';

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
        console.log("safeClone fallback triggered. Target turn:", game.turn(), "Result turn:", clone.turn());
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
        console.log("safeChangeTurn fallback finished. New turn:", game.turn());
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
        console.log("getPseudoLegalMoves for", square, "at turn", g.turn(), "returns", moves.length, "moves");
        return moves.map(m => m.to as Square);
    } catch (e: any) {
        console.error("getPseudoLegalMoves failed:", e.message);
        return [];
    }
};

export function useChessGame() {
    const [game, setGame] = useState(new Chess());
    const [mode, setModeState] = useState<GameMode>('beginner');
    const [learningRole, setLearningRole] = useState<string | null>(null);

    const setMode = useCallback((newMode: GameMode) => {
        setModeState(newMode);
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
        } else {
            setGame(new Chess());
        }
    }, []);

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
        } else if (mode !== 'expert') {
            setGame(new Chess());
        }
    }, [learningRole, mode]);

    const resetGame = useCallback(() => {
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
        } else {
            setGame(new Chess());
        }
    }, [learningRole, mode]);

    const undoMove = useCallback(() => {
        const gameCopy = new Chess(game.fen());
        gameCopy.undo();
        // if playing vs tutor, we might want to undo 2 moves (tutor's and ours)
        setGame(gameCopy);
    }, [game]);

    const makeMove = useCallback((source: Square, target: Square): boolean => {
        try {
            const gameCopy = safeClone(game);
            const piece = gameCopy.get(source);

            // Enforce alternating turns
            if (piece) {
                if (gameCopy.turn() !== piece.color) {
                    return false;
                }

                // Extra check removal if we are in expert mode or learning a specific role
                // This ensures movement stays fluid even in legally "wacky" board states.
                if (mode === 'expert' || learningRole) {
                    // Try to move normally. If it fails, force the move since it's just practicing movement.
                    let move = null;
                    try {
                        move = gameCopy.move({ from: source, to: target, promotion: 'q' });
                    } catch (err) { }

                    if (!move) {
                        // Pseudo-legal bypass
                        gameCopy.remove(source);
                        gameCopy.put(piece, target);
                        // Manually flip turn for pseudo moves
                        safeChangeTurn(gameCopy, piece.color === 'w' ? 'b' : 'w');
                        setGame(gameCopy);
                        return true;
                    } else {
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
                setGame(gameCopy);
                return true;
            }
        } catch (e) {
            return false;
        }
        return false;
    }, [game, mode]);

    return {
        game,
        setGame,
        mode,
        setMode,
        learningRole,
        setLearningRole,
        resetGame,
        undoMove,
        makeMove
    };
}
