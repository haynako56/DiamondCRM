import { useState } from 'react';
import { router } from '@inertiajs/react';

// ─── Production Task Component ────────────────────────────────────────────────


const PAYMENT_PLANS = [
    'Deposit + balance on pickup',
    'Deposit + balance on dispatch',
    'Full payment upfront',
    'Paid in full',
    'Custom arrangement',
];

const COLLECTION_METHODS = [
    'Collect from Showroom',
    'Dispatch by Aus Post',
    'Left in Safe',
];

function taskDateLabel(taskKey: string): string {
    const labels: Record<string, string> = {
        diamonds_order:      'Order date',
        diamonds_delivered:  'Received date',
        cad_send:            'Date sent',
        cad_received:        'Date received',
        cad_approve:         'Approval date',
        casting:             'Date sent',
        production:          'Completion date',
        supplier_order:      'Order date',
        delivery_confirmed:  'Delivery date',
        collection_dispatch: 'Date',
    };
    return labels[taskKey] ?? 'Date';
}

// ─── Delete Confirmation Modal ────────────────────────────────────────────────

function DeleteConfirmModal({ taskLabel, onConfirm, onCancel }) {
    return (
        <div className="fixed inset-0 z-50 bg-black/40 flex items-center justify-center p-4">
            <div className="bg-white rounded-xl w-full max-w-sm shadow-xl">
                <div className="p-5 border-b border-border">
                    <h3 className="font-serif text-lg font-medium">Delete task</h3>
                </div>
                <div className="p-5">
                    <p className="text-sm text-ink-mid">
                        Are you sure you want to delete <strong>"{taskLabel}"</strong>? This cannot be undone.
                    </p>
                </div>
                <div className="p-5 border-t border-border flex justify-end gap-2">
                    <button onClick={onCancel} className="text-sm px-4 py-2 border border-border rounded hover:!border-gold transition-colors">Cancel</button>
                    <button onClick={onConfirm} className="text-sm px-4 py-2 bg-red-600 text-white rounded font-medium hover:bg-red-700 transition-colors">Delete</button>
                </div>
            </div>
        </div>
    );
}

// ─── Payment Note Section ─────────────────────────────────────────────────────

function PaymentNoteSection({ jobId, initialNote, onNoteSaved }) {
    const [note, setNote]           = useState(initialNote ?? '');
    const [draftNote, setDraftNote] = useState(initialNote ?? '');
    const [isEditing, setIsEditing] = useState(false);

    const handleSave = () => {
        setNote(draftNote);
        setIsEditing(false);
        onNoteSaved(draftNote);
        router.patch(`/orders/${jobId}`, { payment_note: draftNote }, { preserveScroll: true, preserveState: true });
    };

    const handleCancel = () => {
        setDraftNote(note);
        setIsEditing(false);
    };

    const handleDelete = () => {
        setNote('');
        setDraftNote('');
        setIsEditing(false);
        router.patch(`/orders/${jobId}`, { payment_note: '' }, { preserveScroll: true, preserveState: true });
    };

    return (
        <div className="mt-3">
            <p className="text-xs text-ink-soft uppercase tracking-widest mb-2">Payment Note</p>

            {/* Show existing note as bubble when not editing */}
            {note && !isEditing && (
                <div
                    onClick={() => { setDraftNote(note); setIsEditing(true); }}
                    className="text-xs bg-gold-pale border border-gold-light rounded px-3 py-2 text-ink-mid cursor-pointer hover:!border-gold transition-colors mb-2 flex items-center gap-2"
                >
                    <span>💬</span> {note}
                </div>
            )}

            {isEditing ? (
                <div className="space-y-2">
                    <textarea
                        value={draftNote}
                        onChange={(e) => setDraftNote(e.target.value)}
                        rows={3}
                        placeholder="e.g. Deposit received via bank transfer"
                        className="w-full text-xs border border-gold rounded px-3 py-2 resize-none focus:outline-none focus:ring-1 focus:ring-gold"
                        autoFocus
                    />
                    <div className="flex gap-2">
                        <button onClick={handleSave} className="text-xs px-3 py-1.5 bg-gold text-white rounded font-medium hover:!bg-gold-dark transition-colors">Save</button>
                        <button onClick={handleCancel} className="text-xs px-3 py-1.5 border border-border rounded hover:!border-gold transition-colors">Cancel</button>
                        {note && (
                            <button onClick={handleDelete} className="text-xs px-3 py-1.5 border border-red-300 text-red-600 rounded hover:!bg-red-50 transition-colors ml-auto">Delete</button>
                        )}
                    </div>
                </div>
            ) : !note ? (
                <button onClick={() => setIsEditing(true)} className="text-xs text-gold-dark font-medium hover:underline">
                    + Add note
                </button>
            ) : null}
        </div>
    );
}

// ─── Edit Order Details Modal ─────────────────────────────────────────────────

function EditOrderModal({ job, savedDetails, onSave, onClose }) {
    const [draft, setDraft] = useState({
        client:                savedDetails.client,
        product:               savedDetails.product,
        email:                 savedDetails.email,
        phone:                 savedDetails.phone,
        address:               savedDetails.address,
        woocommerce_order_id:  savedDetails.woocommerce_order_id ?? '',
    });

    const handleConfirm = () => {
        onSave(draft);
        onClose();
        router.patch(`/orders/${job.id}`, draft, { preserveScroll: true, preserveState: true });
    };

    return (
        <div className="fixed inset-0 z-50 bg-black/40 flex items-center justify-center p-4">
            <div className="bg-white rounded-xl w-full max-w-md shadow-xl">
                <div className="p-5 border-b border-border">
                    <h3 className="font-serif text-lg font-medium">Edit order details</h3>
                </div>
                <div className="p-5 space-y-3">
                    <div>
                        <label className="text-xs text-ink-soft uppercase tracking-widest block mb-1">Client name</label>
                        <input type="text" value={draft.client} onChange={(e) => setDraft({ ...draft, client: e.target.value })} className="w-full text-sm border border-border rounded px-3 py-2" />
                    </div>
                    <div>
                        <label className="text-xs text-ink-soft uppercase tracking-widest block mb-1">Product</label>
                        <input type="text" value={draft.product} onChange={(e) => setDraft({ ...draft, product: e.target.value })} className="w-full text-sm border border-border rounded px-3 py-2" />
                    </div>
                    <div>
                        <label className="text-xs text-ink-soft uppercase tracking-widest block mb-1">Email</label>
                        <input type="email" value={draft.email} onChange={(e) => setDraft({ ...draft, email: e.target.value })} className="w-full text-sm border border-border rounded px-3 py-2" />
                    </div>
                    <div>
                        <label className="text-xs text-ink-soft uppercase tracking-widest block mb-1">Phone</label>
                        <input
                            type="tel"
                            value={draft.phone}
                            onChange={(e) => setDraft({ ...draft, phone: e.target.value.replace(/[^0-9+\s\-()]/g, '') })}
                            className="w-full text-sm border border-border rounded px-3 py-2"
                        />
                    </div>
                    <div>
                        <label className="text-xs text-ink-soft uppercase tracking-widest block mb-1">Address</label>
                        <input type="text" value={draft.address} onChange={(e) => setDraft({ ...draft, address: e.target.value })} className="w-full text-sm border border-border rounded px-3 py-2" />
                    </div>
                    <div>
                        <label className="text-xs text-ink-soft uppercase tracking-widest block mb-1">WooCommerce Order ID</label>
                        <input
                            type="number"
                            min="1"
                            value={draft.woocommerce_order_id}
                            onChange={(e) => setDraft({ ...draft, woocommerce_order_id: e.target.value })}
                            placeholder="e.g. 12345"
                            className="w-full text-sm border border-border rounded px-3 py-2"
                        />
                    </div>
                </div>
                <div className="p-5 border-t border-border flex justify-end gap-2">
                    <button onClick={onClose} className="text-sm px-4 py-2 border border-border rounded hover:!border-gold transition-colors">Cancel</button>
                    <button onClick={handleConfirm} className="text-sm px-4 py-2 bg-gold text-white rounded font-medium hover:!bg-gold-dark">Confirm</button>
                </div>
            </div>
        </div>
    );
}

