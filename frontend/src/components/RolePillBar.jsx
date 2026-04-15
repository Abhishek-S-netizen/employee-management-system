import React from 'react';
import './RolePillBar.css';

const RolePillBar = ({ roles, activeRole, onSelect }) => {
    return (
        <div className="mobile-pill-bar">
            <button
                className={`pill-item ${activeRole === '' ? 'active' : ''}`}
                onClick={() => onSelect('')}
            >
                ALL
            </button>
            {roles.map(role => (
                <button
                    key={role.id}
                    className={`pill-item ${activeRole === role.name ? 'active' : ''}`}
                    onClick={() => onSelect(role.name)}
                >
                    {role.name.toUpperCase()}
                </button>
            ))}
        </div>
    );
};

export default RolePillBar;
