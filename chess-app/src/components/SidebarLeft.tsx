import React from 'react';
import { Trophy, BookOpen, Layers, Undo, RotateCcw, Bot } from 'lucide-react';
import type { GameMode } from '../hooks/useChessGame';

interface SidebarLeftProps {
    mode: GameMode;
    setMode: (mode: GameMode) => void;
    learningRole: string | null;
    setLearningRole: (role: string | null) => void;
    onUndo: () => void;
    onReset: () => void;
}

const roles = ['Pawn', 'Knight', 'Bishop', 'Rook', 'Queen', 'King'];

const aiLevels: { id: GameMode; label: string; tag: string; color: string }[] = [
    { id: 'ai-easy', label: 'Easy Level AI', tag: 'Easy', color: '#10B981' },
    { id: 'ai-medium', label: 'Medium Level AI', tag: 'Medium', color: '#F59E0B' },
    { id: 'ai-hard', label: 'Hard Level AI', tag: 'Hard', color: '#EF4444' },
];

export const SidebarLeft: React.FC<SidebarLeftProps> = ({
    mode, setMode, learningRole, setLearningRole, onUndo, onReset
}) => {
    return (
        <div className="sidebar-left">
            <div className="panel" style={{ border: '1px solid var(--accent-purple)' }}>
                <h2 style={{ color: 'white' }}>
                    <Bot size={18} color="var(--accent-purple)" /> User vs Machine
                </h2>
                <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
                    {aiLevels.map((ai) => {
                        const isActive = mode === ai.id && !learningRole;
                        return (
                            <button
                                key={ai.id}
                                className={`btn ${isActive ? 'active' : ''}`}
                                onClick={() => {
                                    setMode(ai.id);
                                    setLearningRole(null);
                                }}
                                style={{ justifyContent: 'space-between' }}
                            >
                                <span style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                                    <span style={{
                                        width: 8,
                                        height: 8,
                                        borderRadius: '50%',
                                        backgroundColor: ai.color
                                    }} />
                                    {ai.label}
                                </span>
                                {isActive && <div style={{ width: 6, height: 6, borderRadius: '50%', backgroundColor: 'white' }} />}
                            </button>
                        );
                    })}
                </div>
            </div>

            <div className="panel">
                <h2 style={{ color: 'white' }}>
                    <Trophy size={18} color="var(--text-muted)" /> Practice Modes
                </h2>
                <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
                    {['Beginner', 'Intermediate', 'Expert'].map((m) => {
                        const modeId = m.toLowerCase() as GameMode;
                        const isActive = mode === modeId && !learningRole;
                        return (
                            <button
                                key={m}
                                className={`btn ${isActive ? 'active' : ''}`}
                                onClick={() => {
                                    setMode(modeId);
                                    setLearningRole(null);
                                }}
                                style={{ justifyContent: 'space-between' }}
                            >
                                {m}
                                {isActive && <div style={{ width: 6, height: 6, borderRadius: '50%', backgroundColor: 'white' }} />}
                            </button>
                        );
                    })}
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

