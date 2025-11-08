import { Suspense } from "react";
import { redirect } from "next/navigation";
import { getServerSession } from "next-auth";
import { authOptions } from "@/auth";
import { apiFetch, getApiBaseUrl } from "@/app/lib/api";
import StaffOrdersClient, { type OrderSummary } from "./staff-orders-client";

async function fetchOrders(token: string, barIdentifier: string): Promise<OrderSummary[]> {
  const baseUrl = getApiBaseUrl();
  const res = await apiFetch(`${baseUrl}/v1/bars/${barIdentifier}/orders`, {
    cache: "no-store",
    headers: { Authorization: `Bearer ${token}` },
  });

  if (!res.ok) {
    if (res.status === 401 || res.status === 403) {
      throw new Error("Not authorised to view orders for this bar");
    }
    throw new Error("Unable to load orders");
  }

  const payload = (await res.json()) as {
    items: Array<{
      id: string;
      status: OrderSummary["status"];
      createdAt: string;
      fulfilledAt?: string | null;
    }>;
  };

  return payload.items.map((item) => ({
    ...item,
    fulfilledAt: item.fulfilledAt ?? null,
  }));
}

async function StaffOrdersTable({ token, barId }: { token: string; barId: string }) {
  try {
    const orders = await fetchOrders(token, barId);
    return <StaffOrdersClient initialOrders={orders} />;
  } catch (error) {
    const message = error instanceof Error ? error.message : "Unable to load orders.";
    return <StaffOrdersClient initialOrders={[]} initialError={message} />;
  }
}

export default async function StaffDashboardPage() {
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
        <StaffOrdersTable barId={barId} token={apiToken} />
      </Suspense>
    </div>
  );
}
