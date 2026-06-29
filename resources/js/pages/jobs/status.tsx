import { Head } from '@inertiajs/react';
import { useState } from 'react';
import JobPanel from '@/components/jobs/job-panel';

interface StatusJob {
    db_id:                    number;
    id:                       string;
    woo_id:                   string;
    client:                   string;
    product:                  string;
    stage:                    string;
    due_raw:                  string | null;
    category:                 string;
    balance:                  number;
    cad_sent:                 boolean;
    cad_approved:             boolean;
    cad_send_date:            string;
    cad_received_date:        string;
    casting_done:             boolean;
    job_packed_done:          boolean;
    job_packed_date:          string;
    production_progress:      string;
    production_done:          boolean;
    production_date:          string;
    cad_note:                 string;
    production_note:          string;
    awaiting_collection_date: string;
    awaiting_collection_note: string;
    collection_method:        string;
}

interface Props {
    sent_to_cad:         StatusJob[];
    awaiting_approval:   StatusJob[];
    daniele_production:  StatusJob[];
    awaiting_collection: StatusJob[];
    all_open:            StatusJob[];
    jobs:                any[];
}

function dueInfo(dueRaw: string | null): { cls: string; text: string } {
    if (!dueRaw) return { cls: 'due-ok', text: '—' };
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    const dueDate  = new Date(dueRaw);
    const diffDays = Math.ceil((dueDate.getTime() - today.getTime()) / (1000 * 60 * 60 * 24));
    if (diffDays < 0)   return { cls: 'due-overdue', text: Math.abs(diffDays) + 'd overdue' };
    if (diffDays === 0) return { cls: 'due-red',     text: 'Due today' };
    if (diffDays <= 3)  return { cls: 'due-red',     text: 'In ' + diffDays + 'd' };
    if (diffDays <= 7)  return { cls: 'due-orange',  text: 'In ' + diffDays + 'd' };
    if (diffDays <= 14) return { cls: 'due-green',   text: 'In ' + diffDays + 'd' };
    return { cls: 'due-ok', text: dueDate.toLocaleDateString('en-AU', { day: 'numeric', month: 'short' }) };
}

function SentToCadItem({ job, onSelect }: { job: StatusJob; onSelect: (dbId: number) => void }) {
    const due = dueInfo(job.due_raw);
    return (
        <div className="status-item" onClick={() => onSelect(job.db_id)}>
            <div className="status-item-top">
                <span className="status-woo">{job.woo_id}</span>
                <span className="status-name">{job.product}</span>
                <span className={`due-label ${due.cls}`}>⏱ {due.text}</span>
            </div>
            <div className="status-client">{job.client}</div>
            <div className="status-meta">
                <span className="status-badge sb-cad">CAD sent — awaiting return</span>
                {job.cad_send_date && (
                    <span style={{ fontSize: '10px', color: 'var(--ink-soft)' }}>Sent {job.cad_send_date}</span>
                )}
            </div>
            {job.cad_note && <div className="status-note">📎 {job.cad_note}</div>}
        </div>
    );
}

function AwaitingApprovalItem({ job, onSelect }: { job: StatusJob; onSelect: (dbId: number) => void }) {
    const due = dueInfo(job.due_raw);
    return (
        <div className="status-item" onClick={() => onSelect(job.db_id)}>
            <div className="status-item-top">
                <span className="status-woo">{job.woo_id}</span>
                <span className="status-name">{job.product}</span>
                <span className={`due-label ${due.cls}`}>⏱ {due.text}</span>
            </div>
            <div className="status-client">{job.client}</div>
            <div className="status-meta">
                <span className="status-badge sb-cad">Awaiting client approval</span>
                {job.cad_received_date && (
                    <span style={{ fontSize: '10px', color: 'var(--ink-soft)' }}>Received {job.cad_received_date}</span>
                )}
            </div>
            {job.cad_note && <div className="status-note">📎 {job.cad_note}</div>}
        </div>
    );
}

