import { useForm } from '@inertiajs/react';

// Each category label maps to the production method used for task creation
const CATEGORIES = [
    { label: 'Engagement / Custom Ring — CAD & Casting', value: 'Engagement / Custom Ring — CAD & Casting' },
    { label: 'Engagement / Custom Ring — Handmade',      value: 'Engagement / Custom Ring — Handmade' },
    { label: 'Engagement / Custom Ring — Supplier Product', value: 'Engagement / Custom Ring — Supplier Product' },
    { label: "Women's Wedding Band — CAD & Casting",     value: "Women's Wedding Band — CAD & Casting" },
    { label: "Women's Wedding Band — Handmade",          value: "Women's Wedding Band — Handmade" },
    { label: "Men's Wedding Band — Order from Supplier", value: "Men's Wedding Band — Order from Supplier" },
    { label: 'Jewellery — Order from Supplier',          value: 'Jewellery — Order from Supplier' },
    { label: 'Ring Resize',                              value: 'Ring Resize' },
    { label: 'Jewellery Repair',                         value: 'Jewellery Repair' },
];

export default function NewJobModal({ onClose, users = [] }: { onClose: () => void; users?: { id: number; name: string }[] }) {
    const { data, setData, post, processing, errors } = useForm({
        client_name:    '',
        product:        '',
        category:       CATEGORIES[0].value,
        price:          '',
        amount_paid:    '',
        due_date:       '',
        salesperson_id: '',
    });

    const handleSubmit = () => {
        post('/orders', {
            onSuccess: () => onClose(),
        });
    };

    return (
        <div className="fixed inset-0 z-50 bg-black/40 flex items-center justify-center p-4">
            <div className="bg-white rounded-xl p-6 w-full max-w-md max-h-[90vh] overflow-y-auto">
                <h2 className="font-serif text-xl font-medium mb-1">Add manual order</h2>
                <p className="text-sm text-ink-mid mb-6">For walk-in clients or orders not yet in WooCommerce.</p>

                <div className="space-y-4">
                    <div>
                        <label className="text-xs text-ink-soft uppercase tracking-widest block mb-1">Client name</label>
                        <input
                            type="text"
                            value={data.client_name}
                            onChange={(e) => setData('client_name', e.target.value)}
                            placeholder="Full name"
                            className="w-full px-3 py-2 border border-border rounded text-sm"
                            required
                        />
                        {errors.client_name && <p className="text-xs text-red-600 mt-1">{errors.client_name}</p>}
                    </div>

                    <div>
                        <label className="text-xs text-ink-soft uppercase tracking-widest block mb-1">Product description</label>
                        <input
                            type="text"
                            value={data.product}
                            onChange={(e) => setData('product', e.target.value)}
                            placeholder="e.g. 18ct Yellow Gold Oval Ring"
                            className="w-full px-3 py-2 border border-border rounded text-sm"
                            required
                        />
                        {errors.product && <p className="text-xs text-red-600 mt-1">{errors.product}</p>}
                    </div>

                    <div>
                        <label className="text-xs text-ink-soft uppercase tracking-widest block mb-1">Category</label>
                        <select
                            value={data.category}
                            onChange={(e) => setData('category', e.target.value)}
                            className="w-full px-3 py-2 border border-border rounded text-sm bg-white"
                        >
                            {CATEGORIES.map((cat) => (
                                <option key={cat.value} value={cat.value}>{cat.label}</option>
                            ))}
                        </select>
                        {errors.category && <p className="text-xs text-red-600 mt-1">{errors.category}</p>}
                    </div>

                    <div>
                        <label className="text-xs text-ink-soft uppercase tracking-widest block mb-1">Salesperson</label>
                        <select
                            value={data.salesperson_id}
                            onChange={(e) => setData('salesperson_id', e.target.value)}
                            className="w-full px-3 py-2 border border-border rounded text-sm bg-white"
                        >
                            <option value="">— No salesperson —</option>
                            {users.map((user) => (
                                <option key={user.id} value={user.id}>{user.name}</option>
                            ))}
                        </select>
                        {errors.salesperson_id && <p className="text-xs text-red-600 mt-1">{errors.salesperson_id}</p>}
                    </div>

                    <div>
                        <label className="text-xs text-ink-soft uppercase tracking-widest block mb-1">Total price ($AUD)</label>
                        <input
                            type="number"
                            value={data.price}
                            onChange={(e) => setData('price', e.target.value)}
                            placeholder="0.00"
                            required
                            min="0"
                            step="0.01"
                            className="w-full px-3 py-2 border border-border rounded text-sm"
                        />
                        {errors.price && <p className="text-xs text-red-600 mt-1">{errors.price}</p>}
                    </div>

                    <div>
                        <label className="text-xs text-ink-soft uppercase tracking-widest block mb-1">Deposit paid ($AUD)</label>
                        <input
                            type="number"
                            value={data.amount_paid}
                            onChange={(e) => setData('amount_paid', e.target.value)}
                            placeholder="0.00"
                            min="0"
                            step="0.01"
                            className="w-full px-3 py-2 border border-border rounded text-sm"
                        />
                        {errors.amount_paid && <p className="text-xs text-red-600 mt-1">{errors.amount_paid}</p>}
                    </div>

                    <div>
                        <label className="text-xs text-ink-soft uppercase tracking-widest block mb-1">Due date (blank = +4 weeks)</label>
                        <input
                            type="date"
                            value={data.due_date}
                            onChange={(e) => setData('due_date', e.target.value)}
                            className="w-full px-3 py-2 border border-border rounded text-sm"
                        />
                    </div>

                    <div className="flex gap-2 justify-end pt-4 border-t mt-6">
                        <button
                            type="button"
                            onClick={onClose}
                            className="px-4 py-2 text-xs border border-border rounded hover:border-gold transition-colors"
                        >
                            Cancel
                        </button>
                        <button
                            onClick={handleSubmit}
                            disabled={processing}
                            className="px-4 py-2 text-xs bg-gold text-white rounded hover:bg-gold-dark transition-colors font-medium disabled:opacity-50"
                        >
                            {processing ? 'Saving...' : 'Create Order'}
                        </button>
                    </div>
                </div>
            </div>
        </div>
    );
}