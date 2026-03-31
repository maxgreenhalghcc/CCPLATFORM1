'use client';

import { useState } from 'react';
import { Button } from '@/components/ui/button';
import { getApiBaseUrl } from '@/app/lib/api';

interface Tier {
  id: string;
  name: string;
  threshold: number;
  payoutAmount: number;
  sortOrder: number;
}

interface Props {
  barId: string;
  barName: string;
  initialTiers: Tier[];
  initialBaseline: number | null;
  token: string;
}

export default function IncentivesClient({
  barId,
  barName,
  initialTiers,
  initialBaseline,
  token,
}: Props) {
  const base = getApiBaseUrl();
  const headers = {
    Authorization: `Bearer ${token}`,
    'Content-Type': 'application/json',
  };

  const [tiers, setTiers] = useState<Tier[]>(initialTiers);
  const [baseline, setBaselineValue] = useState<string>(
    initialBaseline != null ? String(initialBaseline) : '',
  );
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [baselineSaved, setBaselineSaved] = useState(false);

  // New tier form state
  const [newName, setNewName] = useState('');
  const [newThreshold, setNewThreshold] = useState('');
  const [newPayout, setNewPayout] = useState('');
  const [adding, setAdding] = useState(false);

  async function handleAddTier(e: React.FormEvent) {
    e.preventDefault();
    setError(null);
    setAdding(true);
    try {
      const res = await fetch(`${base}/v1/admin/bars/${barId}/incentive-tiers`, {
        method: 'POST',
        headers,
        body: JSON.stringify({
          name: newName,
          threshold: parseInt(newThreshold, 10),
          payoutAmount: parseFloat(newPayout),
          sortOrder: tiers.length,
        }),
      });
      if (!res.ok) throw new Error(`Server error ${res.status}`);
      const created: Tier = await res.json();
      setTiers((prev) => [...prev, created].sort((a, b) => a.threshold - b.threshold));
      setNewName('');
      setNewThreshold('');
      setNewPayout('');
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to add tier');
    } finally {
      setAdding(false);
    }
  }

  async function handleDeleteTier(tierId: string) {
    setError(null);
    try {
      const res = await fetch(`${base}/v1/admin/bars/${barId}/incentive-tiers/${tierId}`, {
        method: 'DELETE',
        headers,
      });
      if (!res.ok) throw new Error(`Server error ${res.status}`);
      setTiers((prev) => prev.filter((t) => t.id !== tierId));
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to delete tier');
    }
  }

  async function handleTierChange(tierId: string, field: keyof Tier, raw: string) {
    setTiers((prev) =>
      prev.map((t) =>
        t.id === tierId
          ? {
              ...t,
              [field]:
                field === 'name' ? raw : field === 'payoutAmount' ? parseFloat(raw) || 0 : parseInt(raw, 10) || 0,
            }
          : t,
      ),
    );
  }

  async function handleSaveTier(tier: Tier) {
    setError(null);
    setSaving(true);
    try {
      const res = await fetch(`${base}/v1/admin/bars/${barId}/incentive-tiers/${tier.id}`, {
        method: 'PATCH',
        headers,
        body: JSON.stringify({
          name: tier.name,
          threshold: tier.threshold,
          payoutAmount: tier.payoutAmount,
          sortOrder: tier.sortOrder,
        }),
      });
      if (!res.ok) throw new Error(`Server error ${res.status}`);
      const updated: Tier = await res.json();
      setTiers((prev) =>
        prev
          .map((t) => (t.id === updated.id ? updated : t))
          .sort((a, b) => a.threshold - b.threshold),
      );
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to save tier');
    } finally {
      setSaving(false);
    }
  }

  async function handleSaveBaseline(e: React.FormEvent) {
    e.preventDefault();
    setError(null);
    setSaving(true);
    setBaselineSaved(false);
    try {
      const res = await fetch(`${base}/v1/admin/bars/${barId}/baseline`, {
        method: 'PATCH',
        headers,
        body: JSON.stringify({ baseline: parseInt(baseline, 10) }),
      });
      if (!res.ok) throw new Error(`Server error ${res.status}`);
      setBaselineSaved(true);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to save baseline');
    } finally {
      setSaving(false);
    }
  }

  return (
    <div className="flex flex-col gap-8">
      {error && (
        <p className="rounded-lg bg-destructive/10 px-4 py-3 text-sm text-destructive ring-1 ring-destructive/20">
          {error}
        </p>
      )}

      {/* Tiers */}
      <section>
        <h2 className="mb-4 text-lg font-semibold">Incentive tiers — {barName}</h2>
        {tiers.length === 0 ? (
          <p className="text-sm text-muted-foreground">No tiers configured yet.</p>
        ) : (
          <div className="flex flex-col gap-2">
            {tiers.map((tier) => (
              <div
                key={tier.id}
                className="flex flex-wrap items-center gap-3 rounded-xl border border-border/[var(--border-alpha,0.5)] bg-card/60 p-4"
              >
                <input
                  className="w-28 rounded-lg border border-border bg-background px-3 py-1.5 text-sm"
                  value={tier.name}
                  onChange={(e) => handleTierChange(tier.id, 'name', e.target.value)}
                  placeholder="Name"
                />
                <div className="flex items-center gap-1.5">
                  <span className="text-xs text-muted-foreground">Threshold</span>
                  <input
                    type="number"
                    className="w-20 rounded-lg border border-border bg-background px-3 py-1.5 text-sm"
                    value={tier.threshold}
                    onChange={(e) => handleTierChange(tier.id, 'threshold', e.target.value)}
                    min={1}
                  />
                  <span className="text-xs text-muted-foreground">orders</span>
                </div>
                <div className="flex items-center gap-1.5">
                  <span className="text-xs text-muted-foreground">Payout</span>
                  <span className="text-sm">£</span>
                  <input
                    type="number"
                    className="w-20 rounded-lg border border-border bg-background px-3 py-1.5 text-sm"
                    value={tier.payoutAmount}
                    onChange={(e) => handleTierChange(tier.id, 'payoutAmount', e.target.value)}
                    min={0}
                    step={0.01}
                  />
                </div>
                <div className="ml-auto flex gap-2">
                  <Button
                    size="sm"
                    variant="outline"
                    onClick={() => handleSaveTier(tier)}
                    disabled={saving}
                  >
                    Save
                  </Button>
                  <Button
                    size="sm"
                    variant="ghost"
                    className="text-destructive hover:text-destructive"
                    onClick={() => handleDeleteTier(tier.id)}
                  >
                    Remove
                  </Button>
                </div>
              </div>
            ))}
          </div>
        )}

        {/* Add tier form */}
        <form onSubmit={handleAddTier} className="mt-4 flex flex-wrap items-end gap-3">
          <div className="flex flex-col gap-1">
            <label className="text-xs text-muted-foreground">Name</label>
            <input
              className="w-28 rounded-lg border border-border bg-background px-3 py-1.5 text-sm"
              value={newName}
              onChange={(e) => setNewName(e.target.value)}
              placeholder="e.g. Bronze"
              required
            />
          </div>
          <div className="flex flex-col gap-1">
            <label className="text-xs text-muted-foreground">Threshold (orders)</label>
            <input
              type="number"
              className="w-24 rounded-lg border border-border bg-background px-3 py-1.5 text-sm"
              value={newThreshold}
              onChange={(e) => setNewThreshold(e.target.value)}
              placeholder="20"
              min={1}
              required
            />
          </div>
          <div className="flex flex-col gap-1">
            <label className="text-xs text-muted-foreground">Payout (£)</label>
            <input
              type="number"
              className="w-24 rounded-lg border border-border bg-background px-3 py-1.5 text-sm"
              value={newPayout}
              onChange={(e) => setNewPayout(e.target.value)}
              placeholder="10.00"
              min={0}
              step={0.01}
              required
            />
          </div>
          <Button type="submit" variant="outline" disabled={adding}>
            {adding ? 'Adding…' : 'Add tier'}
          </Button>
        </form>
      </section>

      {/* Baseline */}
      <section>
        <h2 className="mb-1 text-lg font-semibold">Weekly baseline</h2>
        <p className="mb-4 text-sm text-muted-foreground">
          The weekly target used to calculate percentage improvement. Defaults to the first
          week&apos;s count if left blank. Set manually to override.
        </p>
        <form onSubmit={handleSaveBaseline} className="flex items-end gap-3">
          <div className="flex flex-col gap-1">
            <label className="text-xs text-muted-foreground">Baseline orders / week</label>
            <input
              type="number"
              className="w-28 rounded-lg border border-border bg-background px-3 py-1.5 text-sm"
              value={baseline}
              onChange={(e) => setBaselineValue(e.target.value)}
              placeholder="e.g. 25"
              min={0}
              required
            />
          </div>
          <Button type="submit" variant="outline" disabled={saving}>
            {saving ? 'Saving…' : 'Save baseline'}
          </Button>
          {baselineSaved && (
            <span className="text-sm text-emerald-400">Saved!</span>
          )}
        </form>
      </section>

      {/* Staff preview */}
      {tiers.length > 0 && (
        <section>
          <h2 className="mb-4 text-lg font-semibold">Staff view preview</h2>
          <div className="rounded-xl border border-border/[var(--border-alpha,0.5)] bg-card/60 p-5">
            <p className="text-xs text-muted-foreground mb-3">
              Staff will see a progress bar with these tier markers:
            </p>
            <div className="flex justify-between text-xs text-muted-foreground mb-1">
              <span>0</span>
              {tiers.map((t) => (
                <span key={t.id} className="flex flex-col items-center">
                  <span>{t.threshold}</span>
                  <span className="text-[10px]">{t.name} (£{t.payoutAmount})</span>
                </span>
              ))}
            </div>
            <div className="h-3 w-full rounded-full bg-border/40">
              <div className="h-full w-1/3 rounded-full bg-gradient-to-r from-primary to-primary/70" />
            </div>
          </div>
        </section>
      )}
    </div>
  );
}
