'use client';

import { useEffect, useRef, useState } from 'react';

interface OrderStreamPayload {
  id: string;
  barId: string;
  recipeName: string;
  status: string;
  createdAt: string;
}

interface UseOrderStreamOptions {
  barId: string;
  token: string | undefined;
  onNewOrder: (order: OrderStreamPayload) => void;
}

export function useOrderStream({ barId, token, onNewOrder }: UseOrderStreamOptions) {
  const [connected, setConnected] = useState(false);
  const onNewOrderRef = useRef(onNewOrder);
  onNewOrderRef.current = onNewOrder;

  useEffect(() => {
    if (!token || !barId) return;

    const apiBaseUrl =
      process.env.NEXT_PUBLIC_API_BASE_URL ?? 'http://localhost:4000';
    const url = `${apiBaseUrl}/v1/bars/${barId}/orders/stream?token=${encodeURIComponent(token)}`;

    const es = new EventSource(url);

    es.onopen = () => {
      setConnected(true);
    };

    es.onmessage = (event) => {
      if (!event.data) return;
      try {
        const payload = JSON.parse(event.data) as OrderStreamPayload;
        onNewOrderRef.current(payload);
      } catch {
        // Ignore unparseable messages (e.g. heartbeat pings)
      }
    };

    es.onerror = () => {
      setConnected(false);
      // EventSource auto-reconnects per spec
    };

    return () => {
      es.close();
      setConnected(false);
    };
  }, [barId, token]);

  return { connected };
}
