/**
 * @jest-environment jsdom
 */
import React from 'react';
import { render, act } from '@testing-library/react';
import { OneTap, disableGoogleAutoSelect } from '@/components/auth/one-tap';
import { useSession, signIn } from 'next-auth/react';
import { useRouter } from 'next/navigation';

jest.mock('next-auth/react', () => ({
  useSession: jest.fn(),
  signIn: jest.fn(),
}));

jest.mock('next/navigation', () => ({
  useRouter: jest.fn(),
}));

const mockUseSession = useSession as jest.MockedFunction<typeof useSession>;
const mockSignIn = signIn as jest.MockedFunction<typeof signIn>;
const mockUseRouter = useRouter as jest.MockedFunction<typeof useRouter>;
const mockRefresh = jest.fn();

const GSI_SRC = 'https://accounts.google.com/gsi/client';

type IdApi = {
  initialize: jest.Mock;
  prompt: jest.Mock;
  disableAutoSelect: jest.Mock;
};

function setGoogleIdApi(): IdApi {
  const api: IdApi = {
    initialize: jest.fn(),
    prompt: jest.fn(),
    disableAutoSelect: jest.fn(),
  };
  (window as unknown as { google: unknown }).google = { accounts: { id: api } };
  return api;
}

function loadGsiScript() {
  const script = document.querySelector<HTMLScriptElement>(`script[src="${GSI_SRC}"]`);
  expect(script).not.toBeNull();
  act(() => {
    script!.dispatchEvent(new Event('load'));
  });
}

describe('OneTap Component', () => {
  beforeEach(() => {
    jest.clearAllMocks();
    document.head.querySelectorAll('script').forEach((s) => s.remove());
    delete (window as unknown as { google?: unknown }).google;
    mockUseSession.mockReturnValue({ data: null, status: 'unauthenticated', update: jest.fn() });
    mockUseRouter.mockReturnValue({ refresh: mockRefresh, push: jest.fn(), replace: jest.fn(), back: jest.fn(), forward: jest.fn(), prefetch: jest.fn() } as unknown as ReturnType<typeof useRouter>);
  });

  test('renders nothing', () => {
    const { container } = render(<OneTap clientId="test-client-id" />);
    expect(container.innerHTML).toBe('');
  });

  test('does not load the GSI script without a client ID', () => {
    render(<OneTap />);
    expect(document.querySelector(`script[src="${GSI_SRC}"]`)).toBeNull();
  });

  test('loads GSI, initializes with auto_select, and prompts when signed out', () => {
    render(<OneTap clientId="test-client-id" />);
    expect(document.querySelector(`script[src="${GSI_SRC}"]`)).not.toBeNull();

    const api = setGoogleIdApi();
    loadGsiScript();

    expect(api.initialize).toHaveBeenCalledWith(
      expect.objectContaining({ client_id: 'test-client-id', auto_select: true })
    );
    expect(api.prompt).toHaveBeenCalled();
  });

  test('initializes but does not prompt while signed in (so sign-out can disable auto-select)', () => {
    mockUseSession.mockReturnValue({ data: {}, status: 'authenticated', update: jest.fn() } as unknown as ReturnType<typeof useSession>);

    render(<OneTap clientId="test-client-id" />);
    const api = setGoogleIdApi();
    loadGsiScript();

    expect(api.initialize).toHaveBeenCalled();
    expect(api.prompt).not.toHaveBeenCalled();
  });

  test('credential callback signs in via the google-one-tap provider and refreshes', async () => {
    mockSignIn.mockResolvedValue({ ok: true, error: null } as unknown as Awaited<ReturnType<typeof signIn>>);

    render(<OneTap clientId="test-client-id" />);
    const api = setGoogleIdApi();
    loadGsiScript();

    const config = api.initialize.mock.calls[0][0] as { callback: (r: { credential: string }) => Promise<void> };
    await act(async () => {
      await config.callback({ credential: 'fake-jwt' });
    });

    expect(mockSignIn).toHaveBeenCalledWith('google-one-tap', {
      credential: 'fake-jwt',
      redirect: false,
    });
    expect(mockRefresh).toHaveBeenCalled();
  });

  test('credential callback survives a sign-in failure', async () => {
    const consoleSpy = jest.spyOn(console, 'error').mockImplementation();
    mockSignIn.mockRejectedValue(new Error('network'));

    render(<OneTap clientId="test-client-id" />);
    const api = setGoogleIdApi();
    loadGsiScript();

    const config = api.initialize.mock.calls[0][0] as { callback: (r: { credential: string }) => Promise<void> };
    await act(async () => {
      await config.callback({ credential: 'fake-jwt' });
    });

    expect(consoleSpy).toHaveBeenCalledWith('One Tap sign-in failed:', expect.any(Error));
    consoleSpy.mockRestore();
  });
});

describe('disableGoogleAutoSelect', () => {
  test('calls the GSI disableAutoSelect API when available', () => {
    const api = setGoogleIdApi();
    disableGoogleAutoSelect();
    expect(api.disableAutoSelect).toHaveBeenCalled();
  });

  test('is a no-op when GSI is not loaded', () => {
    expect(() => disableGoogleAutoSelect()).not.toThrow();
  });
});
