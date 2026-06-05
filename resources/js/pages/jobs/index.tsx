import { Head, router } from '@inertiajs/react';
import { useState } from 'react';
import JobsList from '@/components/jobs/jobs-list';
import JobPanel from '@/components/jobs/job-panel';
import NewJobModal from '@/components/jobs/new-job-modal';

export default function JobsIndex({ jobs, stats }) {
    const [selectedJob, setSelectedJob]     = useState(null);
    const [currentFilter, setCurrentFilter] = useState('all');
    const [expandedCards, setExpandedCards] = useState(new Set());
    const [isModalOpen, setIsModalOpen]     = useState(false);
    const [noteUpdates, setNoteUpdates]     = useState<Record<number, any[]>>({});
    const [isSyncing, setIsSyncing]         = useState(false);

    const toggleCard = (jobId) => {
        setExpandedCards((prev) => {
            const next = new Set(prev);
            if (next.has(jobId)) next.delete(jobId);
            else next.add(jobId);
            return next;
        });
    };

    const handleJobNotesUpdated = (jobId: number, notes: any[]) => {
        setNoteUpdates((prev) => ({ ...prev, [jobId]: notes } as Record<number, any[]>));
    };

    const handleSync = () => {
        setIsSyncing(true);
        router.post('/jobs/sync', {}, {
            onSuccess: () => setIsSyncing(false),
            onError:   () => setIsSyncing(false),
        });
    };

    const jobsWithUpdatedNotes = jobs.map((job) => ({
        ...job,
        notes: noteUpdates[job.id] !== undefined ? noteUpdates[job.id] : job.notes,
    }));

    return (
        <>
            <Head title="Orders Management" />
            <div className="flex h-full overflow-hidden bg-surface">
                {/* Main Content */}
                <div className="flex-1 flex flex-col overflow-hidden">
                    {/* Top Bar */}
                    <div className="bg-white border-b border-border px-6 h-14 flex items-center justify-between flex-shrink-0">
                        <h1 className="font-serif text-xl font-medium">All Orders</h1>
                        <div className="flex gap-2">
                            <button
                                onClick={handleSync}
                                disabled={isSyncing}
                                className="text-xs px-3 py-1.5 border border-border rounded hover:!border-gold transition-colors disabled:opacity-50"
                            >
                                {isSyncing ? 'Syncing…' : '⟳ Sync WooCommerce'}
                            </button>
                            <button
                                onClick={() => setIsModalOpen(true)}
                                className="text-xs px-3 py-1.5 bg-gold text-white rounded hover:!bg-gold-dark transition-colors font-medium"
                            >
                                + New Order
                            </button>
                        </div>
                    </div>

                    {/* Content Scroll */}
                    <div className="flex-1 overflow-y-auto">
                        <JobsList
                            jobs={jobsWithUpdatedNotes}
                            stats={stats}
                            currentFilter={currentFilter}
                            setCurrentFilter={setCurrentFilter}
                            expandedCards={expandedCards}
                            toggleCard={toggleCard}
                            onSelectJob={setSelectedJob}
                        />
                    </div>
                </div>

                {/* Detail Panel — key forces a full remount when a different job is selected */}
                {selectedJob && (
                    <JobPanel
                        key={selectedJob.id}
                        job={selectedJob}
                        onClose={() => setSelectedJob(null)}
                        onJobNotesUpdated={handleJobNotesUpdated}
                    />
                )}
            </div>

            {isModalOpen && <NewJobModal onClose={() => setIsModalOpen(false)} />}
        </>
    );
}

JobsIndex.layout = {
    breadcrumbs: [{ title: 'Jobs' }],
};