import { useState } from 'react';

export default function JobsList({ jobs, stats, currentFilter, setCurrentFilter, expandedCards, toggleCard, onSelectJob }) {

    // Track notes locally so they update instantly when edited from the panel
    const [jobNotes, setJobNotes] = useState<Record<number, string>>(
        Object.fromEntries(jobs.map((job) => [job.id, job.notes ?? '']))
    );

    const updateJobNote = (jobId: number, note: string) => {
        setJobNotes((prev) => ({ ...prev, [jobId]: note }));
    };

    const needsAction = (job) => {
        const steps = Object.values(job.tasks ?? []) as any[];
        return steps.some((task) => !task.is_done) && !job.completed;
    };

    const filteredJobs = jobs.filter((job) => {
        if (currentFilter === 'all')        return !job.completed;
        if (currentFilter === 'ring')       return job.type === 'ring' && !job.completed;
        if (currentFilter === 'jewellery')  return job.type === 'jewellery' && !job.completed;
        if (currentFilter === 'action')     return needsAction(job);
        if (currentFilter === 'completed')  return job.completed;
        return true;
    });

    const dueInfo = (createdAt: string) => {
        return new Date(createdAt).toLocaleDateString('en-AU', { day: 'numeric', month: 'short' });
    };

    const paymentBadge = (job) => {
        if (job.price === 0)  return { label: 'Price TBC',    cls: 'bg-red-100 text-red-700' };
        if (job.owing <= 0)   return { label: '✓ Paid',       cls: 'bg-green-100 text-green-700' };
        if (job.paid > 0)     return { label: 'Deposit paid', cls: 'bg-amber-100 text-amber-700' };
        return                       { label: 'No deposit',   cls: 'bg-red-100 text-red-700' };
    };

    const taskSteps = (job) => {
        return (job.tasks ?? []).map((task: any) => ({
            id:    task.id,
            label: task.label,
            done:  task.is_done,
            date:  task.task_date,
        }));
    };

    return (
        <div className="p-6 space-y-6">

            {/* Stats Row */}
            <div className="grid grid-cols-4 gap-3">
                <div className="bg-white border border-border rounded-lg p-4">
                    <div className="text-xs text-ink-soft uppercase tracking-widest mb-1">Active jobs</div>
                    <div className="font-serif text-2xl font-medium">{stats.active}</div>
                </div>
                <div className="bg-white border border-border rounded-lg p-4">
                    <div className="text-xs text-ink-soft uppercase tracking-widest mb-1">Due this week</div>
                    <div className={`font-serif text-2xl font-medium ${stats.due_soon > 0 ? 'text-amber-600' : ''}`}>{stats.due_soon}</div>
                </div>
                <div className="bg-white border border-border rounded-lg p-4">
                    <div className="text-xs text-ink-soft uppercase tracking-widest mb-1">Overdue</div>
                    <div className={`font-serif text-2xl font-medium ${stats.overdue > 0 ? 'text-red-600' : ''}`}>{stats.overdue}</div>
                </div>
                <div className="bg-white border border-border rounded-lg p-4">
                    <div className="text-xs text-ink-soft uppercase tracking-widest mb-1">Outstanding</div>
                    <div className="font-serif text-2xl font-medium text-gold-dark">${stats.outstanding.toLocaleString()}</div>
                </div>
            </div>

            {/* Alert */}
            {stats.overdue > 0 && (
                <div className="bg-amber-100 border border-amber-300 rounded p-3 text-sm text-amber-800 flex gap-2">
                    <span>⚠</span>
                    <span>{stats.overdue} job{stats.overdue > 1 ? 's are' : ' is'} past due date.</span>
                </div>
            )}

            {/* Filter Bar */}
            <div className="flex gap-2 flex-wrap items-center">
                <span className="text-xs text-ink-soft">Show:</span>
                {['all', 'ring', 'jewellery', 'action', 'completed'].map((filter) => (
                    <button
                        key={filter}
                        onClick={() => setCurrentFilter(filter)}
                        className={`px-3 py-1 rounded-full text-xs font-medium border transition-all ${
                            currentFilter === filter
                                ? 'bg-gold text-white border-gold'
                                : 'bg-white border-border text-ink-mid hover:!border-gold'
                        }`}
                    >
                        {filter === 'all' ? 'All' : filter === 'ring' ? 'Rings' : filter === 'jewellery' ? 'Jewellery' : filter === 'action' ? 'Needs action' : 'Completed'}
                    </button>
                ))}
            </div>

            {/* Jobs List */}
            <div className="space-y-2">
                {filteredJobs.length === 0 ? (
                    <div className="text-center py-12 text-ink-soft">
                        <div className="text-3xl opacity-25 mb-2">◈</div>
                        <p>No orders here</p>
                    </div>
                ) : (
                    filteredJobs.map((job) => {
                        const isExpanded   = expandedCards.has(job.id);
                        const steps        = taskSteps(job);
                        const doneTasks    = steps.filter((s) => s.done);
                        const badge        = paymentBadge(job);
                        const currentNote  = jobNotes[job.id] ?? '';

                        return (
                            <div key={job.id} className="bg-white border border-border rounded-lg p-4 cursor-pointer hover:border-gold transition-all">
                                <div onClick={() => toggleCard(job.id)}>

                                    {/* Header Row */}
                                    <div className="flex items-start gap-3 mb-3">
                                        <div>
                                            <div className="font-serif text-sm font-medium text-gold-dark">{job.woo_id}</div>
                                            <div className="text-xs text-ink-soft">{job.job_id}</div>
                                        </div>
                                        <div className="flex-1">
                                            <div className="text-sm font-medium">{job.product}</div>
                                            {job.line_items?.length > 1 && (
                                                <div className="text-xs text-ink-soft mt-0.5">+{job.line_items.length - 1} more item{job.line_items.length > 2 ? 's' : ''}</div>
                                            )}
                                            <div className="text-xs text-ink-soft mt-1">{job.client} · {job.email}</div>
                                        </div>
                                        <div className="flex flex-col items-end gap-2">
                                            <div className="flex items-center gap-2">
                                                <span className={`text-xs px-2 py-1 rounded-full font-medium ${job.type === 'ring' ? 'bg-purple-100 text-purple-700' : 'bg-green-100 text-green-700'}`}>
                                                    {job.type === 'ring' ? 'Ring' : 'Jewellery'}
                                                </span>
                                                <span className={`text-xs transition-transform ${isExpanded ? 'rotate-180' : ''}`}>▾</span>
                                            </div>
                                            <span className={`text-xs px-2 py-1 rounded-full font-medium ${badge.cls}`}>{badge.label}</span>
                                        </div>
                                    </div>

                                    {/* Pipeline Steps */}
                                    <div className="flex items-center justify-between gap-2 flex-wrap">
                                        <div className="flex gap-1 flex-wrap text-xs">
                                            {steps.map((step) => (
                                                <span key={step.id} className={`px-2 py-1 rounded border ${step.done ? 'step-active font-semibold' : 'bg-gray-100 text-gray-600 border-gray-300'}`}>
                                                    {step.done ? '●' : '○'} {step.label}
                                                </span>
                                            ))}
                                        </div>
                                        <div className="text-xs text-ink-soft whitespace-nowrap">⏱ {dueInfo(job.created_at)}</div>
                                    </div>

                                    {/* Job Note — shown below pipeline if exists */}
                                    {currentNote && (
                                        <div className="mt-3 text-xs p-2 bg-gold-pale border border-gold-light rounded text-ink-mid line-clamp-2">
                                            {currentNote}
                                        </div>
                                    )}
                                </div>

                                {/* Expanded Dropdown */}
                                {isExpanded && (
                                    <div className="border-t border-border pt-3 mt-3">
                                        <div className="mb-3">
                                            <h4 className="text-xs font-semibold text-ink-soft uppercase mb-2">Task Progress</h4>
                                            {doneTasks.length > 0 ? (
                                                <div className="space-y-2">
                                                    {doneTasks.map((step) => (
                                                        <div key={step.id} className="flex items-center gap-2 text-xs">
                                                            <div className="w-4 h-4 rounded-full bg-green-600 flex items-center justify-center text-white text-xs">✓</div>
                                                            <span className="text-green-700 font-medium flex-1">{step.label}</span>
                                                            {step.date && <span className="text-ink-soft">{new Date(step.date).toLocaleDateString('en-AU', { day: 'numeric', month: 'short', year: 'numeric' })}</span>}
                                                        </div>
                                                    ))}
                                                </div>
                                            ) : (
                                                <p className="text-xs text-ink-soft">No tasks completed yet.</p>
                                            )}
                                        </div>

                                        {job.price > 0 && (
                                            <div className="mb-3 pb-3 border-t border-border pt-3">
                                                <p className="text-xs text-ink-soft uppercase tracking-widest mb-1">Payment</p>
                                                <div className="flex items-center gap-3 text-xs flex-wrap">
                                                    <span><span className="text-ink-soft">Total</span> <span className="font-medium">${job.price.toLocaleString()}</span></span>
                                                    <span><span className="text-ink-soft">Paid</span> <span className="font-medium text-green-600">${job.paid.toLocaleString()}</span></span>
                                                    <span><span className="text-ink-soft">Owing</span> <span className="font-medium text-red-600">${job.owing.toLocaleString()}</span></span>
                                                </div>
                                            </div>
                                        )}

                                        <button
                                            onClick={() => onSelectJob({ ...job, _updateNote: updateJobNote })}
                                            className="text-xs text-gold-dark font-medium border border-gold-light px-3 py-1 rounded hover:bg-gold-pale transition-colors"
                                        >
                                            Open full details →
                                        </button>
                                    </div>
                                )}
                            </div>
                        );
                    })
                )}
            </div>
        </div>
    );
}