'use client';

import { useState, useEffect } from 'react';
import { doc, getDoc, setDoc } from 'firebase/firestore';
import { db } from '@/lib/firebase';

interface Pricing {
  costPerMl: number;
  packagingCost: number;
  shippingCost: number;
  extraFees: number;
  profitMargin: number;
}

const DEFAULTS: Pricing = {
  costPerMl: 0.2,
  packagingCost: 2.25,
  shippingCost: 1.55,
  extraFees: 0,
  profitMargin: 40,
};

function calcPrice(ml: number, p: Pricing) {
  const cost = ml * p.costPerMl + p.packagingCost + p.shippingCost + p.extraFees;
  return (cost / (1 - p.profitMargin / 100)).toFixed(2);
}

export default function Settings() {
  const [form, setForm] = useState<Pricing>(DEFAULTS);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [saved, setSaved] = useState(false);

  useEffect(() => {
    async function load() {
      try {
        const snap = await getDoc(doc(db, 'settings', 'pricing'));
        if (snap.exists()) setForm({ ...DEFAULTS, ...(snap.data() as Partial<Pricing>) });
      } finally {
        setLoading(false);
      }
    }
    load();
  }, []);

  async function handleSave(e: React.FormEvent) {
    e.preventDefault();
    setSaving(true);
    try {
      await setDoc(doc(db, 'settings', 'pricing'), form);
      setSaved(true);
      setTimeout(() => setSaved(false), 2000);
    } finally {
      setSaving(false);
    }
  }

  function numField(label: string, key: keyof Pricing, prefix?: string, suffix?: string) {
    return (
      <div>
        <label className="block text-xs font-medium text-gray-600 mb-1">{label}</label>
        <div className="flex items-center border border-gray-200 rounded-lg overflow-hidden focus-within:ring-2 focus-within:ring-amber-400">
          {prefix && (
            <span className="bg-gray-50 px-3 py-2 text-sm text-gray-400 border-r border-gray-100">
              {prefix}
            </span>
          )}
          <input
            type="number"
            step="0.01"
            min="0"
            value={form[key]}
            onChange={(e) =>
              setForm((f) => ({ ...f, [key]: parseFloat(e.target.value) || 0 }))
            }
            className="flex-1 px-3 py-2 text-sm focus:outline-none bg-white"
          />
          {suffix && (
            <span className="bg-gray-50 px-3 py-2 text-sm text-gray-400 border-l border-gray-100">
              {suffix}
            </span>
          )}
        </div>
      </div>
    );
  }

  return (
    <div className="p-6 max-w-lg mx-auto">
      <h1 className="text-2xl font-bold text-gray-900 mb-6">Settings</h1>
      {loading ? (
        <div className="flex items-center gap-2 text-gray-400 text-sm">
          <div className="w-4 h-4 border-2 border-amber-400 border-t-transparent rounded-full animate-spin" />
          Loading…
        </div>
      ) : (
        <form onSubmit={handleSave} className="space-y-5">
          <div className="bg-white rounded-2xl border border-gray-100 shadow-sm p-5 space-y-4">
            <h2 className="text-sm font-semibold text-gray-900">Pricing</h2>
            {numField('Cost per ml (perfume oil)', 'costPerMl', '£')}
            {numField('Packaging cost per item', 'packagingCost', '£')}
            {numField('Shipping cost per item', 'shippingCost', '£')}
            {numField('Extra fees', 'extraFees', '£')}
            {numField('Profit margin', 'profitMargin', undefined, '%')}
          </div>

          <div className="bg-amber-50 rounded-2xl border border-amber-100 p-5">
            <h2 className="text-xs font-semibold text-amber-700 uppercase tracking-wide mb-3">
              Price Preview
            </h2>
            <div className="space-y-1.5">
              {[5, 10, 15, 30].map((ml) => (
                <div key={ml} className="flex justify-between text-sm">
                  <span className="text-amber-700">{ml}ml</span>
                  <span className="font-semibold text-amber-900">£{calcPrice(ml, form)}</span>
                </div>
              ))}
            </div>
          </div>

          <button
            type="submit"
            disabled={saving}
            className="w-full bg-amber-400 hover:bg-amber-500 text-white font-semibold py-2.5 rounded-xl text-sm transition-colors disabled:opacity-60"
          >
            {saving ? 'Saving…' : saved ? '✓ Saved' : 'Save Settings'}
          </button>
        </form>
      )}
    </div>
  );
}
