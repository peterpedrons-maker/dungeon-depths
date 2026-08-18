import { FormEvent, useState } from 'react';
import { supabase } from '../lib/supabaseClient';
import { Button } from './Button';
import gameLogo from '../assets/reino-masmorras-logo.webp';

type Mode = 'signIn' | 'signUp';

// Gate shown before anything else in the app now — Supabase's own
// onAuthStateChange listener in App.tsx picks up the session the instant
// signIn/signUp succeeds, so this component only needs to kick that off
// and surface errors/loading state; it never has to manage the session
// itself.
export function AuthScreen() {
  const [mode, setMode] = useState<Mode>('signIn');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [info, setInfo] = useState<string | null>(null);

  async function handleSubmit(e: FormEvent) {
    e.preventDefault();
    if (loading) return;
    setError(null);
    setInfo(null);
    setLoading(true);
    try {
      if (mode === 'signUp') {
        const { data, error: err } = await supabase.auth.signUp({ email, password });
        if (err) { setError(err.message); return; }
        // A project with "Confirm email" enabled (Supabase's default) won't
        // hand back a session yet at this point — the account exists but
        // stays signed out until the confirmation link is clicked.
        if (!data.session) setInfo('Conta criada! Verifique seu e-mail para confirmar antes de entrar.');
      } else {
        const { error: err } = await supabase.auth.signInWithPassword({ email, password });
        if (err) { setError(err.message); return; }
      }
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="flex-1 flex flex-col items-center justify-center gap-6 px-4 py-10 bg-nightsky text-center">
      <img src={gameLogo} alt="Reino & Masmorras" className="w-56 sm:w-72 max-w-full" draggable={false} />

      <form onSubmit={handleSubmit} className="flex flex-col items-center gap-3 w-full max-w-xs">
        <div className="flex gap-1 mb-1 bg-black/30 rounded p-1 border border-white/10">
          <button
            type="button"
            onClick={() => { setMode('signIn'); setError(null); setInfo(null); }}
            className={`px-3 py-1 text-xs font-bold rounded uppercase tracking-wide ${mode === 'signIn' ? 'bg-gold text-ink' : 'text-parchment/50'}`}
          >
            Entrar
          </button>
          <button
            type="button"
            onClick={() => { setMode('signUp'); setError(null); setInfo(null); }}
            className={`px-3 py-1 text-xs font-bold rounded uppercase tracking-wide ${mode === 'signUp' ? 'bg-gold text-ink' : 'text-parchment/50'}`}
          >
            Criar Conta
          </button>
        </div>

        <input
          type="email"
          value={email}
          onChange={(e) => setEmail(e.target.value)}
          placeholder="E-mail"
          required
          autoComplete="email"
          className="w-full px-3 py-2 rounded bg-black/40 border border-white/20 text-center text-parchment placeholder:text-parchment/40 focus:outline-none focus:border-gold"
        />
        <input
          type="password"
          value={password}
          onChange={(e) => setPassword(e.target.value)}
          placeholder="Senha"
          required
          minLength={6}
          autoComplete={mode === 'signUp' ? 'new-password' : 'current-password'}
          className="w-full px-3 py-2 rounded bg-black/40 border border-white/20 text-center text-parchment placeholder:text-parchment/40 focus:outline-none focus:border-gold"
        />

        {error && <p className="text-xs text-red-400">{error}</p>}
        {info && <p className="text-xs text-emerald-400">{info}</p>}

        <Button type="submit" disabled={loading} className="mt-1 w-full">
          {loading ? 'Aguarde...' : mode === 'signUp' ? 'Criar Conta' : 'Entrar'}
        </Button>
      </form>

      <p className="text-parchment/40 text-xs max-w-xs">
        Sua conta guarda o progresso do seu herói na nuvem e libera seu lugar no ranking global do reino.
      </p>
    </div>
  );
}
