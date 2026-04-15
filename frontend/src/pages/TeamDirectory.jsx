import React, { useState, useEffect } from 'react';
import {
    Plus, Search, Edit2, Trash2, FileText, Globe, Filter,
    RefreshCw, Loader2, AlertCircle, RotateCcw, UserPlus, Key, ChevronLeft, ChevronRight, CheckCircle2, Settings
} from 'lucide-react';
import './TeamDirectory.css';
import api from '../services/api';
import employeeService from '../services/employeeService';
import OnboardModal from '../components/OnboardModal';
import RolesModal from '../components/RolesModal';
import ConfirmModal from '../components/ConfirmModal';
import PasswordModal from '../components/PasswordModal';
import RolePillBar from '../components/RolePillBar';
import UserCard from '../components/UserCard';


const TeamDirectory = () => {
    const [isModalOpen, setIsModalOpen] = useState(false);
    const [isRolesModalOpen, setIsRolesModalOpen] = useState(false);
    const [isPasswordModalOpen, setIsPasswordModalOpen] = useState(false);
    const [selectedEmployeeCode, setSelectedEmployeeCode] = useState(null);

    const [employees, setEmployees] = useState([]);
    const [roles, setRoles] = useState([]);
    const [page, setPage] = useState(1);
    const [totalPages, setTotalPages] = useState(1);
    const [totalUsers, setTotalUsers] = useState(0);
    const [searchQuery, setSearchQuery] = useState('');
    const [filterRole, setFilterRole] = useState('');
    const [isFilterOpen, setIsFilterOpen] = useState(false);
    const [isRefreshing, setIsRefreshing] = useState(false);

    const [editUser, setEditUser] = useState(null);
    const [toast, setToast] = useState(null);
    const [confirmModal, setConfirmModal] = useState({ isOpen: false, message: '', onConfirm: null });

    const showToast = (message, type = 'success') => {
        setToast({ message, type });
        setTimeout(() => setToast(null), 3000);
    };

    const fetchRoles = async () => {
        try {
            const response = await api.get('/api/employees/roles');
            setRoles(response.data);
        } catch (error) {
            console.error('Failed to fetch roles', error);
        }
    };

    const handleAddRole = async (name) => {
        try {
            await api.post('/api/employees/roles', { name });
            await fetchRoles();
            showToast('New role added!');
        } catch (error) {
            showToast('Failed to add role', 'error');
        }
    };

    const executeDeleteRole = async (id) => {
        try {
            await api.delete(`/api/employees/roles/${id}`);
            await fetchRoles();
            showToast('Designation removed.');
        } catch (error) {
            showToast('Failed to delete role', 'error');
        } finally {
            setConfirmModal({ isOpen: false });
        }
    };

    const handleDeleteRole = (id) => {
        setConfirmModal({
            isOpen: true,
            message: "Are you sure you want to remove this designation? It may be linked to existing records.",
            onConfirm: () => executeDeleteRole(id)
        });
    };

    const handleUpdateRole = async (id, name) => {
        try {
            await api.put(`/api/employees/roles/${id}`, { name });
            await fetchRoles();
            showToast('Designation updated.');
        } catch (error) {
            showToast('Failed to update role', 'error');
        }
    };

    const fetchEmployees = async (currentPage, searchTerm = '', role = '') => {
        try {
            const response = await api.get(`/api/employees?page=${currentPage}&limit=10&search=${encodeURIComponent(searchTerm)}&role=${encodeURIComponent(role)}`);
            const fetchedUsers = response.data.users.map(user => {
                const badge = user.type === 'intern' ? 'INTERN' : 'EMPLOYEE';
                return {
                    ...user,
                    id: user.employee_code,
                    roleTitle: user.title,
                    badge: badge,
                    status: 'ACTIVE'
                };
            });
            setEmployees(fetchedUsers);
            setTotalPages(response.data.totalPages);
            setTotalUsers(response.data.total);
            setPage(response.data.page);
        } catch (error) {
            console.error('Failed to fetch employees', error);
        }
    };

    useEffect(() => {
        fetchRoles();
    }, []);

    useEffect(() => {
        const timer = setTimeout(() => {
            fetchEmployees(page, searchQuery, filterRole);
        }, 300);
        return () => clearTimeout(timer);
    }, [page, searchQuery, filterRole]);

    useEffect(() => {
        const hasPending = employees.some(emp => emp.offer_letter_status === 'PENDING');
        if (hasPending) {
            const pollInterval = setInterval(() => {
                fetchEmployees(page, searchQuery, filterRole);
            }, 5000);
            return () => clearInterval(pollInterval);
        }
    }, [employees, page, searchQuery, filterRole]);

    const handleSearchChange = (e) => {
        setSearchQuery(e.target.value);
        setPage(1);
    };

    const handleManualRefresh = async () => {
        setIsRefreshing(true);
        await fetchEmployees(page, searchQuery, filterRole);
        setTimeout(() => setIsRefreshing(false), 600);
    };

    const handleOnboardSuccess = (message) => {
        fetchEmployees(1, searchQuery, filterRole);
        setPage(1);
        setIsModalOpen(false);
        setEditUser(null);
        showToast(message || 'User saved successfully');
    };

    const executeDelete = async (employeeCode) => {
        try {
            await api.delete(`/api/employees/${employeeCode}`);
            fetchEmployees(page, searchQuery, filterRole);
            showToast('User deleted successfully!');
        } catch (err) {
            showToast('Failed to delete user', 'error');
        } finally {
            setConfirmModal({ isOpen: false });
        }
    };

    const handleDeleteClick = (employeeCode) => {
        setConfirmModal({
            isOpen: true,
            message: `Are you sure you want to completely remove user ${employeeCode}? This cannot be undone.`,
            onConfirm: () => executeDelete(employeeCode)
        });
    };

    const handleEditClick = (emp) => {
        setEditUser(emp);
        setIsModalOpen(true);
    };

    const handlePasswordClick = (code) => {
        setSelectedEmployeeCode(code);
        setIsPasswordModalOpen(true);
    };

    const handleViewOfferLetter = async (employeeCode) => {
        try {
            const response = await api.get(`/api/employees/${employeeCode}/offer-letter`);
            if (response.data.link) {
                window.open(response.data.link, '_blank');
            } else {
                showToast('Offer letter is still generating or unavailable.', 'error');
            }
        } catch (err) {
            showToast('Failed to fetch offer letter. Check back later!', 'error');
        }
    };

    const handleRetryOnboarding = async (employeeCode) => {
        try {
            await employeeService.retryOnboarding(employeeCode);
            showToast('Retry initiated! Processing letter...');
            fetchEmployees(page, searchQuery, filterRole);
        } catch (error) {
            showToast('Failed to initiate retry', 'error');
        }
    };

    return (
        <div className="directory-container">
            {toast && (
                <div className={`toast-notification alert-${toast.type}`}>
                    {toast.type === 'success' ? <CheckCircle2 size={20} /> : <AlertCircle size={20} />}
                    {toast.message}
                </div>
            )}


            {isRolesModalOpen && (
                <RolesModal
                    roles={roles}
                    onClose={() => setIsRolesModalOpen(false)}
                    onAddRole={handleAddRole}
                    onDeleteRole={handleDeleteRole}
                    onUpdateRole={handleUpdateRole}
                />
            )}

            <div className="top-nav desktop-only">
                <div className="breadcrumbs">
                    <span className="crumb text-muted">Portal</span>
                    <span className="separator text-muted">›</span>
                    <span className="crumb active-pill">Employee</span>
                </div>
                <div className="nav-actions">
                    <button className="btn-public">
                        <Globe size={14} className="icon-margin-sm" /> Public Site
                    </button>
                    <div className="nav-profile">
                        <div className="avatar bg-gradient">t</div>
                        <div className="profile-text">
                            <span className="profile-name">test</span>
                            <span className="profile-role">Hr</span>
                        </div>
                    </div>
                </div>
            </div>

            <div className="page-header desktop-only">
                <div>
                    <div className="title-row">
                        <h1>Team Directory</h1>
                        <span className="auth-badge">AUTH_LEVEL_1</span>
                    </div>
                    <div className="subtitle text-muted">{totalUsers} ACTIVE ACCOUNTS</div>
                </div>
                <div className="header-actions">
                    <button className="btn-manage-roles" onClick={() => setIsRolesModalOpen(true)}>
                        <Settings size={15} />
                        <span>DESIGNATIONS</span>
                    </button>
                    <button
                        className={`btn-refresh ${isRefreshing ? 'refreshing' : ''}`}
                        onClick={handleManualRefresh}
                        disabled={isRefreshing}
                    >
                        <RotateCcw size={16} className={isRefreshing ? 'animate-spin' : ''} />
                    </button>
                    <button className="btn-primary" onClick={() => { setEditUser(null); setIsModalOpen(true); }}>
                        <UserPlus size={16} />
                        <span>ONBOARD USER</span>
                    </button>
                </div>
            </div>

            {/* Mobile Header & Filter Bar */}
            <div className="mobile-header mobile-only">
                <div className="mobile-title-area">
                    <div className="mobile-title-group">
                        <span className="mobile-subtitle">DIRECTORY</span>
                        <h1 className="mobile-main-title">Team</h1>
                    </div>
                    <div className="mobile-header-actions">
                        <button
                            className="mobile-onboard-icon"
                            onClick={() => { setEditUser(null); setIsModalOpen(true); }}
                        >
                            <UserPlus size={20} />
                        </button>
                        <button
                            className={`mobile-refresh-icon ${isRefreshing ? 'spinning' : ''}`}
                            onClick={handleManualRefresh}
                        >
                            <RotateCcw size={20} />
                        </button>
                    </div>
                </div>

                <div className="mobile-search-bar">
                    <Search size={18} className="search-icon" />
                    <input
                        type="text"
                        placeholder="Find a member..."
                        value={searchQuery}
                        onChange={handleSearchChange}
                    />
                </div>

                <RolePillBar
                    roles={roles}
                    activeRole={filterRole}
                    onSelect={(role) => { setFilterRole(role); setPage(1); }}
                />
            </div>

            <div className="table-card desktop-only">
                <div className="table-toolbar">
                    <div className="table-search">
                        <Search size={16} className="text-muted" />
                        <input
                            type="text"
                            placeholder="Quick search..."
                            value={searchQuery}
                            onChange={handleSearchChange}
                        />
                    </div>

                    <div className="filter-container">
                        <button className="btn-filter" onClick={() => setIsFilterOpen(!isFilterOpen)}>
                            <Filter size={14} className="icon-margin-sm" />
                            {filterRole ? filterRole.toUpperCase() : 'FILTER'}
                        </button>

                        {isFilterOpen && (
                            <div className="filter-dropdown">
                                <div className={`filter-item ${filterRole === '' ? 'active' : ''}`}
                                    onClick={() => { setFilterRole(''); setIsFilterOpen(false); setPage(1); }}>
                                    All Roles
                                </div>
                                {roles.map(role => (
                                    <div key={role.id}
                                        className={`filter-item ${filterRole === role.name ? 'active' : ''}`}
                                        onClick={() => { setFilterRole(role.name); setIsFilterOpen(false); setPage(1); }}>
                                        {role.name}
                                    </div>
                                ))}
                            </div>
                        )}
                    </div>
                </div>

                <table className="user-table">
                    <thead>
                        <tr>
                            <th style={{ width: '40%' }}>IDENTITY</th>
                            <th style={{ width: '30%' }}>ACCESS LEVEL</th>
                            <th style={{ width: '20%' }}>STATUS</th>
                            <th style={{ width: '10%' }}>CONTROLS</th>
                        </tr>
                    </thead>
                    <tbody>
                        {employees.map((emp, index) => (
                            <tr key={index}>
                                <td>
                                    <div className="identity-cell">
                                        <div className="avatar-circle">{emp.name.charAt(0)}</div>
                                        <div className="identity-text">
                                            <span className="emp-name">{emp.name}</span>
                                            <span className="emp-email text-muted">✉ {emp.email}</span>
                                        </div>
                                    </div>
                                </td>
                                <td>
                                    <div className="access-cell">
                                        <div className={`role-badge badge-${emp.type}`}>
                                            {emp.badge}
                                        </div>
                                        <span className="emp-role text-muted">{emp.role}</span>
                                    </div>
                                </td>
                                <td>
                                    {emp.offer_letter_status === 'PENDING' ? (
                                        <div className="text-pending">
                                            <Loader2 size={14} className="animate-spin" />
                                            Onboarding...
                                        </div>
                                    ) : emp.offer_letter_status === 'FAILED' ? (
                                        <div className="text-failed">
                                            <AlertCircle size={14} />
                                            Action Required
                                        </div>
                                    ) : (
                                        <div className="text-active">
                                            <div className="status-dot"></div>
                                            Active
                                        </div>
                                    )}
                                </td>
                                <td>
                                    <div className="controls-cell">
                                        {emp.offer_letter_status === 'FAILED' ? (
                                            <button className="control-btn icon-retry" onClick={() => handleRetryOnboarding(emp.employee_code)} title="Retry Onboarding">
                                                <RefreshCw size={16} />
                                            </button>
                                        ) : (
                                            <button className="control-btn icon-file" onClick={() => handleViewOfferLetter(emp.employee_code)} title="View Offer Letter">
                                                <FileText size={16} />
                                            </button>
                                        )}
                                        <button className="control-btn icon-edit" onClick={() => handleEditClick(emp)} title="Edit Employee">
                                            <Edit2 size={16} />
                                        </button>
                                        <button className="control-btn icon-key" onClick={() => handlePasswordClick(emp.employee_code)} title="Change Password">
                                            <Key size={16} />
                                        </button>
                                        <button className="control-btn icon-delete" onClick={() => handleDeleteClick(emp.employee_code)} title="Remove Employee">
                                            <Trash2 size={16} />
                                        </button>
                                    </div>
                                </td>
                            </tr>
                        ))}
                    </tbody>
                </table>

                {employees.length > 0 && (
                    <div className="pagination-controls">
                        <div className="page-info text-muted">Showing page {page} of {totalPages}</div>
                        <div className="header-actions">
                            <button className="page-btn" disabled={page === 1} onClick={() => setPage(page - 1)}>
                                <ChevronLeft size={16} />
                            </button>
                            <button className="page-btn" disabled={page === totalPages} onClick={() => setPage(page + 1)}>
                                <ChevronRight size={16} />
                            </button>
                        </div>
                    </div>
                )}
            </div>

            {/* Mobile Card List View */}
            <div className="mobile-cards-view mobile-only">
                {employees.map((emp, index) => (
                    <UserCard
                        key={index}
                        emp={emp}
                        onEdit={handleEditClick}
                        onDelete={handleDeleteClick}
                        onPasswordUpdate={handlePasswordClick}
                        onViewOffer={handleViewOfferLetter}
                        onRetry={handleRetryOnboarding}
                    />
                ))}

                {employees.length > 0 && (
                    <div className="mobile-pagination">
                        <button className="pill-item" disabled={page === 1} onClick={() => setPage(page - 1)}>
                            PREVIOUS
                        </button>
                        <span className="mobile-page-indicator">Page {page} / {totalPages}</span>
                        <button className="pill-item" disabled={page === totalPages} onClick={() => setPage(page + 1)}>
                            NEXT
                        </button>
                    </div>
                )}
            </div>

            {isModalOpen && (
                <OnboardModal
                    roles={roles.map(r => r.name)}
                    onClose={() => { setIsModalOpen(false); setEditUser(null); }}
                    onSuccess={handleOnboardSuccess}
                    initialData={editUser}
                />
            )}

            <ConfirmModal
                isOpen={confirmModal.isOpen}
                message={confirmModal.message}
                onConfirm={confirmModal.onConfirm}
                onCancel={() => setConfirmModal({ isOpen: false })}
            />
            {isPasswordModalOpen && (
                <PasswordModal
                    isOpen={isPasswordModalOpen}
                    employeeCode={selectedEmployeeCode}
                    onClose={() => setIsPasswordModalOpen(false)}
                    onSuccess={(msg) => {
                        setIsPasswordModalOpen(false);
                        alert(msg);
                    }}
                />
            )}
        </div>
    );
};

export default TeamDirectory;
