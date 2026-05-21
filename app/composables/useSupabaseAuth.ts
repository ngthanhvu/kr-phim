import type { User } from '@supabase/supabase-js'

let authListenerStarted = false

export function useSupabaseAuth() {
  const { $supabase } = useNuxtApp()
  const user = useState<User | null>('supabase-user', () => null)
  const loading = useState('supabase-auth-loading', () => false)

  async function initAuth() {
    if (!import.meta.client || authListenerStarted) return

    authListenerStarted = true
    loading.value = true

    const { data } = await $supabase.auth.getSession()
    user.value = data.session?.user ?? null
    loading.value = false

    $supabase.auth.onAuthStateChange((_event, session) => {
      user.value = session?.user ?? null
    })
  }

  function authRedirectUrl() {
    const redirectTo = import.meta.client ? window.location.origin : undefined
    return redirectTo
  }

  async function signInWithEmail(email: string) {
    return $supabase.auth.signInWithOtp({
      email,
      options: {
        emailRedirectTo: authRedirectUrl(),
      },
    })
  }

  async function signInWithPassword(email: string, password: string) {
    return $supabase.auth.signInWithPassword({
      email,
      password,
    })
  }

  async function signUpWithPassword(email: string, password: string) {
    return $supabase.auth.signUp({
      email,
      password,
      options: {
        emailRedirectTo: authRedirectUrl(),
      },
    })
  }

  async function signInWithGoogle() {
    return $supabase.auth.signInWithOAuth({
      provider: 'google',
      options: {
        redirectTo: authRedirectUrl(),
      },
    })
  }

  async function resetPassword(email: string) {
    return $supabase.auth.resetPasswordForEmail(email, {
      redirectTo: authRedirectUrl(),
    })
  }

  async function signOut() {
    return $supabase.auth.signOut()
  }

  return {
    user,
    loading,
    initAuth,
    signInWithEmail,
    signInWithPassword,
    signUpWithPassword,
    signInWithGoogle,
    resetPassword,
    signOut,
  }
}