// ─── Edit Payment Modal ───────────────────────────────────────────────────────

function EditPaymentModal({ job, savedPayment, onSave, onClose }) {
    const [draft, setDraft] = useState({
        price:        savedPayment.price,
        amount_paid:  savedPayment.amount_paid,
        payment_plan: savedPayment.payment_plan ?? PAYMENT_PLANS[0],
    });

    const handleConfirm = () => {
        onSave(draft);
        onClose();
        router.patch(`/orders/${job.id}`, {
            price:        draft.price,
            amount_paid:  draft.amount_paid,
            payment_plan: draft.payment_plan,
        }, { preserveScroll: true, preserveState: true });
    };

    return (
        <div className="fixed inset-0 z-50 bg-black/40 flex items-center justify-center p-4">
            <div className="bg-white rounded-xl w-full max-w-md shadow-xl">
                <div className="p-5 border-b border-border">
                    <h3 className="font-serif text-lg font-medium">Update payment</h3>
                    <p className="text-xs text-gold-dark mt-1">Update price and amount paid for {job.client}</p>
                </div>
                <div className="p-5 space-y-3">
                    <div>
                        <label className="text-xs text-ink-soft uppercase tracking-widest block mb-1">Total price ($AUD)</label>
                        <input
                            type="number"
                            min="0"
                            step="0.01"
                            value={draft.price}
                            onChange={(e) => setDraft({ ...draft, price: e.target.value })}
                            className="w-full text-sm border border-border rounded px-3 py-2"
                        />
                    </div>
                    <div>
                        <label className="text-xs text-ink-soft uppercase tracking-widest block mb-1">Amount paid so far ($AUD)</label>
                        <input
                            type="number"
                            min="0"
                            step="0.01"
                            value={draft.amount_paid}
                            onChange={(e) => setDraft({ ...draft, amount_paid: e.target.value })}
                            className="w-full text-sm border border-border rounded px-3 py-2"
                        />
                    </div>
                    <div>
                        <label className="text-xs text-ink-soft uppercase tracking-widest block mb-1">Payment plan</label>
                        <select
                            value={draft.payment_plan}
                            onChange={(e) => setDraft({ ...draft, payment_plan: e.target.value })}
                            className="w-full text-sm border border-border rounded px-3 py-2 bg-white"
                        >
                            {PAYMENT_PLANS.map((plan) => (
                                <option key={plan} value={plan}>{plan}</option>
                            ))}
                        </select>
                    </div>
                    {/* Live preview */}
                    {Number(draft.price) > 0 && (
                        <div className="text-xs bg-surface-2 rounded px-3 py-2 text-ink-mid">
                            {draft.payment_plan} — owing: <strong className="text-red-600">${Math.max(0, Number(draft.price) - Number(draft.amount_paid)).toLocaleString()}</strong>
                        </div>
                    )}
                </div>
                <div className="p-5 border-t border-border flex justify-end gap-2">
                    <button onClick={onClose} className="text-sm px-4 py-2 border border-border rounded hover:!border-gold transition-colors">Cancel</button>
                    <button onClick={handleConfirm} className="text-sm px-4 py-2 bg-gold text-white rounded font-medium hover:!bg-gold-dark">Confirm</button>
                </div>
            </div>
        </div>
    );
}

// ─── Order Task ───────────────────────────────────────────────────────────────

type TaskNote = { content: string; date: string };

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

