interface OrderRecipe {
  id: string;
  name: string;
  method: string;
  glassware: string;
  garnish: string;
  ingredients: Array<{ name: string; amount: string }>;
}

interface OrderDetailResponse {
  orderId: string;
  status: string;
  recipe: OrderRecipe;
}

interface OrderPageProps {
  params: { orderId: string };
}

async function fetchOrder(orderId: string): Promise<OrderDetailResponse | null> {
  const baseUrl = process.env.NEXT_PUBLIC_API_BASE_URL ?? 'http://localhost:4000';
  const res = await fetch(`${baseUrl}/v1/orders/${orderId}/recipe`, { cache: 'no-store' });
  if (!res.ok) {
    return null;
  }
  return (await res.json()) as OrderDetailResponse;
}

export default async function StaffOrderDetailPage({ params }: OrderPageProps) {
  const { orderId } = params;
  const order = await fetchOrder(orderId);

  if (!order) {
    return <p className="px-6 py-16 text-sm text-muted-foreground">Order not found.</p>;
  }

  return (
    <div className="mx-auto flex w-full max-w-4xl flex-col gap-8 px-6 py-16">
      <header className="space-y-1">
        <p className="text-xs uppercase tracking-wide text-muted-foreground">Order</p>
        <h1 className="text-3xl font-semibold">{order.recipe.name}</h1>
        <p className="text-sm text-muted-foreground">Status: {order.status}</p>
      </header>
      <section className="space-y-4 rounded-2xl border bg-card p-6 shadow-sm">
        <h2 className="text-xl font-semibold">Ingredients</h2>
        <ul className="space-y-2 text-sm">
          {order.recipe.ingredients.map((ingredient) => (
            <li className="flex items-center justify-between" key={ingredient.name}>
              <span>{ingredient.name}</span>
              <span className="font-mono text-xs text-muted-foreground">{ingredient.amount}</span>
            </li>
          ))}
        </ul>
        <div className="space-y-2 text-sm text-muted-foreground">
          <p>
            <strong>Method:</strong> {order.recipe.method}
          </p>
          <p>
            <strong>Glassware:</strong> {order.recipe.glassware}
          </p>
          <p>
            <strong>Garnish:</strong> {order.recipe.garnish}
          </p>
        </div>
      </section>
    </div>
  );
}
