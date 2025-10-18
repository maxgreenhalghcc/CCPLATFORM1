'use client';

import { FormEvent, useCallback, useEffect, useMemo, useState } from 'react';
import { useRouter } from 'next/navigation';
import { useSession } from 'next-auth/react';
import { Button } from '@/components/ui/button';
import { apiFetch } from '@/app/lib/api';
import { cn, getApiUrl, themeToCssVars } from '@/lib/utils';

interface BarDetail {
  id: string;
  name: string;
  slug: string;
  location: string | null;
  active: boolean;
  pricingPounds?: number | null;
  theme?: Record<string, string> | null;
}

interface BarSettingsResponse {
  id: string;
  introText: string | null;
  outroText: string | null;
  theme: Record<string, string>;
  pricingPounds: number;
}

interface BarEditorClientProps {
  barId?: string;
}

type TabKey = 'details' | 'settings';
type ThemeField = 'background' | 'foreground' | 'primary' | 'card';

const slugPattern = /^[a-z0-9-]+$/;

const DEFAULT_THEME: Record<ThemeField, string> = {
  background: '#0b0b12',
  foreground: '#ffffff',
  primary: '#7c3aed',
  card: '#1f1f2e'
};

function mergeTheme(theme?: Record<string, string>): Record<ThemeField, string> {
  return {
    ...DEFAULT_THEME,
    ...(theme ?? {})
  } as Record<ThemeField, string>;
}

async function requestJson<T>(input: RequestInfo | URL, init?: RequestInit): Promise<T> {
  const response = await apiFetch(input, init);
  if (!response.ok) {
    let message = response.statusText || 'Request failed';
    try {
      const body = await response.json();
      if (typeof body === 'string') {
        message = body;
      } else if (body?.message) {
        message = Array.isArray(body.message) ? body.message.join(', ') : body.message;
      }
    } catch (error) {
      // ignore parse errors and use default message
    }
    const error = new Error(message);
    (error as any).status = response.status;
    throw error;
  }
  return (await response.json()) as T;
}

