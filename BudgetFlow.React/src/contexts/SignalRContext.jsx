import React, { createContext, useContext, useEffect, useRef, useState } from 'react';
import * as signalR from '@microsoft/signalr';
import { useAuth } from './AuthContext';

const SignalRContext = createContext(null);

export function SignalRProvider({ children }) {
  const { user } = useAuth();
  const connectionRef = useRef(null);
  const [connected, setConnected] = useState(false);
  const listenersRef = useRef({});

  useEffect(() => {
    if (!user) return;

    const connection = new signalR.HubConnectionBuilder()
      .withUrl('http://localhost:8085/hubs/sync', {
        accessTokenFactory: () => localStorage.getItem('accessToken') || ''
      })
      .withAutomaticReconnect()
      .build();

    connection.onreconnected(() => setConnected(true));
    connection.onclose(() => setConnected(false));

    const events = ['ExpenseCreated', 'ExpenseUpdated', 'ExpenseDeleted',
                    'IncomeCreated', 'IncomeUpdated', 'IncomeDeleted',
                    'BudgetCreated', 'BudgetUpdated', 'BudgetDeleted', 'BudgetAlert'];

    events.forEach(event => {
      connection.on(event, (data) => {
        const handlers = listenersRef.current[event] || [];
        handlers.forEach(h => h(data));
      });
    });

    connection.start()
      .then(() => setConnected(true))
      .catch(err => console.error('SignalR connection failed:', err));

    connectionRef.current = connection;
    return () => { connection.stop(); };
  }, [user]);

  const on = (event, handler) => {
    if (!listenersRef.current[event]) listenersRef.current[event] = [];
    listenersRef.current[event].push(handler);
    return () => {
      listenersRef.current[event] = (listenersRef.current[event] || []).filter(h => h !== handler);
    };
  };

  return (
    <SignalRContext.Provider value={{ connected, on }}>
      {children}
    </SignalRContext.Provider>
  );
}

export const useSignalR = () => useContext(SignalRContext);
