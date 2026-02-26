import React, { useState } from 'react';
import { Bot, ChevronDown, ChevronUp } from 'lucide-react';

interface SidebarRightProps {
    message: string;
}

export const SidebarRight: React.FC<SidebarRightProps> = ({ message }) => {
    const [isVisible, setIsVisible] = useState(true);

    return (
        <div className="sidebar-right" style={{ display: 'flex', flexDirection: 'column', gap: '0.75rem' }}>

            {/* Always-visible header card — this NEVER hides */}
            <div className="panel" style={{ padding: '0.9rem 1.2rem', flexShrink: 0, gap: 0 }}>
                <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
                    <h2 style={{ color: 'white', marginBottom: 0, fontSize: '1rem' }}>
                        <Bot size={16} color="var(--accent-purple)" /> Tutor Analysis
                    </h2>
                    <button
                        className={`tutor-toggle-btn${isVisible ? '' : ' collapsed'}`}
                        onClick={() => setIsVisible(v => !v)}
                        title={isVisible ? 'Hide Tutor Analysis' : 'Show Tutor Analysis'}
                    >
                        {isVisible
                            ? <><ChevronUp size={13} /> Hide</>
                            : <><ChevronDown size={13} /> Show</>
                        }
                    </button>
                </div>
            </div>

            {/* Collapsible content panel — conditionally rendered */}
            {isVisible && (
                <div className="panel" style={{ flex: 1 }}>
                    <div style={{ display: 'flex', gap: '12px' }}>
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
            )}
        </div>
    );
};
