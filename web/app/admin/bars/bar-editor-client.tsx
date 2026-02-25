'use client';

import { FormEvent, useCallback, useEffect, useMemo, useState } from 'react';
import { useRouter } from 'next/navigation';
import { useSession } from 'next-auth/react';
import { Button } from '@/components/ui/button';
import { apiFetch } from '@/app/lib/api';
import { cn, getApiUrl, themeToCssVars } from '@/lib/utils';
import {
  AnimatePresence,
  motion,
  DURATION,
  EASE,
} from '@/app/components/motion';
import { PRESETS, FONT_OPTIONS, type PresetId } from '@/app/lib/presets';
import { LogoLockup } from '@/app/components/LogoLockup';
import { LogoUpload } from '@/app/components/LogoUpload';

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
  quizPaused: boolean;
  theme: Record<string, string>;
  pricingPounds: number;
  contactName: string | null;
  contactEmail: string | null;
  contactPhone: string | null;
  address: Record<string, string> | null;
  openingHours: Record<string, string> | null;
  stock: string[];
  stockListUrl: string | null;
  bankDetails: Record<string, string> | null;
  stripeConnectId: string | null;
  stripeConnectLink: string | null;
  brandPalette: Record<string, string> | null;
  logoUrl: string | null;
  preset?: string;
  fontFamily?: string;
  logoLockupMode?: string;
}

interface BarEditorClientProps {
  barId?: string;
}

type TabKey = 'details' | 'settings';
type ThemeField = 'background' | 'foreground' | 'primary' | 'card';
type PaletteField = 'dominant' | 'secondary' | 'accent';

interface AddressFormState {
  line1: string;
  line2: string;
  city: string;
  postcode: string;
  country: string;
}

interface BankFormState {
  accountName: string;
  accountNumber: string;
  sortCode: string;
  iban: string;
  notes: string;
}

interface PaletteState {
  dominant: string;
  secondary: string;
  accent: string;
}

const slugPattern = /^[a-z0-9-]+$/;

const DEFAULT_THEME: Record<ThemeField, string> = {
  background: '#050315',
  foreground: '#fbfbfe',
  primary: '#2f27ce',
  card: '#101226'
};

