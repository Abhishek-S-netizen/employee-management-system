import React from 'react';
import { Mail, Trash2, Edit2, Loader2, AlertCircle, Key } from 'lucide-react';
import './UserCard.css';

const UserCard = ({ emp, onEdit, onDelete, onViewOffer, onRetry, onPasswordUpdate }) => {
    const isPending = emp.offer_letter_status === 'PENDING';
    const isFailed = emp.offer_letter_status === 'FAILED';

    return (
        <div className="mobile-user-card">
            <div className="card-header">
                <div className="identity-block">
                    <div className={`card-avatar avatar-${emp.type}`}>
                        {emp.name.charAt(0)}
                    </div>
                    <div className="identity-text">
                        <h3 className="card-name">{emp.name}</h3>
                        <p className="card-email">{emp.email}</p>
                    </div>
                </div>
                <div className="status-indicator">
                    {isPending ? (
                        <div className="status-dot-pulse pending"></div>
                    ) : isFailed ? (
                        <div className="status-dot shadow-error"></div>
                    ) : (
                        <div className="status-dot active"></div>
                    )}
                </div>
            </div>

            <div className="card-badge-row">
                <div className={`card-badge badge-${emp.type}`}>
                    {emp.badge}
                </div>
                <div className="card-role-title">{emp.role}</div>
            </div>

            <div className="card-footer">
                <div className="footer-left-actions">
                    <a href={`mailto:${emp.email}`} className="card-action-btn icon-mail">
                        <Mail size={18} />
                    </a>
                    <button className="card-action-btn icon-delete" onClick={() => onDelete(emp.employee_code)}>
                        <Trash2 size={18} />
                    </button>
                </div>
                <div className="footer-right-actions">
                    {isFailed ? (
                        <button className="btn-card-primary btn-retry" onClick={() => onRetry(emp.employee_code)}>
                            <Loader2 size={14} className="icon-gap" /> RETRY
                        </button>
                    ) : (
                        <div className="footer-right-grouped">
                            <button className="card-action-btn icon-key" onClick={() => onPasswordUpdate(emp.employee_code)}>
                                <Key size={16} />
                            </button>
                            <button className="btn-card-primary" onClick={() => onEdit(emp)}>
                                <Edit2 size={14} className="icon-gap" /> EDIT
                            </button>
                        </div>
                    )}
                </div>
            </div>
        </div>
    );
};

export default UserCard;
