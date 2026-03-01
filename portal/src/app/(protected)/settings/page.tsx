'use client';

import { useEffect, useState } from 'react';
import { doc, getDoc, setDoc } from 'firebase/firestore';
import { db } from '@/lib/firebase';
import { CheckCircle, Loader2 } from 'lucide-react';

interface PricingSettings {
  costPerMl: number;
  packagingCost: number;
  shippingCost: number;
  extraFees: number;
  profitMargin: number;
}

const DEFAULTS: PricingSettings = {
  costPerMl: 0,
  packagingCost: 2.25,
  shippingCost: 1.55,
  extraFees: 0,
  profitMargin: 40,
};

function calcPrice(ml: number, s: PricingSettings): number {
  if (s.profitMargin >= 100) return 0;
  const cost = ml * s.costPerMl + s.packagingCost + s.shippingCost + s.extraFees;
  return Math.round((cost / (1 - s.profitMargin / 100)) * 100) / 100;
}

export default function SettingsPage() {
  const [settings, setSettings] = useState<PricingSettings>(DEFAULTS);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [saved, setSaved] = useState(false);

  useEffect(() => {
    (async () => {
      try {
        const snap = await getDoc(doc(db, 'settings', 'pricing'));
        if (snap.exists()) setSettings({ ...DEFAULTS, ...snap.data() } as PricingSettings);
      } catch { /* use defaults */ }
      finally { setLoading(false); }
    })();
  }, []);

  const handleSave = async () => {
    setSaving(true);
    try {
      await setDoc(doc(db, 'settings', 'pricing'), settings);
      setSaved(true);
      setTimeout(() => setSaved(false), 2500);
    } finally {
      setSaving(false);
    }
  };

  const field = (
    label: string,
    key: keyof PricingSettings,
    prefix = '£',
    suffix = '',
  ) => (
    <div>
      <label className="mb-1.5 block text-sm font-medium text-gray-700">{label}</label>
      <div className="flex items-center gap-1.5">
        {prefix && <span className="text-sm text-gray-500">{prefix}</span>}
        <input
          type="number"
          min={0}
          step={key === 'profitMargin' ? 1 : 0.01}
          value={settings[key]}
          onChange={(e) =>
            setSettings((s) => ({ ...s, [key]: parseFloat(e.target.value) || 0 }))
          }
          className="w-32 rounded-lg border border-gray-200 px-3 py-2 text-sm outline-none focus:border-amber-400"
        />
        {suffix && <span className="text-sm text-gray-500">{suffix}</span>}
      </div>
    </div>
  );

  // Preview prices at current settings
  const preview = [5, 10, 15].map((ml) => ({
    ml,
    price: calcPrice(ml, settings),
  }));

  if (loading) {
    return (
      <div className="flex min-h-[40vh] items-center justify-center">
        <div className="h-6 w-6 animate-spin rounded-full border-2 border-gray-200 border-t-amber-500" />
      </div>
    );
  }

  return (
    <div className="mx-auto max-w-lg space-y-8 py-6 md:py-8">
      <div>
        <h1 className="text-xl font-bold text-gray-900">Settings</h1>
        <p className="mt-1 text-sm text-gray-500">Pricing defaults used to auto-calculate product prices.</p>
      </div>

      {/* Costs */}
      <div className="rounded-2xl border border-gray-100 bg-white p-6 shadow-sm">
        <h2 className="mb-5 text-sm font-semibold uppercase tracking-wide text-gray-400">Costs per item</h2>
        <div className="space-y-5">
          {field('Perfume cost (per ml)', 'costPerMl')}
          {field('Packaging cost', 'packagingCost')}
          {field('Shipping cost', 'shippingCost')}
          {field('Extra fees', 'extraFees')}
        </div>
      </div>

      {/* Margin */}
      <div className="rounded-2xl border border-gray-100 bg-white p-6 shadow-sm">
        <h2 className="mb-5 text-sm font-semibold uppercase tracking-wide text-gray-400">Profit</h2>
        {field('Profit margin', 'profitMargin', '', '%')}
      </div>

      {/* Preview */}
      <div className="rounded-2xl border border-gray-100 bg-white p-6 shadow-sm">
        <h2 className="mb-4 text-sm font-semibold uppercase tracking-wide text-gray-400">Price preview</h2>
        <div className="space-y-2">
          {preview.map(({ ml, price }) => (
            <div key={ml} className="flex items-center justify-between text-sm">
              <span className="text-gray-600">{ml}ml</span>
              <span className="font-semibold text-gray-900">
                {price > 0 ? `£${price.toFixed(2)}` : '—'}
              </span>
            </div>
          ))}
        </div>
        <p className="mt-3 text-xs text-gray-400">
          Formula: (size × cost/ml + packaging + shipping + fees) ÷ (1 − margin%)
        </p>
      </div>

      {/* Save */}
      <button
        onClick={handleSave}
        disabled={saving}
        className="flex w-full items-center justify-center gap-2 rounded-xl bg-amber-500 px-4 py-3 text-sm font-semibold text-white transition hover:bg-amber-600 disabled:opacity-60"
      >
        {saving ? (
          <><Loader2 size={15} className="animate-spin" /> Saving…</>
        ) : saved ? (
          <><CheckCircle size={15} /> Saved</>
        ) : (
          'Save Settings'
        )}
      </button>
    </div>
  );
}
