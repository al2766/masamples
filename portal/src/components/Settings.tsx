'use client';

import { useState, useEffect } from 'react';
import { doc, getDoc, getDocFromCache, setDoc } from 'firebase/firestore';
import { db } from '@/lib/firebase';

export interface Pricing {
  oilCost: number;       // total cost of perfume oil bottle (£)
  oilVolume: number;     // volume of that bottle (ml)
  costPerMl: number;     // derived: oilCost / oilVolume
  packagingCost: number;
  shippingCost: number;
  extraFees: number;
  profitMargin: number;
}

const DEFAULTS: Pricing = {
  oilCost: 10,
  oilVolume: 50,
  costPerMl: 0.2,
  packagingCost: 2.25,
  shippingCost: 1.55,
  extraFees: 0,
  profitMargin: 40,
};

export function calcPrice(ml: number, p: Pricing): number {
  const cost = ml * p.costPerMl + p.packagingCost + p.shippingCost + p.extraFees;
  return Math.round((cost / (1 - p.profitMargin / 100)) * 100) / 100;
}

function applyDefaults(data: Partial<Pricing>): Pricing {
  return { ...DEFAULTS, ...data };
}

export default function Settings() {
  const [form, setForm] = useState<Pricing>(DEFAULTS);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [saved, setSaved] = useState(false);

  useEffect(() => {
    let cancelled = false;
    const ref = doc(db, 'settings', 'pricing');

    async function load() {
      // Cache first (instant)
      try {
        const cached = await getDocFromCache(ref);
        if (cached.exists() && !cancelled)
          setForm(applyDefaults(cached.data() as Partial<Pricing>));
        if (!cancelled) setLoading(false);
      } catch { if (!cancelled) setLoading(false); /* no cache */ }

      // Network refresh
      try {
        const snap = await getDoc(ref);
        if (snap.exists() && !cancelled)
          setForm(applyDefaults(snap.data() as Partial<Pricing>));
      } catch { /* ignore */ } finally {
        if (!cancelled) setLoading(false);
      }
    }
    load();
    return () => { cancelled = true; };
  }, []);

  function updateOilCost(v: number) {
    setForm((f) => {
      const oilCost = v;
      const costPerMl = f.oilVolume > 0 ? oilCost / f.oilVolume : 0;
      return { ...f, oilCost, costPerMl };
    });
  }

  function updateOilVolume(v: number) {
    setForm((f) => {
      const oilVolume = v;
      const costPerMl = oilVolume > 0 ? f.oilCost / oilVolume : 0;
      return { ...f, oilVolume, costPerMl };
    });
  }

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

  function numInput(
    label: string,
    value: number,
    onChange: (v: number) => void,
    opts: { prefix?: string; suffix?: string; step?: string; readOnly?: boolean } = {}
  ) {
    return (
      <div>
        <label className="block text-xs font-medium text-gray-600 mb-1">{label}</label>
        <div
          className={`flex items-center border rounded-lg overflow-hidden focus-within:ring-2 focus-within:ring-amber-400 ${
            opts.readOnly ? 'border-gray-100 bg-gray-50' : 'border-gray-200'
          }`}
        >
          {opts.prefix && (
            <span className="bg-gray-50 px-3 py-2 text-sm text-gray-400 border-r border-gray-100">
              {opts.prefix}
            </span>
          )}
          <input
            type="number"
            step={opts.step ?? '0.01'}
            min="0"
            value={value}
            readOnly={opts.readOnly}
            onChange={(e) => onChange(parseFloat(e.target.value) || 0)}
            className={`flex-1 px-3 py-2 text-sm focus:outline-none ${
              opts.readOnly ? 'text-gray-500 bg-gray-50 cursor-default' : 'bg-white'
            }`}
          />
          {opts.suffix && (
            <span className="bg-gray-50 px-3 py-2 text-sm text-gray-400 border-l border-gray-100">
              {opts.suffix}
            </span>
          )}
        </div>
      </div>
    );
  }

  return (
    <div className="p-6 max-w-lg mx-auto">
      <h1 className="text-2xl font-bold text-gray-900 mb-6">Settings</h1>
      {loading && form === DEFAULTS ? (
        <div className="flex items-center gap-2 text-gray-400 text-sm">
          <div className="w-4 h-4 border-2 border-amber-400 border-t-transparent rounded-full animate-spin" />
          Loading…
        </div>
      ) : (
        <form onSubmit={handleSave} className="space-y-5">
          {/* Perfume oil cost */}
          <div className="bg-white rounded-2xl border border-gray-100 shadow-sm p-5 space-y-4">
            <h2 className="text-sm font-semibold text-gray-900">Perfume Oil Cost</h2>
            <div className="grid grid-cols-2 gap-4">
              {numInput('Oil cost (£)', form.oilCost, updateOilCost, { prefix: '£' })}
              {numInput('Volume (ml)', form.oilVolume, updateOilVolume, { suffix: 'ml', step: '1' })}
            </div>
            {numInput(
              'Cost per ml (auto-calculated)',
              Math.round(form.costPerMl * 10000) / 10000,
              () => {},
              { prefix: '£', readOnly: true }
            )}
          </div>

          {/* Other costs */}
          <div className="bg-white rounded-2xl border border-gray-100 shadow-sm p-5 space-y-4">
            <h2 className="text-sm font-semibold text-gray-900">Other Costs</h2>
            {numInput('Packaging per item', form.packagingCost, (v) => setForm((f) => ({ ...f, packagingCost: v })), { prefix: '£' })}
            {numInput('Shipping per item', form.shippingCost, (v) => setForm((f) => ({ ...f, shippingCost: v })), { prefix: '£' })}
            {numInput('Extra fees', form.extraFees, (v) => setForm((f) => ({ ...f, extraFees: v })), { prefix: '£' })}
            {numInput('Profit margin', form.profitMargin, (v) => setForm((f) => ({ ...f, profitMargin: v })), { suffix: '%', step: '1' })}
          </div>

          {/* Price preview 1–10ml */}
          <div className="bg-amber-50 rounded-2xl border border-amber-100 p-5">
            <h2 className="text-xs font-semibold text-amber-700 uppercase tracking-wide mb-3">
              Selling Prices (1–10ml)
            </h2>
            <div className="grid grid-cols-2 gap-x-6 gap-y-1.5">
              {Array.from({ length: 10 }, (_, i) => i + 1).map((ml) => (
                <div key={ml} className="flex justify-between text-sm">
                  <span className="text-amber-700">{ml}ml</span>
                  <span className="font-semibold text-amber-900">£{calcPrice(ml, form).toFixed(2)}</span>
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
