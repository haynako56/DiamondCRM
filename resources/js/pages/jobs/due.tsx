import { Head } from '@inertiajs/react';

interface DueJob {
    id:      string;
    client:  string;
    product: string;
    due:     string;
    stage:   string;
    balance: number;
}

interface Props {
    jobs: DueJob[];
}

export default function DueDates({ jobs }: Props) {

    const sendMondayReport = () => {
        const date = new Date().toLocaleDateString('en-AU', { weekday: 'long', day: 'numeric', month: 'long', year: 'numeric' });

        let report = `DIAMOND GALLERY — DUE DATES REPORT\n`;
        report    += `${date}\n`;
        report    += `${'─'.repeat(40)}\n\n`;

        if (jobs.length === 0) {
            report += 'No upcoming due dates.\n';
        } else {
            jobs.forEach((job) => {
                const due       = new Date(job.due);
                const today     = new Date();
                today.setHours(0, 0, 0, 0);
                const daysUntil = Math.ceil((due.getTime() - today.getTime()) / (1000 * 60 * 60 * 24));
                const dueLabel  = daysUntil < 0
                    ? `${Math.abs(daysUntil)}d overdue`
                    : daysUntil === 0
                    ? 'Due today'
                    : `In ${daysUntil}d`;

                const dueFormatted = due.toLocaleDateString('en-AU', { day: 'numeric', month: 'long', year: 'numeric' });

                report += `${job.id} — ${job.client}\n`;
                report += `  Product:  ${job.product}\n`;
                report += `  Stage:    ${job.stage}\n`;
                report += `  Due:      ${dueFormatted} (${dueLabel})\n`;
                report += `  Balance:  ${job.balance > 0 ? '$' + job.balance.toLocaleString() + ' owing' : '✓ Paid'}\n`;
                report += `\n`;
            });
        }

        const subject = encodeURIComponent(`Diamond Gallery — Due Dates Report — ${new Date().toLocaleDateString('en-AU')}`);
        const body    = encodeURIComponent(report);

        window.open(`mailto:?subject=${subject}&body=${body}`);
    };
    return (
        <>
            <Head title="Due Dates" />
            <div className="topbar">
                <h1 className="topbar-title">Due Dates</h1>
                <button onClick={sendMondayReport} className="btn btn-gold">✉ Monday report</button>
            </div>

            <div className="content-scroll">
                <p className="text-sm text-ink-soft mb-4">
                    Sorted by due date — active orders only.
                </p>

                {jobs.length === 0 ? (
                    <div className="text-center py-12 text-ink-soft">
                        <div className="text-3xl opacity-25 mb-2">◈</div>
                        <p>No upcoming due dates.</p>
                    </div>
                ) : (
                    <div className="space-y-2">
                        {jobs.map((job) => {
                            const due        = new Date(job.due);
                            const today      = new Date();
                            today.setHours(0, 0, 0, 0);
                            const daysUntil  = Math.ceil((due.getTime() - today.getTime()) / (1000 * 60 * 60 * 24));
                            const dueClass   = daysUntil < 0 ? 'due-overdue' : daysUntil <= 7 ? 'due-soon' : 'due-ok';
                            const dueLabel   = daysUntil < 0
                                ? `${Math.abs(daysUntil)}d overdue`
                                : daysUntil === 0
                                ? 'Due today'
                                : `In ${daysUntil}d`;

                            return (
                                <div key={job.id} className="job-card flex items-center gap-4">
                                    {/* Date Block */}
                                    <div className="bg-surface-2 rounded-lg p-3 text-center w-16 flex-shrink-0">
                                        <p className="text-xs text-ink-soft uppercase">
                                            {due.toLocaleDateString('en-AU', { month: 'short' })}
                                        </p>
                                        <p className={`font-serif text-2xl font-medium ${dueClass}`}>
                                            {due.getDate()}
                                        </p>
                                    </div>

                                    {/* Details */}
                                    <div className="flex-1">
                                        <p className="font-medium text-sm">{job.client}</p>
                                        <p className="text-xs text-ink-soft mt-1">{job.id} · {job.product}</p>
                                        <p className="text-xs text-ink-mid mt-1">{job.stage}</p>
                                    </div>

                                    {/* Due & Balance */}
                                    <div className="text-right">
                                        <p className={`text-xs font-medium ${dueClass}`}>{dueLabel}</p>
                                        {job.balance > 0 && (
                                            <p className="text-xs text-ink-soft mt-2">${job.balance.toLocaleString()} owing</p>
                                        )}
                                        {job.balance <= 0 && (
                                            <p className="text-xs text-green-600 mt-2">✓ Paid</p>
                                        )}
                                    </div>
                                </div>
                            );
                        })}
                    </div>
                )}
            </div>
        </>
    );
}

DueDates.layout = {
    breadcrumbs: [
        { label: 'Due Dates', href: '/jobs/due' },
    ],
};