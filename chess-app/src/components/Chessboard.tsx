import React, { useState, useEffect } from 'react';
import { Chess, type Square } from 'chess.js';
import { getPseudoLegalMoves } from '../hooks/useChessGame';

interface ChessboardProps {
    game: Chess;
    onMakeMove: (source: Square, target: Square) => boolean;
    soundEnabled: boolean;
    onInvalidMove: () => void;
    showHints?: boolean;
}

const ranks = [8, 7, 6, 5, 4, 3, 2, 1];
const files = ['a', 'b', 'c', 'd', 'e', 'f', 'g', 'h'];

const pieceMap: Record<string, string> = {
    'pw': '♟', 'nw': '♞', 'bw': '♝', 'rw': '♜', 'qw': '♛', 'kw': '♚',
    'pb': '♟', 'nb': '♞', 'bb': '♝', 'rb': '♜', 'qb': '♛', 'kb': '♚'
};

const playSound = () => {
    try {
        const audioCtx = new (window.AudioContext || (window as any).webkitAudioContext)();
        const oscillator = audioCtx.createOscillator();
        const gainNode = audioCtx.createGain();

        oscillator.type = 'sine';
        oscillator.frequency.setValueAtTime(600, audioCtx.currentTime);
        oscillator.frequency.exponentialRampToValueAtTime(800, audioCtx.currentTime + 0.1);

        gainNode.gain.setValueAtTime(0, audioCtx.currentTime);
        gainNode.gain.linearRampToValueAtTime(0.2, audioCtx.currentTime + 0.02);
        gainNode.gain.exponentialRampToValueAtTime(0.01, audioCtx.currentTime + 0.2);

        oscillator.connect(gainNode);
        gainNode.connect(audioCtx.destination);

        oscillator.start();
        oscillator.stop(audioCtx.currentTime + 0.2);
    } catch (e) { }
};

const playErrorSound = () => {
    try {
        const audioCtx = new (window.AudioContext || (window as any).webkitAudioContext)();
        const oscillator = audioCtx.createOscillator();
        const gainNode = audioCtx.createGain();

        oscillator.type = 'sawtooth';
        oscillator.frequency.setValueAtTime(150, audioCtx.currentTime);

        gainNode.gain.setValueAtTime(0.1, audioCtx.currentTime);
        gainNode.gain.exponentialRampToValueAtTime(0.01, audioCtx.currentTime + 0.3);

        oscillator.connect(gainNode);
        gainNode.connect(audioCtx.destination);

        oscillator.start();
        oscillator.stop(audioCtx.currentTime + 0.3);
    } catch (e) { }
};

export const Chessboard: React.FC<ChessboardProps> = ({ game, onMakeMove, soundEnabled, onInvalidMove, showHints = true }) => {
    const [selectedSquare, setSelectedSquare] = useState<Square | null>(null);
    const [validMoves, setValidMoves] = useState<Square[]>([]);

    // Update whenever game state changes
    useEffect(() => {
        setSelectedSquare(null);
        setValidMoves([]);
    }, [game.fen()]);

    const handleSquareClick = (square: Square) => {
        // If we click the already selected square, unselect it
        if (selectedSquare === square) {
            setSelectedSquare(null);
            setValidMoves([]);
            return;
        }

        const piece = game.get(square);

        // Helper to get moves for ANY piece, overriding turn if necessary

        // If we have a selected square, try to move there
        if (selectedSquare) {
            const isMoveValid = validMoves.includes(square);
            if (isMoveValid) {
                const success = onMakeMove(selectedSquare, square);
                if (success) {
                    if (soundEnabled) playSound();
                } else {
                    onInvalidMove();
                    if (soundEnabled) playErrorSound();
                }
            } else {
                // Did we click another piece? Let's just select it instead of showing error,
                // treating it as changing selection.
                if (piece) {
                    setSelectedSquare(square);
                    setValidMoves(getPseudoLegalMoves(game, square));
                } else {
                    // Invalid move area clicked
                    onInvalidMove();
                    if (soundEnabled) playErrorSound();
                    setSelectedSquare(null);
                    setValidMoves([]);
                }
            }
            return;
        }

        // Otherwise, select the piece if it exists
        if (piece) {
            setSelectedSquare(square);
            setValidMoves(getPseudoLegalMoves(game, square));
        }
    };

    return (
        <div style={{
            width: '100%',
            maxWidth: '600px',
            aspectRatio: '1/1',
            display: 'grid',
            gridTemplateColumns: 'repeat(8, 1fr)',
            gridTemplateRows: 'repeat(8, 1fr)',
            border: '4px solid var(--panel-bg)',
            borderRadius: '8px',
            overflow: 'hidden',
            boxShadow: '0 10px 30px rgba(0,0,0,0.5)'
        }}>
            {ranks.map((rank, i) =>
                files.map((file, j) => {
                    const isDark = (i + j) % 2 === 1;
                    const square = `${file}${rank}` as Square;
                    const piece = game.get(square);
                    const isSelected = selectedSquare === square;
                    const isValidMove = validMoves.includes(square);
                    const showHintUI = showHints && isValidMove;

                    let bgColor = isDark ? 'var(--board-dark)' : 'var(--board-light)';
                    if (isSelected) {
                        bgColor = 'var(--board-highlight)';
                    } else if (showHintUI) {
                        bgColor = 'var(--board-valid-move)';
                    }

                    let colorStyles = {};
                    if (piece) {
                        if (piece.color === 'w') {
                            colorStyles = {
                                color: 'white',
                                textShadow: '0 2px 4px rgba(0,0,0,0.4)',
                                fontSize: '3rem'
                            };
                        } else {
                            colorStyles = {
                                color: 'black',
                                textShadow: '0 2px 4px rgba(0,0,0,0.4)',
                                fontSize: '3rem'
                            };
                        }
                    }

                    return (
                        <div
                            key={square}
                            onClick={() => handleSquareClick(square)}
                            style={{
                                backgroundColor: bgColor,
                                display: 'flex',
                                alignItems: 'center',
                                justifyContent: 'center',
                                position: 'relative',
                                cursor: 'pointer',
                                userSelect: 'none',
                                transition: 'background-color 0.2s',
                                ...colorStyles
                            }}
                        >
                            {piece && pieceMap[`${piece.type}${piece.color}`]}

                            {/* Valid move indicator if empty space */}
                            {showHintUI && !piece && (
                                <div style={{
                                    width: '20%',
                                    height: '20%',
                                    borderRadius: '50%',
                                    backgroundColor: 'rgba(0,0,0,0.2)'
                                }} />
                            )}

                            {/* Coordinates */}
                            {j === 0 && <span style={{ position: 'absolute', top: 2, left: 4, fontSize: 10, color: isDark ? 'var(--board-light)' : 'var(--board-dark)' }}>{rank}</span>}
                            {i === 7 && <span style={{ position: 'absolute', bottom: 2, right: 4, fontSize: 10, color: isDark ? 'var(--board-light)' : 'var(--board-dark)' }}>{file}</span>}
                        </div>
                    );
                })
            )}
        </div>
    );
};
