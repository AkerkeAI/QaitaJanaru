import * as SecureStore from 'expo-secure-store';

const API_URL = (process.env.EXPO_PUBLIC_API_URL || '').replace(/\/$/, '');
const TOKEN_KEY = 'qaitajanaru_access_token';

export type AuthUser = { id: number; full_name: string; email: string; city: string | null; eco_points: number; level: number; streak: number; total_scans: number };
type AuthResponse = AuthUser & { user_id?: number; access_token: string; token_type: string };
export type ProfileResponse = AuthUser & { user_type: string; institution: string; level_progress_percent: number; analytics: { total_recycling_actions: number; total_eco_points_earned: number; materials: { key: string; quantity: number }[]; recent_activity: unknown[] } };

export async function getToken() { return SecureStore.getItemAsync(TOKEN_KEY); }
export async function storeToken(token: string) { await SecureStore.setItemAsync(TOKEN_KEY, token); }
export async function clearToken() { await SecureStore.deleteItemAsync(TOKEN_KEY); }

async function request<T>(path: string, init: RequestInit = {}, authenticated = false): Promise<T> {
  if (!API_URL) throw new Error('API_URL_NOT_CONFIGURED');
  const token = authenticated ? await getToken() : null;
  const response = await fetch(`${API_URL}${path}`, { ...init, headers: { 'Content-Type': 'application/json', ...(token ? { Authorization: `Bearer ${token}` } : {}), ...init.headers } });
  let body: unknown = null;
  try { body = await response.json(); } catch { /* Empty response */ }
  if (!response.ok) {
    const detail = typeof body === 'object' && body && 'detail' in body ? String(body.detail) : 'REQUEST_FAILED';
    const error = new Error(detail);
    (error as Error & { status?: number }).status = response.status;
    throw error;
  }
  return body as T;
}

export function signIn(email: string, password: string) { return request<AuthResponse>('/auth/login', { method: 'POST', body: JSON.stringify({ email, password }) }); }
export function signUp(fullName: string, email: string, password: string, city: string) { return request<AuthResponse>('/auth/register', { method: 'POST', body: JSON.stringify({ full_name: fullName, email, password, city }) }); }
export function signInWithGoogle(idToken: string) { return request<AuthResponse>('/auth/google', { method: 'POST', body: JSON.stringify({ id_token: idToken }) }); }
export function getCurrentUser() { return request<AuthUser>('/auth/me', {}, true); }
export function getProfile(userId: number) { return request<ProfileResponse>(`/profile/${userId}`, {}, true); }
export function deleteAccount() { return request<{ message: string }>('/auth/account', { method: 'DELETE' }, true); }
export function requestPasswordReset(email: string) { return request<{ message: string }>('/auth/forgot-password/request', { method: 'POST', body: JSON.stringify({ email }) }); }

export async function saveAuthResponse(response: { access_token: string }) { await storeToken(response.access_token); return getCurrentUser(); }
