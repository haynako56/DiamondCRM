import { Head, router } from '@inertiajs/react';
import { useState } from 'react';

interface FinanceCost {
    id:        number;
    key:       string;
    label:     string;
    supplier:  string;
    amount:    number;
    note:      string;
    is_saved:  boolean;
    is_custom: boolean;
}

interface FinanceJob {
    finance_id:    number;
    order_id:      number;
    job_id:        string;
    woo_id:        string;
    client:        string;
    product:       string;
    sale_price:    number;
    total_cost:    number;
    profit:        number;
    completed:     boolean;
    costings_done: boolean;
    costs:         FinanceCost[];
}

interface Stats {
    total_revenue: number;
    total_costs:   number;
    gross_profit:  number;
    margin:        number;
}

interface Props {
    stats:     Stats;
    active:    FinanceJob[];
    completed: FinanceJob[];
    costed:    FinanceJob[];
}

type FinanceView = 'active' | 'completed' | 'costed';

// Supplier shortlist per default cost line; "Other" reveals a free-text field
const SUPPLIER_OPTIONS: Record<string, string[]> = {
    diamond:    ['Nivoda', 'Diamonds on Call', 'Diamond Port', 'Fine Star', 'Other'],
    cad:        ['Rani', 'Tag Jellers', 'Other'],
    casting:    ['Chemgold', 'Daniele', 'Other'],
    production: ['Daniele', 'Other'],
};

const requestOptions = { preserveScroll: true, preserveState: true };

function money(amount: number): string {
    return '$' + (amount || 0).toLocaleString();
}

function moneyExact(amount: number): string {
    return '$' + (amount || 0).toLocaleString('en-AU', { minimumFractionDigits: 2, maximumFractionDigits: 2 });
}

// ─── Cost line: locked view ───────────────────────────────────────────────────

function SavedCostLine({ cost }: { cost: FinanceCost }) {
    const unlock = () => {
        router.patch(`/finance/costs/${cost.id}`, { is_saved: false }, requestOptions);
    };

    const remove = () => {
        if (!confirm(`Remove "${cost.label}"?`)) {
            return;
        }

        router.delete(`/finance/costs/${cost.id}`, requestOptions);
    };

    return (
        <div className="cost-line cost-line-saved">
            <div className="cost-line-head">
                <div className="cost-line-title">✓ {cost.label}</div>
                <div style={{ display: 'flex', gap: '6px' }}>
                    <button className="btn btn-sm" onClick={unlock}>✎ Edit</button>
                    {cost.is_custom && <button className="cost-remove" onClick={remove} title="Remove cost">✕</button>}
                </div>
            </div>
            <div className="cost-line-grid">
                <div className="cost-line-cell">
                    <div className="cost-line-cell-label">Supplier</div>
                    <div className="cost-line-cell-value">{cost.supplier || '—'}</div>
                </div>
                <div className="cost-line-cell">
                    <div className="cost-line-cell-label">Amount</div>
                    <div className="cost-line-cell-value">{moneyExact(cost.amount)}</div>
                </div>
                {cost.note && (
                    <div className="cost-line-cell" style={{ gridColumn: '1 / -1' }}>
                        <div className="cost-line-cell-label">Note / reference</div>
                        <div className="cost-line-cell-value">{cost.note}</div>
                    </div>
                )}
            </div>
        </div>
    );
}

// ─── Cost line: editable view ─────────────────────────────────────────────────

