import React, { useEffect, useState } from 'react';
import { useParams } from 'react-router-dom';
import { CheckCircle, ShieldCheck, Download, AlertCircle, Loader2, ShieldAlert, Home } from 'lucide-react';
import employeeService from '../services/employeeService';
import './PublicIDCard.css';

const PublicIDCard = () => {
    const { code } = useParams();
    const [employee, setEmployee] = useState(null);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState(null);

    useEffect(() => {
        const fetchDetails = async () => {
            try {
                setLoading(true);
                const data = await employeeService.getPublicDetails(code);
                setEmployee(data);
            } catch (err) {
                setError(err.response?.data?.error || 'Failed to verify employee record.');
            } finally {
                setLoading(false);
            }
        };

        if (code) {
            fetchDetails();
        }
    }, [code]);

    const handleDownload = () => {
        window.print();
    };

    if (loading) {
        return (
            <div className="id-loading-container">
                <Loader2 className="animate-spin" size={48} color="#922D2F" />
                <p className="id-loading-text">Verifying Credentials...</p>
            </div>
        );
    }

    if (error) {
        return (
            <div className="id-page-wrapper fallback-theme">
                <div className="id-error-card">
                    <div className="id-error-header">
                        <ShieldAlert size={48} color="#ef4444" />
                    </div>
                    <div className="id-error-body">
                        <h2 className="id-error-title">Verification Invalid</h2>
                        <div className="id-error-status-badge">FAILED_INTEGRITY_CHECK</div>
                        <p className="id-error-text">
                            The credential seal you scanned could not be verified by the HR Management System.
                            This may be due to an expired record or an invalid digital signature.
                        </p>

                        <div className="id-error-info-box">
                            <AlertCircle size={16} />
                            <span>Reference Code: {code || 'N/A'}</span>
                        </div>
                    </div>
                    <div className="id-error-footer">
                        <button onClick={() => window.location.href = '/'} className="id-back-home-btn">
                            <Home size={18} />
                            Return to Corporate Portal
                        </button>
                    </div>
                </div>
                <p className="id-fallback-disclaimer">
                    Strict Security Protocol AR-401 Enabled
                </p>
            </div>
        );
    }

    return (
        <div className="id-page-wrapper">
            <div className="no-print id-header">
                <div className="id-verified-status">
                    <ShieldCheck size={20} color="#922D2F" />
                    <span className="id-verified-status-text">Official Verification Portal</span>
                </div>
            </div>

            <div id="id-card" className="id-card-main">
                {/* Top Decorative Section */}
                <div className="id-card-header">
                    <div className="id-logo-container">
                        <span className="id-logo-text">{employee.type === 'employee' ? 'E' : 'IN'}</span>
                    </div>
                    <div className="id-verified-badge">
                        <CheckCircle size={16} color="#ffffff" />
                        <span>Verified</span>
                    </div>
                </div>

                {/* Profile Info */}
                <div className="id-profile-section">
                    <div className="id-avatar">
                        {employee.name.split(' ').map(n => n[0]).join('')}
                    </div>
                    <h1 className="id-employee-name">{employee.name}</h1>
                    <p className="id-employee-title">{employee.title}</p>
                    <div className={`id-role-badge ${employee.type}`}>
                        {employee.type.toUpperCase()}
                    </div>
                </div>

                {/* Details Grid */}
                <div className="id-details-grid">
                    <div className="id-detail-item">
                        <span className="id-detail-label">Role</span>
                        <span className="id-detail-value">{employee.role}</span>
                    </div>
                    <div className="id-detail-item">
                        <span className="id-detail-label">Employee ID</span>
                        <span className="id-detail-value">{employee.employee_code}</span>
                    </div>
                    <div className="id-detail-item">
                        <span className="id-detail-label">Joined Date</span>
                        <span className="id-detail-value">{new Date(employee.start_date).toLocaleDateString()}</span>
                    </div>
                    <div className="id-detail-item">
                        <span className="id-detail-label">Official Email</span>
                        <span className="id-detail-value">{employee.email}</span>
                    </div>
                </div>

                {/* Bottom Bar */}
                <div className="id-card-footer">
                    <div className="id-footer-divider"></div>
                    <p className="id-footer-caption">Securely verified by HR Management System</p>
                </div>
            </div>

            <button className="no-print id-download-btn" onClick={handleDownload} >
                <Download size={20} />
                Download ID Card
            </button>
        </div>
    );
};

export default PublicIDCard;
