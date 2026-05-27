import { Head } from '@inertiajs/react';
import { router } from '@inertiajs/react';

interface ReportJob {
    id:      string;
    woo_id:  string;
    client:  string;
    product: string;
    stage:   string;
    due:     string;
    balance: number;
    notes:   string;
    status:  string;
}

interface Stats {
    total_order_value: number;
    collected:         number;
    outstanding:       number;
    active_jobs:       number;
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
    jobs:          ReportJob[];
    stats:         Stats;
    pagination:    Pagination;
    daniele_email: string;
}

export default function Reports({ jobs, stats, pagination, daniele_email }: Props) {

    const sendToDaniele = () => {
        const date = new Date().toLocaleDateString('en-AU', { weekday: 'long', day: 'numeric', month: 'long', year: 'numeric' });

        let report = `DIAMOND GALLERY — WEEKLY STATUS REPORT\n`;
        report    += `${date}\n`;
        report    += `${'─'.repeat(40)}\n\n`;

        // Summary stats
        report += `SUMMARY\n`;
        report += `  Total order value: $${stats.total_order_value.toLocaleString()}\n`;
        report += `  Collected:         $${stats.collected.toLocaleString()}\n`;
        report += `  Outstanding:       $${stats.outstanding.toLocaleString()}\n`;
        report += `  Active jobs:       ${stats.active_jobs}\n\n`;

        report += `${'─'.repeat(40)}\n\n`;

        // All jobs
        if (jobs.length === 0) {
            report += 'No active orders.\n';
        } else {
            report += `ACTIVE ORDERS\n\n`;
            jobs.forEach((job) => {
                report += `${job.id} — ${job.client}\n`;
                report += `  Order:    ${job.woo_id}\n`;
                report += `  Product:  ${job.product}\n`;
                report += `  Stage:    ${job.stage}\n`;
                report += `  Due:      ${job.due || '—'}\n`;
                report += `  Balance:  ${job.balance > 0 ? '$' + job.balance.toLocaleString() + ' owing' : '✓ Paid'}\n`;
                if (job.notes) report += `  Notes:    ${job.notes}\n`;
                report += `\n`;
            });
        }

        const danieleEmail = daniele_email ?? '';
        const subject      = encodeURIComponent(`Diamond Gallery — Weekly Report — ${new Date().toLocaleDateString('en-AU')}`);
        const body         = encodeURIComponent(report);

        window.open(`mailto:${danieleEmail}?subject=${subject}&body=${body}`);
    };
    const statCards = [
        { label: 'Total order value', value: `$${stats.total_order_value.toLocaleString()}`, gold: true,  danger: false },
        { label: 'Collected',         value: `$${stats.collected.toLocaleString()}`,         gold: false, danger: false },
        { label: 'Outstanding',       value: `$${stats.outstanding.toLocaleString()}`,       gold: false, danger: true  },
        { label: 'Active jobs',       value: String(stats.active_jobs),                      gold: false, danger: false },
    ];

    const today = new Date().toLocaleDateString('en-AU', { weekday: 'long', day: 'numeric', month: 'long', year: 'numeric' });

    const goToPage = (page: number) => {
        router.get('/jobs/reports', { page }, { preserveScroll: true });
    };

    return (
        <>
            <Head title="Reports" />
            <div className="topbar">
                <h1 className="topbar-title">Weekly Report</h1>
                <button onClick={sendToDaniele} className="btn btn-gold">✉ Send to Daniele</button>
            </div>

            <div className="content-scroll">

                {/* Stats */}
                <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: '12px', marginBottom: '20px' }}>
                    {statCards.map((stat) => (
                        <div key={stat.label} className="stat-card">
                            <p className="stat-label">{stat.label}</p>
                            <p className={`stat-value ${stat.gold ? 'gold' : stat.danger ? 'danger' : ''}`}>{stat.value}</p>
                        </div>
                    ))}
                </div>

                {/* Report Section */}
                <div>
                    <div style={{ display: 'flex', alignItems: 'baseline', justifyContent: 'space-between', marginBottom: '14px' }}>
                        <div>
                            <h3 style={{ fontFamily: 'Cormorant Garamond, serif', fontSize: '18px', fontWeight: 500, marginBottom: '2px' }}>
                                Status report
                            </h3>
                            <p style={{ fontSize: '12px', color: 'var(--ink-soft)' }}>{today}</p>
                        </div>
                        {/* Showing X–Y of Z */}
                        <p style={{ fontSize: '12px', color: 'var(--ink-soft)' }}>
                            Showing {pagination.from}–{pagination.to} of {pagination.total} orders
                        </p>
                    </div>

                    {/* Table */}
                    <div className="bg-white border border-border rounded-lg overflow-hidden">
                        <table className="w-full text-xs">
                            <thead>
                                <tr className="bg-surface-2 border-b border-border">
                                    <th className="text-left px-4 py-3 text-ink-soft uppercase tracking-widest font-medium">Job</th>
                                    <th className="text-left px-4 py-3 text-ink-soft uppercase tracking-widest font-medium">Client</th>
                                    <th className="text-left px-4 py-3 text-ink-soft uppercase tracking-widest font-medium">Product</th>
                                    <th className="text-left px-4 py-3 text-ink-soft uppercase tracking-widest font-medium">Stage</th>
                                    <th className="text-left px-4 py-3 text-ink-soft uppercase tracking-widest font-medium">Due</th>
                                    <th className="text-right px-4 py-3 text-ink-soft uppercase tracking-widest font-medium">Balance</th>
                                    <th className="text-left px-4 py-3 text-ink-soft uppercase tracking-widest font-medium">Notes</th>
                                </tr>
                            </thead>
                            <tbody>
                                {jobs.length === 0 ? (
                                    <tr>
                                        <td colSpan={7} className="px-4 py-8 text-center text-ink-soft">No active orders.</td>
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
                                            <td className="px-4 py-3 text-ink-mid">{job.stage}</td>
                                            <td
                                                className="px-4 py-3 whitespace-nowrap font-medium"
                                                style={{
                                                    backgroundColor: job.due && new Date(job.due) < new Date() ? 'var(--amber-bg)' : 'var(--green-bg)',
                                                    color:           job.due && new Date(job.due) < new Date() ? 'var(--amber)'    : 'var(--green)',
                                                }}
                                            >
                                                {job.due}
                                            </td>
                                            <td className={`px-4 py-3 font-medium text-right ${job.balance > 0 ? 'text-red-600' : 'text-green-600'}`}>
                                                ${job.balance.toLocaleString()}
                                            </td>
                                            <td className="px-4 py-3 text-ink-soft max-w-xs truncate">{job.notes}</td>
                                        </tr>
                                    ))
                                )}
                            </tbody>
                        </table>
                    </div>

                    {/* Pagination Controls */}
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

Reports.layout = {
    breadcrumbs: [
        { label: 'Reports', href: '/jobs/reports' },
    ],
};