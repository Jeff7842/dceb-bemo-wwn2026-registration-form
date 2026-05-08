'use client';
import { useState, useEffect, useCallback } from 'react';
import { useForm, Controller } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { toast } from 'sonner';
import Header from '@/components/Header';
import ChurchDropdown from '@/components/ChurchDropdown';
import PhoneInput from '@/components/PhoneInput';
import SearchableDropdown from '@/components/SearchableDropdown';
import { SERVING_AREAS, EAST_AFRICAN_COUNTRIES } from '@/lib/churches';
import { Icon } from '@iconify/react';

const schema = z
  .object({
    firstName: z.string().min(2, 'First name must be at least 2 characters'),
    lastName: z.string().min(2, 'Last name must be at least 2 characters'),
    phone: z.object({
      countryCode: z.string(),
      number: z.string().min(6, 'Phone number must be at least 6 digits'),
    }),
    email: z.string().email('Invalid email').or(z.literal('')).optional(),
    country: z.string().min(1, 'Please select a country'),
    region: z.string().optional(),
    church: z.string().min(1, 'Please select your church'),
    role: z.enum(['member', 'pastor', 'staff'], { error: 'Please select a role' }),
    servingArea: z.string().optional(),
  })
  .superRefine((data, ctx) => {
    if (data.role === 'staff' && !data.servingArea) {
      ctx.addIssue({ code: 'custom', message: 'Please select your serving area', path: ['servingArea'] });
    }
  });

type FormData = z.infer<typeof schema>;

const OFFLINE_QUEUE_KEY = 'wwn_offline_queue';

async function fetchChurches(): Promise<string[]> {
  const res = await fetch('/api/churches');
  const data = await res.json();
  return data.churches ?? [];
}

function Field({ label, error, children }: { label: string; error?: string; children: React.ReactNode }) {
  return (
    <div className="flex flex-col gap-1">
      <label className="field-label">{label}</label>
      {children}
      {error && <p className="text-xs mt-0.5" style={{ color: 'var(--danger)' }}>{error}</p>}
    </div>
  );
}

