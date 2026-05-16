"use client";

import { useState, useEffect, useRef, useCallback } from "react";

const RECONNECT_DELAY = 3000;
const MAX_RECONNECTS = 5;

export function useSessionEvents(sessionId: string) {
  const [connected, setConnected] = useState(false);
  const [events, setEvents] = useState<any[]>([]);
  const esRef = useRef<EventSource | null>(null);
  const reconnectCountRef = useRef(0);
  const reconnectTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  const connect = useCallback(() => {
    if (!sessionId || esRef.current) return;

    const es = new EventSource(`/api/sessions/${sessionId}/events`);
    esRef.current = es;

    es.onopen = () => {
      setConnected(true);
      reconnectCountRef.current = 0;
    };

    es.onmessage = (e) => {
      try {
        const data = JSON.parse(e.data);
        setEvents((prev) => [...prev, data]);
      } catch {
        setEvents((prev) => [...prev, { raw: e.data }]);
      }
    };

    es.onerror = () => {
      setConnected(false);
      es.close();
      esRef.current = null;

      if (reconnectCountRef.current < MAX_RECONNECTS) {
        reconnectCountRef.current++;
        reconnectTimerRef.current = setTimeout(() => {
          esRef.current = null;
          connect();
        }, RECONNECT_DELAY * reconnectCountRef.current);
      }
    };
  }, [sessionId]);

  const disconnect = useCallback(() => {
    if (reconnectTimerRef.current) {
      clearTimeout(reconnectTimerRef.current);
      reconnectTimerRef.current = null;
    }
    esRef.current?.close();
    esRef.current = null;
    setConnected(false);
  }, []);

  useEffect(() => {
    connect();
    return disconnect;
  }, [connect, disconnect]);

  return { connected, events, connect, disconnect };
}
