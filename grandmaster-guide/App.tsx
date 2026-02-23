import React, { useState, useEffect, useCallback, useRef } from 'react';
import { Chess, Move } from 'chess.js';
import { Chessboard } from 'react-chessboard';
import { Header } from './components/Header';
import { ChatPanel } from './components/ChatPanel';
import { getTutorMoveAndComment } from './services/geminiService';
import { DifficultyLevel, ChatMessage } from './types';
import { RefreshCw, RotateCcw, Trophy, Layers } from 'lucide-react';

const App: React.FC = () => {
  // Game State
  const [game, setGame] = useState(new Chess());
  const [difficulty, setDifficulty] = useState<DifficultyLevel>(DifficultyLevel.BEGINNER);
  const [messages, setMessages] = useState<ChatMessage[]>([]);
  const [isAiThinking, setIsAiThinking] = useState(false);
  const [isGameOver, setIsGameOver] = useState(false);
  
  // Refs to prevent closure staleness in callbacks if needed
  const gameRef = useRef(game);

  // Initialize chat
  useEffect(() => {
    setMessages([
      {
        id: 'welcome',
        sender: 'tutor',
        text: `Hello! I'm your chess tutor. I'll be playing Black. \n\nCurrently playing at **${difficulty}** level. Make your first move!`,
        timestamp: Date.now(),
      },
    ]);
  }, []); // Run once on mount

  // Update difficulty message when changed
  const handleDifficultyChange = (newLevel: DifficultyLevel) => {
    setDifficulty(newLevel);
    addMessage('tutor', `Difficulty changed to **${newLevel}**. Let's see how you handle this!`);
  };

  const addMessage = (sender: 'user' | 'tutor', text: string) => {
    setMessages((prev) => [
      ...prev,
      {
        id: Date.now().toString() + Math.random().toString(),
        sender,
        text,
        timestamp: Date.now(),
      },
    ]);
  };

  const makeAiMove = useCallback(async () => {
    if (gameRef.current.isGameOver() || gameRef.current.turn() === 'w') return;

    setIsAiThinking(true);
    
    // Get valid moves for AI
    const validMoves = gameRef.current.moves();
    const fen = gameRef.current.fen();
    const pgn = gameRef.current.pgn();

    try {
      const { move, commentary } = await getTutorMoveAndComment(
        fen, 
        pgn, 
        difficulty, 
        validMoves
      );

      // Apply AI move
      const gameCopy = new Chess(gameRef.current.fen());
      try {
        gameCopy.move(move);
        setGame(gameCopy);
        gameRef.current = gameCopy;
        addMessage('tutor', `**${move}** - ${commentary}`);
      } catch (e) {
        // Fallback if AI hallucinates an invalid move despite prompt constraints
        console.warn("AI suggested invalid move:", move);
        const randomMove = validMoves[Math.floor(Math.random() * validMoves.length)];
        gameCopy.move(randomMove);
        setGame(gameCopy);
        gameRef.current = gameCopy;
        addMessage('tutor', `I considered ${move}, but decided on **${randomMove}** instead. ${commentary}`);
      }
    } catch (error) {
        console.error("AI Error", error);
        addMessage('tutor', "I'm having trouble connecting to my brain. I'll just wait for you to try again or reset.");
    } finally {
      setIsAiThinking(false);
      checkGameOver(gameRef.current);
    }
  }, [difficulty]);

  function onDrop(sourceSquare: string, targetSquare: string): boolean {
    if (game.turn() === 'b' || isGameOver) return false;

    const gameCopy = new Chess(game.fen());
    
    try {
      const move = gameCopy.move({
        from: sourceSquare,
        target: targetSquare,
        promotion: 'q', // always promote to queen for simplicity
      });

      if (move === null) return false;

      setGame(gameCopy);
      gameRef.current = gameCopy;
      
      // Optional: Add user move to chat for log, or keep chat strictly for commentary
      // addMessage('user', `Played ${move.san}`);

      checkGameOver(gameCopy);
      
      if (!gameCopy.isGameOver()) {
        // Trigger AI response
        setTimeout(() => makeAiMove(), 500);
      }
      
      return true;
    } catch (e) {
      return false;
    }
  }

  const checkGameOver = (chessInstance: Chess) => {
    if (chessInstance.isGameOver()) {
      setIsGameOver(true);
      if (chessInstance.isCheckmate()) {
        const winner = chessInstance.turn() === 'w' ? 'Black' : 'White';
        addMessage('tutor', `Checkmate! ${winner} wins! Game over.`);
      } else if (chessInstance.isDraw()) {
        addMessage('tutor', "It's a draw! Good game.");
      } else {
        addMessage('tutor', "Game over.");
      }
    }
  };

  const resetGame = () => {
    const newGame = new Chess();
    setGame(newGame);
    gameRef.current = newGame;
    setMessages([{
        id: 'restart',
        sender: 'tutor',
        text: `Game reset. I'm ready when you are! (Level: ${difficulty})`,
        timestamp: Date.now(),
    }]);
    setIsGameOver(false);
    setIsAiThinking(false);
  };

  const undoMove = () => {
    const gameCopy = new Chess(game.fen());
    // Undo AI move
    gameCopy.undo();
    // Undo User move
    gameCopy.undo();
    
    setGame(gameCopy);
    gameRef.current = gameCopy;
    addMessage('tutor', "Moves undone. Try a different approach.");
    setIsGameOver(false);
  };

  return (
    <div className="min-h-screen flex flex-col bg-slate-900 text-slate-100 font-sans">
      <Header />
      
      <main className="flex-1 max-w-7xl w-full mx-auto p-4 md:p-6 lg:p-8 grid grid-cols-1 lg:grid-cols-12 gap-6 lg:gap-8">
        
        {/* Sidebar / Controls */}
        <div className="lg:col-span-3 flex flex-col gap-6 order-2 lg:order-1">
          <div className="bg-slate-800 p-5 rounded-xl border border-slate-700 shadow-lg">
            <h2 className="text-lg font-semibold mb-4 flex items-center gap-2 text-white">
              <Trophy className="w-5 h-5 text-yellow-500" />
              Difficulty
            </h2>
            <div className="space-y-2">
              {(Object.values(DifficultyLevel) as DifficultyLevel[]).map((level) => (
                <button
                  key={level}
                  onClick={() => handleDifficultyChange(level)}
                  className={`w-full text-left px-4 py-3 rounded-lg transition-all duration-200 flex items-center justify-between ${
                    difficulty === level
                      ? 'bg-indigo-600 text-white shadow-md shadow-indigo-900/20'
                      : 'bg-slate-700/50 text-slate-300 hover:bg-slate-700 hover:text-white'
                  }`}
                >
                  <span>{level}</span>
                  {difficulty === level && <div className="w-2 h-2 bg-white rounded-full" />}
                </button>
              ))}
            </div>
            
            <div className="mt-4 text-xs text-slate-400 leading-relaxed">
              {difficulty === DifficultyLevel.BEGINNER && "I will focus on basic principles and be forgiving of mistakes."}
              {difficulty === DifficultyLevel.INTERMEDIATE && "I will use tactics and expect you to see threats."}
              {difficulty === DifficultyLevel.EXPERT && "I will play positionally and punish any weakness."}
            </div>
          </div>

          <div className="bg-slate-800 p-5 rounded-xl border border-slate-700 shadow-lg space-y-3">
            <h2 className="text-lg font-semibold mb-2 text-white flex items-center gap-2">
              <Layers className="w-5 h-5 text-slate-400" />
              Actions
            </h2>
            <button 
              onClick={undoMove}
              disabled={game.history().length < 2 || isAiThinking || isGameOver}
              className="w-full flex items-center justify-center gap-2 px-4 py-3 bg-slate-700 hover:bg-slate-600 disabled:opacity-50 disabled:cursor-not-allowed text-slate-200 rounded-lg transition-colors font-medium"
            >
              <RotateCcw className="w-4 h-4" />
              Undo Move
            </button>
            <button 
              onClick={resetGame}
              disabled={isAiThinking}
              className="w-full flex items-center justify-center gap-2 px-4 py-3 bg-slate-700 hover:bg-slate-600 disabled:opacity-50 disabled:cursor-not-allowed text-slate-200 rounded-lg transition-colors font-medium"
            >
              <RefreshCw className="w-4 h-4" />
              New Game
            </button>
          </div>
        </div>

        {/* Chess Board */}
        <div className="lg:col-span-5 flex flex-col justify-center items-center order-1 lg:order-2">
          <div className="w-full max-w-[600px] aspect-square bg-slate-800 p-1 rounded-lg shadow-2xl border border-slate-700 relative">
             <Chessboard 
                position={game.fen()} 
                onPieceDrop={onDrop}
                boardOrientation="white"
                customDarkSquareStyle={{ backgroundColor: '#4f46e5' }} // Indigo-600
                customLightSquareStyle={{ backgroundColor: '#e0e7ff' }} // Indigo-100
                animationDuration={300}
             />
             {isGameOver && (
                <div className="absolute inset-0 z-10 bg-black/60 flex items-center justify-center rounded-lg backdrop-blur-sm">
                    <div className="bg-slate-900 p-8 rounded-xl border border-slate-600 text-center shadow-2xl">
                        <h3 className="text-2xl font-bold text-white mb-2">Game Over</h3>
                        <button 
                            onClick={resetGame}
                            className="mt-4 px-6 py-2 bg-indigo-600 hover:bg-indigo-500 text-white rounded-lg font-medium transition-colors"
                        >
                            Play Again
                        </button>
                    </div>
                </div>
             )}
          </div>
          <div className="mt-4 flex items-center gap-4 text-slate-400 text-sm">
            <div className="flex items-center gap-2">
                <div className="w-3 h-3 bg-[#e0e7ff] rounded-sm"></div> White (You)
            </div>
            <div className="flex items-center gap-2">
                <div className="w-3 h-3 bg-[#4f46e5] rounded-sm"></div> Black (Tutor)
            </div>
          </div>
        </div>

        {/* Chat / Feedback */}
        <div className="lg:col-span-4 h-[500px] lg:h-[600px] order-3">
          <ChatPanel messages={messages} isThinking={isAiThinking} />
        </div>

      </main>
    </div>
  );
};

export default App;