export default function RegisterPage() {
  const queryClient = useQueryClient();
  const [extraChurch, setExtraChurch] = useState<string | null>(null);
  const [offlineCount, setOfflineCount] = useState(0);

  const { data: churches = [] } = useQuery({
    queryKey: ['churches'],
    queryFn: fetchChurches,
  });

  const allChurches = extraChurch
    ? [...churches.filter((c) => c !== 'Other'), extraChurch, 'Other']
    : churches;

  const {
    register,
    control,
    handleSubmit,
    reset,
    watch,
    formState: { errors },
  } = useForm<FormData>({
    resolver: zodResolver(schema),
    defaultValues: {
      phone: { countryCode: '+254', number: '' },
      country: 'Kenya',
      role: undefined,
    },
  });

  const role = watch('role');

  const drainQueue = useCallback(async () => {
    const raw = localStorage.getItem(OFFLINE_QUEUE_KEY);
    if (!raw) return;
    const queue: object[] = JSON.parse(raw);
    if (!queue.length) return;
    const remaining: object[] = [];
    for (const item of queue) {
      try {
        await fetch('/api/register', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify(item),
        });
      } catch {
        remaining.push(item);
      }
    }
    if (remaining.length === 0) {
      localStorage.removeItem(OFFLINE_QUEUE_KEY);
      toast.success(`${queue.length} offline submission${queue.length > 1 ? 's' : ''} synced!`);
    } else {
      localStorage.setItem(OFFLINE_QUEUE_KEY, JSON.stringify(remaining));
    }
    setOfflineCount(remaining.length);
    queryClient.invalidateQueries({ queryKey: ['members'] });
  }, [queryClient]);

  useEffect(() => {
    const raw = localStorage.getItem(OFFLINE_QUEUE_KEY);
    if (raw) setOfflineCount(JSON.parse(raw).length);
    window.addEventListener('online', drainQueue);
    if (navigator.onLine) drainQueue();
    return () => window.removeEventListener('online', drainQueue);
  }, [drainQueue]);

  const mutation = useMutation({
    mutationFn: async (payload: object) => {
      const res = await fetch('/api/register', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload),
      });
      const data = await res.json();
      if (!res.ok) throw { ...data, status: res.status };
      return data;
    },
  });

  async function onSubmit(data: FormData) {
    const payload = {
      firstName: data.firstName,
      lastName: data.lastName,
      phoneCountryCode: data.phone.countryCode,
      phoneNumber: data.phone.number,
      email: data.email || null,
      country: data.country,
      region: data.region || null,
      churchName: data.church,
      role: data.role,
      servingArea: data.servingArea || null,
    };

    if (!navigator.onLine) {
      const raw = localStorage.getItem(OFFLINE_QUEUE_KEY);
      const queue = raw ? JSON.parse(raw) : [];
      queue.push(payload);
      localStorage.setItem(OFFLINE_QUEUE_KEY, JSON.stringify(queue));
      setOfflineCount(queue.length);
      toast.warning("You're offline — registration queued and will sync automatically.");
      reset();
      return;
    }

    try {
      const result = await mutation.mutateAsync(payload);
      if (result.duplicate) {
        toast.info("The Member is already registered — welcome back! 🙏");
      } else {
        toast.success("The Member has been successfully registered 🎉!");
      }
      reset();
      queryClient.invalidateQueries({ queryKey: ['churches'] });
    } catch {
      toast.error('Registration failed. Please try again.');
    }
  }

  return (
    <div
      className="min-h-screen flex flex-col"
      style={{
        background: 'var(--gradient-hero)',
        paddingTop: '3.5rem',
      }}
    >
      <Header />

      <div className="flex-1 flex items-center justify-center px-4 py-10">
        <div className="w-full max-w-lg">

          {/* Card */}
          <div className="rounded-2xl px-5 sm:px-8 pt-8 sm:pt-10 pb-8 sm:pb-10" style={{ background: 'var(--surface)', border: '1px solid var(--border)', boxShadow: 'var(--shadow-card)' }}>

            {/* Title */}
            <div className="text-center mb-8">
              <h1
                className="font-display text-4xl font-bold mb-2 leading-tight"
                style={{ color: 'var(--text-primary)' }}
              >
                Join the Gathering
              </h1>
              <p className="text-sm" style={{ color: 'var(--text-muted)' }}>
                Worship &amp; Warfare Night Registration
              </p>
              {offlineCount > 0 && (
                <div className="mt-3 inline-flex items-center gap-2 px-3 py-1.5 rounded-lg text-xs font-medium"
                  style={{ background: 'rgba(245,158,11,0.1)', color: '#d97706', border: '1px solid rgba(245,158,11,0.2)' }}>
                  <Icon icon="lucide:wifi-off" className="w-3.5 h-3.5" />
                  {offlineCount} queued — will sync when online
                </div>
              )}
            </div>

            <form onSubmit={handleSubmit(onSubmit)} className="flex flex-col gap-5">

              {/* Row 1: First Name / Last Name */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <Field label="First Name" error={errors.firstName?.message}>
                  <input
                    {...register('firstName')}
                    placeholder="Enter your first name"
                    className={`input-base${errors.firstName ? ' input-error' : ''}`}
                  />
                </Field>
                <Field label="Last Name" error={errors.lastName?.message}>
                  <input
                    {...register('lastName')}
                    placeholder="Enter your last name"
                    className={`input-base${errors.lastName ? ' input-error' : ''}`}
                  />
                </Field>
              </div>

              {/* Row 2: Phone / Email */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <Field label="Phone Number" error={errors.phone?.number?.message}>
                  <Controller
                    name="phone"
                    control={control}
                    render={({ field }) => (
                      <PhoneInput
                        value={field.value}
                        onChange={field.onChange}
                        error={errors.phone?.number?.message}
                      />
                    )}
                  />
                </Field>
                <Field label="Email Address" error={errors.email?.message}>
                  <input
                    {...register('email')}
                    type="email"
                    placeholder="Enter your email address"
                    className={`input-base${errors.email ? ' input-error' : ''}`}
                  />
                </Field>
              </div>

              {/* Row 3: Country / Region */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <Field label="Country" error={errors.country?.message}>
                  <Controller
                    name="country"
                    control={control}
                    render={({ field }) => (
                      <SearchableDropdown
                        options={EAST_AFRICAN_COUNTRIES}
                        value={field.value ?? ''}
                        onChange={field.onChange}
                        placeholder="Select country"
                        error={errors.country?.message}
                      />
                    )}
                  />
                </Field>
                <Field label="Region/County" error={errors.region?.message}>
                  <input
                    {...register('region')}
                    placeholder="e.g Nairobi,Kasarani"
                    className="input-base"
                  />
                </Field>
              </div>

              {/* Church — full width */}
              <Field label="Church" error={errors.church?.message}>
                <Controller
                  name="church"
                  control={control}
                  render={({ field }) => (
                    <ChurchDropdown
                      value={field.value ?? ''}
                      onChange={field.onChange}
                      churches={allChurches}
                      onNewChurch={(name) => setExtraChurch(name)}
                      error={errors.church?.message}
                    />
                  )}
                />
              </Field>

              {/* Your Role — segmented */}
              <Field label="Your Role" error={errors.role?.message}>
                <Controller
                  name="role"
                  control={control}
                  render={({ field }) => (
                    <div className="flex">
                      {[
                        { value: 'member', label: 'Member' },
                        { value: 'pastor', label: 'Pastor' },
                        { value: 'staff',  label: 'Staff'  },
                      ].map((opt) => (
                        <button
                          key={opt.value}
                          type="button"
                          onClick={() => field.onChange(opt.value)}
                          className={`seg-btn${field.value === opt.value ? ' seg-active' : ''}`}
                        >
                          {opt.label}
                        </button>
                      ))}
                    </div>
                  )}
                />
              </Field>

              {/* Serving Area — animated, staff only */}
              <div
                className="transition-all duration-300"
                style={{
                  maxHeight: role === 'staff' ? '200px' : '0px',
                  overflow: role === 'staff' ? 'visible' : 'hidden',
                  opacity: role === 'staff' ? 1 : 0,
                }}
              >
                <Field label="Serving Area" error={errors.servingArea?.message}>
                  <Controller
                    name="servingArea"
                    control={control}
                    render={({ field }) => (
                      <SearchableDropdown
                        options={SERVING_AREAS}
                        value={field.value ?? ''}
                        onChange={field.onChange}
                        placeholder="Select your serving area"
                        allowOther
                        error={errors.servingArea?.message}
                      />
                    )}
                  />
                </Field>
              </div>

              {/* Submit */}
              <button
                type="submit"
                disabled={mutation.isPending}
                className="btn-primary mt-1"
                style={{ background: 'var(--primary-btn)', color: 'var(--primary-btn-text)', borderRadius: '8px' }}
              >
                {mutation.isPending ? (
                  <>
                    <Icon icon="lucide:loader-2" className="w-4 h-4 animate-spin" />
                    Registering…
                  </>
                ) : (
                  <>
                    <Icon icon="lucide:user-check" className="w-4 h-4" />
                    Register for Gathering
                  </>
                )}
              </button>
            </form>
          </div>
        </div>
      </div>
    </div>
  );
}
