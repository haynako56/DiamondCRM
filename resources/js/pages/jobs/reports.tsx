import { Head } from '@inertiajs/react';
import { useState } from 'react';
import JobPanel from '@/components/jobs/job-panel';

interface ReportJob {
    db_id:       number;
    id:          string;
    woo_id:      string;
    client:      string;
    product:     string;
    stage:       string;
    stage_color: string;
    stage_bg:    string;
    due:         string;
    due_raw:     string | null;
    balance:     number;
    notes:       string;
}

interface WeekGroup {
    label: string;
    color: string;
    jobs:  ReportJob[];
}

interface StageSummary {
    label: string;
    count: number;
    color: string;
    bg:    string;
}

interface Stats {
    total_order_value: number;
    collected:         number;
    outstanding:       number;
    active_jobs:       number;
}

interface Props {
    groups:        WeekGroup[];
    stage_counts:  StageSummary[];
    stats:         Stats;
    daniele_email: string;
    jobs:          any[];
}

function dueDateColor(dueRaw: string | null): string {
    if (!dueRaw) return '';
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    const due  = new Date(dueRaw);
    const diff = Math.ceil((due.getTime() - today.getTime()) / (1000 * 60 * 60 * 24));
    if (diff < 0)  return 'var(--red)';
    if (diff <= 7) return 'var(--amber)';
    return '';
}

function groupLabelColor(color: string): string {
    if (color === 'red')   return 'var(--red)';
    if (color === 'amber') return 'var(--amber)';
    return 'var(--ink-soft)';
}

