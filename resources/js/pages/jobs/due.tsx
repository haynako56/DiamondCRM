import { Head } from '@inertiajs/react';

export default function DueDates() {
    const jobs = [
        { id: 'DG-001', client: 'Madeleine Perrottet', product: 'Custom Ring', due: '2026-06-17', stage: 'Awaiting CAD approval', balance: 2600 },
        { id: 'DG-005', client: 'Casey Machen', product: 'Custom Ring', due: '2026-06-03', stage: 'Diamonds awaiting delivery', balance: 2300 },
    ];

    return (
        <>
            <Head title="Due Dates" />
            <div className="topbar">
                <h1 className="topbar-title">Due Dates</h1>
                <button className="btn btn-gold">
                    ✉ Monday report
                </button>
            </div>
            
            <div className="content-scroll">
                <p className="text-sm text-ink-soft mb-4">Sorted by due date. 4-week default applied to new rings.</p>

                <div className="space-y-2">
                    {jobs.map((job) => {
                        const due = new Date(job.due);
                        const today = new Date();
                        const daysUntil = Math.ceil((due.getTime() - today.getTime()) / (1000 * 60 * 60 * 24));
                        const dueClass = daysUntil < 0 ? 'due-overdue' : daysUntil <= 7 ? 'due-soon' : 'due-ok';

                        return (
                            <div key={job.id} className="job-card flex items-center gap-4">
                                <div className="bg-surface-2 rounded-lg p-3 text-center w-16 flex-shrink-0">
                                    <p className="text-xs text-ink-soft uppercase">{due.toLocaleDateString('en-AU', { month: 'short' })}</p>
                                    <p className={`font-serif text-2xl font-medium ${dueClass}`}>{due.getDate()}</p>
                                </div>
                                <div className="flex-1">
                                    <p className="font-medium text-sm">{job.client}</p>
                                    <p className="text-xs text-ink-soft mt-1">{job.id} · {job.product}</p>
                                    <p className="text-xs text-ink-mid mt-1">{job.stage}</p>
                                </div>
                                <div className="text-right">
                                    <p className={`text-xs font-medium ${dueClass}`}>{daysUntil < 0 ? Math.abs(daysUntil) + 'd overdue' : 'In ' + daysUntil + 'd'}</p>
                                    <p className="text-xs text-ink-soft mt-2">${job.balance.toLocaleString()} owing</p>
                                </div>
                            </div>
                        );
                    })}
                </div>
            </div>
        </>
    );
}

DueDates.layout = {
    breadcrumbs: [
        { label: 'Due', href: route('jobs.index') },
    ],
}