function EditableCostLine({ cost }: { cost: FinanceCost }) {
    const supplierOptions = SUPPLIER_OPTIONS[cost.key] ?? [];
    const supplierIsPreset = supplierOptions.includes(cost.supplier);
    const startsAsOther    = cost.supplier !== '' && !supplierIsPreset;

    const [label, setLabel]                     = useState(cost.label);
    const [supplierChoice, setSupplierChoice]   = useState(startsAsOther ? 'Other' : cost.supplier);
    const [supplierOther, setSupplierOther]     = useState(startsAsOther ? cost.supplier : '');
    const [amount, setAmount]                   = useState(cost.amount ? String(cost.amount) : '');
    const [note, setNote]                       = useState(cost.note);

    const resolvedSupplier = supplierChoice === 'Other' ? supplierOther : supplierChoice;

    const save = () => {
        if (cost.is_custom && !label.trim()) {
            alert('Please enter a description for this cost.');

            return;
        }

        router.patch(`/finance/costs/${cost.id}`, {
            label:    label.trim(),
            supplier: resolvedSupplier.trim(),
            amount:   parseFloat(amount) || 0,
            note:     note.trim(),
            is_saved: true,
        }, requestOptions);
    };

    const remove = () => {
        if (!confirm(`Remove "${cost.label}"?`)) {
            return;
        }

        router.delete(`/finance/costs/${cost.id}`, requestOptions);
    };

    return (
        <div className="cost-line">
            <div className="cost-line-head">
                {cost.is_custom
                    ? <input type="text" className="cost-input" value={label} onChange={(event) => setLabel(event.target.value)} placeholder="Description, e.g. Polishing" style={{ flex: 1, fontWeight: 600 }} />
                    : <div className="cost-line-title">{cost.label}</div>
                }
                {cost.is_custom && <button className="cost-remove" onClick={remove} title="Remove cost">✕</button>}
            </div>

            <div className="cost-line-fields">
                <div>
                    <div className="cost-field-label">Supplier</div>
                    {supplierOptions.length > 0 ? (
                        <>
                            <select className="cost-input" value={supplierChoice} onChange={(event) => setSupplierChoice(event.target.value)}>
                                <option value="">— Select supplier —</option>
                                {supplierOptions.map((option) => <option key={option} value={option}>{option}</option>)}
                            </select>
                            {supplierChoice === 'Other' && (
                                <input type="text" className="cost-input" value={supplierOther} onChange={(event) => setSupplierOther(event.target.value)} placeholder="Enter supplier name…" style={{ marginTop: '5px' }} />
                            )}
                        </>
                    ) : (
                        <input type="text" className="cost-input" value={supplierChoice} onChange={(event) => setSupplierChoice(event.target.value)} placeholder="Supplier name" />
                    )}
                </div>
                <div>
                    <div className="cost-field-label">Amount ($)</div>
                    <input type="number" min="0" step="0.01" className="cost-input cost-input-amount" value={amount} onChange={(event) => setAmount(event.target.value)} placeholder="0.00" />
                </div>
            </div>

            <div style={{ marginTop: '6px' }}>
                <div className="cost-field-label">Note / reference</div>
                <input type="text" className="cost-input" value={note} onChange={(event) => setNote(event.target.value)} placeholder="Invoice ref, notes…" />
            </div>

            <div style={{ marginTop: '8px' }}>
                <button className="btn btn-sm btn-gold" onClick={save}>✓ Save {cost.is_custom ? 'this cost' : cost.label}</button>
            </div>
        </div>
    );
}

// ─── One order's finance card ─────────────────────────────────────────────────

function FinanceCard({ job, expanded, onToggle }: { job: FinanceJob; expanded: boolean; onToggle: () => void }) {
    const defaultCosts = job.costs.filter((cost) => !cost.is_custom);
    const customCosts  = job.costs.filter((cost) => cost.is_custom);
    const allSaved     = defaultCosts.every((cost) => cost.is_saved);
    const hasCosts     = job.total_cost > 0;
    const margin       = job.sale_price > 0 ? Math.round((job.profit / job.sale_price) * 100) : 0;

    const addCustomCost = () => {
        router.post(`/finance/${job.finance_id}/costs`, { label: 'Other cost' }, requestOptions);
    };

    const setCostingsDone = (done: boolean) => {
        router.patch(`/finance/${job.finance_id}`, { costings_done: done }, requestOptions);
    };

    return (
        <div className={`fin-card${job.costings_done ? ' fin-card-done' : ''}`}>
            <div className="fin-card-head" onClick={onToggle}>
                <div style={{ flex: 1, minWidth: 0 }}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '8px', flexWrap: 'wrap' }}>
                        <span className="fin-job-id">{job.woo_id}</span>
                        <span className="fin-job-name">{job.client}</span>
                        {job.costings_done && <span className="badge badge-completed">✓ Costings complete</span>}
                        {!hasCosts && !job.costings_done && <span className="badge badge-deposit">No costs entered</span>}
                    </div>
                    <div className="fin-job-product">{job.job_id} · {job.product}</div>
                </div>
                <div className="fin-summary">
                    <div>Sale: <strong>{money(job.sale_price)}</strong></div>
                    <div>Cost: <strong>{money(job.total_cost)}</strong></div>
                    <div className={`fin-profit ${job.profit >= 0 ? 'profit' : 'loss'}`}>Profit: {money(job.profit)}</div>
                </div>
                <span className={`card-chevron ${expanded ? 'open' : ''}`}>▾</span>
            </div>

            {expanded && (
                <div className="fin-body">
                    {defaultCosts.map((cost) => (
                        cost.is_saved ? <SavedCostLine key={cost.id} cost={cost} /> : <EditableCostLine key={cost.id} cost={cost} />
                    ))}

                    {customCosts.length > 0 && (
                        <>
                            <div className="drop-section-head" style={{ margin: '10px 0 6px' }}>Other costs</div>
                            {customCosts.map((cost) => (
                                cost.is_saved ? <SavedCostLine key={cost.id} cost={cost} /> : <EditableCostLine key={cost.id} cost={cost} />
                            ))}
                        </>
                    )}

                    <button className="btn btn-sm" style={{ marginBottom: '12px' }} onClick={addCustomCost}>+ Add other cost</button>

                    <div className="fin-totals">
                        <div className="fin-total-cell">
                            <div className="fin-total-label">Total cost</div>
                            <div className="fin-total-value">{money(job.total_cost)}</div>
                        </div>
                        <div className="fin-total-cell">
                            <div className="fin-total-label">Sale price</div>
                            <div className="fin-total-value">{money(job.sale_price)}</div>
                        </div>
                        <div className="fin-total-cell">
                            <div className="fin-total-label">Profit ({margin}%)</div>
                            <div className="fin-total-value" style={{ color: job.profit >= 0 ? 'var(--green)' : 'var(--red)' }}>{money(job.profit)}</div>
                        </div>
                    </div>

                    {allSaved && <div className="fin-all-saved">✓ All costings saved</div>}

                    <div style={{ marginTop: '12px', paddingTop: '12px', borderTop: '1px solid var(--border)' }}>
                        {job.costings_done ? (
                            <button className="btn btn-sm" style={{ color: 'var(--ink-soft)' }} onClick={() => setCostingsDone(false)}>↩ Reopen costings</button>
                        ) : (
                            <>
                                <button className="btn btn-gold" style={{ width: '100%', justifyContent: 'center' }} onClick={() => setCostingsDone(true)}>✓ Mark costings complete</button>
                                <p style={{ fontSize: '11px', color: 'var(--ink-soft)', marginTop: '6px', textAlign: 'center' }}>Moves this order to the Costings Complete section</p>
                            </>
                        )}
                    </div>
                </div>
            )}
        </div>
    );
}

