import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { supabase } from '@/integrations/supabase/client';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { User, Mail, Lock, Loader2 } from 'lucide-react';
import { toast } from 'sonner';
import dungeonBg from '@/assets/dungeon-mossy.jpg';
import { enableGuestMode } from '@/lib/guestMode';
export default function Auth() {
  const navigate = useNavigate();
  const [isLogin, setIsLogin] = useState(true);
  const [loading, setLoading] = useState(false);
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');

  const handleGuestMode = () => {
    enableGuestMode();
    navigate('/');
  };
  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!email || !password) {
      toast.error('Please fill in all fields');
      return;
    }
    if (password.length < 6) {
      toast.error('Password must be at least 6 characters');
      return;
    }
    setLoading(true);
    try {
      if (isLogin) {
        const {
          error
        } = await supabase.auth.signInWithPassword({
          email,
          password
        });
        if (error) throw error;
        toast.success('Welcome back, adventurer!');
        navigate('/');
      } else {
        const {
          error
        } = await supabase.auth.signUp({
          email,
          password,
          options: {
            emailRedirectTo: `${window.location.origin}/`
          }
        });
        if (error) throw error;
        toast.success('Account created! Your adventure begins...');
        navigate('/');
      }
    } catch (error: any) {
      if (error.message.includes('User already registered')) {
        toast.error('This email is already registered. Try logging in.');
      } else if (error.message.includes('Invalid login credentials')) {
        toast.error('Invalid email or password');
      } else {
        toast.error(error.message || 'Authentication failed');
      }
    } finally {
      setLoading(false);
    }
  };
  return <div className="relative min-h-screen w-full overflow-hidden">
      {/* Background */}
      <div className="absolute inset-0 bg-cover bg-center" style={{
      backgroundImage: `url(${dungeonBg})`
    }} />
      <div className="absolute inset-0 bg-background/90" />
      
      {/* Content */}
      <div className="relative z-10 flex min-h-screen flex-col items-center justify-center px-4">
        <div className="w-full max-w-md">
          {/* Header */}
          <div className="mb-8 text-center">
            <div className="mb-4 flex items-center justify-center gap-3">
              
              <h1 className="font-cinzel-decorative text-4xl font-bold text-primary">
                Dungeon Crawler
              </h1>
              
            </div>
            <p className="text-muted-foreground">
              {isLogin ? 'Welcome back, brave adventurer' : 'Begin your legend'}
            </p>
          </div>

          {/* Auth Form */}
          <div className="rounded-lg border border-border bg-card/80 p-6 backdrop-blur-sm">
            <form onSubmit={handleSubmit} className="space-y-4">
              <div className="space-y-2">
                <Label htmlFor="email" className="flex items-center gap-2 text-foreground">
                  <Mail className="h-4 w-4" />
                  Email
                </Label>
                <Input id="email" type="email" placeholder="adventurer@realm.com" value={email} onChange={e => setEmail(e.target.value)} className="bg-background/50" disabled={loading} />
              </div>

              <div className="space-y-2">
                <Label htmlFor="password" className="flex items-center gap-2 text-foreground">
                  <Lock className="h-4 w-4" />
                  Password
                </Label>
                <Input id="password" type="password" placeholder="••••••••" value={password} onChange={e => setPassword(e.target.value)} className="bg-background/50" disabled={loading} />
              </div>

              <Button type="submit" className="fantasy-button w-full py-6 font-cinzel text-lg" disabled={loading}>
                {loading ? <Loader2 className="h-5 w-5 animate-spin" /> : <>
                    <User className="mr-2 h-5 w-5" />
                    {isLogin ? 'Enter the Dungeon' : 'Create Character'}
                  </>}
              </Button>
            </form>

            <div className="mt-6 text-center">
              <button type="button" onClick={() => setIsLogin(!isLogin)} className="text-sm text-muted-foreground hover:text-primary transition-colors" disabled={loading}>
                {isLogin ? "New adventurer? Create an account" : 'Already have an account? Sign in'}
              </button>
            </div>

            <div className="mt-4 border-t border-border pt-4 text-center">
              <button type="button" onClick={handleGuestMode} className="text-sm text-muted-foreground hover:text-primary transition-colors underline-offset-4 hover:underline" disabled={loading}>
                Play as Guest (no account, local save only)
              </button>
            </div>
          </div>
        </div>
      </div>
    </div>;
}