function ProdItem({ job, onSelect }: { job: StatusJob; onSelect: (dbId: number) => void }) {
    const due = dueInfo(job.due_raw);
    return (
        <div className="status-item" onClick={() => onSelect(job.db_id)}>
            <div className="status-item-top">
                <span className="status-woo">{job.woo_id}</span>
                <span className="status-name">{job.product}</span>
                <span className={`due-label ${due.cls}`}>⏱ {due.text}</span>
            </div>
            <div className="status-client">{job.client}</div>
            <div style={{ marginTop: '6px', display: 'flex', flexDirection: 'column', gap: '3px' }}>
                <div style={{ fontSize: '11px', color: job.job_packed_done ? 'var(--green)' : 'var(--ink-mid)', fontWeight: job.job_packed_done ? 400 : 500 }}>
                    {job.job_packed_done ? '✓' : '●'} Job Packed to Daniele
                    {job.job_packed_date && <span style={{ color: 'var(--ink-soft)', fontWeight: 400, marginLeft: '6px' }}>{job.job_packed_date}</span>}
                </div>
                <div style={{ fontSize: '11px', color: job.production_done ? 'var(--green)' : 'var(--ink-soft)' }}>
                    {job.production_done ? '✓' : '○'} Production at Daniele
                    {job.production_date && <span style={{ marginLeft: '6px' }}>{job.production_date}</span>}
                </div>
            </div>
            {job.production_note && <div className="status-note">📎 {job.production_note}</div>}
        </div>
    );
}

function AwaitingCollectionItem({ job, onSelect }: { job: StatusJob; onSelect: (dbId: number) => void }) {
    const due = dueInfo(job.due_raw);
    return (
        <div className="status-item" onClick={() => onSelect(job.db_id)}>
            <div className="status-item-top">
                <span className="status-woo">{job.woo_id}</span>
                <span className="status-name">{job.product}</span>
                <span className={`due-label ${due.cls}`}>⏱ {due.text}</span>
            </div>
            <div className="status-client">{job.client}</div>
            <div className="status-meta">
                <span className="status-badge sb-approved">{job.collection_method || 'Ready for collection'}</span>
                {job.awaiting_collection_date && (
                    <span style={{ fontSize: '10px', color: 'var(--ink-soft)' }}>Ready since {job.awaiting_collection_date}</span>
                )}
                {job.balance > 0
                    ? <span style={{ fontSize: '10px', color: 'var(--red)', fontWeight: 500 }}>${job.balance.toLocaleString()} owing</span>
                    : <span style={{ fontSize: '10px', color: 'var(--green)' }}>✓ Paid</span>
                }
            </div>
            {job.awaiting_collection_note && <div className="status-note">📎 {job.awaiting_collection_note}</div>}
        </div>
    );
}

function AllOpenItem({ job, onSelect }: { job: StatusJob; onSelect: (dbId: number) => void }) {
    const due = dueInfo(job.due_raw);
    return (
        <div className="status-item" onClick={() => onSelect(job.db_id)}>
            <div className="status-item-top">
                <span className="status-woo">{job.woo_id}</span>
                <span className="status-name">{job.product}</span>
                <span className={`due-label ${due.cls}`}>⏱ {due.text}</span>
            </div>
            <div className="status-client">{job.client}</div>
            <div className="status-meta">
                <span className="status-badge sb-cad">{job.stage}</span>
            </div>
        </div>
    );
}

