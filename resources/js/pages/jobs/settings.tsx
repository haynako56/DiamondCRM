import { Head, useForm, usePage } from '@inertiajs/react';
import { useState } from 'react';

const TURNAROUND_OPTIONS = ['4 weeks', '6 weeks', '8 weeks'];

interface Settings {
    store_url:          string;
    consumer:           string;
    secret:             string;
    production_email:   string;
    admin_email:        string;
    default_turnaround: string;
}

interface Props {
    settings: Settings | null;
}

export default function Settings({ settings }: Props) {
    const { props } = usePage<any>();

    const connectionStatus = props.flash?.connection_status;
    const connectionError  = props.flash?.connection_error;
    const wooCommerceSaved = props.flash?.woocommerce_saved;
    const teamSaved        = props.flash?.team_saved;

    // ── WooCommerce form ──────────────────────────────────────────────────────
    const wooForm = useForm({
        store_url: settings?.store_url ?? '',
        consumer:  settings?.consumer  ?? '',
        secret:    '',   // always blank — user must re-enter to change
    });

    const handleSaveWooCommerce = () => {
        wooForm.post('/jobs/settings/woocommerce', {
            onSuccess: () => wooForm.reset('secret'),
        });
    };

    const handleTestConnection = () => {
        wooForm.post('/jobs/settings/woocommerce/test');
    };

    // ── Team form ─────────────────────────────────────────────────────────────
    const teamForm = useForm({
        production_email:   settings?.production_email   ?? '',
        admin_email:        settings?.admin_email        ?? '',
        default_turnaround: settings?.default_turnaround ?? '4 weeks',
    });

    const handleSaveTeam = () => {
        teamForm.post('/jobs/settings/team');
    };

    return (
        <>
            <Head title="Settings" />
            <div className="topbar">
                <h1 className="topbar-title">Settings</h1>
            </div>

            <div className="content-scroll" style={{ maxWidth: '600px' }}>

                {/* WooCommerce Connection */}
                <div className="bg-white border border-border rounded-lg p-6 mb-6">
                    <h3 style={{ fontFamily: 'Cormorant Garamond, serif', fontSize: '18px', fontWeight: 500, marginBottom: '16px' }}>
                        WooCommerce connection
                    </h3>

                    {/* Connection status banner */}
                    {connectionStatus === 'success' && (
                        <div className="mb-4 text-xs px-3 py-2 bg-green-50 border border-green-300 text-green-700 rounded">
                            ✓ Connection successful — WooCommerce API is reachable.
                        </div>
                    )}
                    {connectionStatus === 'failed' && (
                        <div className="mb-4 text-xs px-3 py-2 bg-red-50 border border-red-300 text-red-700 rounded">
                            ✕ Connection failed — {connectionError}
                        </div>
                    )}
                    {wooCommerceSaved && (
                        <div className="mb-4 text-xs px-3 py-2 bg-green-50 border border-green-300 text-green-700 rounded">
                            ✓ WooCommerce settings saved.
                        </div>
                    )}

                    <div className="space-y-4">
                        <div>
                            <label className="text-xs text-ink-soft uppercase tracking-widest block mb-1">Store URL</label>
                            <input
                                type="text"
                                value={wooForm.data.store_url}
                                onChange={(e) => wooForm.setData('store_url', e.target.value)}
                                placeholder="https://diamondgallery.com.au"
                            />
                            {wooForm.errors.store_url && <p className="text-xs text-red-600 mt-1">{wooForm.errors.store_url}</p>}
                        </div>
                        <div>
                            <label className="text-xs text-ink-soft uppercase tracking-widest block mb-1">Consumer key</label>
                            <input
                                type="text"
                                value={wooForm.data.consumer}
                                onChange={(e) => wooForm.setData('consumer', e.target.value)}
                                placeholder="ck_xxxxxxxxxxxx"
                            />
                            {wooForm.errors.consumer && <p className="text-xs text-red-600 mt-1">{wooForm.errors.consumer}</p>}
                        </div>
                        <div>
                            <label className="text-xs text-ink-soft uppercase tracking-widest block mb-1">Consumer secret</label>
                            <input
                                type="password"
                                value={wooForm.data.secret}
                                onChange={(e) => wooForm.setData('secret', e.target.value)}
                                placeholder={settings?.secret ? 'Enter new secret to change' : 'cs_xxxxxxxxxxxx'}
                            />
                            {wooForm.errors.secret && <p className="text-xs text-red-600 mt-1">{wooForm.errors.secret}</p>}
                        </div>
                        <div className="flex gap-2">
                            <button
                                onClick={handleSaveWooCommerce}
                                disabled={wooForm.processing}
                                className="btn btn-gold"
                            >
                                {wooForm.processing ? 'Saving…' : 'Save'}
                            </button>
                            <button
                                onClick={handleTestConnection}
                                disabled={wooForm.processing}
                                className="btn"
                            >
                                ⚡ Test connection
                            </button>
                        </div>
                        <p className="text-xs text-ink-soft">WooCommerce → Settings → Advanced → REST API</p>
                    </div>
                </div>

                {/* Team & Notifications */}
                <div className="bg-white border border-border rounded-lg p-6 mb-6">
                    <h3 style={{ fontFamily: 'Cormorant Garamond, serif', fontSize: '18px', fontWeight: 500, marginBottom: '16px' }}>
                        Team & notifications
                    </h3>

                    {teamSaved && (
                        <div className="mb-4 text-xs px-3 py-2 bg-green-50 border border-green-300 text-green-700 rounded">
                            ✓ Team settings saved.
                        </div>
                    )}

                    <div className="space-y-4">
                        <div>
                            <label className="text-xs text-ink-soft uppercase tracking-widest block mb-1">Production contact (Daniele)</label>
                            <input
                                type="email"
                                value={teamForm.data.production_email}
                                onChange={(e) => teamForm.setData('production_email', e.target.value)}
                                placeholder="daniele@diamondgallery.com.au"
                            />
                            {teamForm.errors.production_email && <p className="text-xs text-red-600 mt-1">{teamForm.errors.production_email}</p>}
                        </div>
                        <div>
                            <label className="text-xs text-ink-soft uppercase tracking-widest block mb-1">Your email</label>
                            <input
                                type="email"
                                value={teamForm.data.admin_email}
                                onChange={(e) => teamForm.setData('admin_email', e.target.value)}
                                placeholder="you@diamondgallery.com.au"
                            />
                            {teamForm.errors.admin_email && <p className="text-xs text-red-600 mt-1">{teamForm.errors.admin_email}</p>}
                        </div>
                        <div>
                            <label className="text-xs text-ink-soft uppercase tracking-widest block mb-1">Default ring turnaround</label>
                            <select
                                value={teamForm.data.default_turnaround}
                                onChange={(e) => teamForm.setData('default_turnaround', e.target.value)}
                                className="w-full px-3 py-2 border border-border rounded text-sm bg-white"
                            >
                                {TURNAROUND_OPTIONS.map((option) => (
                                    <option key={option} value={option}>{option}</option>
                                ))}
                            </select>
                        </div>
                        <button
                            onClick={handleSaveTeam}
                            disabled={teamForm.processing}
                            className="btn btn-gold"
                        >
                            {teamForm.processing ? 'Saving…' : 'Save settings'}
                        </button>
                    </div>
                </div>

                {/* Data — not wired yet */}
                <div className="bg-white border border-border rounded-lg p-6">
                    <h3 style={{ fontFamily: 'Cormorant Garamond, serif', fontSize: '18px', fontWeight: 500, marginBottom: '16px' }}>Data</h3>
                    <p className="text-sm text-ink-mid mb-4">Export a backup of all orders or reset data.</p>
                    <div className="flex gap-2 flex-wrap">
                        <button className="btn">⬇ Export backup</button>
                        <button className="btn">⬆ Restore</button>
                        <button className="btn" style={{ borderColor: 'var(--red)', color: 'var(--red)' }}>✕ Reset</button>
                    </div>
                </div>
            </div>
        </>
    );
}

Settings.layout = {
    breadcrumbs: [
        { label: 'Settings', href: '/jobs/settings' },
    ],
};