export default function Reports({ groups, stage_counts, stats, daniele_email, jobs }: Props) {
    const [selectedJob, setSelectedJob] = useState<any | null>(null);

    const openPanel = (dbId: number) => {
        const fullJob = jobs.find((job) => job.id === dbId);
        if (fullJob) setSelectedJob(fullJob);
    };

    const sendReport = () => {
        const date = new Date().toLocaleDateString('en-AU', { weekday: 'long', day: 'numeric', month: 'long', year: 'numeric' });
        let report  = `DIAMOND GALLERY — WEEKLY ORDER REPORT\n${date}\n\n`;

        if (groups.length === 0) {
            report += 'No active orders.\n';
        } else {
            groups.forEach((group) => {
                report += `\n── ${group.label.toUpperCase()} ──────────────────────\n`;
                group.jobs.forEach((job) => {
                    report += `${job.woo_id} | ${job.client} | Due: ${job.due || '—'} | ${job.stage} | Balance: ${job.balance > 0 ? '$' + job.balance.toLocaleString() : '✓ Paid'}\n`;
                    if (job.notes) report += `   📎 ${job.notes}\n`;
                });
            });
        }

        const subject = encodeURIComponent(`Diamond Gallery — Weekly Report — ${new Date().toLocaleDateString('en-AU')}`);
        const body    = encodeURIComponent(report);
        window.open(`mailto:${daniele_email ?? ''}?subject=${subject}&body=${body}`);
    };

    return (
        <>
            <Head title="Reports" />
            <div className="topbar">
                <h1 className="topbar-title">Weekly Report</h1>
            </div>

            <div style={{ flex: 1, display: 'flex', overflow: 'hidden' }}>
                <div className="content-scroll" style={{ flex: 1, minWidth: 0 }}>

                    {/* Stats row */}
                    <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: '10px', marginBottom: '18px' }}>
                        <div className="stat-card">
                            <div className="stat-label">Total value</div>
                            <div className="stat-value gold">${stats.total_order_value.toLocaleString()}</div>
                        </div>
                        <div className="stat-card">
                            <div className="stat-label">Collected</div>
                            <div className="stat-value">${stats.collected.toLocaleString()}</div>
                        </div>
                        <div className="stat-card">
                            <div className="stat-label">Outstanding</div>
                            <div className={`stat-value ${stats.outstanding > 0 ? 'danger' : ''}`}>${stats.outstanding.toLocaleString()}</div>
                        </div>
                        <div className="stat-card">
                            <div className="stat-label">Active orders</div>
                            <div className="stat-value">{stats.active_jobs}</div>
                        </div>
                    </div>

                    {/* Status breakdown card */}
                    {stage_counts.length > 0 && (
                        <div style={{ background: 'var(--white)', border: '1px solid var(--border)', borderRadius: '10px', padding: '14px 16px', marginBottom: '16px' }}>
                            <div style={{ fontSize: '11px', fontWeight: 500, textTransform: 'uppercase', letterSpacing: '0.09em', color: 'var(--ink-soft)', marginBottom: '10px' }}>
                                Status breakdown
                            </div>
                            <div style={{ display: 'flex', flexWrap: 'wrap', gap: '7px' }}>
                                {stage_counts.map((stageSummary) => (
                                    <div
                                        key={stageSummary.label}
                                        style={{ display: 'inline-flex', alignItems: 'center', gap: '6px', padding: '5px 12px', borderRadius: '20px', background: stageSummary.bg, border: `1px solid ${stageSummary.color}44` }}
                                    >
                                        <span style={{ fontSize: '13px', fontWeight: 600, color: stageSummary.color }}>{stageSummary.count}</span>
                                        <span style={{ fontSize: '11px', color: stageSummary.color }}>{stageSummary.label}</span>
                                    </div>
                                ))}
                            </div>
                        </div>
                    )}

                    {/* Orders by week header + email button */}
                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '10px' }}>
                        <div style={{ fontFamily: 'Cormorant Garamond, serif', fontSize: '19px', fontWeight: 500 }}>Orders by week</div>
                        <button onClick={sendReport} className="btn btn-gold btn-sm">✉ Email report</button>
                    </div>

                    {/* Weekly groups */}
                    {groups.length === 0 ? (
                        <div style={{ textAlign: 'center', padding: '50px 20px', color: 'var(--ink-soft)' }}>
                            <div style={{ fontSize: '32px', opacity: 0.25, marginBottom: '8px' }}>◈</div>
                            <p>No active orders.</p>
                        </div>
                    ) : (
                        groups.map((group) => (
                            <div key={group.label} style={{ marginBottom: '14px' }}>

                                {/* Divider-style header */}
                                <div style={{ display: 'flex', alignItems: 'center', gap: '10px', marginBottom: '7px' }}>
                                    <div style={{ fontSize: '12px', fontWeight: 600, textTransform: 'uppercase', letterSpacing: '0.08em', color: groupLabelColor(group.color) }}>
                                        {group.label}
                                    </div>
                                    <div style={{ flex: 1, height: '1px', background: 'var(--border)' }} />
                                    <div style={{ fontSize: '11px', color: 'var(--ink-soft)' }}>
                                        {group.jobs.length} order{group.jobs.length !== 1 ? 's' : ''}
                                    </div>
                                </div>

                                {/* Table */}
                                <div className="report-table-wrap">
                                    <table className="report-table">
                                        <thead>
                                            <tr>
                                                <th>Order</th>
                                                <th>Client</th>
                                                <th>Status</th>
                                                <th>Due</th>
                                                <th>Balance</th>
                                            </tr>
                                        </thead>
                                        <tbody>
                                            {group.jobs.flatMap((job) => [
                                                <tr key={job.db_id} onClick={() => openPanel(job.db_id)}>
                                                    <td>
                                                        <span style={{ fontWeight: 500, color: 'var(--gold)' }}>{job.woo_id}</span>
                                                        <br />
                                                        <span style={{ fontSize: '10px', color: 'var(--ink-soft)' }}>{job.id}</span>
                                                    </td>
                                                    <td>
                                                        <div style={{ fontSize: '12px', fontWeight: 500 }}>{job.client}</div>
                                                        <div style={{ fontSize: '10px', color: 'var(--ink-soft)', maxWidth: '130px', whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>
                                                            {job.product}
                                                        </div>
                                                    </td>
                                                    <td>
                                                        <span style={{ fontSize: '10px', padding: '2px 8px', borderRadius: '10px', background: job.stage_bg, color: job.stage_color, fontWeight: 500, whiteSpace: 'nowrap' }}>
                                                            {job.stage}
                                                        </span>
                                                    </td>
                                                    <td style={{ color: dueDateColor(job.due_raw), fontSize: '11px', whiteSpace: 'nowrap' }}>
                                                        {job.due || '—'}
                                                    </td>
                                                    <td style={{ color: job.balance > 0 ? 'var(--red)' : 'var(--green)', fontWeight: 500, fontSize: '12px', whiteSpace: 'nowrap' }}>
                                                        ${job.balance.toLocaleString()}
                                                    </td>
                                                </tr>,
                                                ...(job.notes ? [
                                                    <tr key={`${job.db_id}-note`}>
                                                        <td colSpan={5} style={{ padding: '3px 13px 8px', fontSize: '10px', color: 'var(--ink-soft)' }}>
                                                            📎 {job.notes}
                                                        </td>
                                                    </tr>,
                                                ] : []),
                                            ])}
                                        </tbody>
                                    </table>
                                </div>

                            </div>
                        ))
                    )}

                </div>

                {/* Detail panel */}
                {selectedJob && (
                    <JobPanel
                        key={selectedJob.id}
                        job={selectedJob}
                        onClose={() => setSelectedJob(null)}
                        onJobNotesUpdated={() => {}}
                    />
                )}
            </div>
        </>
    );
}

Reports.layout = {
    breadcrumbs: [
        { label: 'Reports', href: '/jobs/reports' },
    ],
};
