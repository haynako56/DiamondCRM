import { Head, router } from '@inertiajs/react';
import { useState, useEffect, useRef } from 'react';
import JobPanel from '@/components/jobs/job-panel';

function ScrollIntoView({ children }: { children: React.ReactNode }) {
    const ref = useRef<HTMLDivElement>(null);
    useEffect(() => { ref.current?.scrollIntoView({ behavior: 'smooth', block: 'nearest' }); }, []);
    return <div ref={ref}>{children}</div>;
}

interface CompletedJob {
    db_id:               number;
    id:                  string;
    woo_id:              string;
    client:              string;
    email:               string;
    product:             string;
    production_category: string;
    due:                 string;
    total:               number;
    balance:             number;
    tracking:            string | null;
    notes:               string;
    status:              string;
}

interface Pagination {
    current_page: number;
    last_page:    number;
    per_page:     number;
    total:        number;
    from:         number | null;
    to:           number | null;
}

interface Props {
    jobs:       CompletedJob[];
    full_jobs:  any[];
    pagination: Pagination;
}

const CATEGORY_LABELS: Record<string, string> = {
    cad_casting:      'CAD & Casting',
    handmade:         'Handmade',
    supplier_product: 'Supplier Product',
    ring_resize:      'Ring Resize',
    jewellery_repair: 'Jewellery Repair',
    custom:           'Custom',
};

export default function Completed({ jobs, full_jobs, pagination }: Props) {
    const [selectedJob, setSelectedJob] = useState<any | null>(null);

    const openPanel = (dbId: number) => {
        if (selectedJob?.id === dbId) {
            setSelectedJob(null);
            return;
        }
        const fullJob = full_jobs.find((job) => job.id === dbId);
        if (fullJob) setSelectedJob(fullJob);
    };

    const reopenJob = (job: CompletedJob) => {
        if (!confirm(`Reopen ${job.id} — ${job.client}? It will move back to Open Orders.`)) return;
        router.patch(`/orders/${job.db_id}/reopen`, {}, { preserveScroll: false });
    };

    const archiveJob = (job: CompletedJob) => {
        if (!confirm(`Archive ${job.id}? It will be removed from this list.`)) return;
        router.patch(`/orders/${job.db_id}`, { is_archived: true }, { preserveScroll: true });
    };

    const goToPage = (page: number) => {
        router.get('/jobs/completed', { page }, { preserveScroll: true });
    };

    return (
        <>
            <Head title="Completed Orders" />
            <div className="topbar">
                <h1 className="topbar-title">Completed Orders</h1>
                {pagination.from !== null && (
                    <span style={{ fontSize: '12px', color: 'var(--ink-soft)' }}>
                        {pagination.from}–{pagination.to} of {pagination.total} orders
                    </span>
                )}
            </div>

            <div className="content-scroll">

                    {/* Cards */}
                    {jobs.length === 0 ? (
                        <div style={{ textAlign: 'center', padding: '60px 20px', color: 'var(--ink-soft)' }}>
                            <div style={{ fontSize: '36px', opacity: 0.2, marginBottom: '10px' }}>✓</div>
                            <p>No completed orders yet.</p>
                        </div>
                    ) : (
                        <>
                            {jobs.map((job) => {
                                const categoryLabel = CATEGORY_LABELS[job.production_category] ?? job.production_category;
                                const isSelected   = selectedJob?.id === job.db_id;

                                return (
                                    <div key={job.db_id}>
                                    <div className={`job-card${isSelected ? ' selected' : ''}`} style={{ opacity: 0.9 }}>
                                        {/* Top row */}
                                        <div style={{ display: 'flex', alignItems: 'flex-start', gap: '10px', marginBottom: '7px' }}>
                                            <div style={{ flexShrink: 0 }}>
                                                <div className="job-id">{job.woo_id}</div>
                                                <div className="job-woo">{job.id}</div>
                                            </div>
                                            <div style={{ flex: 1, minWidth: 0 }}>
                                                <div className="job-product">{job.product}</div>
                                                <div className="job-client">{job.client}{job.email ? ` · ${job.email}` : ''}</div>
                                            </div>
                                            <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'flex-end', gap: '4px', flexShrink: 0 }}>
                                                <span style={{ fontSize: '10px', background: 'var(--green-bg)', color: 'var(--green)', padding: '3px 9px', borderRadius: '20px', fontWeight: 500 }}>✓ Completed</span>
                                                <span style={{ fontSize: '10px', color: 'var(--ink-soft)' }}>{categoryLabel}</span>
                                            </div>
                                        </div>

                                        {/* Meta row */}
                                        <div style={{ display: 'flex', gap: '14px', flexWrap: 'wrap', fontSize: '12px', color: 'var(--ink-soft)', marginBottom: '6px' }}>
                                            {job.due && job.due !== '—' && (
                                                <span>Due: <strong style={{ color: 'var(--ink-mid)' }}>{job.due}</strong></span>
                                            )}
                                            {job.tracking && (
                                                <span>Tracking: <strong style={{ color: 'var(--ink-mid)' }}>{job.tracking}</strong></span>
                                            )}
                                            <span>Total: <strong style={{ color: 'var(--ink-mid)' }}>${(job.total || 0).toLocaleString()}</strong></span>
                                            {job.balance > 0
                                                ? <span style={{ color: 'var(--red)' }}>Owing: <strong>${job.balance.toLocaleString()}</strong></span>
                                                : <span style={{ color: 'var(--green)' }}>✓ Fully paid</span>
                                            }
                                        </div>

                                        {/* Notes */}
                                        {job.notes && (
                                            <div style={{ fontSize: '11px', color: 'var(--ink-mid)', background: 'var(--surface-2)', borderRadius: '5px', padding: '5px 9px', marginBottom: '6px' }}>
                                                📎 {job.notes}
                                            </div>
                                        )}

                                        {/* Actions */}
                                        <div style={{ marginTop: '8px', display: 'flex', gap: '7px' }}>
                                            <button className="btn btn-sm" onClick={() => openPanel(job.db_id)}>
                                                {isSelected ? '✕ Close details' : 'View details'}
                                            </button>
                                            <button className="btn btn-sm" onClick={() => reopenJob(job)}>
                                                ↩ Reopen
                                            </button>
                                            <button
                                                className="btn btn-sm"
                                                onClick={() => archiveJob(job)}
                                                style={{ marginLeft: 'auto', color: 'var(--ink-soft)' }}
                                            >
                                                Archive
                                            </button>
                                        </div>
                                    </div>
                                    {isSelected && (
                                        <ScrollIntoView>
                                            <JobPanel
                                                key={job.db_id}
                                                job={selectedJob}
                                                inline={true}
                                                onClose={() => setSelectedJob(null)}
                                                onJobNotesUpdated={() => {}}
                                            />
                                        </ScrollIntoView>
                                    )}
                                    </div>
                                );
                            })}

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
                        </>
                    )}

            </div>
        </>
    );
}

Completed.layout = {
    breadcrumbs: [
        { label: 'Completed', href: '/jobs/completed' },
    ],
};
