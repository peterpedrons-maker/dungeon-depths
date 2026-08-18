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

  // Full-page redirect to Discord's own OAuth screen — Supabase's
  // onAuthStateChange listener in App.tsx picks up the session automatically
  // once Discord redirects back, same as the email/password paths above.
  // Requires the Discord provider to be enabled (Client ID/Secret) in the
  // Supabase project's Authentication → Providers settings — see the
  // Configuração da Conta section in KIT-DE-ARTE.md.
  async function handleDiscordSignIn() {
    setError(null);
    setInfo(null);
    const { error: err } = await supabase.auth.signInWithOAuth({
      provider: 'discord',
      options: { redirectTo: window.location.origin + import.meta.env.BASE_URL },
    });
    if (err) setError(err.message);
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

        <div className="flex items-center gap-2 w-full my-1">
          <span className="flex-1 h-px bg-white/10" />
          <span className="text-[10px] text-parchment/30 uppercase tracking-wide">ou</span>
          <span className="flex-1 h-px bg-white/10" />
        </div>

        <button
          type="button"
          onClick={handleDiscordSignIn}
          className="w-full flex items-center justify-center gap-2 px-4 py-2.5 rounded font-bold text-sm text-white transition hover:brightness-110 active:brightness-95"
          style={{ background: '#5865F2' }}
        >
          <svg viewBox="0 0 24 24" className="w-4 h-4 shrink-0" fill="currentColor" aria-hidden>
            <path d="M20.317 4.492c-1.53-.69-3.17-1.2-4.885-1.49a.075.075 0 0 0-.079.036c-.21.369-.444.85-.608 1.23a18.566 18.566 0 0 0-5.487 0 12.36 12.36 0 0 0-.617-1.23A.077.077 0 0 0 8.562 3c-1.714.29-3.354.8-4.885 1.491a.07.07 0 0 0-.032.027C.533 9.093-.32 13.555.099 17.961a.08.08 0 0 0 .031.055 20.03 20.03 0 0 0 5.993 2.98.078.078 0 0 0 .084-.026 13.83 13.83 0 0 0 1.226-1.963.074.074 0 0 0-.041-.104 13.201 13.201 0 0 1-1.872-.878.075.075 0 0 1-.008-.125c.126-.093.252-.19.372-.287a.075.075 0 0 1 .078-.01c3.927 1.764 8.18 1.764 12.061 0a.075.075 0 0 1 .079.009c.12.098.246.195.373.288a.075.075 0 0 1-.006.125c-.598.344-1.22.635-1.873.877a.075.075 0 0 0-.041.106c.36.687.772 1.341 1.225 1.962a.077.077 0 0 0 .084.028 19.963 19.963 0 0 0 6.002-2.98.076.076 0 0 0 .032-.054c.5-5.094-.838-9.52-3.549-13.442a.06.06 0 0 0-.031-.028ZM8.02 15.278c-1.182 0-2.157-1.069-2.157-2.38 0-1.312.956-2.38 2.157-2.38 1.21 0 2.176 1.077 2.157 2.38 0 1.311-.956 2.38-2.157 2.38Zm7.975 0c-1.183 0-2.157-1.069-2.157-2.38 0-1.312.955-2.38 2.157-2.38 1.21 0 2.176 1.077 2.157 2.38 0 1.311-.947 2.38-2.157 2.38Z" />
          </svg>
          Entrar com Discord
        </button>
      </form>

      <p className="text-parchment/40 text-xs max-w-xs">
        Sua conta guarda o progresso do seu herói na nuvem e libera seu lugar no ranking global do reino.
      </p>
    </div>
  );
}
