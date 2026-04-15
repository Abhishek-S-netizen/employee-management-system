import React, { useState } from 'react';
import { Settings, X, Edit2, Trash2, Loader2, Plus } from 'lucide-react';
import './RolesModal.css';

const RolesModal = ({ roles, onClose, onAddRole, onDeleteRole, onUpdateRole }) => {
    const [newRole, setNewRole] = useState('');
    const [isAdding, setIsAdding] = useState(false);
    const [editingId, setEditingId] = useState(null);
    const [editValue, setEditValue] = useState('');

    const handleSubmit = async (e) => {
        e.preventDefault();
        if (!newRole.trim()) return;
        setIsAdding(true);
        await onAddRole(newRole.trim());
        setNewRole('');
        setIsAdding(false);
    };

    const startEdit = (role) => {
        setEditingId(role.id);
        setEditValue(role.name);
    };

    const handleUpdate = async () => {
        if (!editValue.trim()) return;
        await onUpdateRole(editingId, editValue.trim());
        setEditingId(null);
    };

    return (
        <div className="modal-backdrop">
            <div className="modal-card roles-modal-card">
                <div className="modal-header">
                    <div className="modal-title-wrapper">
                        <div className="modal-icon-bg">
                            <Settings size={18} />
                        </div>
                        <div>
                            <h3>Manage Designations</h3>
                            <span className="modal-subtext">SYSTEM_CONFIGURATION</span>
                        </div>
                    </div>
                    <button className="btn-close" onClick={onClose}><X size={20} /></button>
                </div>

                <div className="modal-body">
                    <div className="roles-list-container">
                        {roles.map(role => (
                            <div key={role.id} className="role-row-item">
                                {editingId === role.id ? (
                                    <input
                                        className="edit-role-input"
                                        value={editValue}
                                        autoFocus
                                        onChange={(e) => setEditValue(e.target.value)}
                                        onBlur={handleUpdate}
                                        onKeyDown={(e) => e.key === 'Enter' && handleUpdate()}
                                    />
                                ) : (
                                    <>
                                        <span>{role.name}</span>
                                        <div className="role-actions">
                                            <button className="role-btn role-btn-edit" onClick={() => startEdit(role)}>
                                                <Edit2 size={14} />
                                            </button>
                                            <button className="role-btn role-btn-delete" onClick={() => onDeleteRole(role.id)}>
                                                <Trash2 size={14} />
                                            </button>
                                        </div>
                                    </>
                                )}
                            </div>
                        ))}
                    </div>

                    <form onSubmit={handleSubmit} className="add-role-form">
                        <input
                            type="text"
                            placeholder="Type new role..."
                            value={newRole}
                            onChange={(e) => setNewRole(e.target.value)}
                            className="add-role-input"
                        />
                        <button type="submit" disabled={isAdding} className="btn-modal-submit btn-add-role">
                            {isAdding ? <Loader2 className="animate-spin" size={16} /> : <Plus size={16} />}
                        </button>
                    </form>
                </div>
            </div>
        </div>
    );
};

export default RolesModal;
