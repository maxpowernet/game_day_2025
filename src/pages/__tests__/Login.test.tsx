import React from 'react';
import { render, screen, fireEvent } from '@testing-library/react';
import { describe, it, expect } from 'vitest';
import { MemoryRouter } from 'react-router-dom';
import Login from '../Login';

describe('Login page', () => {
  it('toggles login password visibility when eye button is clicked', () => {
    render(
      <MemoryRouter>
        <Login />
      </MemoryRouter>
    );

    // find password input by placeholder
    const passwordInput = screen.getByPlaceholderText('Digite sua senha') as HTMLInputElement;
    expect(passwordInput).toBeTruthy();
    expect(passwordInput.type).toBe('password');

    // find the eye button (aria-label should be 'Mostrar senha')
    const eyeButton = screen.getByLabelText('Mostrar senha');
    fireEvent.click(eyeButton);

    // after click, input type should be text
    expect(passwordInput.type).toBe('text');

    // button now should have aria-label to hide
    const hideButton = screen.getByLabelText('Ocultar senha');
    fireEvent.click(hideButton);
    expect(passwordInput.type).toBe('password');
  });
});
