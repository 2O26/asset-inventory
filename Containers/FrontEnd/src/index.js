import React from 'react';
import { createRoot } from 'react-dom/client';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query'
import UserService from './components/Services/UserService';
import App from './App';

import './index.css'

const queryClient = new QueryClient()

const renderApp = () => createRoot(document.getElementById("root")).render(
  <QueryClientProvider client={queryClient}>
    <App />
  </QueryClientProvider>
);

UserService.initKeycloak(renderApp);