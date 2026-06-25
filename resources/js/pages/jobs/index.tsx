import { Head, router } from '@inertiajs/react';
import { useState } from 'react';
import JobsList from '@/components/jobs/jobs-list';
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
            <div style={{ flex: 1, display: 'flex', flexDirection: 'column', overflow: 'hidden' }}>
                <div style={{ flex: 1, display: 'flex', flexDirection: 'column', overflow: 'hidden' }}>
                    <div className="topbar">
                        <h1 className="topbar-title">All Orders</h1>
                        <div style={{ display: 'flex', gap: '8px' }}>
                            <button
                                onClick={handleSync}
                                disabled={isSyncing}
                                className="btn"
                                style={{ opacity: isSyncing ? 0.5 : 1 }}
                            >
                                {isSyncing ? 'Syncing…' : '⟳ Sync WooCommerce'}
                            </button>
                            <button onClick={() => setIsModalOpen(true)} className="btn btn-gold">
                                + New Order
                            </button>
                        </div>
                    </div>

                    <div className="content-scroll">
                        <JobsList
                            jobs={jobsWithUpdatedNotes}
                            stats={stats}
                            currentFilter={currentFilter}
                            setCurrentFilter={setCurrentFilter}
                            expandedCards={expandedCards}
                            toggleCard={toggleCard}
                            selectedJob={selectedJob}
                            onSelectJob={setSelectedJob}
                            onJobNotesUpdated={handleJobNotesUpdated}
                        />
                    </div>
                </div>
            </div>

            {isModalOpen && <NewJobModal onClose={() => setIsModalOpen(false)} />}
        </>
    );
}

JobsIndex.layout = {
    breadcrumbs: [{ title: 'Jobs' }],
};