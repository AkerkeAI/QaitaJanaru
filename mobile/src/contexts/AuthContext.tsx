import React, { createContext, useContext, useEffect, useState } from 'react';
import { AuthUser, clearToken, deleteAccount, getCurrentUser, saveAuthResponse, signIn, signInWithGoogle, signUp } from '../services/api';

type AuthContextValue = { user: AuthUser | null; loading: boolean; error: string | null; signInWithEmail: (email: string, password: string) => Promise<void>; signUpWithEmail: (name: string, email: string, password: string, city: string) => Promise<void>; signInWithGoogleToken: (token: string) => Promise<void>; signOut: () => Promise<void>; removeAccount: () => Promise<void>; clearError: () => void };
const AuthContext = createContext<AuthContextValue | null>(null);

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const [user, setUser] = useState<AuthUser | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    void getCurrentUser().then(setUser).catch(() => clearToken()).finally(() => setLoading(false));
  }, []);

  const runAuth = async (action: () => Promise<{ access_token: string }>) => {
    setError(null); setLoading(true);
    try { const response = await action(); setUser(await saveAuthResponse(response)); } catch (authError) { setError(authError instanceof Error ? authError.message : 'REQUEST_FAILED'); throw authError; } finally { setLoading(false); }
  };
  const signOut = async () => { await clearToken(); setUser(null); setError(null); };
  const removeAccount = async () => { await deleteAccount(); await clearToken(); setUser(null); };

  return <AuthContext.Provider value={{ user, loading, error, signInWithEmail: (email, password) => runAuth(() => signIn(email, password)), signUpWithEmail: (name, email, password, city) => runAuth(() => signUp(name, email, password, city)), signInWithGoogleToken: (token) => runAuth(() => signInWithGoogle(token)), signOut, removeAccount, clearError: () => setError(null) }}>{children}</AuthContext.Provider>;
}

export function useAuth() { const context = useContext(AuthContext); if (!context) throw new Error('useAuth must be used inside AuthProvider'); return context; }
