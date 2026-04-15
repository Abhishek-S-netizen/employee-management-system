import React, { useState } from 'react';
import { Key, Lock, X, CheckCircle, AlertCircle } from 'lucide-react';
import api from '../services/api';
import './PasswordModal.css';

const PasswordModal = ({ isOpen, employeeCode, onClose, onSuccess }) => {
    const [formData, setFormData] = useState({
        currentPassword: '',
        newPassword: '',
        confirmPassword: ''
    });
    const [isLoading, setIsLoading] = useState(false);
    const [error, setError] = useState(null);

    if (!isOpen) return null;

    const handleChange = (e) => {
        setFormData({ ...formData, [e.target.name]: e.target.value });
        setError(null);
    };

    const handleSubmit = async (e) => {
        e.preventDefault();

        if (!formData.currentPassword) {
            setError('Current password is required.');
            return;
        }

        if (formData.newPassword !== formData.confirmPassword) {
            setError('New passwords do not match.');
            return;
        }

        if (formData.newPassword.length < 6) {
            setError('Password must be at least 6 characters long.');
            return;
        }

        setIsLoading(true);
        try {
            await api.put(`/api/employees/${employeeCode}/password`, {
                currentPassword: formData.currentPassword,
                newPassword: formData.newPassword
            });
            onSuccess('Password updated successfully!');
        } catch (err) {
            setError(err.response?.data?.error || 'Failed to update password.');
        } finally {
            setIsLoading(false);
        }
    };

    return (
        <div className="modal-backdrop">
            <div className="modal-card">
                <div className="modal-header">
                    <div className="modal-title-wrapper">
                        <div className="modal-icon-bg" style={{ borderColor: '#e2e8f0', color: '#6366f1' }}>
                            <Key size={18} />
                        </div>
                        <div>
                            <h3>Secure Credential Update</h3>
                            <span className="modal-subtext">REAUTHENTICATION_REQUIRED</span>
                        </div>
                    </div>
                    <button className="btn-close" onClick={onClose}>
                        <X size={20} />
                    </button>
                </div>

                <form className="modal-body" onSubmit={handleSubmit}>
                    {error && (
                        <div className="error-banner">
                            <AlertCircle size={16} className="icon-margin-sm" />
                            {error}
                        </div>
                    )}

                    <div className="form-group">
                        <label>CURRENT PASSWORD</label>
                        <div className="input-wrapper">
                            <Lock size={16} className="input-icon text-muted" />
                            <input
                                type="password"
                                name="currentPassword"
                                placeholder="Verify current credentials..."
                                value={formData.currentPassword}
                                onChange={handleChange}
                                required
                            />
                        </div>
                    </div>

                    <div className="form-group">
                        <label>NEW PASSWORD</label>
                        <div className="input-wrapper">
                            <Key size={16} className="input-icon text-muted" />
                            <input
                                type="password"
                                name="newPassword"
                                placeholder="Enter strong password..."
                                value={formData.newPassword}
                                onChange={handleChange}
                                required
                            />
                        </div>
                    </div>

                    <div className="form-group">
                        <label>CONFIRM NEW PASSWORD</label>
                        <div className="input-wrapper">
                            <CheckCircle size={16} className="input-icon text-muted" />
                            <input
                                type="password"
                                name="confirmPassword"
                                placeholder="Repeat new password..."
                                value={formData.confirmPassword}
                                onChange={handleChange}
                                required
                            />
                        </div>
                    </div>

                    <div className="modal-footer">
                        <button type="button" className="btn-cancel" onClick={onClose}>Cancel</button>
                        <button type="submit" className="btn-modal-submit" disabled={isLoading}>
                            {isLoading ? 'UPDATING...' : 'UPDATE PASSWORD'}
                        </button>
                    </div>
                </form>
            </div>
        </div>
    );
};

export default PasswordModal;