// ─── Page ─────────────────────────────────────────────────────────────────────

export default function Finance({ stats, active, completed, costed }: Props) {
    const [currentView, setCurrentView]   = useState<FinanceView>('active');
    const [expandedCards, setExpandedCards] = useState<Set<number>>(new Set());

    const toggleCard = (financeId: number) => {
        setExpandedCards((previous) => {
            const next = new Set(previous);

            if (next.has(financeId)) {
                next.delete(financeId);
            } else {
                next.add(financeId);
            }

            return next;
        });
    };

    const views: { key: FinanceView; label: string; jobs: FinanceJob[]; empty: string }[] = [
        { key: 'active',    label: 'Active orders',        jobs: active,    empty: 'No active orders.' },
        { key: 'completed', label: 'Completed orders',     jobs: completed, empty: 'No completed orders without costings.' },
        { key: 'costed',    label: '✓ Costings complete',  jobs: costed,    empty: 'No costings marked complete yet.' },
    ];

    const currentJobs = views.find((view) => view.key === currentView)!;

    return (
        <>
            <Head title="Finance" />
            <div className="topbar">
                <h1 className="topbar-title">Finance</h1>
            </div>

            <div className="content-scroll">
                {/* Stats */}
                <div className="stats-row">
                    <div className="stat-card">
                        <div className="stat-label">Total revenue</div>
                        <div className="stat-value gold">{money(stats.total_revenue)}</div>
                    </div>
                    <div className="stat-card">
                        <div className="stat-label">Total costs</div>
                        <div className={`stat-value ${stats.total_costs > stats.total_revenue ? 'danger' : ''}`}>{money(stats.total_costs)}</div>
                    </div>
                    <div className="stat-card">
                        <div className="stat-label">Gross profit</div>
                        <div className={`stat-value ${stats.gross_profit < 0 ? 'danger' : ''}`}>{money(stats.gross_profit)}</div>
                    </div>
                    <div className="stat-card">
                        <div className="stat-label">Margin</div>
                        <div className={`stat-value ${stats.margin < 30 ? 'warn' : ''}`}>{stats.margin}%</div>
                    </div>
                </div>

                {/* View tabs */}
                <div style={{ display: 'flex', gap: '6px', marginBottom: '16px', flexWrap: 'wrap' }}>
                    {views.map((view) => (
                        <button
                            key={view.key}
                            className={`btn ${currentView === view.key ? 'btn-gold' : ''}`}
                            style={currentView !== view.key && view.key === 'costed' ? { borderColor: 'var(--green)', color: 'var(--green)' } : undefined}
                            onClick={() => setCurrentView(view.key)}
                        >
                            {view.label} ({view.jobs.length})
                        </button>
                    ))}
                </div>

                {/* Cards */}
                {currentJobs.jobs.length === 0 ? (
                    <div style={{ textAlign: 'center', padding: '48px 0', color: 'var(--ink-soft)' }}>
                        <div style={{ fontSize: '28px', opacity: 0.2, marginBottom: '8px' }}>$</div>
                        <p>{currentJobs.empty}</p>
                    </div>
                ) : (
                    currentJobs.jobs.map((job) => (
                        <FinanceCard
                            key={job.finance_id}
                            job={job}
                            expanded={expandedCards.has(job.finance_id)}
                            onToggle={() => toggleCard(job.finance_id)}
                        />
                    ))
                )}
            </div>
        </>
    );
}

Finance.layout = {
    breadcrumbs: [
        { label: 'Finance', href: '/finance' },
    ],
};
