import { User } from '@supabase/supabase-js';
import { Button } from './Button';
import gameLogo from '../assets/reino-masmorras-logo.webp';

function accountLabel(user: User): string {
  return user.email
    ?? (user.user_metadata?.full_name as string | undefined)
    ?? (user.user_metadata?.name as string | undefined)
    ?? (user.user_metadata?.user_name as string | undefined)
    ?? 'sua conta';
}

// Shown once per fresh browser load whenever Supabase hands back a session
// it already had in storage (see App.tsx's INITIAL_SESSION handling) —
// distinct from a session that was just created by an explicit sign-in this
// visit, which skips straight past this screen instead. Lets the player
// confirm it's really them before dropping into their hero, or bail out to
// the normal login form for a different account, on a shared/borrowed
// device.
export function AccountGate({ user, onContinue, onSwitch }: { user: User; onContinue: () => void; onSwitch: () => void }) {
  const label = accountLabel(user);
  return (
    <div className="flex-1 flex flex-col items-center justify-center gap-6 px-4 py-10 bg-nightsky text-center">
      <img src={gameLogo} alt="Reino & Masmorras" className="w-56 sm:w-72 max-w-full" draggable={false} />

      <div className="flex flex-col items-center gap-3 w-full max-w-xs">
        <p className="text-parchment/60 text-xs uppercase tracking-wide">Conta conectada</p>
        <p className="text-gold font-bold text-base break-all leading-snug">{label}</p>

        <Button onClick={onContinue} className="w-full mt-2">Continuar</Button>

        <button
          type="button"
          onClick={onSwitch}
          className="text-xs text-parchment/50 hover:text-parchment underline underline-offset-2 mt-1"
        >
          Trocar de conta
        </button>
      </div>
    </div>
  );
}
