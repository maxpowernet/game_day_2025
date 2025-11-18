import React from 'react';
import { describe, it, expect, vi } from 'vitest';
import { render, screen } from '@testing-library/react';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';

// Mock storageApi to return predictable data
vi.mock('@/lib/storageApi', () => ({
  fetchAdmins: async () => [],
  fetchMessages: async () => [],
}));

import Settings from '@/pages/Settings';

const queryClient = new QueryClient();

describe('Settings page', () => {
  it('renders heading', () => {
    render(
      <QueryClientProvider client={queryClient}>
        <Settings />
      </QueryClientProvider>
    );

    expect(screen.getByText('Configurações')).toBeDefined();
  });
});
