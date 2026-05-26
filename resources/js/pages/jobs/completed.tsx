import { Head } from '@inertiajs/react';
import { router } from '@inertiajs/react';

interface CompletedJob {
    id:      string;
    woo_id:  string;
    client:  string;
    product: string;
    due:     string;
    balance: number;
    notes:   string;
    status:  string;
}

interface Stats {
    total_completed: number;
    total_value:     number;
    total_collected: number;
}

interface Pagination {
    current_page: number;
    last_page:    number;
    per_page:     number;
    total:        number;
    from:         number;
    to:           number;
}

interface Props {
    jobs:       CompletedJob[];
    stats:      Stats;
    pagination: Pagination;
}

export default function Completed({ jobs, stats, pagination }: Props) {
    const statCards = [
        { label: 'Total completed',  value: String(stats.total_completed),                  gold: false, danger: false },
        { label: 'Total value',      value: `$${stats.total_value.toLocaleString()}`,        gold: true,  danger: false },
        { label: 'Total collected',  value: `$${stats.total_collected.toLocaleString()}`,    gold: false, danger: false },
    ];

    const today = new Date().toLocaleDateString('en-AU', { weekday: 'long', day: 'numeric', month: 'long', year: 'numeric' });

    const goToPage = (page: number) => {
        router.get('/jobs/completed', { page }, { preserveScroll: true });
    };

    return (
        <>
            <Head title="Completed Orders" />
            <div className="topbar">
                <h1 className="topbar-title">Completed Orders</h1>
            </div>

            <div className="content-scroll">

                {/* Stats */}
                <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: '12px', marginBottom: '20px' }}>
                    {statCards.map((stat) => (
                        <div key={stat.label} className="stat-card">
                            <p className="stat-label">{stat.label}</p>
                            <p className={`stat-value ${stat.gold ? 'gold' : stat.danger ? 'danger' : ''}`}>{stat.value}</p>
                        </div>
                    ))}
                </div>

                {/* Table Section */}
                <div>
                    <div style={{ display: 'flex', alignItems: 'baseline', justifyContent: 'space-between', marginBottom: '14px' }}>
                        <div>
                            <h3 style={{ fontFamily: 'Cormorant Garamond, serif', fontSize: '18px', fontWeight: 500, marginBottom: '2px' }}>
                                Completed orders
                            </h3>
                            <p style={{ fontSize: '12px', color: 'var(--ink-soft)' }}>{today}</p>
                        </div>
                        {pagination.from && (
                            <p style={{ fontSize: '12px', color: 'var(--ink-soft)' }}>
                                Showing {pagination.from}–{pagination.to} of {pagination.total} orders
                            </p>
                        )}
                    </div>

                    {/* Table */}
                    <div className="bg-white border border-border rounded-lg overflow-hidden">
                        <table className="w-full text-xs">
                            <thead>
                                <tr className="bg-surface-2 border-b border-border">
                                    <th className="text-left px-4 py-3 text-ink-soft uppercase tracking-widest font-medium">Job</th>
                                    <th className="text-left px-4 py-3 text-ink-soft uppercase tracking-widest font-medium">Client</th>
                                    <th className="text-left px-4 py-3 text-ink-soft uppercase tracking-widest font-medium">Product</th>
                                    <th className="text-left px-4 py-3 text-ink-soft uppercase tracking-widest font-medium">Due</th>
                                    <th className="text-right px-4 py-3 text-ink-soft uppercase tracking-widest font-medium">Balance</th>
                                    <th className="text-left px-4 py-3 text-ink-soft uppercase tracking-widest font-medium">Notes</th>
                                </tr>
                            </thead>
                            <tbody>
                                {jobs.length === 0 ? (
                                    <tr>
                                        <td colSpan={6} className="px-4 py-8 text-center text-ink-soft">No completed orders yet.</td>
                                    </tr>
                                ) : (
                                    jobs.map((job) => (
                                        <tr key={job.id} className="border-b border-surface-2 hover:bg-surface transition-colors">
                                            <td className="px-4 py-3">
                                                <div className="text-gold-dark font-medium">{job.id}</div>
                                                <div className="text-ink-soft" style={{ fontSize: '10px' }}>{job.woo_id}</div>
                                            </td>
                                            <td className="px-4 py-3 font-medium">{job.client}</td>
                                            <td className="px-4 py-3 text-ink-mid max-w-[180px] truncate">{job.product}</td>
                                            <td className="px-4 py-3 whitespace-nowrap">{job.due}</td>
                                            <td className={`px-4 py-3 font-medium text-right ${job.balance > 0 ? 'text-red-600' : 'text-green-600'}`}>
                                                {job.balance > 0 ? `$${job.balance.toLocaleString()}` : '✓ Paid'}
                                            </td>
                                            <td className="px-4 py-3 text-ink-soft max-w-xs truncate">{job.notes}</td>
                                        </tr>
                                    ))
                                )}
                            </tbody>
                        </table>
                    </div>

                    {/* Pagination */}
                    {pagination.last_page > 1 && (
                        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '6px', marginTop: '16px' }}>
                            <button
                                onClick={() => goToPage(pagination.current_page - 1)}
                                disabled={pagination.current_page === 1}
                                className="btn"
                                style={{ opacity: pagination.current_page === 1 ? 0.4 : 1 }}
                            >
                                ← Prev
                            </button>

                            {Array.from({ length: pagination.last_page }, (_, index) => index + 1).map((page) => (
                                <button
                                    key={page}
                                    onClick={() => goToPage(page)}
                                    className={page === pagination.current_page ? 'btn btn-gold' : 'btn'}
                                    style={{ minWidth: '36px' }}
                                >
                                    {page}
                                </button>
                            ))}

                            <button
                                onClick={() => goToPage(pagination.current_page + 1)}
                                disabled={pagination.current_page === pagination.last_page}
                                className="btn"
                                style={{ opacity: pagination.current_page === pagination.last_page ? 0.4 : 1 }}
                            >
                                Next →
                            </button>
                        </div>
                    )}
                </div>
            </div>
        </>
    );
}

Completed.layout = {
    breadcrumbs: [
        { label: 'Completed', href: '/jobs/completed' },
    ],
};