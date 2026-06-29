import { useState, useEffect, useRef } from 'react';
import JobPanel from '@/components/jobs/job-panel';

function ScrollIntoView({ children }: { children: React.ReactNode }) {
    const ref = useRef<HTMLDivElement>(null);
    useEffect(() => { ref.current?.scrollIntoView({ behavior: 'smooth', block: 'nearest' }); }, []);
    return <div ref={ref}>{children}</div>;
}

export default function JobsList({ jobs, stats, currentFilter, setCurrentFilter, expandedCards, toggleCard, selectedJob, onSelectJob, onJobNotesUpdated }: { jobs: any[]; stats: any; currentFilter: string; setCurrentFilter: (filter: string) => void; expandedCards: Set<any>; toggleCard: (id: any) => void; selectedJob: any; onSelectJob: (job: any) => void; onJobNotesUpdated?: (jobId: number, notes: any[]) => void }) {

    const [searchQuery, setSearchQuery] = useState('');

    const [paymentNotes] = useState<Record<number, string>>(
        Object.fromEntries(jobs.map((job: any) => [job.id, job.payment_note ?? '']))
    );

    const dueInfo = (dueDateStr: string | null): { cls: string; text: string } => {
        if (!dueDateStr) return { cls: 'due-ok', text: '—' };
        const today = new Date();
        today.setHours(0, 0, 0, 0);
        const due  = new Date(dueDateStr);
        const diff = Math.ceil((due.getTime() - today.getTime()) / (1000 * 60 * 60 * 24));
        if (diff < 0)   return { cls: 'due-overdue', text: Math.abs(diff) + 'd overdue' };
        if (diff === 0) return { cls: 'due-red',     text: 'Due today' };
        if (diff <= 3)  return { cls: 'due-red',     text: 'In ' + diff + 'd' };
        if (diff <= 7)  return { cls: 'due-orange',  text: 'In ' + diff + 'd' };
        if (diff <= 14) return { cls: 'due-green',   text: 'In ' + diff + 'd' };
        return { cls: 'due-ok', text: due.toLocaleDateString('en-AU', { day: 'numeric', month: 'short' }) };
    };

    const paymentBadge = (job: any): { label: string; cls: string } => {
        if (job.price === 0) return { label: 'Price TBC',    cls: 'badge-unpaid' };
        if (job.owing <= 0)  return { label: '✓ Paid',       cls: 'badge-paid' };
        if (job.paid > 0)    return { label: 'Deposit paid', cls: 'badge-deposit' };
        return                      { label: 'No deposit',   cls: 'badge-unpaid' };
    };

    const taskSteps = (job: any) => {
        const tasks = (job.tasks ?? []).map((task: any) => ({
            id:    task.id,
            label: task.label,
            done:  task.is_done,
            date:  task.task_date,
        }));
        let activeAssigned = false;
        return tasks.map((step: any) => {
            const isActive = !activeAssigned && !step.done;
            if (isActive) activeAssigned = true;
            return { ...step, active: isActive };
        });
    };

    const needsAction = (job: any) => {
        return taskSteps(job).some((step: any) => !step.done) && !job.completed;
    };

    const matchesSearch = (job: any): boolean => {
        if (!searchQuery) return true;
        const query = searchQuery.toLowerCase();
        return (
            job.client?.toLowerCase().includes(query) ||
            job.product?.toLowerCase().includes(query) ||
            job.job_id?.toLowerCase().includes(query) ||
            job.woo_id?.toLowerCase().includes(query) ||
            job.email?.toLowerCase().includes(query)
        );
    };

    const filteredJobs = jobs.filter((job: any) => {
        if (!matchesSearch(job)) return false;
        if (currentFilter === 'all')       return !job.completed;
        if (currentFilter === 'ring')      return job.type === 'ring' && !job.completed;
        if (currentFilter === 'jewellery') return job.type === 'jewellery' && !job.completed;
        if (currentFilter === 'action')    return needsAction(job);
        if (currentFilter === 'completed') return job.completed;
        return true;
    });

    const filterLabels: Record<string, string> = {
        all: 'All', ring: 'Rings', jewellery: 'Jewellery', action: 'Needs action', completed: 'Completed',
    };

    return (
        <div>
            {/* Stats */}
            <div className="stats-row">
                <div className="stat-card">
                    <div className="stat-label">Active jobs</div>
                    <div className="stat-value">{stats.active}</div>
                </div>
                <div className="stat-card">
                    <div className="stat-label">Due this week</div>
                    <div className={`stat-value ${stats.due_soon > 0 ? 'warn' : ''}`}>{stats.due_soon}</div>
                </div>
                <div className="stat-card">
                    <div className="stat-label">Overdue</div>
                    <div className={`stat-value ${stats.overdue > 0 ? 'danger' : ''}`}>{stats.overdue}</div>
                </div>
                <div className="stat-card">
                    <div className="stat-label">Outstanding</div>
                    <div className="stat-value gold">${stats.outstanding.toLocaleString()}</div>
                </div>
            </div>

            {/* Overdue alert */}
            {stats.overdue > 0 && (
                <div className="alert">
                    <span>⚠</span>
                    <span>{stats.overdue} job{stats.overdue > 1 ? 's are' : ' is'} past due date.</span>
                </div>
            )}

            {/* Filter bar + search */}
            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: '8px', marginBottom: '14px', flexWrap: 'wrap' }}>
                <div className="filter-bar" style={{ marginBottom: 0 }}>
                    <span style={{ fontSize: '11px', color: 'var(--ink-soft)' }}>Show:</span>
                    {['all', 'ring', 'jewellery', 'action', 'completed'].map((filter) => (
                        <div
                            key={filter}
                            className={`filter-chip ${currentFilter === filter ? 'active' : ''}`}
                            onClick={() => setCurrentFilter(filter)}
                        >
                            {filterLabels[filter]}
                        </div>
                    ))}
                </div>
                <input
                    type="search"
                    placeholder="Search client, product, order…"
                    value={searchQuery}
                    onChange={(event) => setSearchQuery(event.target.value)}
                    style={{ width: '220px', marginBottom: 0 }}
                />
            </div>

            {/* Job cards */}
            {filteredJobs.length === 0 ? (
                <div style={{ textAlign: 'center', padding: '48px 0', color: 'var(--ink-soft)' }}>
                    <div style={{ fontSize: '28px', opacity: 0.2, marginBottom: '8px' }}>◈</div>
                    <p>No orders here</p>
                </div>
            ) : (
                filteredJobs.map((job: any) => {
                    const isExpanded         = expandedCards.has(job.id);
                    const isSelected         = selectedJob?.id === job.id;
                    const steps              = taskSteps(job);
                    const doneTasks          = steps.filter((step: any) => step.done);
                    const badge              = paymentBadge(job);
                    const due                = dueInfo(job.due_date ?? null);
                    const latestNotes        = (Array.isArray(job.notes) ? job.notes : []).slice(0, 2);
                    const currentPaymentNote = paymentNotes[job.id] ?? '';

                    return (
                        <div key={job.id}>
                        <div className={`job-card${isSelected ? ' selected' : ''}`}>
                            <div onClick={() => toggleCard(job.id)}>

                                {/* Card top */}
                                <div className="job-card-top">
                                    <div>
                                        <div className="job-id">{job.woo_id}</div>
                                        <div className="job-woo">{job.job_id}</div>
                                    </div>
                                    <div style={{ flex: 1 }}>
                                        <div className="job-client" style={{ fontWeight: 600, fontSize: '14px', color: 'var(--ink)' }}>{job.client}</div>
                                        <div className="job-product" style={{ fontWeight: 400, fontSize: '12px', color: 'var(--ink-soft)', marginTop: '1px' }}>{job.product}</div>
                                    </div>
                                    <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'flex-end', gap: '4px' }}>
                                        <div style={{ display: 'flex', alignItems: 'center', gap: '5px' }}>
                                            <span className={`badge ${job.type === 'ring' ? 'badge-ring' : 'badge-jewellery'}`}>
                                                {job.type === 'ring' ? 'Ring' : 'Jewellery'}
                                            </span>
                                            <span className={`card-chevron ${isExpanded ? 'open' : ''}`}>▾</span>
                                        </div>
                                        <span className={`badge ${badge.cls}`}>{badge.label}</span>
                                    </div>
                                </div>

                                {/* Pipeline + due */}
                                <div className="job-meta">
                                    <div className="pipeline">
                                        {steps.map((step: any) => (
                                            <span
                                                key={step.id}
                                                className={`step ${step.done ? 'step-done' : step.active ? 'step-active' : 'step-todo'}`}
                                            >
                                                {step.done ? '✔ ' : step.active ? '● ' : '○ '}{step.label}
                                            </span>
                                        ))}
                                    </div>
                                    <div className={`due-label ${due.cls}`}>⏱ {due.text}</div>
                                </div>

                                {/* Latest notes */}
                                {latestNotes.length > 0 && (
                                    <div style={{ marginTop: '7px' }}>
                                        {latestNotes.map((note: any, index: number) => (
                                            <div
                                                key={index}
                                                style={{ marginBottom: '4px', fontSize: '11px', color: 'var(--ink-mid)', background: 'var(--gold-pale)', border: '1px solid var(--gold-light)', borderRadius: '5px', padding: '5px 9px', lineHeight: 1.5 }}
                                            >
                                                📝 {note.content}
                                            </div>
                                        ))}
                                    </div>
                                )}

                                {/* Payment note */}
                                {currentPaymentNote && (
                                    <div style={{ marginTop: '5px', fontSize: '11px', color: 'var(--ink-mid)', background: 'var(--surface-2)', border: '1px solid var(--payment-note-border)', borderRadius: '5px', padding: '5px 9px', lineHeight: 1.5 }}>
                                        💬 {currentPaymentNote}
                                    </div>
                                )}
                            </div>

                            {/* Expanded dropdown */}
                            <div className={`card-dropdown ${isExpanded ? 'open' : ''}`}>
                                <div className="drop-section">
                                    <div className="drop-section-head">Task progress</div>
                                    {doneTasks.length > 0 ? (
                                        doneTasks.map((step: any) => (
                                            <div key={step.id}>
                                                <div className="drop-task-row">
                                                    <div className="drop-check done">✓</div>
                                                    <div className="drop-task-name done">{step.label}</div>
                                                    {step.date && (
                                                        <span style={{ fontSize: '10px', color: 'var(--ink-soft)', marginLeft: 'auto' }}>
                                                            {new Date(step.date).toLocaleDateString('en-AU', { day: 'numeric', month: 'short', year: 'numeric' })}
                                                        </span>
                                                    )}
                                                </div>
                                            </div>
                                        ))
                                    ) : (
                                        <div style={{ fontSize: '11px', color: 'var(--ink-soft)', padding: '4px 0' }}>No tasks completed yet.</div>
                                    )}
                                </div>

                                {job.price > 0 && (
                                    <div className="drop-section">
                                        <div className="drop-section-head">Payment</div>
                                        <div style={{ display: 'flex', gap: '10px', fontSize: '12px' }}>
                                            <span style={{ color: 'var(--ink-soft)' }}>Total <strong style={{ color: 'var(--ink-mid)' }}>${(job.price || 0).toLocaleString()}</strong></span>
                                            <span style={{ color: 'var(--ink-soft)' }}>Paid <strong style={{ color: 'var(--green)' }}>${(job.paid || 0).toLocaleString()}</strong></span>
                                            {job.owing > 0
                                                ? <span style={{ color: 'var(--ink-soft)' }}>Owing <strong style={{ color: 'var(--red)' }}>${job.owing.toLocaleString()}</strong></span>
                                                : <span style={{ color: 'var(--green)', fontWeight: 500 }}>✓ Fully paid</span>
                                            }
                                        </div>
                                    </div>
                                )}

                                <button className="drop-open-btn" onClick={(event) => { event.stopPropagation(); onSelectJob(isSelected ? null : job); }}>
                                    {isSelected ? '✕ Close details' : 'Open full details →'}
                                </button>
                            </div>
                        </div>
                        {isSelected && (
                            <ScrollIntoView>
                                <JobPanel
                                    key={job.id}
                                    job={job}
                                    inline={true}
                                    onClose={() => onSelectJob(null)}
                                    onJobNotesUpdated={onJobNotesUpdated ?? (() => {})}
                                />
                            </ScrollIntoView>
                        )}
                        </div>
                    );
                })
            )}
        </div>
    );
}