export default function Status({ sent_to_cad, awaiting_approval, daniele_production, awaiting_collection, all_open, jobs }: Props) {
    const [selectedJob, setSelectedJob] = useState<any | null>(null);

    const openPanel = (dbId: number) => {
        const fullJob = jobs.find((job) => job.id === dbId);
        if (fullJob) setSelectedJob(fullJob);
    };

    return (
        <>
            <Head title="Order Status" />
            <div className="topbar">
                <h1 className="topbar-title">Order Status</h1>
            </div>

            <div style={{ flex: 1, display: 'flex', overflow: 'hidden' }}>
                <div className="content-scroll" style={{ flex: 1, minWidth: 0 }}>

                    {/* Row 1: CAD boards */}
                    <div className="status-boards">

                        <div className="status-board">
                            <div className="status-board-head">
                                <div>
                                    <div className="status-board-title">Sent to CAD</div>
                                    <div style={{ fontSize: '11px', color: 'var(--ink-soft)', marginTop: '1px' }}>
                                        CAD sent, awaiting design back
                                    </div>
                                </div>
                                <span className={`status-count status-badge ${sent_to_cad.length ? 'sb-cad' : 'sb-approved'}`}>
                                    {sent_to_cad.length}
                                </span>
                            </div>
                            {sent_to_cad.length > 0
                                ? sent_to_cad.map((job) => <SentToCadItem key={job.id} job={job} onSelect={openPanel} />)
                                : <div className="status-empty">✓ No orders waiting on CAD</div>
                            }
                        </div>

                        <div className="status-board">
                            <div className="status-board-head">
                                <div>
                                    <div className="status-board-title">Awaiting Client Approval</div>
                                    <div style={{ fontSize: '11px', color: 'var(--ink-soft)', marginTop: '1px' }}>
                                        CAD received, sent to client for sign-off
                                    </div>
                                </div>
                                <span className={`status-count status-badge ${awaiting_approval.length ? 'sb-cad' : 'sb-approved'}`}>
                                    {awaiting_approval.length}
                                </span>
                            </div>
                            {awaiting_approval.length > 0
                                ? awaiting_approval.map((job) => <AwaitingApprovalItem key={job.id} job={job} onSelect={openPanel} />)
                                : <div className="status-empty">✓ No pending approvals</div>
                            }
                        </div>

                    </div>

                    {/* Row 2: Production boards */}
                    <div className="status-boards">

                        <div className="status-board">
                            <div className="status-board-head">
                                <div>
                                    <div className="status-board-title">Daniele — Production</div>
                                    <div style={{ fontSize: '11px', color: 'var(--ink-soft)', marginTop: '1px' }}>
                                        In casting or actively in production
                                    </div>
                                </div>
                                <span className={`status-count status-badge ${daniele_production.length ? 'sb-prod' : 'sb-approved'}`}>
                                    {daniele_production.length}
                                </span>
                            </div>
                            {daniele_production.length > 0
                                ? daniele_production.map((job) => <ProdItem key={job.id} job={job} onSelect={openPanel} />)
                                : <div className="status-empty">✓ Nothing in production</div>
                            }
                        </div>

                        <div className="status-board">
                            <div className="status-board-head">
                                <div>
                                    <div className="status-board-title">Awaiting Collection</div>
                                    <div style={{ fontSize: '11px', color: 'var(--ink-soft)', marginTop: '1px' }}>
                                        Complete — client hasn't picked up yet
                                    </div>
                                </div>
                                <span
                                    className="status-count status-badge"
                                    style={awaiting_collection.length ? { background: '#FFF0DC', color: '#E67E22' } : undefined}
                                >
                                    {awaiting_collection.length}
                                </span>
                            </div>
                            {awaiting_collection.length > 0
                                ? awaiting_collection.map((job) => <AwaitingCollectionItem key={job.id} job={job} onSelect={openPanel} />)
                                : <div className="status-empty">✓ No orders awaiting collection</div>
                            }
                        </div>

                    </div>

                    {/* All open orders */}
                    <div className="status-board" style={{ marginBottom: '14px' }}>
                        <div className="status-board-head">
                            <div>
                                <div className="status-board-title">All open orders</div>
                                <div style={{ fontSize: '11px', color: 'var(--ink-soft)', marginTop: '1px' }}>
                                    Every active order with current stage
                                </div>
                            </div>
                            <span className="status-count status-badge sb-cad">{all_open.length}</span>
                        </div>
                        {all_open.length === 0
                            ? <div className="status-empty">No open orders</div>
                            : all_open.map((job) => <AllOpenItem key={job.id} job={job} onSelect={openPanel} />)
                        }
                    </div>

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

Status.layout = {
    breadcrumbs: [
        { label: 'Status', href: '/jobs/status' },
    ],
};
