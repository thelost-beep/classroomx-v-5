import { useState, useEffect } from 'react'
import { Search, UserPlus, Shield, Trash2, Edit } from 'lucide-react'
import { getAllUsers, adminUpdateUserRole, adminCreateUser } from '@/lib/api/admin'
import { supabase } from '@/lib/supabase'
import { Avatar, Button } from '@/components/ui'
import { toast } from '@/hooks/useToast'
import './Users.css'

export function Users() {
    const [users, setUsers] = useState<any[]>([])
    const [loading, setLoading] = useState(true)
    const [searchTerm, setSearchTerm] = useState('')
    const [isAddModalOpen, setIsAddModalOpen] = useState(false)
    const [newUser, setNewUser] = useState({ name: '', email: '', role: 'student' })
    const [addingUser, setAddingUser] = useState(false)

    useEffect(() => {
        fetchUsers()
    }, [])

    const fetchUsers = async () => {
        try {
            setLoading(true)
            const data = await getAllUsers()
            setUsers(data || [])
        } catch (error) {
            console.error('Error fetching users:', error)
            toast.error('Failed to load users')
        } finally {
            setLoading(false)
        }
    }

    const handleUpdateRole = async (userId: string, currentRole: string) => {
        const roles: ('student' | 'teacher' | 'admin')[] = ['student', 'teacher', 'admin']
        const nextRole = roles[(roles.indexOf(currentRole as any) + 1) % roles.length]

        if (window.confirm(`Change user role to ${nextRole}?`)) {
            try {
                await adminUpdateUserRole(userId, nextRole)
                toast.success('User role updated successfully')
                fetchUsers()
            } catch (error) {
                toast.error('Failed to update role')
            }
        }
    }

    const handleAddUser = async (e: React.FormEvent) => {
        e.preventDefault()
        if (!newUser.name || !newUser.email) return

        try {
            setAddingUser(true)
            const COMMON_PASSWORD = 'ClassroomX123!'

            // 1. Sign up the user in auth system
            const { error: authError } = await supabase.auth.signUp({
                email: newUser.email,
                password: COMMON_PASSWORD,
                options: {
                    data: { name: newUser.name }
                }
            })

            // If user already exists, signUp might fail, but we can still try to create/fix their profile
            if (authError && authError.message !== 'User already registered') {
                throw authError
            }

            // 2. Set the profile and role via our RPC
            // This will work even if they were already signed up
            await adminCreateUser(newUser.email, newUser.name, newUser.role)

            toast.success('User created successfully with common password')
            setIsAddModalOpen(false)
            setNewUser({ name: '', email: '', role: 'student' })
            fetchUsers()
        } catch (error: any) {
            console.error('Error creating user:', error)
            toast.error(error.message || 'Failed to create user')
        } finally {
            setAddingUser(false)
        }
    }

    const filteredUsers = users.filter(user =>
        user.name?.toLowerCase().includes(searchTerm.toLowerCase()) ||
        user.email?.toLowerCase().includes(searchTerm.toLowerCase())
    )

    return (
        <div className="admin-users">
            <header className="users-header">
                <h1>User Management</h1>
                <Button variant="primary" className="add-user-btn" onClick={() => setIsAddModalOpen(true)}>
                    <UserPlus size={18} />
                    <span>Add User</span>
                </Button>
            </header>

            {isAddModalOpen && (
                <div className="admin-modal-overlay">
                    <div className="admin-modal">
                        <h2>Create New User</h2>
                        <form onSubmit={handleAddUser}>
                            <div className="form-group">
                                <label>Full Name</label>
                                <input
                                    type="text"
                                    value={newUser.name}
                                    onChange={(e) => setNewUser({ ...newUser, name: e.target.value })}
                                    placeholder="John Doe"
                                    required
                                />
                            </div>
                            <div className="form-group">
                                <label>Email Address</label>
                                <input
                                    type="email"
                                    value={newUser.email}
                                    onChange={(e) => setNewUser({ ...newUser, email: e.target.value })}
                                    placeholder="john@example.com"
                                    required
                                />
                            </div>
                            <div className="form-group">
                                <label>Initial Role</label>
                                <select
                                    value={newUser.role}
                                    onChange={(e) => setNewUser({ ...newUser, role: e.target.value })}
                                >
                                    <option value="student">Student</option>
                                    <option value="teacher">Teacher</option>
                                    <option value="admin">Admin</option>
                                </select>
                            </div>
                            <p className="password-info">
                                New user will be assigned password: <code>ClassroomX123!</code>
                            </p>
                            <div className="modal-actions">
                                <button type="button" className="btn-secondary" onClick={() => setIsAddModalOpen(false)}>
                                    Cancel
                                </button>
                                <button type="submit" className="btn-primary" disabled={addingUser}>
                                    {addingUser ? 'Creating...' : 'Create User'}
                                </button>
                            </div>
                        </form>
                    </div>
                </div>
            )}

            <div className="users-controls">
                <div className="search-bar">
                    <Search size={18} />
                    <input
                        type="text"
                        placeholder="Search users..."
                        value={searchTerm}
                        onChange={(e) => setSearchTerm(e.target.value)}
                    />
                </div>
            </div>

            <div className="users-list-container">
                {loading ? (
                    <div className="loading">Loading users...</div>
                ) : filteredUsers.length === 0 ? (
                    <div className="empty">No users found</div>
                ) : (
                    <table className="users-table">
                        <thead>
                            <tr>
                                <th>User</th>
                                <th>Email</th>
                                <th>Role</th>
                                <th>Status</th>
                                <th>Actions</th>
                            </tr>
                        </thead>
                        <tbody>
                            {filteredUsers.map((user) => (
                                <tr key={user.id}>
                                    <td>
                                        <div className="user-info-cell">
                                            <Avatar src={user.avatar_url} fallback={user.name} size="sm" />
                                            <span>{user.name}</span>
                                        </div>
                                    </td>
                                    <td>{user.email}</td>
                                    <td>
                                        <span className={`role-badge ${user.role}`}>
                                            {user.role}
                                        </span>
                                    </td>
                                    <td>
                                        <span className={`status-indicator ${user.is_profile_complete ? 'complete' : 'pending'}`}>
                                            {user.is_profile_complete ? 'Active' : 'Incomplete'}
                                        </span>
                                    </td>
                                    <td>
                                        <div className="action-buttons">
                                            <button onClick={() => handleUpdateRole(user.id, user.role)} title="Change Role">
                                                <Shield size={18} />
                                            </button>
                                            <button title="Edit User">
                                                <Edit size={18} />
                                            </button>
                                            <button className="delete" title="Delete User">
                                                <Trash2 size={18} />
                                            </button>
                                        </div>
                                    </td>
                                </tr>
                            ))}
                        </tbody>
                    </table>
                )}
            </div>
        </div>
    )
}
