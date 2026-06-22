import { Head } from '@inertiajs/react';
import { useState } from 'react';
import JobPanel from '@/components/jobs/job-panel';

interface StatusJob {
    db_id:               number;
    id:                  string;
    woo_id:              string;
    client:              string;
    product:             string;
    stage:               string;
    due_raw:             string | null;
    category:            string;
    cad_sent:            boolean;
    cad_approved:        boolean;
    cad_send_date:       string;
    casting_done:        boolean;
    production_progress: string;
    production_done:     boolean;
    production_date:     string;
    cad_note:            string;
    production_note:     string;
}

interface Props {
    sent_to_cad:        StatusJob[];
    daniele_production: StatusJob[];
    all_open:           StatusJob[];
    jobs:               any[];
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

function CadItem({ job, onSelect }: { job: StatusJob; onSelect: (dbId: number) => void }) {
    const due = dueInfo(job.due_raw);
    let stage = '', stageCls = '';
    if (!job.cad_sent) {
        stage = 'CAD not yet sent'; stageCls = 'sb-waiting';
    } else if (!job.cad_approved) {
        stage = 'Awaiting client approval'; stageCls = 'sb-cad';
    }
    return (
        <div className="status-item" onClick={() => onSelect(job.db_id)}>
            <div className="status-item-top">
                <span className="status-woo">{job.woo_id}</span>
                <span className="status-name">{job.product}</span>
                <span className={`due-label ${due.cls}`}>⏱ {due.text}</span>
            </div>
            <div className="status-client">{job.client}</div>
            <div className="status-meta">
                {stage && <span className={`status-badge ${stageCls}`}>{stage}</span>}
                {job.cad_send_date && (
                    <span style={{ fontSize: '10px', color: 'var(--ink-soft)' }}>Sent {job.cad_send_date}</span>
                )}
            </div>
            {job.cad_note && <div className="status-note">📎 {job.cad_note}</div>}
        </div>
    );
}

function ProdItem({ job, onSelect }: { job: StatusJob; onSelect: (dbId: number) => void }) {
    const due          = dueInfo(job.due_raw);
    const needsCasting = job.category === 'cad_casting';
    let stage = '', stageCls = '';
    if (needsCasting && !job.casting_done) {
        stage = 'Waiting for casting'; stageCls = 'sb-waiting';
    } else if (!job.production_done) {
        const progress = job.production_progress || 'Not started';
        stage    = progress;
        stageCls = progress === 'Complete'    ? 'sb-approved'
                 : progress === 'In Progress' ? 'sb-prod'
                 : 'sb-waiting';
    } else {
        stage = 'Ready to dispatch'; stageCls = 'sb-approved';
    }
    return (
        <div className="status-item" onClick={() => onSelect(job.db_id)}>
            <div className="status-item-top">
                <span className="status-woo">{job.woo_id}</span>
                <span className="status-name">{job.product}</span>
                <span className={`due-label ${due.cls}`}>⏱ {due.text}</span>
            </div>
            <div className="status-client">{job.client}</div>
            <div className="status-meta">
                {stage && <span className={`status-badge ${stageCls}`}>{stage}</span>}
                {job.production_date && (
                    <span style={{ fontSize: '10px', color: 'var(--ink-soft)' }}>Updated {job.production_date}</span>
                )}
            </div>
            {job.production_note && <div className="status-note">📎 {job.production_note}</div>}
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

export default function Status({ sent_to_cad, daniele_production, all_open, jobs }: Props) {
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

                    <div className="status-boards">

                        {/* Sent to CAD */}
                        <div className="status-board">
                            <div className="status-board-head">
                                <div>
                                    <div className="status-board-title">Sent to CAD</div>
                                    <div style={{ fontSize: '11px', color: 'var(--ink-soft)', marginTop: '1px' }}>
                                        Orders awaiting CAD design or client approval
                                    </div>
                                </div>
                                <span className={`status-count status-badge ${sent_to_cad.length ? 'sb-cad' : 'sb-approved'}`}>
                                    {sent_to_cad.length}
                                </span>
                            </div>
                            {sent_to_cad.length > 0
                                ? sent_to_cad.map((job) => <CadItem key={job.id} job={job} onSelect={openPanel} />)
                                : <div className="status-empty">✓ All CAD complete</div>
                            }
                        </div>

                        {/* Daniele Production */}
                        <div className="status-board">
                            <div className="status-board-head">
                                <div>
                                    <div className="status-board-title">Daniele — Production</div>
                                    <div style={{ fontSize: '11px', color: 'var(--ink-soft)', marginTop: '1px' }}>
                                        Orders in production or awaiting casting
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
