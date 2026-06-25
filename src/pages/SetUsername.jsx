import { useState, useCallback, useEffect, useRef } from 'react';
import { base44 } from '@/api/base44Client';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { AtSign, Check, X, Loader2 } from 'lucide-react';
import AuthLayout, { AuthError } from '@/components/AuthLayout';

export default function SetUsername() {
  const [username, setUsername] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [usernameStatus, setUsernameStatus] = useState(null);
  const usernameTimer = useRef(null);

  const checkAvailability = useCallback(async (val) => {
    if (!val || val.length < 3) { setUsernameStatus(null); return; }
    if (!/^[a-zA-Z0-9._]+$/.test(val)) { setUsernameStatus('invalid'); return; }
    setUsernameStatus('checking');
    try {
      const res = await base44.functions.invoke('checkUsername', { username: val });
      setUsernameStatus(res.data.available ? 'available' : 'taken');
    } catch {
      setUsernameStatus(null);
    }
  }, []);

  const handleUsernameChange = (e) => {
    const val = e.target.value.toLowerCase().replace(/[^a-z0-9._]/g, '');
    setUsername(val);
    setUsernameStatus(null);
    if (usernameTimer.current) clearTimeout(usernameTimer.current);
    usernameTimer.current = setTimeout(() => checkAvailability(val), 500);
  };

  useEffect(() => {
    return () => { if (usernameTimer.current) clearTimeout(usernameTimer.current); };
  }, []);

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!username || username.length < 3) {
      setError('Please choose a username (at least 3 characters)');
      return;
    }
    if (usernameStatus !== 'available') {
      setError('Please choose an available username');
      return;
    }
    setLoading(true);
    setError('');
    try {
      await base44.auth.updateMe({ username });
      window.location.href = '/';
    } catch (err) {
      setError(err.message || 'Failed to set username');
    } finally {
      setLoading(false);
    }
  };

  return (
    <AuthLayout tagline="Choose a unique name for your profile">
      <form onSubmit={handleSubmit} className="space-y-4">
        <div className="space-y-1">
          <h2 className="text-section-title text-center">Pick a username</h2>
          <p className="text-caption text-muted-foreground text-center">
            Friends can find you by this name
          </p>
        </div>

        <AuthError>{error}</AuthError>

        <div className="space-y-2">
          <Label>Username</Label>
          <div className="relative">
            <AtSign className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" aria-hidden="true" />
            <Input
              placeholder="Choose a unique username"
              value={username}
              onChange={handleUsernameChange}
              className="rounded-xl h-12 pl-10 pr-10"
              autoComplete="off"
              required
            />
            <div className="absolute right-3 top-1/2 -translate-y-1/2">
              {usernameStatus === 'checking' && <Loader2 className="w-4 h-4 text-muted-foreground animate-spin" />}
              {usernameStatus === 'available' && <Check className="w-4 h-4 text-primary" />}
              {usernameStatus === 'taken' && <X className="w-4 h-4 text-destructive" />}
              {usernameStatus === 'invalid' && <X className="w-4 h-4 text-destructive" />}
            </div>
          </div>
          {usernameStatus === 'available' && (
            <p className="text-caption text-primary">Username available</p>
          )}
          {usernameStatus === 'taken' && (
            <p className="text-caption text-destructive">This username is already taken</p>
          )}
          {usernameStatus === 'invalid' && (
            <p className="text-caption text-destructive">Only letters, numbers, dots and underscores</p>
          )}
        </div>

        <Button
          type="submit"
          disabled={loading || usernameStatus !== 'available'}
          className="w-full h-12 rounded-xl"
        >
          {loading ? 'Saving…' : 'Set username'}
        </Button>
      </form>
    </AuthLayout>
  );
}
