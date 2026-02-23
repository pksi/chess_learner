import { useState } from 'react';
import './index.css';
import { SidebarLeft } from './components/SidebarLeft';
import { SidebarRight } from './components/SidebarRight';
import { Chessboard } from './components/Chessboard';
import { useChessGame } from './hooks/useChessGame';

function App() {
  const { game, mode, setMode, learningRole, setLearningRole, resetGame, undoMove, makeMove } = useChessGame();
  const [soundEnabled, setSoundEnabled] = useState(true);
  const [warningMessage, setWarningMessage] = useState<string | null>(null);

  const getTutorMessage = () => {
    if (warningMessage) {
      return `<strong style="color: var(--danger)">Warning:</strong> ${warningMessage}`;
    }
    if (learningRole) {
      return `You are now learning how the <strong>${learningRole}</strong> moves! Click on any ${learningRole.toLowerCase()} to see its valid moves.`;
    }
    return `Hello! I'm your chess tutor. You can <strong>Play</strong> a full game or check the <strong>Learn</strong> section to practice specific pieces like the Pawn.`;
  };

  const handleInvalidMove = (message?: string) => {
    setWarningMessage(message || "Invalid move! Remember the rules for this piece.");
    setTimeout(() => {
      setWarningMessage(null);
    }, 3000);
  };

  return (
    <div className="app-container">
      <SidebarLeft
        mode={mode}
        setMode={setMode}
        learningRole={learningRole}
        setLearningRole={setLearningRole}
        onUndo={undoMove}
        onReset={resetGame}
      />

      <div className="center-board">
        <Chessboard
          game={game}
          onMakeMove={makeMove}
          soundEnabled={soundEnabled}
          onInvalidMove={handleInvalidMove}
          showHints={mode === 'beginner'}
        />
        <div style={{ marginTop: '1rem', display: 'flex', alignItems: 'center', justifyContent: 'space-between', width: '100%', maxWidth: '600px', fontSize: '0.9rem' }}>
          <div style={{ display: 'flex', gap: '1rem' }}>
            <span style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
              <div style={{ width: 12, height: 12, backgroundColor: 'white', borderRadius: 2 }} /> White (You)
            </span>
            <span style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', color: 'var(--text-muted)' }}>
              <div style={{ width: 12, height: 12, backgroundColor: 'var(--panel-bg)', borderRadius: 2 }} /> Black (Tutor)
            </span>
          </div>
          <label style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', cursor: 'pointer', color: 'var(--text-muted)' }}>
            <input
              type="checkbox"
              checked={soundEnabled}
              onChange={(e) => setSoundEnabled(e.target.checked)}
              style={{ accentColor: 'var(--accent-purple)' }}
            />
            Sound On
          </label>
        </div>
      </div>

      <SidebarRight message={getTutorMessage()} />
    </div>
  );
}

export default App;