export default function BarEditorClient({ barId }: BarEditorClientProps) {
  const isNew = !barId;
  const router = useRouter();
  const { data: session, status } = useSession();

  const [activeTab, setActiveTab] = useState<TabKey>('details');
  const [detail, setDetail] = useState<BarDetail>({
    id: barId ?? '',
    name: '',
    slug: '',
    location: null,
    active: true
  });
  const [settings, setSettings] = useState<BarSettingsResponse>({
    id: barId ?? '',
    introText: null,
    outroText: null,
    pricingPounds: 12,
    theme: { ...DEFAULT_THEME }
  });
  const [pricingInput, setPricingInput] = useState('12');

  const [isLoadingDetail, setIsLoadingDetail] = useState(!isNew);
  const [isLoadingSettings, setIsLoadingSettings] = useState(!isNew);
  const [detailError, setDetailError] = useState<string | null>(null);
  const [settingsError, setSettingsError] = useState<string | null>(null);
  const [detailSuccess, setDetailSuccess] = useState<string | null>(null);
  const [settingsSuccess, setSettingsSuccess] = useState<string | null>(null);
  const [isSavingDetail, setIsSavingDetail] = useState(false);
  const [isSavingSettings, setIsSavingSettings] = useState(false);

  const previewPrice = useMemo(() => {
    const value = Number.parseFloat(pricingInput);
    if (Number.isNaN(value)) {
      return settings.pricingPounds;
    }
    return value;
  }, [pricingInput, settings.pricingPounds]);

  useEffect(() => {
    if (isNew || status !== 'authenticated' || !session?.apiToken) {
      setIsLoadingDetail(false);
      setIsLoadingSettings(false);
      return;
    }

    let cancelled = false;

    async function load() {
      setIsLoadingDetail(true);
      setIsLoadingSettings(true);
      setDetailError(null);
      setSettingsError(null);

      try {
        const api = getApiUrl();
        const headers: HeadersInit = { Authorization: `Bearer ${session.apiToken}` };

        const [detailResponse, settingsResponse] = await Promise.all([
          requestJson<BarDetail>(`${api}/bars/${barId}`, { headers }),
          requestJson<BarSettingsResponse>(`${api}/bars/${barId}/settings`, { headers })
        ]);

        if (cancelled) {
          return;
        }

        setDetail({
          id: detailResponse.id,
          name: detailResponse.name,
          slug: detailResponse.slug,
          location: detailResponse.location ?? null,
          active: detailResponse.active
        });
        const mergedTheme = mergeTheme(settingsResponse.theme);
        setSettings({
          id: settingsResponse.id,
          introText: settingsResponse.introText,
          outroText: settingsResponse.outroText,
          pricingPounds: settingsResponse.pricingPounds,
          theme: mergedTheme
        });
        setPricingInput(settingsResponse.pricingPounds.toFixed(2));
      } catch (error) {
        if (!cancelled) {
          const message = error instanceof Error ? error.message : 'Failed to load bar';
          setDetailError(message);
          setSettingsError(message);
        }
      } finally {
        if (!cancelled) {
          setIsLoadingDetail(false);
          setIsLoadingSettings(false);
        }
      }
    }

    load();

    return () => {
      cancelled = true;
    };
  }, [barId, isNew, session?.apiToken, status]);

  useEffect(() => {
    if (detailError) {
      setActiveTab('details');
    }
  }, [detailError]);

  const slugValid = detail.slug.length > 0 ? slugPattern.test(detail.slug) : !isNew;
  const detailFormValid = detail.name.trim().length >= 2 && slugValid;

  const previewStyle = useMemo(() => {
    return themeToCssVars(settings.theme ?? DEFAULT_THEME);
  }, [settings.theme]);

  const handleDetailSubmit = useCallback(
    async (event: FormEvent<HTMLFormElement>) => {
      event.preventDefault();
      if (status !== 'authenticated' || !session?.apiToken) {
        return;
      }
      if (!detailFormValid) {
        setDetailError('Please fix validation errors before saving.');
        return;
      }

      setIsSavingDetail(true);
      setDetailError(null);
      setDetailSuccess(null);

      try {
        const api = getApiUrl();
        const headers: HeadersInit = {
          Authorization: `Bearer ${session.apiToken}`,
          'Content-Type': 'application/json'
        };
        const trimmedLocation = (detail.location ?? '').trim();
        const payload = {
          name: detail.name.trim(),
          slug: detail.slug.trim(),
          location: trimmedLocation.length ? trimmedLocation : null,
          active: detail.active
        };
        if (isNew) {
          const created = await requestJson<BarDetail>(`${api}/bars`, {
            method: 'POST',
            headers,
            body: JSON.stringify(payload)
          });
          setDetailSuccess('Bar created. Redirecting to editor...');
          setTimeout(() => {
            router.replace(`/admin/bars/${created.id}`);
          }, 600);
        } else {
          const updated = await requestJson<BarDetail>(`${api}/bars/${barId}`, {
            method: 'PUT',
            headers,
            body: JSON.stringify(payload)
          });
          setDetail({
            id: updated.id,
            name: updated.name,
            slug: updated.slug,
            location: updated.location ?? null,
            active: updated.active
          });
          setDetailSuccess('Changes saved');
        }
      } catch (error) {
        const message = error instanceof Error ? error.message : 'Failed to save bar';
        if ((error as any)?.status === 409) {
          setDetailError('Slug already exists. Please choose another.');
        } else {
          setDetailError(message);
        }
      } finally {
        setIsSavingDetail(false);
      }
    },
    [barId, detail, detailFormValid, isNew, router, session?.apiToken, status]
  );

  const handleSettingsSubmit = useCallback(
    async (event: FormEvent<HTMLFormElement>) => {
      event.preventDefault();
      if (isNew || status !== 'authenticated' || !session?.apiToken) {
        return;
      }

      const parsedPrice = Number.parseFloat(pricingInput);
      if (Number.isNaN(parsedPrice) || parsedPrice < 0) {
        setSettingsError('Pricing must be a positive number.');
        return;
      }

      setIsSavingSettings(true);
      setSettingsError(null);
      setSettingsSuccess(null);

      try {
        const api = getApiUrl();
        const headers: HeadersInit = {
          Authorization: `Bearer ${session.apiToken}`,
          'Content-Type': 'application/json'
        };
        const payload = {
          introText: settings.introText ?? null,
          outroText: settings.outroText ?? null,
          pricingPounds: parsedPrice,
          theme: settings.theme
        };

        const response = await requestJson<BarSettingsResponse>(`${api}/bars/${barId}/settings`, {
          method: 'PUT',
          headers,
          body: JSON.stringify(payload)
        });

        setSettings({
          id: response.id,
          introText: response.introText,
          outroText: response.outroText,
          pricingPounds: response.pricingPounds,
          theme: mergeTheme(response.theme)
        });
        setPricingInput(String(response.pricingPounds));
        setSettingsSuccess('Settings saved');
      } catch (error) {
        const message = error instanceof Error ? error.message : 'Failed to save settings';
        setSettingsError(message);
      } finally {
        setIsSavingSettings(false);
      }
    },
    [barId, isNew, pricingInput, session?.apiToken, settings.introText, settings.outroText, settings.theme, status]
  );

  const renderTabs = (
    <div className="flex items-center gap-4 border-b border-border">
      {(['details', 'settings'] as TabKey[]).map((tab) => {
        const disabled = tab === 'settings' && isNew;
        return (
          <button
            key={tab}
            type="button"
            disabled={disabled}
            onClick={() => !disabled && setActiveTab(tab)}
            className={cn(
              'border-b-2 px-1 pb-2 text-sm font-medium transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary',
              activeTab === tab ? 'border-primary text-foreground' : 'border-transparent text-muted-foreground',
              disabled && 'cursor-not-allowed opacity-60'
            )}
          >
            {tab === 'details' ? 'Details' : 'Settings'}
          </button>
        );
      })}
    </div>
  );

  return (
    <div className="px-6 py-16">
      <div className="mx-auto max-w-5xl space-y-8">
        <div>
          <h1 className="text-2xl font-semibold">
            {isNew ? 'Create a new bar' : `Manage ${detail.name || 'bar'}`}
          </h1>
          <p className="text-sm text-muted-foreground">
            Configure tenant details, pricing, and theming for customer experiences.
          </p>
        </div>

        {renderTabs}

        {activeTab === 'details' ? (
          <div className="rounded-xl border border-border bg-card p-6 shadow-sm">
            {isLoadingDetail ? (
              <div className="space-y-3">
                {Array.from({ length: 4 }).map((_, index) => (
                  <div key={index} className="h-12 animate-pulse rounded-md bg-muted/40" />
                ))}
              </div>
            ) : (
              <form className="space-y-6" onSubmit={handleDetailSubmit}>
                {detailError && (
                  <div className="rounded-md border border-destructive/40 bg-destructive/10 p-3 text-sm text-destructive">
                    {detailError}
                  </div>
                )}
                {detailSuccess && (
                  <div className="rounded-md border border-emerald-500/30 bg-emerald-500/10 p-3 text-sm text-emerald-500">
                    {detailSuccess}
                  </div>
                )}
                <div className="grid gap-4 md:grid-cols-2">
                  <label className="space-y-2">
                    <span className="text-sm font-medium text-foreground">Name</span>
                    <input
                      required
                      value={detail.name}
                      onChange={(event) =>
                        setDetail((current) => ({ ...current, name: event.target.value }))
                      }
                      className="h-10 w-full rounded-md border border-border bg-background px-3 text-sm focus:outline-none focus:ring-2 focus:ring-primary"
                    />
                  </label>
                  <label className="space-y-2">
                    <span className="text-sm font-medium text-foreground">Slug</span>
                    <input
                      required
                      value={detail.slug}
                      onChange={(event) =>
                        setDetail((current) => ({
                          ...current,
                          slug: event.target.value.toLowerCase()
                        }))
                      }
                      className={cn(
                        'h-10 w-full rounded-md border px-3 text-sm focus:outline-none focus:ring-2',
                        slugValid
                          ? 'border-border bg-background focus:ring-primary'
                          : 'border-destructive bg-destructive/10 focus:ring-destructive'
                      )}
                      placeholder="e.g. demo-bar"
                    />
                    {!slugValid && (
                      <p className="text-xs text-destructive">
                        Slug must use lowercase letters, numbers, or hyphens.
                      </p>
                    )}
                  </label>
                  <label className="space-y-2">
                    <span className="text-sm font-medium text-foreground">Location</span>
                    <input
                      value={detail.location ?? ''}
                      onChange={(event) =>
                        setDetail((current) => ({ ...current, location: event.target.value }))
                      }
                      className="h-10 w-full rounded-md border border-border bg-background px-3 text-sm focus:outline-none focus:ring-2 focus:ring-primary"
                      placeholder="City or region"
                    />
                  </label>
                  <label className="flex items-center gap-3 pt-7">
                    <input
                      type="checkbox"
                      checked={detail.active}
                      onChange={(event) =>
                        setDetail((current) => ({ ...current, active: event.target.checked }))
                      }
                      className="h-4 w-4 rounded border-border text-primary focus:ring-primary"
                    />
                    <span className="text-sm text-foreground">Active</span>
                  </label>
                </div>
                <div className="flex justify-end">
                  <Button type="submit" disabled={!detailFormValid || isSavingDetail}>
                    {isSavingDetail ? 'Saving...' : isNew ? 'Create bar' : 'Save changes'}
                  </Button>
                </div>
              </form>
            )}
          </div>
        ) : (
          <div className="grid gap-6 lg:grid-cols-[2fr_1fr]">
            <div className="rounded-xl border border-border bg-card p-6 shadow-sm">
              {isLoadingSettings ? (
                <div className="space-y-3">
                  {Array.from({ length: 5 }).map((_, index) => (
                    <div key={index} className="h-12 animate-pulse rounded-md bg-muted/40" />
                  ))}
                </div>
              ) : (
                <form className="space-y-6" onSubmit={handleSettingsSubmit}>
                  {settingsError && (
                    <div className="rounded-md border border-destructive/40 bg-destructive/10 p-3 text-sm text-destructive">
                      {settingsError}
                    </div>
                  )}
                  {settingsSuccess && (
                    <div className="rounded-md border border-emerald-500/30 bg-emerald-500/10 p-3 text-sm text-emerald-500">
                      {settingsSuccess}
                    </div>
                  )}
                  <div className="grid gap-4">
                    <label className="space-y-2">
                      <span className="text-sm font-medium text-foreground">Intro copy</span>
                      <textarea
                        value={settings.introText ?? ''}
                        onChange={(event) =>
                          setSettings((current) => ({
                            ...current,
                            introText: event.target.value || null
                          }))
                        }
                        rows={3}
                        className="w-full rounded-md border border-border bg-background px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-primary"
                      />
                    </label>
                    <label className="space-y-2">
                      <span className="text-sm font-medium text-foreground">Outro copy</span>
                      <textarea
                        value={settings.outroText ?? ''}
                        onChange={(event) =>
                          setSettings((current) => ({
                            ...current,
                            outroText: event.target.value || null
                          }))
                        }
                        rows={3}
                        className="w-full rounded-md border border-border bg-background px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-primary"
                      />
                    </label>
                    <label className="space-y-2">
                      <span className="text-sm font-medium text-foreground">Pricing (GBP)</span>
                      <input
                        type="number"
                        min="0"
                        step="0.5"
                        value={pricingInput}
                        onChange={(event) => setPricingInput(event.target.value)}
                        className="h-10 w-full rounded-md border border-border bg-background px-3 text-sm focus:outline-none focus:ring-2 focus:ring-primary"
                        required
                      />
                    </label>
                  </div>

                  <div className="grid gap-4 md:grid-cols-2">
                    {(Object.keys(DEFAULT_THEME) as ThemeField[]).map((key) => (
                      <label key={key} className="space-y-2">
                        <span className="text-sm font-medium capitalize text-foreground">{key}</span>
                        <input
                          value={settings.theme[key] ?? ''}
                          onChange={(event) =>
                            setSettings((current) => ({
                              ...current,
                              theme: { ...current.theme, [key]: event.target.value }
                            }))
                          }
                          className="h-10 w-full rounded-md border border-border bg-background px-3 text-sm focus:outline-none focus:ring-2 focus:ring-primary"
                          placeholder="#000000"
                        />
                      </label>
                    ))}
                  </div>

                  <div className="flex justify-end">
                    <Button type="submit" disabled={isSavingSettings}>
                      {isSavingSettings ? 'Saving...' : 'Save settings'}
                    </Button>
                  </div>
                </form>
              )}
            </div>
            <aside className="rounded-xl border border-border bg-card p-6 shadow-sm">
              <h2 className="text-sm font-semibold text-foreground">Theme preview</h2>
              <p className="mt-1 text-xs text-muted-foreground">
                Preview customer-facing colours using the current editor values.
              </p>
              <div
                className="mt-6 space-y-4 rounded-lg p-6"
                style={{
                  ...previewStyle,
                  background: settings.theme.background,
                  color: settings.theme.foreground
                }}
              >
                <div>
                  <p className="text-xs uppercase tracking-wide opacity-80">Hero</p>
                  <p className="text-lg font-semibold">{detail.name || 'Your Bar Name'}</p>
                  <Button
                    type="button"
                    className="mt-3"
                    style={{ backgroundColor: settings.theme.primary, color: settings.theme.foreground }}
                  >
                    Try quiz
                  </Button>
                </div>
                <div
                  className="rounded-md border"
                  style={{
                    backgroundColor: settings.theme.card,
                    borderColor: settings.theme.primary
                  }}
                >
                  <div className="space-y-2 p-4">
                    <p className="text-sm font-medium">Cocktail preview</p>
                    <p className="text-xs text-muted-foreground" style={{ color: settings.theme.foreground }}>
                      Pricing: £{previewPrice.toFixed(2)}
                    </p>
                  </div>
                </div>
              </div>
            </aside>
          </div>
        )}
      </div>
    </div>
  );
}
