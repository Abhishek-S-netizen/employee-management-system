import React from 'react';
import { AlertCircle, X } from 'lucide-react';
import './ConfirmModal.css';

const ConfirmModal = ({ isOpen, message, onConfirm, onCancel, zIndex = 3000 }) => {
    if (!isOpen) return null;

    return (
        <div className="modal-backdrop" style={{ zIndex }}>
            <div className="modal-card">
                <div className="modal-header">
                    <div className="modal-title-wrapper">
                        <div className="modal-icon-bg" style={{ borderColor: '#fecaca', color: '#ef4444' }}>
                            <AlertCircle size={18} />
                        </div>
                        <div>
                            <h3>Confirm Action</h3>
                            <span className="modal-subtext">DESTRUCTIVE_PROCEDURE</span>
                        </div>
                    </div>
                    <button className="btn-close" onClick={onCancel}>
                        <X size={20} />
                    </button>
                </div>
                <div className="modal-body">
                    <p className="confirm-modal-text">
                        {message}
                    </p>
                </div>
                <div className="modal-footer">
                    <button className="btn-cancel" onClick={onCancel}>
                        Go Back
                    </button>
                    <button className="btn-danger" onClick={onConfirm}>
                        Yes, Delete
                    </button>
                </div>
            </div>
        </div>
    );
};

export default ConfirmModal;