function OrderTask({ task, orderId, onDeleted }) {
    const [isDone, setIsDone]                       = useState(Boolean(task.is_done));
    const [taskDate, setTaskDate]                   = useState(task.task_date ? task.task_date.substring(0, 10) : '');
    const [taskNotes, setTaskNotes]                 = useState<TaskNote[]>(parseTaskNotes(task.note));
    const [trackingRef, setTrackingRef]             = useState(task.tracking_ref ?? '');
    const [collectionMethod, setCollectionMethod]   = useState(task.progress ?? '');
    const [showNoteInput, setShowNoteInput]         = useState(false);
    const [draftNote, setDraftNote]                 = useState('');
    const [showDeleteConfirm, setShowDeleteConfirm] = useState(false);

    const saveToServer = (fields: Record<string, any>) => {
        router.patch(`/orders/${orderId}/tasks/${task.id}`, fields, { preserveScroll: true, preserveState: true });
    };

    const toggleDone = () => {
        const newValue = !isDone;
        setIsDone(newValue);
        if (newValue && !taskDate) {
            const today = new Date().toISOString().split('T')[0];
            setTaskDate(today);
            saveToServer({ is_done: newValue, task_date: today });
        } else {
            saveToServer({ is_done: newValue });
        }
    };

    const addTaskNote = () => {
        if (!draftNote.trim()) return;
        const entry: TaskNote = {
            content: draftNote.trim(),
            date:    new Date().toLocaleDateString('en-AU', { day: 'numeric', month: 'short', year: 'numeric' }),
        };
        const updated = [...taskNotes, entry];
        setTaskNotes(updated);
        setDraftNote('');
        setShowNoteInput(false);
        saveToServer({ note: JSON.stringify(updated) });
    };

    const deleteTaskNote = (index: number) => {
        const updated = taskNotes.filter((_, i) => i !== index);
        setTaskNotes(updated);
        saveToServer({ note: JSON.stringify(updated) });
    };

    const confirmDelete = () => {
        router.delete(`/orders/${orderId}/tasks/${task.id}`, {
            preserveScroll: true,
            preserveState:  true,
            onSuccess:      () => onDeleted(task.id),
        });
    };

    return (
        <>
            <div className="pb-5 mb-5 border-b border-border last:border-0 last:mb-0 last:pb-0">
                <div className="flex items-start gap-3 mb-3">
                    <button
                        onClick={toggleDone}
                        className={`w-5 h-5 mt-0.5 rounded-full border-2 flex items-center justify-center flex-shrink-0 transition-colors ${
                            isDone ? 'bg-amber-done text-white' : 'border-gray-300 hover:border-gold'
                        }`}
                    >
                        {isDone && <span className="text-xs">✓</span>}
                    </button>
                    <div className="flex-1">
                        <p className={`text-sm font-medium ${isDone ? 'line-through text-ink-soft' : 'text-ink'}`}>{task.label}</p>
                        {task.description && <p className="text-xs text-ink-soft mt-0.5">{task.description}</p>}
                        {task.is_custom   && <p className="text-xs text-ink-soft mt-0.5">Custom</p>}
                    </div>
                    {task.is_custom && (
                        <button onClick={() => setShowDeleteConfirm(true)} className="text-ink-soft hover:text-red-500 transition-colors text-base flex-shrink-0" title="Delete custom task">✕</button>
                    )}
                </div>

                <div className="ml-8 space-y-2">
                    {task.key === 'collection_dispatch' && (
                        <div className="flex items-center gap-3">
                            <span className="text-xs text-ink-soft w-28 flex-shrink-0">Method</span>
                            <select
                                value={collectionMethod}
                                onChange={(e) => { setCollectionMethod(e.target.value); saveToServer({ progress: e.target.value }); }}
                                className="flex-1 text-xs border border-border rounded px-2 py-1.5 bg-white"
                            >
                                <option value="">Select method…</option>
                                {COLLECTION_METHODS.map((method) => (
                                    <option key={method} value={method}>{method}</option>
                                ))}
                            </select>
                        </div>
                    )}
                    {(task.key === 'collection_dispatch' || task.key === 'supplier_order') && (
                        <div className="flex items-center gap-3">
                            <span className="text-xs text-ink-soft w-28 flex-shrink-0">Tracking ref</span>
                            <input type="text" defaultValue={trackingRef} onBlur={(e) => { setTrackingRef(e.target.value); saveToServer({ tracking_ref: e.target.value }); }} placeholder="Enter tracking number" className="flex-1 text-xs border border-border rounded px-2 py-1.5" />
                        </div>
                    )}
                    <div className="flex items-center gap-3">
                        <span className="text-xs text-ink-soft w-28 flex-shrink-0">{taskDateLabel(task.key)}</span>
                        <input type="date" value={taskDate} onChange={(e) => { setTaskDate(e.target.value); saveToServer({ task_date: e.target.value }); }} className="flex-1 text-xs border border-border rounded px-2 py-1.5" />
                    </div>
                    {taskNotes.map((entry, index) => (
                        <div key={index} className="group text-xs bg-gold-pale border border-gold-light rounded px-3 py-2 text-ink-mid leading-relaxed flex gap-2 items-start">
                            <div className="flex-1">
                                <p>{entry.content}</p>
                                {entry.date && <p className="text-ink-soft mt-0.5">{entry.date}</p>}
                            </div>
                            <button onClick={() => deleteTaskNote(index)} className="opacity-0 group-hover:opacity-100 text-ink-soft hover:text-red-500 transition-colors flex-shrink-0" title="Delete note">✕</button>
                        </div>
                    ))}
                    {showNoteInput ? (
                        <div className="space-y-2">
                            <textarea value={draftNote} onChange={(e) => setDraftNote(e.target.value)} rows={2} placeholder="Add a note..." className="w-full text-xs border border-gold rounded px-3 py-2 resize-none focus:outline-none focus:ring-1 focus:ring-gold" autoFocus />
                            <div className="flex gap-2">
                                <button onClick={addTaskNote} disabled={!draftNote.trim()} className="text-xs px-3 py-1.5 bg-gold text-white rounded hover:!bg-gold-dark transition-colors font-medium disabled:opacity-50">Save</button>
                                <button onClick={() => { setShowNoteInput(false); setDraftNote(''); }} className="text-xs px-3 py-1.5 border border-border rounded hover:!border-gold transition-colors">Cancel</button>
                            </div>
                        </div>
                    ) : (
                        <button onClick={() => setShowNoteInput(true)} className="text-xs text-gold-dark font-medium hover:underline">+ Add note</button>
                    )}
                </div>
            </div>

            {showDeleteConfirm && (
                <DeleteConfirmModal taskLabel={task.label} onConfirm={confirmDelete} onCancel={() => setShowDeleteConfirm(false)} />
            )}
        </>
    );
}

// ─── Add Custom Task Form ─────────────────────────────────────────────────────

function AddCustomTaskForm({ orderId, onAdded, onCancel }) {
    const [label, setLabel]             = useState('');
    const [description, setDescription] = useState('');
    const [isSaving, setIsSaving]       = useState(false);

    const handleAdd = () => {
        if (!label.trim()) return;
        setIsSaving(true);
        router.post(`/orders/${orderId}/tasks`, { label: label.trim(), description: description.trim() }, {
            preserveScroll: true,
            preserveState:  true,
            onSuccess: (page) => {
                const updatedJobs = (page.props as any).jobs;
                const updatedJob  = updatedJobs?.find((j: any) => j.id === orderId);
                const newTask     = updatedJob?.tasks?.at(-1);
                if (newTask) onAdded(newTask);
                setIsSaving(false);
            },
            onError: () => setIsSaving(false),
        });
    };

    return (
        <div className="mt-3 p-3 border border-dashed border-gold-light rounded-lg bg-gold-pale space-y-2">
            <input type="text" value={label} onChange={(e) => setLabel(e.target.value)} placeholder="Task name (required)" className="w-full text-xs border border-border rounded px-2 py-1.5 bg-white focus:outline-none focus:border-gold" autoFocus />
            <input type="text" value={description} onChange={(e) => setDescription(e.target.value)} placeholder="Description (optional)" className="w-full text-xs border border-border rounded px-2 py-1.5 bg-white focus:outline-none focus:border-gold" />
            <div className="flex gap-2 pt-1">
                <button onClick={handleAdd} disabled={!label.trim() || isSaving} className="text-xs px-3 py-1.5 bg-gold text-white rounded font-medium disabled:opacity-50">
                    {isSaving ? 'Adding…' : 'Add task'}
                </button>
                <button onClick={onCancel} className="text-xs px-3 py-1.5 border border-border rounded">Cancel</button>
            </div>
        </div>
    );
}

// ─── Job Notes Section ────────────────────────────────────────────────────────

type OrderNote = { id: number; content: string; created_at: string };

