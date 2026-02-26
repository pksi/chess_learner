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
  const [isFullscreen, setIsFullscreen] = useState(false);

  const toggleFullscreen = () => {
    const elem = document.getElementById('board-container');
    if (!elem) return;

    if (!document.fullscreenElement) {
      elem.requestFullscreen().catch(err => {
        console.error(`Error attempting to enable full-screen mode: ${err.message}`);
      });
      setIsFullscreen(true);
    } else {
      document.exitFullscreen();
      setIsFullscreen(false);
    }
  };

  // Sync state if user exits via Esc key
  useState(() => {
    const handleFsChange = () => {
      setIsFullscreen(!!document.fullscreenElement);
    };
    document.addEventListener('fullscreenchange', handleFsChange);
    return () => document.removeEventListener('fullscreenchange', handleFsChange);
  });

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
        <div id="board-container" className={isFullscreen ? 'fullscreen-mode' : ''} style={{
          display: 'flex',
          flexDirection: 'column',
          alignItems: 'center',
          justifyContent: 'center',
          backgroundColor: isFullscreen ? 'var(--bg-dark)' : 'transparent',
          padding: isFullscreen ? '2rem' : '0',
          width: isFullscreen ? '100%' : 'auto'
        }}>
          <Chessboard
            game={game}
            onMakeMove={makeMove}
            soundEnabled={soundEnabled}
            onInvalidMove={handleInvalidMove}
            showHints={mode === 'beginner'}
          />
          <div style={{ marginTop: '1rem', display: 'flex', alignItems: 'center', justifyContent: 'space-between', width: '100%', maxWidth: '800px', fontSize: '0.9rem' }}>
            <div style={{ display: 'flex', gap: '1rem' }}>
              <span style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                <div style={{ width: 12, height: 12, backgroundColor: 'white', borderRadius: 2 }} /> White (You)
              </span>
              <span style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', color: 'var(--text-muted)' }}>
                <div style={{ width: 12, height: 12, backgroundColor: 'var(--panel-bg)', borderRadius: 2 }} /> Black (Tutor)
              </span>
            </div>
            <div style={{ display: 'flex', alignItems: 'center', gap: '1.5rem' }}>
              <button
                onClick={toggleFullscreen}
                className="fs-btn"
                title={isFullscreen ? "Exit Fullscreen" : "Enter Fullscreen"}
              >
                {isFullscreen ? (
                  <>
                    <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M8 3v3a2 2 0 0 1-2 2H3m18 0h-3a2 2 0 0 1-2-2V3m0 18v-3a2 2 0 0 1 2-2h3M3 16h3a2 2 0 0 1 2 2v3" /></svg>
                    Exit Fullscreen
                  </>
                ) : (
                  <>
                    <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M15 3h6v6M9 21H3v-6M21 3l-7 7M3 21l7-7" /></svg>
                    Fullscreen
                  </>
                )}
              </button>
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
        </div>
      </div>

      <SidebarRight message={getTutorMessage()} />
    </div>
  );
}

export default App;
