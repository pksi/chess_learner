import React from 'react';
import { Bot } from 'lucide-react';

interface SidebarRightProps {
    message: string;
}

export const SidebarRight: React.FC<SidebarRightProps> = ({ message }) => {
    return (
        <div className="sidebar-right">
            <div className="panel" style={{ height: '100%' }}>
                <h2 style={{ color: 'white' }}>
                    <Bot size={18} color="var(--accent-purple)" /> Tutor Analysis
                </h2>

                <div style={{ display: 'flex', gap: '12px', marginTop: '1rem' }}>
                    <div style={{
                        width: 32,
                        height: 32,
                        borderRadius: '50%',
                        backgroundColor: 'var(--accent-purple)',
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'center',
                        flexShrink: 0
                    }}>
                        <Bot size={18} color="white" />
                    </div>
                    <div style={{
                        backgroundColor: 'rgba(255, 255, 255, 0.03)',
                        padding: '1rem',
                        borderRadius: '0 12px 12px 12px',
                        fontSize: '0.95rem',
                        lineHeight: 1.5,
                        color: 'var(--text-muted)',
                        border: '1px solid var(--border-color)'
                    }}>
                        <p dangerouslySetInnerHTML={{ __html: message }} />
                    </div>
                </div>
            </div>
        </div>
    );
};
