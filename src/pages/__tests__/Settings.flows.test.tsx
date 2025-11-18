import React from 'react';
import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';

// Mock storageApi
const mockUpdateAdmin = vi.fn();
const mockDeleteAdmin = vi.fn();
vi.mock('@/lib/storageApi', () => ({
  fetchAdmins: async () => [{ id: 1, name: 'Admin One', email: 'a@x.com', invited: false, createdAt: new Date().toISOString() }],
  fetchMessages: async () => [],
  updateAdmin: (a: any) => mockUpdateAdmin(a),
  deleteAdmin: (id: number) => mockDeleteAdmin(id),
  addAdmin: async (a: any) => ({ id: 2, ...a, createdAt: new Date().toISOString() }),
}));

// Mock sonner toast to silence toasts in tests
vi.mock('@/components/ui/sonner', () => ({ toast: vi.fn(), Toaster: () => null }));

import Settings from '@/pages/Settings';

const queryClient = new QueryClient();

describe('Settings flows', () => {
  beforeEach(() => {
    queryClient.clear();
    mockUpdateAdmin.mockReset();
    mockDeleteAdmin.mockReset();
  });

  it('edits an admin via modal', async () => {
    render(
      <QueryClientProvider client={queryClient}>
        <Settings />
      </QueryClientProvider>
    );

    // wait for table row to appear
    await waitFor(() => expect(screen.getByText('Admin One')).toBeTruthy());

    const editBtn = screen.getAllByTitle('Alterar nome')[0];
    fireEvent.click(editBtn);

    // modal should open - input labelled 'Nome' should appear
    const nameInput = await screen.findByLabelText('Nome');
    fireEvent.change(nameInput, { target: { value: 'Admin Updated' } });

    const saveBtn = screen.getByText('Salvar');
    fireEvent.click(saveBtn);

    await waitFor(() => {
      expect(mockUpdateAdmin).toHaveBeenCalled();
      const calledWith = mockUpdateAdmin.mock.calls[0][0];
      expect(calledWith.name).toBe('Admin Updated');
    });
  });

  it('confirms and deletes an admin', async () => {
    render(
      <QueryClientProvider client={queryClient}>
        <Settings />
      </QueryClientProvider>
    );

    await waitFor(() => expect(screen.getByText('Admin One')).toBeTruthy());

    const deleteBtn = screen.getAllByTitle('Excluir administrador')[0];
    fireEvent.click(deleteBtn);

    // Confirmation dialog should appear
    const confirmTitle = await screen.findByText('Remover administrador?');
    expect(confirmTitle).toBeTruthy();

    const confirmBtn = screen.getByText('Confirmar');
    fireEvent.click(confirmBtn);

    await waitFor(() => {
      expect(mockDeleteAdmin).toHaveBeenCalledWith(1);
    });
  });
});