const DEFAULT_PALETTE: PaletteState = {
  dominant: '#050315',
  secondary: '#2f27ce',
  accent: '#dedcff'
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
    quizPaused: false,
    pricingPounds: 12,
    theme: { ...DEFAULT_THEME },
    contactName: null,
    contactEmail: null,
    contactPhone: null,
    address: null,
    openingHours: null,
    stock: [],
    stockListUrl: null,
    bankDetails: null,
    stripeConnectId: null,
    stripeConnectLink: null,
    brandPalette: { ...DEFAULT_PALETTE },
    logoUrl: null,
    preset: 'modern',
    fontFamily: 'inter',
    logoLockupMode: 'symbol-only'
  });
  const [pricingInput, setPricingInput] = useState('12');
  const [openingHoursInput, setOpeningHoursInput] = useState('');
  const [stockInput, setStockInput] = useState('');
  const [addressForm, setAddressForm] = useState<AddressFormState>({
    line1: '',
    line2: '',
    city: '',
    postcode: '',
    country: ''
  });
  const [bankForm, setBankForm] = useState<BankFormState>({
    accountName: '',
    accountNumber: '',
    sortCode: '',
    iban: '',
    notes: ''
  });
  const [paletteState, setPaletteState] = useState<PaletteState>({ ...DEFAULT_PALETTE });

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
        const token = session?.apiToken;
        if (!token) {
          throw new Error('Missing API token');
        }
        const headers: HeadersInit = { Authorization: `Bearer ${token}` };

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
        const palette = normalizePaletteState(settingsResponse.brandPalette);
        setSettings({
          id: settingsResponse.id,
          introText: settingsResponse.introText,
          outroText: settingsResponse.outroText,
          quizPaused: settingsResponse.quizPaused ?? false,
          pricingPounds: settingsResponse.pricingPounds,
          theme: mergedTheme,
          contactName: settingsResponse.contactName,
          contactEmail: settingsResponse.contactEmail,
          contactPhone: settingsResponse.contactPhone,
          address: settingsResponse.address,
          openingHours: settingsResponse.openingHours,
          stock: settingsResponse.stock,
          stockListUrl: settingsResponse.stockListUrl,
          bankDetails: settingsResponse.bankDetails,
          stripeConnectId: settingsResponse.stripeConnectId,
          stripeConnectLink: settingsResponse.stripeConnectLink,
          brandPalette: { ...DEFAULT_PALETTE, ...palette },
          logoUrl: settingsResponse.logoUrl,
          preset: settingsResponse.preset ?? 'modern',
          fontFamily: settingsResponse.fontFamily ?? 'inter',
          logoLockupMode: settingsResponse.logoLockupMode ?? 'symbol-only'
        });
        setPricingInput(settingsResponse.pricingPounds.toFixed(2));
        setPaletteState(palette);
        setAddressForm(toAddressState(settingsResponse.address));
        setBankForm(toBankState(settingsResponse.bankDetails));
        setOpeningHoursInput(formatOpeningHours(settingsResponse.openingHours));
        setStockInput((settingsResponse.stock ?? []).join('\n'));
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

  const handlePaletteChange = useCallback(
    (field: PaletteField, value: string) => {
      const nextPalette = { ...paletteState, [field]: value };
      setPaletteState(nextPalette);
      setSettings((current) => ({
        ...current,
        brandPalette: { ...DEFAULT_PALETTE, ...nextPalette },
        theme: {
          ...current.theme,
          ...(field === 'dominant' ? { background: value } : {}),
          ...(field === 'secondary' ? { primary: value } : {}),
          ...(field === 'accent' ? { card: value } : {})
        }
      }));
    },
    [paletteState]
  );

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
        const token = session!.apiToken;
        const headers: HeadersInit = {
          Authorization: `Bearer ${token}`,
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
        const token = session!.apiToken;
        const headers: HeadersInit = {
          Authorization: `Bearer ${token}`,
          'Content-Type': 'application/json'
        };

        // NOTE: This handler must capture the latest form state. Incomplete dependency
        // arrays previously caused stale values to be submitted ("settings not saving").
        const payload: Record<string, unknown> = {
          introText: settings.introText ?? null,
          outroText: settings.outroText ?? null,
          quizPaused: settings.quizPaused,
          pricingPounds: parsedPrice,
          theme: settings.theme,
          contactName: normalizeNullableString(settings.contactName),
          contactEmail: normalizeNullableString(settings.contactEmail),
          contactPhone: normalizeNullableString(settings.contactPhone),
          stockListUrl: normalizeNullableString(settings.stockListUrl),
          stripeConnectId: normalizeNullableString(settings.stripeConnectId),
          stripeConnectLink: normalizeNullableString(settings.stripeConnectLink),
          logoUrl: normalizeNullableString(settings.logoUrl),
          address: buildAddressPayload(addressForm),
          bankDetails: buildBankPayload(bankForm),
          openingHours: parseOpeningHoursInput(openingHoursInput),
          stock: parseStockInput(stockInput),
          brandPalette: buildPalettePayload(paletteState),
          preset: settings.preset,
          fontFamily: settings.fontFamily,
          logoLockupMode: settings.logoLockupMode
        };

        const response = await requestJson<BarSettingsResponse>(`${api}/bars/${barId}/settings`, {
          method: 'PUT',
          headers,
          body: JSON.stringify(payload)
        });

        const mergedTheme = mergeTheme(response.theme);
        const palette = normalizePaletteState(response.brandPalette);

        setSettings({
          id: response.id,
          introText: response.introText,
          outroText: response.outroText,
          quizPaused: response.quizPaused ?? false,
          pricingPounds: response.pricingPounds,
          theme: mergedTheme,
          contactName: response.contactName,
          contactEmail: response.contactEmail,
          contactPhone: response.contactPhone,
          address: response.address,
          openingHours: response.openingHours,
          stock: response.stock,
          stockListUrl: response.stockListUrl,
          bankDetails: response.bankDetails,
          stripeConnectId: response.stripeConnectId,
          stripeConnectLink: response.stripeConnectLink,
          brandPalette: { ...DEFAULT_PALETTE, ...palette },
          logoUrl: response.logoUrl,
          preset: response.preset ?? 'modern',
          fontFamily: response.fontFamily ?? 'inter',
          logoLockupMode: response.logoLockupMode ?? 'symbol-only'
        });
        setPricingInput(String(response.pricingPounds));
        setPaletteState(palette);
        setAddressForm(toAddressState(response.address));
        setBankForm(toBankState(response.bankDetails));
        setOpeningHoursInput(formatOpeningHours(response.openingHours));
        setStockInput((response.stock ?? []).join('\n'));
        setSettingsSuccess('Settings saved');
      } catch (error) {
        const message = error instanceof Error ? error.message : 'Failed to save settings';
        setSettingsError(message);
      } finally {
        setIsSavingSettings(false);
      }
    },
    [
      barId, isNew, pricingInput, session?.apiToken, status,
      settings.introText, settings.outroText, settings.theme, settings.quizPaused,
      settings.contactName, settings.contactEmail, settings.contactPhone,
      settings.stockListUrl, settings.stripeConnectId, settings.stripeConnectLink,
      settings.logoUrl, settings.preset, settings.fontFamily, settings.logoLockupMode,
      addressForm, bankForm, openingHoursInput, stockInput, paletteState,
    ]
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

        <AnimatePresence mode="wait">
        {activeTab === 'details' ? (
          <motion.div
            key="details"
            initial={{ opacity: 0, y: 6 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -6 }}
            transition={{ duration: DURATION.micro, ease: EASE.out }}
            className="rounded-xl border border-border bg-card p-6 shadow-sm"
          >
            {isLoadingDetail ? (
              <div className="space-y-3">
                {Array.from({ length: 4 }).map((_, index) => (
                  <div key={index} className="h-12 animate-shimmer rounded-md" />
                ))}
              </div>
            ) : (
              <form className="space-y-6" onSubmit={handleDetailSubmit}>
                <AnimatePresence>
                  {detailError && (
                    <motion.div
                      key="detail-error"
                      initial={{ opacity: 0, height: 0 }}
                      animate={{ opacity: 1, height: 'auto' }}
                      exit={{ opacity: 0, height: 0 }}
                      transition={{ duration: DURATION.micro, ease: EASE.out }}
                      className="rounded-md border border-destructive/40 bg-destructive/10 p-3 text-sm text-destructive"
                    >
                      {detailError}
                    </motion.div>
                  )}
                  {detailSuccess && (
                    <motion.div
                      key="detail-success"
                      initial={{ opacity: 0, height: 0 }}
                      animate={{ opacity: 1, height: 'auto' }}
                      exit={{ opacity: 0, height: 0 }}
                      transition={{ duration: DURATION.micro, ease: EASE.out }}
                      className="rounded-md border border-emerald-500/30 bg-emerald-500/10 p-3 text-sm text-emerald-500"
                    >
                      {detailSuccess}
                    </motion.div>
                  )}
                </AnimatePresence>
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
          </motion.div>
        ) : (
          <motion.div
            key="settings"
            initial={{ opacity: 0, y: 6 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -6 }}
            transition={{ duration: DURATION.micro, ease: EASE.out }}
            className="grid gap-6 lg:grid-cols-[2fr_1fr]"
          >
            <div className="rounded-xl border border-border bg-card p-6 shadow-sm">
              {isLoadingSettings ? (
                <div className="space-y-3">
                  {Array.from({ length: 5 }).map((_, index) => (
                    <div key={index} className="h-12 animate-shimmer rounded-md" />
                  ))}
                </div>
              ) : (
                <form className="space-y-6" onSubmit={handleSettingsSubmit}>
                  <AnimatePresence>
                    {settingsError && (
                      <motion.div
                        key="settings-error"
                        initial={{ opacity: 0, height: 0 }}
                        animate={{ opacity: 1, height: 'auto' }}
                        exit={{ opacity: 0, height: 0 }}
                        transition={{ duration: DURATION.micro, ease: EASE.out }}
                        className="rounded-md border border-destructive/40 bg-destructive/10 p-3 text-sm text-destructive"
                      >
                        {settingsError}
                      </motion.div>
                    )}
                    {settingsSuccess && (
                      <motion.div
                        key="settings-success"
                        initial={{ opacity: 0, height: 0 }}
                        animate={{ opacity: 1, height: 'auto' }}
                        exit={{ opacity: 0, height: 0 }}
                        transition={{ duration: DURATION.micro, ease: EASE.out }}
                        className="rounded-md border border-emerald-500/30 bg-emerald-500/10 p-3 text-sm text-emerald-500"
                      >
                        {settingsSuccess}
                      </motion.div>
                    )}
                  </AnimatePresence>
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

                    <label className="flex items-center gap-3 rounded-md border border-border/60 bg-muted/20 px-3 py-3">
                      <input
                        type="checkbox"
                        checked={settings.quizPaused}
                        onChange={(event) =>
                          setSettings((current) => ({
                            ...current,
                            quizPaused: event.target.checked
                          }))
                        }
                        className="h-4 w-4 rounded border-border text-primary focus:ring-primary"
                      />
                      <div>
                        <div className="text-sm font-medium text-foreground">Busy-night mode (pause quiz)</div>
                        <div className="text-xs text-muted-foreground">
                          Stops new guest quiz sessions for this bar. Staff dashboard stays live.
                        </div>
                      </div>
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

                  <div className="border-t border-border/60 pt-6">
                    <div className="flex items-baseline justify-between gap-3">
                      <h3 className="text-sm font-semibold text-foreground">Contact</h3>
                      <p className="text-xs text-muted-foreground">Primary venue contact details.</p>
                    </div>
                    <div className="mt-4 grid gap-4 md:grid-cols-2">
                      <label className="space-y-2">
                        <span className="text-sm font-medium text-foreground">Owner name</span>
                        <input
                          value={settings.contactName ?? ''}
                          onChange={(event) =>
                            setSettings((current) => ({
                              ...current,
                              contactName: event.target.value
                            }))
                          }
                          className="h-10 w-full rounded-md border border-border bg-background px-3 text-sm focus:outline-none focus:ring-2 focus:ring-primary"
                          placeholder="e.g. Alex Turner"
                        />
                      </label>
                      <label className="space-y-2">
                        <span className="text-sm font-medium text-foreground">Contact email</span>
                        <input
                          type="email"
                          value={settings.contactEmail ?? ''}
                          onChange={(event) =>
                            setSettings((current) => ({
                              ...current,
                              contactEmail: event.target.value
                            }))
                          }
                          className="h-10 w-full rounded-md border border-border bg-background px-3 text-sm focus:outline-none focus:ring-2 focus:ring-primary"
                          placeholder="owner@bar.com"
                        />
                      </label>
                      <label className="space-y-2 md:col-span-2">
                        <span className="text-sm font-medium text-foreground">Contact phone</span>
                        <input
                          value={settings.contactPhone ?? ''}
                          onChange={(event) =>
                            setSettings((current) => ({
                              ...current,
                              contactPhone: event.target.value
                            }))
                          }
                          className="h-10 w-full rounded-md border border-border bg-background px-3 text-sm focus:outline-none focus:ring-2 focus:ring-primary"
                          placeholder="+44 20 0000 0000"
                        />
                      </label>
                    </div>
                  </div>

                  <div className="border-t border-border/60 pt-6">
                    <div className="flex items-baseline justify-between gap-3">
                      <h3 className="text-sm font-semibold text-foreground">Venue details</h3>
                      <p className="text-xs text-muted-foreground">Address and operating hours for staff reference.</p>
                    </div>
                    <div className="mt-4 grid gap-4 md:grid-cols-2">
                      <label className="space-y-2">
                        <span className="text-sm font-medium text-foreground">Address line 1</span>
                        <input
                          value={addressForm.line1}
                          onChange={(event) =>
                            setAddressForm((current) => ({ ...current, line1: event.target.value }))
                          }
                          className="h-10 w-full rounded-md border border-border bg-background px-3 text-sm focus:outline-none focus:ring-2 focus:ring-primary"
                          placeholder="123 High Street"
                        />
                      </label>
                      <label className="space-y-2">
                        <span className="text-sm font-medium text-foreground">Address line 2</span>
                        <input
                          value={addressForm.line2}
                          onChange={(event) =>
                            setAddressForm((current) => ({ ...current, line2: event.target.value }))
                          }
                          className="h-10 w-full rounded-md border border-border bg-background px-3 text-sm focus:outline-none focus:ring-2 focus:ring-primary"
                          placeholder="Suite or building"
                        />
                      </label>
                      <label className="space-y-2">
                        <span className="text-sm font-medium text-foreground">City</span>
                        <input
                          value={addressForm.city}
                          onChange={(event) =>
                            setAddressForm((current) => ({ ...current, city: event.target.value }))
                          }
                          className="h-10 w-full rounded-md border border-border bg-background px-3 text-sm focus:outline-none focus:ring-2 focus:ring-primary"
                          placeholder="London"
                        />
                      </label>
                      <label className="space-y-2">
                        <span className="text-sm font-medium text-foreground">Postcode</span>
                        <input
                          value={addressForm.postcode}
                          onChange={(event) =>
                            setAddressForm((current) => ({ ...current, postcode: event.target.value }))
                          }
                          className="h-10 w-full rounded-md border border-border bg-background px-3 text-sm focus:outline-none focus:ring-2 focus:ring-primary"
                          placeholder="E1 6AN"
                        />
                      </label>
                      <label className="space-y-2 md:col-span-2">
                        <span className="text-sm font-medium text-foreground">Country</span>
                        <input
                          value={addressForm.country}
                          onChange={(event) =>
                            setAddressForm((current) => ({ ...current, country: event.target.value }))
                          }
                          className="h-10 w-full rounded-md border border-border bg-background px-3 text-sm focus:outline-none focus:ring-2 focus:ring-primary"
                          placeholder="United Kingdom"
                        />
                      </label>
                      <label className="space-y-2 md:col-span-2">
                        <span className="text-sm font-medium text-foreground">Opening hours</span>
                        <textarea
                          value={openingHoursInput}
                          onChange={(event) => setOpeningHoursInput(event.target.value)}
                          rows={4}
                          className="w-full rounded-md border border-border bg-background px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-primary"
                          placeholder={`Monday: 12:00-22:00\nTuesday: 12:00-22:00`}
                        />
                        <p className="text-xs text-muted-foreground">
                          One entry per line using the format <code>Day: hours</code>.
                        </p>
                      </label>
                    </div>
                  </div>

                  <div className="border-t border-border/60 pt-6">
                    <div className="flex items-baseline justify-between gap-3">
                      <h3 className="text-sm font-semibold text-foreground">Stock & assets</h3>
                      <p className="text-xs text-muted-foreground">Keep the bar team aligned on available inventory.</p>
                    </div>
                    <div className="mt-4 grid gap-4 md:grid-cols-2">
                      <label className="space-y-2 md:col-span-2">
                        <span className="text-sm font-medium text-foreground">Stock items</span>
                        <textarea
                          value={stockInput}
                          onChange={(event) => setStockInput(event.target.value)}
                          rows={4}
                          className="w-full rounded-md border border-border bg-background px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-primary"
                          placeholder={`Vodka\nGin\nLime`}
                        />
                        <p className="text-xs text-muted-foreground">Enter one item per line.</p>
                      </label>
                      <label className="space-y-2">
                        <span className="text-sm font-medium text-foreground">Stock list URL</span>
                        <input
                          value={settings.stockListUrl ?? ''}
                          onChange={(event) =>
                            setSettings((current) => ({
                              ...current,
                              stockListUrl: event.target.value
                            }))
                          }
                          className="h-10 w-full rounded-md border border-border bg-background px-3 text-sm focus:outline-none focus:ring-2 focus:ring-primary"
                          placeholder="https://cdn.example.com/bars/demo-bar/stock.pdf"
                        />
                      </label>
                    </div>
                  </div>

                  <div className="border-t border-border/60 pt-6">
                    <div className="flex items-baseline justify-between gap-3">
                      <h3 className="text-sm font-semibold text-foreground">Bank & payouts</h3>
                      <p className="text-xs text-muted-foreground">Stored for reconciliation and payout handover.</p>
                    </div>
                    <div className="mt-4 grid gap-4 md:grid-cols-2">
                      <label className="space-y-2">
                        <span className="text-sm font-medium text-foreground">Account name</span>
                        <input
                          value={bankForm.accountName}
                          onChange={(event) =>
                            setBankForm((current) => ({ ...current, accountName: event.target.value }))
                          }
                          className="h-10 w-full rounded-md border border-border bg-background px-3 text-sm focus:outline-none focus:ring-2 focus:ring-primary"
                          placeholder="Demo Bar Ltd"
                        />
                      </label>
                      <label className="space-y-2">
                        <span className="text-sm font-medium text-foreground">Account number</span>
                        <input
                          value={bankForm.accountNumber}
                          onChange={(event) =>
                            setBankForm((current) => ({ ...current, accountNumber: event.target.value }))
                          }
                          className="h-10 w-full rounded-md border border-border bg-background px-3 text-sm focus:outline-none focus:ring-2 focus:ring-primary"
                          placeholder="00012345"
                        />
                      </label>
                      <label className="space-y-2">
                        <span className="text-sm font-medium text-foreground">Sort code</span>
                        <input
                          value={bankForm.sortCode}
                          onChange={(event) =>
                            setBankForm((current) => ({ ...current, sortCode: event.target.value }))
                          }
                          className="h-10 w-full rounded-md border border-border bg-background px-3 text-sm focus:outline-none focus:ring-2 focus:ring-primary"
                          placeholder="00-00-00"
                        />
                      </label>
                      <label className="space-y-2">
                        <span className="text-sm font-medium text-foreground">IBAN</span>
                        <input
                          value={bankForm.iban}
                          onChange={(event) =>
                            setBankForm((current) => ({ ...current, iban: event.target.value }))
                          }
                          className="h-10 w-full rounded-md border border-border bg-background px-3 text-sm focus:outline-none focus:ring-2 focus:ring-primary"
                          placeholder="GB00BARC00000000000000"
                        />
                      </label>
                      <label className="space-y-2 md:col-span-2">
                        <span className="text-sm font-medium text-foreground">Notes</span>
                        <textarea
                          value={bankForm.notes}
                          onChange={(event) =>
                            setBankForm((current) => ({ ...current, notes: event.target.value }))
                          }
                          rows={3}
                          className="w-full rounded-md border border-border bg-background px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-primary"
                          placeholder="Settlement via Stripe Connect standard account."
                        />
                      </label>
                    </div>
                  </div>

                  <div className="border-t border-border/60 pt-6">
                    <div className="flex items-baseline justify-between gap-3">
                      <h3 className="text-sm font-semibold text-foreground">Stripe & branding</h3>
                      <p className="text-xs text-muted-foreground">Links required for Stripe Connect and identity assets.</p>
                    </div>
                    <div className="mt-4 grid gap-4 md:grid-cols-2">
                      <label className="space-y-2">
                        <span className="text-sm font-medium text-foreground">Stripe Connect account ID</span>
                        <input
                          value={settings.stripeConnectId ?? ''}
                          onChange={(event) =>
                            setSettings((current) => ({
                              ...current,
                              stripeConnectId: event.target.value
                            }))
                          }
                          className="h-10 w-full rounded-md border border-border bg-background px-3 text-sm focus:outline-none focus:ring-2 focus:ring-primary"
                          placeholder="acct_123456789"
                        />
                      </label>
                      <label className="space-y-2">
                        <span className="text-sm font-medium text-foreground">Stripe Connect onboarding link</span>
                        <input
                          value={settings.stripeConnectLink ?? ''}
                          onChange={(event) =>
                            setSettings((current) => ({
                              ...current,
                              stripeConnectLink: event.target.value
                            }))
                          }
                          className="h-10 w-full rounded-md border border-border bg-background px-3 text-sm focus:outline-none focus:ring-2 focus:ring-primary"
                          placeholder="https://dashboard.stripe.com/..."
                        />
                      </label>
                    </div>
                  </div>

                  <div className="border-t border-border/60 pt-6">
                    <div className="flex items-baseline justify-between gap-3">
                      <h3 className="text-sm font-semibold text-foreground">Brand palette (70 / 20 / 10)</h3>
                      <p className="text-xs text-muted-foreground">Control dominant, secondary, and accent hues.</p>
                    </div>
                    <div className="mt-4 grid gap-4 md:grid-cols-3">
                      {(Object.keys(DEFAULT_PALETTE) as PaletteField[]).map((field) => (
                        <label key={field} className="space-y-2">
                          <span className="text-sm font-medium capitalize text-foreground">
                            {field === 'dominant'
                              ? 'Dominant (70%)'
                              : field === 'secondary'
                              ? 'Secondary (20%)'
                              : 'Accent (10%)'}
                          </span>
                          <input
                            type="color"
                            value={paletteState[field]}
                            onChange={(event) => handlePaletteChange(field, event.target.value)}
                            className="h-12 w-full cursor-pointer rounded-md border border-border bg-background"
                            aria-label={`${field} brand colour`}
                          />
                        </label>
                      ))}
                    </div>
                  </div>

                  {/* ── Brand Studio ──────────────────────────────── */}
                  <div className="space-y-6 rounded-2xl border border-border/60 bg-card/40 p-6">
                    <h3 className="text-base font-semibold">Brand Studio</h3>

                    {/* Preset selector */}
                    <div className="space-y-3">
                      <label className="text-sm font-medium text-foreground">Visual Preset</label>
                      <div className="grid grid-cols-2 gap-2 sm:grid-cols-3">
                        {Object.values(PRESETS).map((preset) => (
                          <button
                            key={preset.id}
                            type="button"
                            onClick={() => setSettings((s) => ({ ...s, preset: preset.id }))}
                            className={cn(
                              'flex flex-col gap-1 rounded-xl border p-3 text-left transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary',
                              settings.preset === preset.id
                                ? 'border-primary bg-primary/10 text-foreground'
                                : 'border-border/60 bg-background/60 text-muted-foreground hover:border-primary/40',
                            )}
                          >
                            <span className="text-sm font-semibold text-foreground">{preset.label}</span>
                            <span className="text-xs leading-snug">{preset.description}</span>
                          </button>
                        ))}
                      </div>
                    </div>

                    {/* Font family */}
                    <div className="space-y-2">
                      <label className="text-sm font-medium text-foreground" htmlFor="font-family-select">
                        Font Family
                      </label>
                      <select
                        id="font-family-select"
                        value={settings.fontFamily ?? 'inter'}
                        onChange={(e) => setSettings((s) => ({ ...s, fontFamily: e.target.value }))}
                        className="w-full rounded-xl border border-border/70 bg-background px-4 py-3 text-sm focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary"
                      >
                        {FONT_OPTIONS.map((font) => (
                          <option key={font.key} value={font.key}>
                            {font.label} — {font.description}
                          </option>
                        ))}
                      </select>
                    </div>

                    {/* Logo */}
                    <div className="space-y-3">
                      <label className="text-sm font-medium text-foreground">Logo</label>
                      <LogoUpload
                        currentUrl={settings.logoUrl}
                        barName={detail.name || 'Your Bar'}
                        onUploaded={(url) => setSettings((s) => ({ ...s, logoUrl: url }))}
                      />
                      <p className="text-xs text-muted-foreground">Or paste a URL directly:</p>
                      <input
                        id="logo-url-input"
                        type="url"
                        value={settings.logoUrl ?? ''}
                        onChange={(event) =>
                          setSettings((current) => ({
                            ...current,
                            logoUrl: event.target.value || null
                          }))
                        }
                        className="h-10 w-full rounded-xl border border-border/70 bg-background px-4 text-sm focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary"
                        placeholder="https://cdn.example.com/your-logo.png"
                      />
                    </div>

                    {/* Logo lockup mode */}
                    <div className="space-y-2">
                      <label className="text-sm font-medium text-foreground">Logo Display Mode</label>
                      <div className="flex gap-2">
                        {(['symbol-only', 'horizontal', 'stacked'] as const).map((mode) => (
                          <button
                            key={mode}
                            type="button"
                            onClick={() => setSettings((s) => ({ ...s, logoLockupMode: mode }))}
                            className={cn(
                              'rounded-lg border px-3 py-2 text-xs font-medium capitalize transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary',
                              settings.logoLockupMode === mode
                                ? 'border-primary bg-primary/10 text-foreground'
                                : 'border-border/60 bg-background/60 text-muted-foreground hover:border-primary/40',
                            )}
                          >
                            {mode.replace('-', ' ')}
                          </button>
                        ))}
                      </div>
                    </div>

                    {/* Logo preview */}
                    <div className="space-y-2">
                      <label className="text-sm font-medium text-foreground">Logo Preview</label>
                      <div className="flex items-center justify-center rounded-xl border border-border/40 bg-background/60 p-6">
                        <LogoLockup
                          logoUrl={settings.logoUrl}
                          barName={detail.name || 'Your Bar'}
                          mode={(settings.logoLockupMode as any) ?? 'symbol-only'}
                          treatment="glass-badge"
                          size="md"
                        />
                      </div>
                    </div>
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
                  color: settings.theme.foreground,
                  transition: 'all 0.4s ease',
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
          </motion.div>
        )}
        </AnimatePresence>
      </div>
    </div>
  );
}

function normalizeNullableString(value?: string | null): string | null {
  if (!value) {
    return null;
  }
  const trimmed = value.trim();
  return trimmed.length > 0 ? trimmed : null;
}

function toAddressState(record?: Record<string, string> | null): AddressFormState {
  return {
    line1: record?.line1 ?? '',
    line2: record?.line2 ?? '',
    city: record?.city ?? '',
    postcode: record?.postcode ?? '',
    country: record?.country ?? ''
  };
}

function buildAddressPayload(state: AddressFormState): Record<string, string> | null {
  const entries: Record<string, string> = {};
  if (state.line1.trim()) entries.line1 = state.line1.trim();
  if (state.line2.trim()) entries.line2 = state.line2.trim();
  if (state.city.trim()) entries.city = state.city.trim();
  if (state.postcode.trim()) entries.postcode = state.postcode.trim();
  if (state.country.trim()) entries.country = state.country.trim();
  return Object.keys(entries).length > 0 ? entries : null;
}

function toBankState(record?: Record<string, string> | null): BankFormState {
  return {
    accountName: record?.accountName ?? '',
    accountNumber: record?.accountNumber ?? '',
    sortCode: record?.sortCode ?? '',
    iban: record?.iban ?? '',
    notes: record?.notes ?? ''
  };
}

function buildBankPayload(state: BankFormState): Record<string, string> | null {
  const entries: Record<string, string> = {};
  if (state.accountName.trim()) entries.accountName = state.accountName.trim();
  if (state.accountNumber.trim()) entries.accountNumber = state.accountNumber.trim();
  if (state.sortCode.trim()) entries.sortCode = state.sortCode.trim();
  if (state.iban.trim()) entries.iban = state.iban.trim();
  if (state.notes.trim()) entries.notes = state.notes.trim();
  return Object.keys(entries).length > 0 ? entries : null;
}

function formatOpeningHours(record?: Record<string, string> | null): string {
  if (!record) {
    return '';
  }
  return Object.entries(record)
    .map(([day, hours]) => `${day}: ${hours}`)
    .join('\n');
}

function parseOpeningHoursInput(input: string): Record<string, string> | null {
  const lines = input
    .split(/\r?\n/)
    .map((line) => line.trim())
    .filter(Boolean);

  if (lines.length === 0) {
    return null;
  }

  const output: Record<string, string> = {};
  for (const line of lines) {
    const [day, ...rest] = line.split(':');
    const key = day?.trim();
    const value = rest.join(':').trim();
    if (key) {
      output[key] = value || '';
    }
  }

  return Object.keys(output).length > 0 ? output : null;
}

function parseStockInput(input: string): string[] {
  return input
    .split(/\r?\n/)
    .map((line) => line.trim())
    .filter((line) => line.length > 0);
}

function normalizePaletteState(record?: Record<string, string> | null): PaletteState {
  return {
    dominant: record?.dominant ?? DEFAULT_PALETTE.dominant,
    secondary: record?.secondary ?? DEFAULT_PALETTE.secondary,
    accent: record?.accent ?? DEFAULT_PALETTE.accent
  };
}

function buildPalettePayload(state: PaletteState): Record<string, string> {
  return {
    dominant: state.dominant,
    secondary: state.secondary,
    accent: state.accent
  };
}