function NoteItem({ note, onDeleted }: { note: OrderNote; onDeleted: (id: number) => void }) {
    return (
        <div className="group text-xs bg-gold-pale border border-gold-light rounded px-3 py-2 text-ink-mid leading-relaxed flex gap-2 items-start">
            <div className="flex-1">
                <p>{note.content}</p>
                <p className="text-ink-soft mt-1">{new Date(note.created_at).toLocaleDateString('en-AU', { day: 'numeric', month: 'short', year: 'numeric' })}</p>
            </div>
            <button onClick={() => onDeleted(note.id)} className="opacity-0 group-hover:opacity-100 text-ink-soft hover:text-red-500 transition-colors flex-shrink-0" title="Delete note">✕</button>
        </div>
    );
}

function JobNotesSection({ jobId, initialNotes, onNotesUpdated }: { jobId: number; initialNotes: OrderNote[]; onNotesUpdated: (notes: OrderNote[]) => void }) {
    const [notes, setNotes]               = useState<OrderNote[]>(initialNotes ?? []);
    const [newNoteContent, setNewNoteContent] = useState('');
    const [isAdding, setIsAdding]         = useState(false);
    const [isSaving, setIsSaving]         = useState(false);

    const handleAdd = () => {
        if (!newNoteContent.trim()) return;
        setIsSaving(true);
        router.post(`/orders/${jobId}/notes`, { content: newNoteContent.trim() }, {
            preserveScroll: true,
            preserveState:  true,
            onSuccess: (page) => {
                const updatedJobs  = (page.props as any).jobs;
                const updatedJob   = updatedJobs?.find((job: any) => job.id === jobId);
                const updatedNotes = updatedJob?.notes ?? notes;
                setNotes(updatedNotes);
                onNotesUpdated(updatedNotes);
                setNewNoteContent('');
                setIsAdding(false);
                setIsSaving(false);
            },
            onError: () => setIsSaving(false),
        });
    };

    const handleDelete = (noteId: number) => {
        router.delete(`/orders/${jobId}/notes/${noteId}`, {
            preserveScroll: true,
            preserveState:  true,
            onSuccess: (page) => {
                const updatedJobs  = (page.props as any).jobs;
                const updatedJob   = updatedJobs?.find((job: any) => job.id === jobId);
                const updatedNotes = updatedJob?.notes ?? notes.filter((note) => note.id !== noteId);
                setNotes(updatedNotes);
                onNotesUpdated(updatedNotes);
            },
        });
    };

    return (
        <section>
            <div className="flex items-center justify-between mb-3 pb-2 border-b border-border">
                <h3 className="text-xs font-semibold text-ink-soft uppercase tracking-wider">Job Notes</h3>
                {!isAdding && (
                    <button onClick={() => setIsAdding(true)} className="text-xs px-2 py-1 border border-border rounded hover:!border-gold transition-colors">
                        + Add note
                    </button>
                )}
            </div>

            {notes.length > 0 && (
                <div className="space-y-2 mb-3">
                    {notes.map((note) => (
                        <NoteItem
                            key={note.id}
                            note={note}
                            onDeleted={handleDelete}
                        />
                    ))}
                </div>
            )}

            {notes.length === 0 && !isAdding && (
                <p className="text-xs text-ink-soft mb-2">No notes yet.</p>
            )}

            {isAdding ? (
                <div className="space-y-2">
                    <textarea
                        value={newNoteContent}
                        onChange={(e) => setNewNoteContent(e.target.value)}
                        rows={3}
                        placeholder="Add a note..."
                        className="w-full text-xs border border-gold rounded px-3 py-2 resize-none focus:outline-none focus:ring-1 focus:ring-gold"
                        autoFocus
                    />
                    <div className="flex gap-2">
                        <button onClick={handleAdd} disabled={!newNoteContent.trim() || isSaving} className="text-xs px-3 py-1.5 bg-gold text-white rounded font-medium hover:!bg-gold-dark transition-colors disabled:opacity-50">
                            {isSaving ? 'Saving…' : 'Save'}
                        </button>
                        <button onClick={() => { setIsAdding(false); setNewNoteContent(''); }} className="text-xs px-3 py-1.5 border border-border rounded hover:!border-gold transition-colors">Cancel</button>
                    </div>
                </div>
            ) : null}
        </section>
    );
}

// ─── Edit Production Category Modal ──────────────────────────────────────────

const PRODUCTION_CATEGORIES = [
    { value: 'cad_casting',      label: 'CAD & Casting' },
    { value: 'handmade',         label: 'Handmade' },
    { value: 'supplier_product', label: 'Supplier Product' },
    { value: 'custom',           label: 'Custom' },
];

function EditProductionModal({ job, currentCategory, onSave, onClose }) {
    const [selected, setSelected] = useState(currentCategory ?? 'cad_casting');

    const handleConfirm = () => {
        onClose();
        router.patch(`/orders/${job.id}/production-category`, { production_category: selected }, {
            preserveScroll: true,
            preserveState:  false,  // false so Inertia re-fetches page props with new tasks
            onSuccess: (page) => {
                const updatedJobs = (page.props as any).jobs;
                const updatedJob  = updatedJobs?.find((j: any) => j.id === job.id);
                if (updatedJob) onSave(selected, updatedJob.tasks ?? []);
            },
        });
    };

    return (
        <div className="fixed inset-0 z-50 bg-black/40 flex items-center justify-center p-4">
            <div className="bg-white rounded-xl w-full max-w-sm shadow-xl">
                <div className="p-5 border-b border-border">
                    <h3 className="font-serif text-lg font-medium">Change production type</h3>
                    <p className="text-xs text-gold-dark mt-1">This will change existing tasks.</p>
                </div>
                <div className="p-5 space-y-2">
                    {PRODUCTION_CATEGORIES.map((cat) => (
                        <label key={cat.value} className={`flex items-center gap-3 px-3 py-2 rounded border cursor-pointer transition-colors ${selected === cat.value ? 'border-gold bg-gold-pale' : 'border-border hover:!border-gold'}`}>
                            <input
                                type="radio"
                                name="production_category"
                                value={cat.value}
                                checked={selected === cat.value}
                                onChange={() => setSelected(cat.value)}
                                className="accent-gold"
                            />
                            <span className="text-sm">{cat.label}</span>
                        </label>
                    ))}
                </div>
                <div className="p-5 border-t border-border flex justify-end gap-2">
                    <button onClick={onClose} className="text-sm px-4 py-2 border border-border rounded hover:!border-gold transition-colors">Cancel</button>
                    <button onClick={handleConfirm} className="text-sm px-4 py-2 bg-gold text-white rounded font-medium hover:!bg-gold-dark">Confirm</button>
                </div>
            </div>
        </div>
    );
}

// ─── Main Panel ───────────────────────────────────────────────────────────────

