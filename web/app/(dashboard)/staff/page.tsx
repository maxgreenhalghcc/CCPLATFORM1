<<<<<<< HEAD
import { Suspense } from "react";
import { redirect } from "next/navigation";
import { getServerSession } from "next-auth";
import { authOptions } from "@/auth";
import { apiFetch, getApiBaseUrl } from "@/app/lib/api";
import StaffOrdersClient, { type OrderSummary } from "./staff-orders-client";
=======
import { Suspense } from 'react';
import { redirect } from 'next/navigation';
import { auth } from '@/auth';
import { apiFetch, getApiBaseUrl } from '@/app/lib/api';
import StaffOrdersClient, { type OrderSummary } from './staff-orders-client';
>>>>>>> pr-22

async function fetchOrders(token: string, barIdentifier: string): Promise<OrderSummary[]> {
  const baseUrl = getApiBaseUrl();
  const res = await apiFetch(`${baseUrl}/v1/bars/${barIdentifier}/orders`, {
<<<<<<< HEAD
    cache: "no-store",
    headers: { Authorization: `Bearer ${token}` },
=======
    cache: 'no-store',
    headers: {
      Authorization: `Bearer ${token}`
    }
>>>>>>> pr-22
  });

  if (!res.ok) {
    if (res.status === 401 || res.status === 403) {
<<<<<<< HEAD
      throw new Error("Not authorised to view orders for this bar");
    }
    throw new Error("Unable to load orders");
=======
      throw new Error('Not authorised to view orders for this bar');
    }
    throw new Error('Unable to load orders');
>>>>>>> pr-22
  }

  const payload = (await res.json()) as {
    items: Array<{
      id: string;
<<<<<<< HEAD
      status: OrderSummary["status"];
=======
      status: OrderSummary['status'];
>>>>>>> pr-22
      createdAt: string;
      fulfilledAt?: string | null;
    }>;
  };

  return payload.items.map((item) => ({
    ...item,
<<<<<<< HEAD
    fulfilledAt: item.fulfilledAt ?? null,
=======
    fulfilledAt: item.fulfilledAt ?? null
>>>>>>> pr-22
  }));
}

async function StaffOrdersTable({ token, barId }: { token: string; barId: string }) {
  try {
    const orders = await fetchOrders(token, barId);
    return <StaffOrdersClient initialOrders={orders} />;
  } catch (error) {
<<<<<<< HEAD
    const message = error instanceof Error ? error.message : "Unable to load orders.";
=======
    const message = error instanceof Error ? error.message : 'Unable to load orders.';
>>>>>>> pr-22
    return <StaffOrdersClient initialOrders={[]} initialError={message} />;
  }
}

export default async function StaffDashboardPage() {
<<<<<<< HEAD
  const session = await getServerSession(authOptions);

  // Guard: must be signed in and must be staff
  if (!session || (session as any)?.user?.role !== "staff") {
    redirect(`/login?callbackUrl=${encodeURIComponent("/staff")}`);
  }

  const apiToken: string | undefined = (session as any)?.apiToken;
  if (!apiToken) {
    throw new Error("Missing API token for staff session");
  }

  const barId: string = ((session as any)?.user?.barId as string) ?? "demo-bar";
=======
  const session = await auth();

  if (!session || session.user.role !== 'staff') {
    redirect(`/login?callbackUrl=${encodeURIComponent('/staff')}`);
  }

  if (!session.apiToken) {
    throw new Error('Missing API token for staff session');
  }

  const barId = session.user.barId ?? 'demo-bar';
>>>>>>> pr-22

  return (
    <div className="mx-auto flex min-h-screen w-full max-w-6xl flex-col gap-8 px-6 py-16">
      <header className="flex flex-col gap-2">
        <h1 className="text-3xl font-semibold">Staff orders</h1>
        <p className="text-muted-foreground">
          Monitor live orders and access generated recipes once payments clear.
        </p>
      </header>
      <Suspense fallback={<p>Loading orders…</p>}>
        {/* @ts-expect-error Async Server Component */}
<<<<<<< HEAD
        <StaffOrdersTable barId={barId} token={apiToken} />
=======
        <StaffOrdersTable barId={barId} token={session.apiToken} />
>>>>>>> pr-22
      </Suspense>
    </div>
  );
}
