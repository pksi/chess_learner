import React from 'react';
import { Trophy, BookOpen, Layers, Undo, RotateCcw } from 'lucide-react';

interface SidebarLeftProps {
    mode: 'beginner' | 'intermediate' | 'expert';
    setMode: (mode: 'beginner' | 'intermediate' | 'expert') => void;
    learningRole: string | null;
    setLearningRole: (role: string | null) => void;
    onUndo: () => void;
    onReset: () => void;
}

const roles = ['Pawn', 'Knight', 'Bishop', 'Rook', 'Queen', 'King'];

export const SidebarLeft: React.FC<SidebarLeftProps> = ({
    mode, setMode, learningRole, setLearningRole, onUndo, onReset
}) => {
    return (
        <div className="sidebar-left">
            <div className="panel" style={{ border: '1px solid var(--accent-purple)' }}>
                <h2 style={{ color: 'white' }}>
                    <Trophy size={18} color="var(--accent-purple)" /> Play Mode
                </h2>
                <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
                    {['Beginner', 'Intermediate', 'Expert'].map((m) => (
                        <button
                            key={m}
                            className={`btn ${mode === m.toLowerCase() ? 'active' : ''}`}
                            onClick={() => {
                                setMode(m.toLowerCase() as any);
                                setLearningRole(null);
                            }}
                            style={{ justifyContent: 'space-between' }}
                        >
                            {m}
                            {mode === m.toLowerCase() && <div style={{ width: 6, height: 6, borderRadius: '50%', backgroundColor: 'white' }} />}
                        </button>
                    ))}
                </div>
            </div>

            <div className="panel">
                <h2 style={{ color: 'white' }}>
                    <BookOpen size={18} color="var(--text-muted)" /> Learn Roles
                </h2>
                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '8px' }}>
                    {roles.map((role) => (
                        <button
                            key={role}
                            className={`btn ${learningRole === role ? 'active' : ''}`}
                            onClick={() => setLearningRole(role)}
                            style={{ justifyContent: 'center', padding: '0.6rem' }}
                        >
                            {role}
                        </button>
                    ))}
                </div>
            </div>

            <div className="panel">
                <h2 style={{ color: 'white' }}>
                    <Layers size={18} color="var(--text-muted)" /> Actions
                </h2>
                <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
                    <button className="btn" onClick={onUndo} style={{ justifyContent: 'center', gap: '8px' }}>
                        <Undo size={16} /> Undo Move
                    </button>
                    <button className="btn" onClick={onReset} style={{ justifyContent: 'center', gap: '8px' }}>
                        <RotateCcw size={16} /> Reset Board
                    </button>
                </div>
            </div>
        </div>
    );
};
