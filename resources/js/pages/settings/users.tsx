import { Head, useForm, usePage } from '@inertiajs/react';
import { router } from '@inertiajs/react';
import { useState } from 'react';
import Heading from '@/components/heading';

interface User {
    id:         number;
    name:       string;
    email:      string;
    permission: 'admin' | 'super-admin';
    is_current: boolean;
}

interface Props {
    users: User[];
}

export default function Users({ users }: Props) {
    const { props } = usePage<any>();
    const flash      = props.flash ?? {};

    const [showCreateForm, setShowCreateForm] = useState(false);
    const [confirmDeleteId, setConfirmDeleteId] = useState<number | null>(null);

    const { data, setData, post, processing, errors, reset } = useForm({
        name:                  '',
        email:                 '',
        password:              '',
        password_confirmation: '',
        permission:            'admin',
    });

    const handleCreate = () => {
        post('/settings/users', {
            onSuccess: () => {
                reset();
                setShowCreateForm(false);
            },
        });
    };

    const handleDelete = (userId: number) => {
        router.delete(`/settings/users/${userId}`, {
            onSuccess: () => setConfirmDeleteId(null),
        });
    };

    return (
        <>
            <Head title="User Management" />

            <h1 className="sr-only">User Management</h1>

            <div className="space-y-6">
                <div className="flex items-center justify-between">
                    <Heading
                        variant="small"
                        title="User Management"
                        description="Manage who has access to Diamond Gallery CRM"
                    />
                    <button
                        onClick={() => setShowCreateForm(true)}
                        className="btn btn-gold"
                    >
                        + New User
                    </button>
                </div>

                {/* Flash message */}
                {flash.success && (
                    <div className="text-xs px-3 py-2 bg-green-50 border border-green-300 text-green-700 rounded">
                        ✓ {flash.success}
                    </div>
                )}

                {/* Users Table */}
                <div className="bg-white border border-border rounded-lg overflow-hidden">
                    <table className="w-full text-sm">
                        <thead>
                            <tr className="bg-surface-2 border-b border-border">
                                <th className="text-left px-4 py-3 text-ink-soft uppercase tracking-widest text-xs font-medium">Name</th>
                                <th className="text-left px-4 py-3 text-ink-soft uppercase tracking-widest text-xs font-medium">Email</th>
                                <th className="text-left px-4 py-3 text-ink-soft uppercase tracking-widest text-xs font-medium">Permission</th>
                                <th className="px-4 py-3"></th>
                            </tr>
                        </thead>
                        <tbody>
                            {users.map((user) => (
                                <tr key={user.id} className="border-b border-surface-2 hover:bg-surface transition-colors">
                                    <td className="px-4 py-3 font-medium">
                                        {user.name}
                                        {user.is_current && <span className="ml-2 text-xs text-ink-soft">(you)</span>}
                                    </td>
                                    <td className="px-4 py-3 text-ink-mid">{user.email}</td>
                                    <td className="px-4 py-3">
                                        <span className={`text-xs px-2 py-1 rounded-full font-medium ${
                                            user.permission === 'super-admin'
                                                ? 'bg-purple-100 text-purple-700'
                                                : 'bg-surface-2 text-ink-mid'
                                        }`}>
                                            {user.permission}
                                        </span>
                                    </td>
                                    <td className="px-4 py-3 text-right">
                                        {!user.is_current && (
                                            <button
                                                onClick={() => setConfirmDeleteId(user.id)}
                                                className="text-xs text-red-600 hover:underline"
                                            >
                                                Delete
                                            </button>
                                        )}
                                    </td>
                                </tr>
                            ))}
                        </tbody>
                    </table>
                </div>
            </div>

            {/* Create User Modal */}
            {showCreateForm && (
                <div className="fixed inset-0 z-50 bg-black/40 flex items-center justify-center p-4">
                    <div className="bg-white rounded-xl w-full max-w-md shadow-xl">
                        <div className="p-5 border-b border-border">
                            <h3 className="font-serif text-lg font-medium">Create new user</h3>
                        </div>
                        <div className="p-5 space-y-4">
                            <div>
                                <label className="text-xs text-ink-soft uppercase tracking-widest block mb-1">Name</label>
                                <input
                                    type="text"
                                    value={data.name}
                                    onChange={(e) => setData('name', e.target.value)}
                                    placeholder="Full name"
                                    className="w-full text-sm border border-border rounded px-3 py-2"
                                    style={{ marginBottom: 0 }}
                                />
                                {errors.name && <p className="text-xs text-red-600 mt-1">{errors.name}</p>}
                            </div>
                            <div>
                                <label className="text-xs text-ink-soft uppercase tracking-widest block mb-1">Email</label>
                                <input
                                    type="email"
                                    value={data.email}
                                    onChange={(e) => setData('email', e.target.value)}
                                    placeholder="email@diamondgallery.com.au"
                                    className="w-full text-sm border border-border rounded px-3 py-2"
                                    style={{ marginBottom: 0 }}
                                />
                                {errors.email && <p className="text-xs text-red-600 mt-1">{errors.email}</p>}
                            </div>
                            <div>
                                <label className="text-xs text-ink-soft uppercase tracking-widest block mb-1">Password</label>
                                <input
                                    type="password"
                                    value={data.password}
                                    onChange={(e) => setData('password', e.target.value)}
                                    placeholder="Min 8 characters"
                                    className="w-full text-sm border border-border rounded px-3 py-2"
                                    style={{ marginBottom: 0 }}
                                />
                                {errors.password && <p className="text-xs text-red-600 mt-1">{errors.password}</p>}
                            </div>
                            <div>
                                <label className="text-xs text-ink-soft uppercase tracking-widest block mb-1">Confirm password</label>
                                <input
                                    type="password"
                                    value={data.password_confirmation}
                                    onChange={(e) => setData('password_confirmation', e.target.value)}
                                    placeholder="Repeat password"
                                    className="w-full text-sm border border-border rounded px-3 py-2"
                                    style={{ marginBottom: 0 }}
                                />
                            </div>
                            <div>
                                <label className="text-xs text-ink-soft uppercase tracking-widest block mb-1">Permission</label>
                                <select
                                    value={data.permission}
                                    onChange={(e) => setData('permission', e.target.value)}
                                    className="w-full text-sm border border-border rounded px-3 py-2 bg-white"
                                    style={{ marginBottom: 0 }}
                                >
                                    <option value="admin">Admin</option>
                                    <option value="super-admin">Super Admin</option>
                                </select>
                                {errors.permission && <p className="text-xs text-red-600 mt-1">{errors.permission}</p>}
                            </div>
                        </div>
                        <div className="p-5 border-t border-border flex justify-end gap-2">
                            <button onClick={() => { setShowCreateForm(false); reset(); }} className="text-sm px-4 py-2 border border-border rounded hover:border-gold transition-colors">
                                Cancel
                            </button>
                            <button onClick={handleCreate} disabled={processing} className="text-sm px-4 py-2 bg-gold text-white rounded font-medium disabled:opacity-50">
                                {processing ? 'Creating…' : 'Create user'}
                            </button>
                        </div>
                    </div>
                </div>
            )}

            {/* Delete Confirmation Modal */}
            {confirmDeleteId !== null && (
                <div className="fixed inset-0 z-50 bg-black/40 flex items-center justify-center p-4">
                    <div className="bg-white rounded-xl w-full max-w-sm shadow-xl">
                        <div className="p-5 border-b border-border">
                            <h3 className="font-serif text-lg font-medium">Delete user</h3>
                        </div>
                        <div className="p-5">
                            <p className="text-sm text-ink-mid">
                                Are you sure you want to delete <strong>{users.find(u => u.id === confirmDeleteId)?.name}</strong>? This cannot be undone.
                            </p>
                        </div>
                        <div className="p-5 border-t border-border flex justify-end gap-2">
                            <button onClick={() => setConfirmDeleteId(null)} className="text-sm px-4 py-2 border border-border rounded hover:border-gold transition-colors">
                                Cancel
                            </button>
                            <button onClick={() => handleDelete(confirmDeleteId)} className="text-sm px-4 py-2 bg-red-600 text-white rounded font-medium hover:bg-red-700 transition-colors">
                                Delete
                            </button>
                        </div>
                    </div>
                </div>
            )}
        </>
    );
}

Users.layout = {
    breadcrumbs: [
        { title: 'User Management', href: '/settings/users' },
    ],
};