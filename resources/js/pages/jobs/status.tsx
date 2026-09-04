import { Head } from '@inertiajs/react';
import { useState, useEffect } from 'react';
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
    order_date:               string;
}

interface Props {
    new_jobs:            StatusJob[];
    sent_to_cad:         StatusJob[];
    awaiting_approval:   StatusJob[];
    daniele_production:  StatusJob[];
    awaiting_collection: StatusJob[];
    all_open:            StatusJob[];
    jobs:                any[];
}

interface TaskNote {
    content: string;
    date:    string;
}

// Task notes are stored as a JSON array on the task. Fall back to plain text for older notes.
function parseTaskNotes(raw: string | null): TaskNote[] {
    if (!raw) return [];
    try {
        const parsed = JSON.parse(raw);
        if (Array.isArray(parsed)) return parsed;
        return [{ content: raw, date: '' }];
    } catch {
        return [{ content: raw, date: '' }];
    }
}

function TaskNotes({ rawNote }: { rawNote: string | null }) {
    const notes = parseTaskNotes(rawNote);
    if (notes.length === 0) return null;
    return (
        <>
            {notes.map((note, index) => (
                <div key={index} className="status-note">
                    📎 {note.content}
                    {note.date && <span style={{ marginLeft: '6px', opacity: 0.7 }}>{note.date}</span>}
                </div>
            ))}
        </>
    );
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

function NewJobItem({ job, onSelect }: { job: StatusJob; onSelect: (dbId: number) => void }) {
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
                <span className="status-badge sb-new">{job.stage}</span>
                {job.order_date && (
                    <span style={{ fontSize: '10px', color: 'var(--ink-soft)' }}>Ordered {job.order_date}</span>
                )}
            </div>
        </div>
    );
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
                <span className="status-badge sb-cad">{job.cad_sent ? 'CAD sent — awaiting return' : job.stage}</span>
                {job.cad_send_date && (
                    <span style={{ fontSize: '10px', color: 'var(--ink-soft)' }}>Sent {job.cad_send_date}</span>
                )}
            </div>
            <TaskNotes rawNote={job.cad_note} />
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
            <TaskNotes rawNote={job.cad_note} />
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
            <TaskNotes rawNote={job.production_note} />
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
            <TaskNotes rawNote={job.awaiting_collection_note} />
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

function PrintBoardButton({ onPrint }: { onPrint: () => void }) {
    return (
        <button className="status-print-btn" onClick={onPrint} title="Print this board">
            🖨 Print
        </button>
    );
}

export default function Status({ new_jobs, sent_to_cad, awaiting_approval, daniele_production, awaiting_collection, all_open, jobs }: Props) {
    const [selectedJob, setSelectedJob]     = useState<any | null>(null);
    const [printingBoard, setPrintingBoard] = useState<string | null>(null);

    // Only the board marked as printing stays visible (see the @media print rules)
    useEffect(() => {
        if (!printingBoard) {
            return;
        }

        const clearPrintingBoard = () => setPrintingBoard(null);

        window.addEventListener('afterprint', clearPrintingBoard);
        window.print();

        return () => window.removeEventListener('afterprint', clearPrintingBoard);
    }, [printingBoard]);

    const boardClass = (boardName: string) =>
        `status-board${printingBoard === boardName ? ' printing' : ''}`;

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

                    {/* New jobs waiting to be started */}
                    <div className={boardClass('new_jobs')} style={{ marginBottom: '18px' }}>
                        <div className="status-board-head">
                            <div>
                                <div className="status-board-title">New Jobs</div>
                                <div style={{ fontSize: '11px', color: 'var(--ink-soft)', marginTop: '1px' }}>
                                    Order placed — no steps completed yet
                                </div>
                            </div>
                            <div className="status-board-actions">
                                <span className={`status-count status-badge ${new_jobs.length ? 'sb-new' : 'sb-approved'}`}>
                                    {new_jobs.length}
                                </span>
                                <PrintBoardButton onPrint={() => setPrintingBoard('new_jobs')} />
                            </div>
                        </div>
                        {new_jobs.length > 0
                            ? new_jobs.map((job) => <NewJobItem key={job.id} job={job} onSelect={openPanel} />)
                            : <div className="status-empty">✓ No new jobs waiting to start</div>
                        }
                    </div>

                    {/* Row 1: CAD boards */}
                    <div className="status-boards">

                        <div className={boardClass('sent_to_cad')}>
                            <div className="status-board-head">
                                <div>
                                    <div className="status-board-title">Sent to CAD</div>
                                    <div style={{ fontSize: '11px', color: 'var(--ink-soft)', marginTop: '1px' }}>
                                        Started — awaiting CAD design back
                                    </div>
                                </div>
                                <div className="status-board-actions">
                                    <span className={`status-count status-badge ${sent_to_cad.length ? 'sb-cad' : 'sb-approved'}`}>
                                        {sent_to_cad.length}
                                    </span>
                                    <PrintBoardButton onPrint={() => setPrintingBoard('sent_to_cad')} />
                                </div>
                            </div>
                            {sent_to_cad.length > 0
                                ? sent_to_cad.map((job) => <SentToCadItem key={job.id} job={job} onSelect={openPanel} />)
                                : <div className="status-empty">✓ No orders waiting on CAD</div>
                            }
                        </div>

                        <div className={boardClass('awaiting_approval')}>
                            <div className="status-board-head">
                                <div>
                                    <div className="status-board-title">Awaiting Client Approval</div>
                                    <div style={{ fontSize: '11px', color: 'var(--ink-soft)', marginTop: '1px' }}>
                                        CAD received, sent to client for sign-off
                                    </div>
                                </div>
                                <div className="status-board-actions">
                                    <span className={`status-count status-badge ${awaiting_approval.length ? 'sb-cad' : 'sb-approved'}`}>
                                        {awaiting_approval.length}
                                    </span>
                                    <PrintBoardButton onPrint={() => setPrintingBoard('awaiting_approval')} />
                                </div>
                            </div>
                            {awaiting_approval.length > 0
                                ? awaiting_approval.map((job) => <AwaitingApprovalItem key={job.id} job={job} onSelect={openPanel} />)
                                : <div className="status-empty">✓ No pending approvals</div>
                            }
                        </div>

                    </div>

                    {/* Row 2: Production boards */}
                    <div className="status-boards">

                        <div className={boardClass('daniele_production')}>
                            <div className="status-board-head">
                                <div>
                                    <div className="status-board-title">Daniele — Production</div>
                                    <div style={{ fontSize: '11px', color: 'var(--ink-soft)', marginTop: '1px' }}>
                                        In casting or actively in production
                                    </div>
                                </div>
                                <div className="status-board-actions">
                                    <span className={`status-count status-badge ${daniele_production.length ? 'sb-prod' : 'sb-approved'}`}>
                                        {daniele_production.length}
                                    </span>
                                    <PrintBoardButton onPrint={() => setPrintingBoard('daniele_production')} />
                                </div>
                            </div>
                            {daniele_production.length > 0
                                ? daniele_production.map((job) => <ProdItem key={job.id} job={job} onSelect={openPanel} />)
                                : <div className="status-empty">✓ Nothing in production</div>
                            }
                        </div>

                        <div className={boardClass('awaiting_collection')}>
                            <div className="status-board-head">
                                <div>
                                    <div className="status-board-title">Awaiting Collection</div>
                                    <div style={{ fontSize: '11px', color: 'var(--ink-soft)', marginTop: '1px' }}>
                                        Complete — client hasn't picked up yet
                                    </div>
                                </div>
                                <div className="status-board-actions">
                                    <span
                                        className="status-count status-badge"
                                        style={awaiting_collection.length ? { background: '#FFF0DC', color: '#E67E22' } : undefined}
                                    >
                                        {awaiting_collection.length}
                                    </span>
                                    <PrintBoardButton onPrint={() => setPrintingBoard('awaiting_collection')} />
                                </div>
                            </div>
                            {awaiting_collection.length > 0
                                ? awaiting_collection.map((job) => <AwaitingCollectionItem key={job.id} job={job} onSelect={openPanel} />)
                                : <div className="status-empty">✓ No orders awaiting collection</div>
                            }
                        </div>

                    </div>

                    {/* All open orders */}
                    <div className={boardClass('all_open')} style={{ marginBottom: '14px' }}>
                        <div className="status-board-head">
                            <div>
                                <div className="status-board-title">All open orders</div>
                                <div style={{ fontSize: '11px', color: 'var(--ink-soft)', marginTop: '1px' }}>
                                    Every active order with current stage
                                </div>
                            </div>
                            <div className="status-board-actions">
                                <span className="status-count status-badge sb-cad">{all_open.length}</span>
                                <PrintBoardButton onPrint={() => setPrintingBoard('all_open')} />
                            </div>
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