export default function JobPanel({ job, onClose, onJobNotesUpdated, inline = false }) {
    const [tasks, setTasks]                         = useState(job.tasks ?? []);
    const [showAddTaskForm, setShowAddTaskForm]      = useState(false);
    const [jobNotes, setJobNotes]                   = useState<OrderNote[]>(Array.isArray(job.notes) ? job.notes : []);
    const [isEditModalOpen, setIsEditModalOpen]           = useState(false);
    const [isPaymentModalOpen, setIsPaymentModalOpen]     = useState(false);
    const [isProductionModalOpen, setIsProductionModalOpen] = useState(false);
    const [productionCategory, setProductionCategory]       = useState(job.production_category ?? 'cad_casting');
    const [paymentNote, setPaymentNote] = useState(job.payment_note ?? '');

    const [savedDetails, setSavedDetails] = useState({
        client:               job.client,
        product:              job.product,
        email:                job.email,
        phone:                job.phone,
        address:              job.address,
        woocommerce_order_id: job.woocommerce_order_id ?? '',
    });

    const [isCompleted, setIsCompleted]             = useState(job.completed ?? false);
    const [isCompleteModalOpen, setIsCompleteModalOpen] = useState(false);
    const [trackingInput, setTrackingInput]             = useState('');
    const [dueDate, setDueDate]                         = useState(job.due_date ? job.due_date.substring(0, 10) : '');

    const [savedPayment, setSavedPayment] = useState({
        price:        job.price,
        amount_paid:  job.paid,
        payment_plan: job.payment_plan ?? PAYMENT_PLANS[0],
    });

    const owing = Math.max(0, Number(savedPayment.price) - Number(savedPayment.amount_paid));

    const handleTaskAdded = (newTask: any) => {
        setTasks((prev) => [...prev, newTask]);
        setShowAddTaskForm(false);
    };

    const handleTaskDeleted = (deletedTaskId: number) => {
        setTasks((prev) => prev.filter((task) => task.id !== deletedTaskId));
    };

    const handleNotesUpdated = (updatedNotes: OrderNote[]) => {
        setJobNotes(updatedNotes);
        if (onJobNotesUpdated) onJobNotesUpdated(job.id, updatedNotes);
    };

    const sendJobReport = () => {
        const date    = new Date().toLocaleDateString('en-AU');
        const owing   = Math.max(0, Number(savedPayment.price) - Number(savedPayment.amount_paid));

        // Product details
        let report = `DIAMOND GALLERY — JOB REPORT\n`;
        report    += `${date}\n`;
        report    += `${'─'.repeat(40)}\n\n`;

        report += `JOB DETAILS\n`;
        report += `Order:   ${job.woo_id} · ${job.job_id}\n`;
        report += `Client:  ${savedDetails.client}\n`;
        report += `Email:   ${savedDetails.email}\n`;
        report += `Phone:   ${savedDetails.phone}\n`;
        report += `Address: ${savedDetails.address}\n`;
        if (dueDate) report += `Due:     ${new Date(dueDate).toLocaleDateString('en-AU', { day: 'numeric', month: 'long', year: 'numeric' })}\n`;
        report += `\n`;

        // Product details
        report += `PRODUCT\n`;
        report += `${savedDetails.product}\n`;
        if (job.stone_data && Object.keys(job.stone_data).length > 0) {
            Object.entries(job.stone_data)
                .filter(([key]) => key !== 'cert' && key !== 'vid')
                .forEach(([key, value]) => {
                    const label = key.replace(/([A-Z])/g, ' $1').replace(/_/g, ' ');
                    report += `  ${label.charAt(0).toUpperCase() + label.slice(1)}: ${value}\n`;
                });
        }
        report += `\n`;

        // Payment
        report += `PAYMENT\n`;
        report += `Total:  $${Number(savedPayment.price).toLocaleString()}\n`;
        report += `Paid:   $${Number(savedPayment.amount_paid).toLocaleString()}\n`;
        report += `Owing:  $${owing.toLocaleString()}\n`;
        if (paymentNote) report += `Note:   ${paymentNote}\n`;
        report += `\n`;

        // Production tasks
        report += `PRODUCTION TASKS (${productionCategory.replace(/_/g, ' ').replace(/\b\w/g, c => c.toUpperCase())})\n`;
        (tasks as any[]).forEach((task) => {
            const status = task.is_done ? `✓ Done${task.task_date ? ' — ' + task.task_date : ''}` : '○ Pending';
            report += `  ${task.label}: ${status}\n`;
            if (task.note) report += `    Note: ${task.note}\n`;
        });
        report += `\n`;

        // Job notes
        if (jobNotes.length > 0) {
            report += `NOTES\n`;
            jobNotes.forEach((note) => { report += `${note.content}\n`; });
        }

        const subject = encodeURIComponent(`Diamond Gallery — Job Report ${job.job_id} · ${savedDetails.client} · ${date}`);
        const body    = encodeURIComponent(report);

        window.open(`mailto:?subject=${subject}&body=${body}`);
    };

    const printPackingSlip = () => {
        const balance  = Math.max(0, (job.price ?? 0) - (job.paid ?? 0));
        const today    = new Date().toLocaleDateString('en-AU', { day: 'numeric', month: 'long', year: 'numeric' });
        const dueFormatted = dueDate
            ? new Date(dueDate).toLocaleDateString('en-AU', { day: 'numeric', month: 'long', year: 'numeric' })
            : '—';

        const stone    = job.stone_data as Record<string, string> | null | undefined;
        const stoneRows = stone
            ? [
                stone.carat       ? `<tr><td class="sl">Diamond</td><td>${stone.carat}${stone.stoneType ? ' ' + stone.stoneType : ''}</td></tr>` : '',
                (stone.cut || stone.colour || stone.clarity)
                    ? `<tr><td class="sl">Cut / Colour / Clarity</td><td>${[stone.cut, stone.colour, stone.clarity].filter(Boolean).join(' / ')}</td></tr>` : '',
                stone.polish      ? `<tr><td class="sl">Polish</td><td>${stone.polish}</td></tr>` : '',
                stone.symmetry    ? `<tr><td class="sl">Symmetry</td><td>${stone.symmetry}</td></tr>` : '',
                stone.measurements ? `<tr><td class="sl">Measurements</td><td>${stone.measurements}</td></tr>` : '',
                stone.ringSize    ? `<tr><td class="sl">Ring size</td><td>${stone.ringSize}</td></tr>` : '',
                stone.material    ? `<tr><td class="sl">Metal</td><td>${stone.material}</td></tr>` : '',
                stone.bandWidth   ? `<tr><td class="sl">Band width</td><td>${stone.bandWidth}</td></tr>` : '',
                stone.certificateNumber ? `<tr><td class="sl">Certificate</td><td>${stone.certificateNumber}</td></tr>` : '',
                stone.cert        ? `<tr><td class="sl">Certificate</td><td><a href="${stone.cert}" target="_blank" style="color:#A67C52">${stone.cert}</a></td></tr>` : '',
            ].join('')
            : '';

        const latestNote = Array.isArray(job.notes) && job.notes.length > 0
            ? (job.notes as { content: string }[]).map(n => n.content).join('\n\n')
            : '';

        const notesHtml = latestNote
            ? `<div class="section-head">Notes</div><div class="notes-box">${latestNote.replace(/&/g,'&amp;').replace(/</g,'&lt;').replace(/>/g,'&gt;')}</div>`
            : '';

        const stoneSection = stoneRows
            ? `<div class="section-head">Diamond / Stone spec</div><table>${stoneRows}</table>`
            : '';

        const win = window.open('', '_blank', 'width=700,height=900');
        if (!win) return;
        win.document.write(`<!DOCTYPE html><html><head><title>Packing Slip — ${job.woo_id}</title>
<style>
  *{margin:0;padding:0;box-sizing:border-box}
  body{font-family:'DM Sans',Helvetica,Arial,sans-serif;font-size:13px;color:#1E2B2F;padding:32px 40px;max-width:680px;margin:0 auto}
  .logo{font-family:Georgia,serif;font-size:22px;color:#A67C52;letter-spacing:0.04em;margin-bottom:4px}
  .logo-sub{font-size:10px;color:#7A8C90;text-transform:uppercase;letter-spacing:0.1em;margin-bottom:28px}
  .slip-title{font-size:18px;font-weight:600;margin-bottom:20px;padding-bottom:10px;border-bottom:2px solid #A67C52}
  table{width:100%;border-collapse:collapse;margin-bottom:20px}
  td{padding:7px 10px;border-bottom:1px solid #E4E0D6;vertical-align:top}
  td.sl{color:#7A8C90;width:160px;font-size:12px;white-space:nowrap}
  .section-head{font-size:10px;text-transform:uppercase;letter-spacing:0.09em;color:#7A8C90;font-weight:600;margin:18px 0 6px;padding-bottom:4px;border-bottom:1px solid #C8C4B8}
  .balance-box{background:#F5F1EC;border:1px solid #C8C4B8;border-radius:6px;padding:12px 16px;margin-top:6px;display:flex;justify-content:space-between;align-items:center}
  .balance-label{font-size:12px;color:#7A8C90}
  .balance-amount{font-size:20px;font-weight:700;color:${balance > 0 ? '#8B2020' : '#2D6A4F'}}
  .notes-box{background:#F5F1EC;border-left:3px solid #A67C52;padding:8px 12px;font-size:12px;color:#3D4E52;margin-bottom:16px;white-space:pre-wrap;line-height:1.6}
  .footer{margin-top:32px;padding-top:16px;border-top:1px solid #E4E0D6;font-size:10px;color:#7A8C90;text-align:center;line-height:1.6}
  @media print{button{display:none}}
</style></head><body>
<div class="logo">Diamond Gallery</div>
<div class="logo-sub">Custom Jewellery · Sydney</div>
<div class="slip-title">Packing Slip</div>

<div class="section-head">Order details</div>
<table>
  <tr><td class="sl">Order number</td><td><strong>${job.woo_id}</strong> (${job.job_id})</td></tr>
  <tr><td class="sl">Date printed</td><td>${today}</td></tr>
  <tr><td class="sl">Due date</td><td>${dueFormatted}</td></tr>
</table>

<div class="section-head">Client</div>
<table>
  <tr><td class="sl">Name</td><td>${savedDetails.client}</td></tr>
  <tr><td class="sl">Email</td><td>${savedDetails.email}</td></tr>
  ${job.phone ? `<tr><td class="sl">Phone</td><td>${job.phone}</td></tr>` : ''}
  ${job.address ? `<tr><td class="sl">Billing address</td><td>${job.address}</td></tr>` : ''}
  ${job.shipping_address ? `<tr><td class="sl">Shipping address</td><td>${job.shipping_address}</td></tr>` : ''}
</table>

<div class="section-head">Product</div>
<table>
  <tr><td class="sl">Description</td><td>${savedDetails.product}</td></tr>
  ${job.category ? `<tr><td class="sl">Category</td><td>${job.category}</td></tr>` : ''}
</table>

${stoneSection}
${notesHtml}

<div class="section-head">Payment</div>
<table>
  <tr><td class="sl">Total price</td><td>$${(job.price ?? 0).toLocaleString()}</td></tr>
  <tr><td class="sl">Amount paid</td><td style="color:#2D6A4F">$${(job.paid ?? 0).toLocaleString()}</td></tr>
</table>
<div class="balance-box">
  <span class="balance-label">${balance > 0 ? 'Balance owing on collection' : 'Fully paid — no payment required'}</span>
  <span class="balance-amount">${balance > 0 ? '$' + balance.toLocaleString() : '✓ Paid'}</span>
</div>

<div class="footer">
  Diamond Gallery Co · diamondgallery.com.au<br>
  Thank you for your order — we look forward to seeing you soon.
</div>
<br>
<button onclick="window.print()" style="margin-top:16px;padding:10px 20px;background:#A67C52;color:#fff;border:none;border-radius:6px;cursor:pointer;font-size:13px">🖨 Print packing slip</button>
</body></html>`);
        win.document.close();
    };

    const emailClient = () => {
        const firstName = savedDetails.client.split(' ')[0];
        const subject   = encodeURIComponent(`Update on your Diamond Gallery order — ${job.job_id}`);
        const body      = encodeURIComponent(
            `Hi ${firstName},\n\n` +
            `I wanted to update you on your order ${job.job_id}.\n\n` +
            `${savedDetails.product ? 'Product: ' + savedDetails.product + '\n' : ''}` +
            (dueDate ? `Due date: ${new Date(dueDate).toLocaleDateString('en-AU', { day: 'numeric', month: 'long', year: 'numeric' })}\n` : '') +
            `\nKind regards,\nDiamond Gallery`
        );

        window.open(`mailto:${savedDetails.email}?subject=${subject}&body=${body}`);
    };

    return (
        <>
            <div className={inline ? 'inline-panel' : 'w-96 bg-white border-l border-border overflow-y-auto shadow-lg self-stretch min-h-0'}>
                <div className="sticky top-0 bg-white border-b border-border p-5 flex items-start justify-between">
                    <div>
                        <div className="text-xs text-ink-soft uppercase tracking-widest">Order {job.woo_id} · {job.job_id}</div>
                        <h2 className="font-serif text-lg font-medium mt-1 line-clamp-2">{savedDetails.product}</h2>
                        <p className="text-sm text-ink-mid mt-1">{savedDetails.client}</p>
                    </div>
                    <button onClick={onClose} className="text-2xl text-ink-soft hover:text-ink-mid flex-shrink-0">✕</button>
                </div>

                <div className="p-5 space-y-6">

                    {/* Order Details */}
                    <section>
                        <div className="flex items-center justify-between mb-3 pb-2 border-b border-border">
                            <h3 className="text-xs font-semibold text-ink-soft uppercase tracking-wider">Order Details</h3>
                            <button onClick={() => setIsEditModalOpen(true)} className="text-xs px-2 py-1 border border-border rounded hover:!border-gold transition-colors flex items-center gap-1">
                                ✎ Edit
                            </button>
                        </div>
                        <div className="space-y-2 text-xs">
                            <div className="flex justify-between info-row"><span className="text-ink-soft">Email</span><span className="font-medium">{savedDetails.email}</span></div>
                            <div className="flex justify-between info-row"><span className="text-ink-soft">Phone</span><span className="font-medium">{savedDetails.phone}</span></div>
                            <div className="flex justify-between info-row"><span className="text-ink-soft">Address</span><span className="font-medium text-right max-w-[60%]">{savedDetails.address}</span></div>
                            <div className="flex justify-between info-row">
                                <span className="text-ink-soft">Order date</span>
                                <span className="font-medium">{new Date(job.created_at).toLocaleDateString('en-AU', { day: 'numeric', month: 'short', year: 'numeric' })}</span>
                            </div>
                            <div className="flex justify-between items-center info-row">
                                <span className="text-ink-soft">Due date</span>
                                <div className="flex items-center gap-2">
                                    <input
                                        type="date"
                                        value={dueDate}
                                        onChange={(e) => {
                                            setDueDate(e.target.value);
                                            router.patch(`/orders/${job.id}`, { due_date: e.target.value }, {
                                                preserveScroll: true,
                                                preserveState:  true,
                                            });
                                        }}
                                        style={{ marginBottom: 0, fontSize: '12px', padding: '3px 6px', border: '1px solid var(--border)', borderRadius: '6px', width: 'auto' }}
                                    />
                                    {dueDate && (
                                        <span className="text-xs text-ink-soft whitespace-nowrap">
                                            {new Date(dueDate).toLocaleDateString('en-AU', { day: 'numeric', month: 'short' })}
                                        </span>
                                    )}
                                </div>
                            </div>
                            <div className="flex justify-between">
                                <span className="text-ink-soft">Status</span>
                                <span className={`font-medium capitalize px-2 py-0.5 rounded-full text-xs ${job.status === 'completed' ? 'bg-green-100 text-green-700' : job.status === 'processing' ? 'bg-blue-100 text-blue-700' : 'bg-gray-100 text-gray-600'}`}>
                                    {job.status.replace(/-/g, ' ')}
                                </span>
                            </div>
                            {job.date_paid && (
                                <div className="flex justify-between">
                                    <span className="text-ink-soft">Date paid</span>
                                    <span className="font-medium">{new Date(job.date_paid).toLocaleDateString('en-AU', { day: 'numeric', month: 'short', year: 'numeric' })}</span>
                                </div>
                            )}
                        </div>
                    </section>

                    {/* Payment */}
                    <section>
                        <div className="flex items-center justify-between mb-3 pb-2 border-b border-border">
                            <h3 className="text-xs font-semibold text-ink-soft uppercase tracking-wider">Payment</h3>
                            <button onClick={() => setIsPaymentModalOpen(true)} className="text-xs px-2 py-1 border border-border rounded hover:!border-gold transition-colors flex items-center gap-1">
                                ✎ Edit
                            </button>
                        </div>

                        {/* Payment Plan */}
                        <div className="flex items-center gap-2 mb-3">
                            <span className="text-xs text-ink-soft">Plan:</span>
                            <span className="text-xs font-medium text-ink">{savedPayment.payment_plan}</span>
                        </div>

                        <div className="grid grid-cols-3 gap-2 mb-3">
                            <div className="bg-surface-2 rounded p-2 text-center">
                                <p className="text-xs text-ink-soft uppercase">Total</p>
                                <p className="font-serif font-medium text-sm mt-1">${Number(savedPayment.price).toLocaleString()}</p>
                            </div>
                            <div className="bg-surface-2 rounded p-2 text-center">
                                <p className="text-xs text-ink-soft uppercase">Paid</p>
                                <p className="font-serif font-medium text-green-600 text-sm mt-1">${Number(savedPayment.amount_paid).toLocaleString()}</p>
                            </div>
                            <div className="bg-surface-2 rounded p-2 text-center">
                                <p className="text-xs text-ink-soft uppercase">Owing</p>
                                <p className={`font-serif font-medium text-sm mt-1 ${owing > 0 ? 'text-red-600' : 'text-green-600'}`}>${owing.toLocaleString()}</p>
                            </div>
                        </div>
                        {job.payment_note && <p className="text-xs bg-surface-2 rounded p-2 text-ink-mid">💬 {job.payment_note}</p>}

                        {/* Payment Note — inline add/edit/delete */}
                        <PaymentNoteSection
                            jobId={job.id}
                            initialNote={paymentNote}
                            onNoteSaved={setPaymentNote}
                        />
                    </section>

                    {/* Line Items */}
                    {job.line_items?.length > 1 && (
                        <section>
                            <h3 className="text-xs font-semibold text-ink-soft uppercase tracking-wider mb-3 pb-2 border-b border-border">Items ({job.line_items.length})</h3>
                            <div className="space-y-3">
                                {job.line_items.map((lineItem) => (
                                    <div key={lineItem.id} className="flex gap-3 items-start">
                                        {lineItem.image_url && <img src={lineItem.image_url} alt={lineItem.product_name} className="w-12 h-12 object-cover rounded border border-border flex-shrink-0" />}
                                        <div className="flex-1 min-w-0">
                                            <p className="text-xs font-medium truncate">{lineItem.product_name}</p>
                                            <p className="text-xs text-ink-soft mt-0.5 capitalize">{lineItem.category} · qty {lineItem.quantity}</p>
                                            <p className="text-xs font-medium text-gold-dark mt-0.5">${Number(lineItem.total).toLocaleString()}</p>
                                        </div>
                                    </div>
                                ))}
                            </div>
                        </section>
                    )}

                    {/* Product Spec */}
                    {job.stone_data && Object.keys(job.stone_data).length > 0 && (
                        <section>
                            <h3 className="text-xs font-semibold text-ink-soft uppercase tracking-wider mb-3 pb-2 border-b border-border">Product Spec</h3>
                            <div className="bg-surface-2 rounded p-3 text-xs">
                                <div className="grid grid-cols-2 gap-x-4 gap-y-1">
                                    {Object.entries(job.stone_data)
                                        .filter(([key]) => key !== 'cert' && key !== 'vid' && key !== 'measurements')
                                        .map(([key, value]) => (
                                            <div key={key} className="flex justify-between pb-1 border-b border-border">
                                                <span className="text-ink-soft capitalize">{key.replace(/([A-Z])/g, ' $1')}</span>
                                                <span className="font-medium text-gold-dark">{String(value)}</span>
                                            </div>
                                        ))
                                    }
                                </div>
                                {/* Measurements spans full width */}
                                {job.stone_data.measurements && (
                                    <div className="flex justify-between pt-1 pb-2 mt-1 border-b border-border">
                                        <span className="text-ink-soft">Measurements</span>
                                        <span className="font-medium text-gold-dark">{String(job.stone_data.measurements)}</span>
                                    </div>
                                )}

                                {/* Cert and Video buttons */}
                                {(job.stone_data.cert || job.stone_data.vid) && (
                                    <div className="flex gap-2 mt-3">
                                        {job.stone_data.cert && (
                                            <a
                                                href={String(job.stone_data.cert)}
                                                target="_blank"
                                                rel="noopener noreferrer"
                                                className="flex-1 text-xs px-3 py-2 border border-gold-light rounded bg-gold-pale hover:!border-gold transition-colors font-medium flex items-center justify-center gap-1"
                                            >
                                                📄 Certificate
                                            </a>
                                        )}
                                        {job.stone_data.vid && (
                                            <a
                                                href={String(job.stone_data.vid)}
                                                target="_blank"
                                                rel="noopener noreferrer"
                                                className="flex-1 text-xs px-3 py-2 border border-gold-light rounded bg-gold-pale hover:!border-gold transition-colors font-medium flex items-center justify-center gap-1"
                                            >
                                                ▶ 360° Video
                                            </a>
                                        )}
                                    </div>
                                )}
                            </div>
                        </section>
                    )}

                    {/* Production Tasks */}
                    <section>
                        <div className="flex items-center justify-between mb-4 pb-2 border-b border-border">
                            <h3 className="text-xs font-semibold text-ink-soft uppercase tracking-wider">Production Tasks</h3>
                            <button onClick={() => setIsProductionModalOpen(true)} className="text-xs px-2 py-1 border border-border rounded hover:!border-gold transition-colors flex items-center gap-1">
                                ✎ Edit
                            </button>
                        </div>
                        <div className="mb-3 px-3 py-2 bg-surface-2 rounded text-xs text-ink-soft">Method: <span className="font-medium text-gold-dark">{productionCategory.replace(/_/g, ' ').replace(/\b\w/g, (c) => c.toUpperCase())}</span></div>
                        {tasks.length > 0 ? (
                            tasks.map((task) => (
                                <OrderTask key={task.id} task={task} orderId={job.id} onDeleted={handleTaskDeleted} />
                            ))
                        ) : (
                            <p className="text-xs text-ink-soft">No tasks assigned yet.</p>
                        )}
                        {showAddTaskForm ? (
                            <AddCustomTaskForm orderId={job.id} onAdded={handleTaskAdded} onCancel={() => setShowAddTaskForm(false)} />
                        ) : (
                            <button onClick={() => setShowAddTaskForm(true)} className="mt-3 w-full text-xs px-3 py-2 border border-dashed border-gold-light rounded text-gold-dark font-medium hover:!bg-gold-pale transition-colors">
                                + Add custom task
                            </button>
                        )}
                    </section>

                    {/* Job Notes */}
                    <JobNotesSection jobId={job.id} initialNotes={jobNotes} onNotesUpdated={handleNotesUpdated} />

                    {/* Actions */}
                    <section>
                        <h3 className="text-xs font-semibold text-ink-soft uppercase tracking-wider mb-3 pb-2 border-b border-border">Actions</h3>
                        <div className="flex gap-2 flex-wrap">
                            <button
                                onClick={emailClient}
                                className="flex-1 text-xs px-3 py-1 border border-border rounded hover:!border-gold transition-colors font-medium flex items-center justify-center gap-1"
                            >
                                ✉ Email client
                            </button>
                            <button
                                onClick={printPackingSlip}
                                className="flex-1 text-xs px-3 py-1 border border-border rounded hover:!border-gold transition-colors font-medium flex items-center justify-center gap-1"
                            >
                                🖨 Packing Slip
                            </button>
                            <button
                                onClick={sendJobReport}
                                className="flex-1 text-xs px-3 py-1 border border-border rounded hover:!border-gold transition-colors font-medium flex items-center justify-center gap-1"
                            >
                                📋 Report
                            </button>
                            {!isCompleted && (
                                <button
                                    onClick={() => { setTrackingInput(''); setIsCompleteModalOpen(true); }}
                                    className="flex-1 text-xs px-3 py-1 bg-gold text-white rounded hover:!bg-gold-dark transition-colors font-medium flex items-center justify-center gap-1"
                                >
                                    ✓ Complete
                                </button>
                            )}
                            {isCompleted && (
                                <span className="flex-1 text-xs px-3 py-1 bg-green-100 text-green-700 rounded font-medium flex items-center justify-center gap-1">
                                    ✓ Completed
                                </span>
                            )}
                        </div>
                    </section>
                </div>
            </div>

            {/* Edit Order Details Modal */}
            {isEditModalOpen && (
                <EditOrderModal
                    job={job}
                    savedDetails={savedDetails}
                    onSave={(updated) => setSavedDetails(updated)}
                    onClose={() => setIsEditModalOpen(false)}
                />
            )}

            {/* Edit Payment Modal */}
            {isProductionModalOpen && (
                <EditProductionModal
                    job={job}
                    currentCategory={productionCategory}
                    onSave={(updated, newTasks) => {
                        setProductionCategory(updated);
                        if (newTasks) setTasks(newTasks);
                    }}
                    onClose={() => setIsProductionModalOpen(false)}
                />
            )}

            {isPaymentModalOpen && (
                <EditPaymentModal
                    job={job}
                    savedPayment={savedPayment}
                    onSave={(updated) => setSavedPayment(updated)}
                    onClose={() => setIsPaymentModalOpen(false)}
                />
            )}

            {/* Mark complete modal */}
            {isCompleteModalOpen && (
                <div className="modal-overlay open" onClick={() => setIsCompleteModalOpen(false)}>
                    <div className="modal" onClick={(e) => e.stopPropagation()}>
                        <h3>Mark order complete</h3>
                        <p>Enter tracking / pickup number for {job.client}:</p>
                        <input
                            type="text"
                            value={trackingInput}
                            onChange={(e) => setTrackingInput(e.target.value)}
                            placeholder="Tracking number or pickup ref"
                            autoFocus
                            onKeyDown={(e) => {
                                if (e.key === 'Enter') e.currentTarget.form?.requestSubmit();
                            }}
                        />
                        <div style={{ display: 'flex', gap: '8px', justifyContent: 'flex-end', marginTop: '4px' }}>
                            <button className="btn" onClick={() => setIsCompleteModalOpen(false)}>Cancel</button>
                            <button
                                className="btn btn-gold"
                                onClick={() => {
                                    setIsCompleteModalOpen(false);
                                    setIsCompleted(true);
                                    router.patch(`/orders/${job.id}/complete`, {
                                        tracking_number: trackingInput,
                                    });
                                }}
                            >
                                ✓ Mark complete
                            </button>
                        </div>
                    </div>
                </div>
            )}
        </>
    );
}