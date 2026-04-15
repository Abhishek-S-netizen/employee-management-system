import React, { useState, useRef, useEffect } from 'react';
import { User, Mail, Shield, Briefcase, Calendar, X, ChevronDown, Check } from 'lucide-react';
import api from '../services/api';
import './OnboardModal.css';

const OnboardModal = ({ onClose, onSuccess, initialData, roles = [] }) => {
    const defaultRole = roles.length > 0 ? roles[0] : 'Developer';

    const [formData, setFormData] = useState({
        name: initialData?.name || '',
        email: initialData?.email || '',
        password: '', // New password field
        role: initialData?.role || defaultRole,
        title: initialData?.title || '',
        type: initialData?.type || 'employee',
        start_date: initialData?.start_date ? initialData.start_date.split('T')[0] : '',
        end_date: initialData?.end_date ? initialData.end_date.split('T')[0] : ''
    });

    const today = new Date().toISOString().split('T')[0];

    const [isLoading, setIsLoading] = useState(false);
    const [error, setError] = useState(null);
    const [activeDropdown, setActiveDropdown] = useState(null); // 'role' or 'type'

    const roleRef = useRef(null);
    const typeRef = useRef(null);

    // Click outside to close logic
    useEffect(() => {
        const handleClickOutside = (event) => {
            if (activeDropdown === 'role' && roleRef.current && !roleRef.current.contains(event.target)) {
                setActiveDropdown(null);
            }
            if (activeDropdown === 'type' && typeRef.current && !typeRef.current.contains(event.target)) {
                setActiveDropdown(null);
            }
        };
        document.addEventListener('mousedown', handleClickOutside);
        return () => document.removeEventListener('mousedown', handleClickOutside);
    }, [activeDropdown]);

    const handleChange = (e) => {
        setFormData({ ...formData, [e.target.name]: e.target.value });
        setError(null);
    };

    const handleSelectAction = (name, value) => {
        setFormData({ ...formData, [name]: value });
        setActiveDropdown(null);
        setError(null);
    };

    const handleSubmit = async (e) => {
        e.preventDefault();

        // Date Validation
        if (formData.start_date < today) {
            setError('Start date cannot be in the past');
            return;
        }

        if (formData.type === 'intern') {
            if (!formData.end_date) {
                setError('End date is required for interns');
                return;
            }
            if (formData.end_date < today) {
                setError('End date cannot be in the past');
                return;
            }
            if (formData.end_date <= formData.start_date) {
                setError('End date must be strictly after the start date');
                return;
            }
        }

        setIsLoading(true);
        try {
            if (initialData) {
                const response = await api.put(`/api/employees/${initialData.id}`, formData);
                if (response.data && response.data.user) {
                    onSuccess('User successfully updated!');
                }
            } else {
                const response = await api.post('/api/employees/appoint', formData);
                if (response.data && response.data.user) {
                    onSuccess('User successfully onboarded!');
                }
            }
        } catch (err) {
            setError(err.response?.data?.error || 'Something went wrong while processing user.');
        } finally {
            setIsLoading(false);
        }
    };

    const roleOptions = roles;
    const typeOptions = [
        { label: 'Employee', value: 'employee' },
        { label: 'Intern', value: 'intern' }
    ];

    return (
        <div className="modal-backdrop">
            <div className="modal-card">

                <div className="modal-header">
                    <div className="modal-title-wrapper">
                        <div className="modal-icon-bg">
                            <User size={18} />
                        </div>
                        <div>
                            <h2>{initialData ? 'Edit User Record' : 'Onboard User'}</h2>
                            <span className="modal-subtext">{initialData ? 'UPDATE_ENTRY' : 'NEW_ENTRY'}</span>
                        </div>
                    </div>
                    <button className="btn-close" onClick={onClose} disabled={isLoading}>
                        <X size={20} className="text-muted" />
                    </button>
                </div>

                <form className="modal-body" onSubmit={handleSubmit}>

                    {error && <div className="error-banner">{error}</div>}

                    <div className="form-group">
                        <label>FULL NAME</label>
                        <div className="input-wrapper">
                            <User size={16} className="input-icon text-muted" />
                            <input
                                type="text"
                                name="name"
                                placeholder="Enter full name..."
                                value={formData.name} onChange={handleChange} required
                            />
                        </div>
                    </div>

                    <div className="form-group">
                        <label>EMAIL</label>
                        <div className="input-wrapper">
                            <Mail size={16} className="input-icon text-muted" />
                            <input
                                type="email"
                                name="email"
                                placeholder="user@devlab.com"
                                value={formData.email} onChange={handleChange} required
                            />
                        </div>
                    </div>

                    {!initialData && (
                        <div className="form-group">
                            <label>PASSWORD</label>
                            <div className="input-wrapper">
                                <Shield size={16} className="input-icon text-muted" />
                                <input
                                    type="password"
                                    name="password"
                                    placeholder="••••••••"
                                    value={formData.password} onChange={handleChange} required
                                />
                            </div>
                        </div>
                    )}

                    <div className="form-row" style={{ zIndex: 100 }}>
                        <div className="form-group half" ref={roleRef}>
                            <label>ROLE</label>
                            <div className="input-wrapper select-wrapper custom-select"
                                onClick={() => setActiveDropdown(activeDropdown === 'role' ? null : 'role')}>
                                <Shield size={16} className="input-icon text-muted" />
                                <div className="select-trigger-text">{formData.role}</div>
                                <ChevronDown className={`select-arrow ${activeDropdown === 'role' ? 'open' : ''}`} size={14} />

                                {activeDropdown === 'role' && (
                                    <div className="custom-dropdown-options">
                                        {roleOptions.map(opt => (
                                            <div key={opt}
                                                className={`custom-option ${formData.role === opt ? 'active' : ''}`}
                                                onClick={(e) => { e.stopPropagation(); handleSelectAction('role', opt); }}>
                                                {opt}
                                                {formData.role === opt && <Check size={12} />}
                                            </div>
                                        ))}
                                    </div>
                                )}
                            </div>
                        </div>
                        <div className="form-group half" ref={typeRef}>
                            <label>TYPE</label>
                            <div className="input-wrapper select-wrapper custom-select"
                                onClick={() => setActiveDropdown(activeDropdown === 'type' ? null : 'type')}>
                                <Briefcase size={16} className="input-icon text-muted" />
                                <div className="select-trigger-text">
                                    {typeOptions.find(t => t.value === formData.type)?.label}
                                </div>
                                <ChevronDown className={`select-arrow ${activeDropdown === 'type' ? 'open' : ''}`} size={14} />

                                {activeDropdown === 'type' && (
                                    <div className="custom-dropdown-options">
                                        {typeOptions.map(opt => (
                                            <div key={opt.value}
                                                className={`custom-option ${formData.type === opt.value ? 'active' : ''}`}
                                                onClick={(e) => { e.stopPropagation(); handleSelectAction('type', opt.value); }}>
                                                {opt.label}
                                                {formData.type === opt.value && <Check size={12} />}
                                            </div>
                                        ))}
                                    </div>
                                )}
                            </div>
                        </div>
                    </div>

                    <div className="form-group">
                        <label>TITLE</label>
                        <div className="input-wrapper">
                            <Briefcase size={16} className="input-icon text-muted" />
                            <input
                                type="text"
                                name="title"
                                placeholder="e.g. Senior Frontend Engineer"
                                value={formData.title} onChange={handleChange} required
                            />
                        </div>
                    </div>

                    <div className="form-row">
                        <div className="form-group half">
                            <label>START DATE</label>
                            <div className="input-wrapper">
                                <Calendar size={16} className="input-icon text-muted" />
                                <input
                                    type="date"
                                    name="start_date"
                                    min={today}
                                    value={formData.start_date} onChange={handleChange} required
                                />
                            </div>
                        </div>
                        {formData.type === 'intern' && (
                            <div className="form-group half">
                                <label>END DATE</label>
                                <div className="input-wrapper">
                                    <Calendar size={16} className="input-icon text-muted" />
                                    <input
                                        type="date"
                                        name="end_date"
                                        min={formData.start_date || today}
                                        value={formData.end_date} onChange={handleChange} required
                                    />
                                </div>
                            </div>
                        )}
                    </div>

                    <div className="modal-footer">
                        <button type="button" className="btn-cancel" onClick={onClose} disabled={isLoading}>Cancel</button>
                        <button type="submit" className="btn-modal-submit" disabled={isLoading}>
                            {isLoading ? (initialData ? 'SAVING...' : 'CREATING...') : (initialData ? 'SAVE CHANGES' : 'CREATE USER')}
                        </button>
                    </div>

                </form>
            </div>
        </div>
    );
};

export default OnboardModal;
