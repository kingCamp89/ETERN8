import { useState, useCallback, useEffect, useRef } from 'react';
import { base44 } from '@/api/base44Client';
import { Link } from 'react-router-dom';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Mail, Lock, Eye, EyeOff, KeyRound, AtSign, Check, X, Loader2 } from 'lucide-react';
import AuthLayout, { AuthError } from '@/components/AuthLayout';
import { AnimatePresence, motion } from 'framer-motion';

export default function Register() {
  const [step, setStep] = useState('register');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [username, setUsername] = useState('');
  const [otpCode, setOtpCode] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [usernameStatus, setUsernameStatus] = useState(null);
  const usernameTimer = useRef(null);

  const checkAvailability = useCallback(async (val) => {
    if (!val || val.length < 3) {
      setUsernameStatus(null);
      return;
    }
    if (!/^[a-zA-Z0-9._]+$/.test(val)) {
      setUsernameStatus('invalid');
      return;
    }
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

  const handleRegister = async (e) => {
    e.preventDefault();
    if (password !== confirmPassword) {
      setError('Passwords do not match');
      return;
    }
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
      await base44.auth.register({ email, password });
      setStep('otp');
    } catch (err) {
      setError(err.message || 'Registration failed');
    } finally {
      setLoading(false);
    }
  };

  const handleVerify = async (e) => {
    e.preventDefault();
    setLoading(true);
    setError('');
    try {
      const res = await base44.auth.verifyOtp({ email, otpCode });
      base44.auth.setToken(res.access_token);
      await new Promise(r => setTimeout(r, 300));
      await base44.auth.updateMe({ username });
      window.location.href = '/intro';
    } catch (err) {
      setError(err.message || 'Invalid code');
    } finally {
      setLoading(false);
    }
  };

  const handleResendOtp = async () => {
    try {
      await base44.auth.resendOtp(email);
    } catch {
      // ignore
    }
  };

  return (
    <AuthLayout
      tagline={step === 'register'
        ? 'Begin preserving memories for those you love'
        : 'Almost there — verify your email'}
      footer={
        <>
          Already have an account?{' '}
          <Link to="/login" className="text-primary font-medium hover:underline">
            Sign in
          </Link>
        </>
      }
    >
      <AnimatePresence mode="wait">
        {step === 'register' ? (
          <motion.form
            key="register"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            onSubmit={handleRegister}
            className="space-y-4"
          >
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
                  {(usernameStatus === 'taken' || usernameStatus === 'invalid') && <X className="w-4 h-4 text-destructive" />}
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

            <div className="space-y-2">
              <Label>Email</Label>
              <div className="relative">
                <Mail className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" aria-hidden="true" />
                <Input
                  type="email"
                  placeholder="you@example.com"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  className="rounded-xl h-12 pl-10"
                  autoComplete="email"
                  required
                />
              </div>
            </div>

            <div className="space-y-2">
              <Label>Password</Label>
              <div className="relative">
                <Lock className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" aria-hidden="true" />
                <Input
                  type={showPassword ? 'text' : 'password'}
                  placeholder="Create a password"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  className="rounded-xl h-12 pl-10 pr-10"
                  autoComplete="new-password"
                  required
                />
                <button
                  type="button"
                  onClick={() => setShowPassword(!showPassword)}
                  className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground transition-colors"
                  aria-label={showPassword ? 'Hide password' : 'Show password'}
                >
                  {showPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                </button>
              </div>
            </div>

            <div className="space-y-2">
              <Label>Confirm password</Label>
              <div className="relative">
                <Lock className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" aria-hidden="true" />
                <Input
                  type="password"
                  placeholder="Confirm your password"
                  value={confirmPassword}
                  onChange={(e) => setConfirmPassword(e.target.value)}
                  className="rounded-xl h-12 pl-10"
                  autoComplete="new-password"
                  required
                />
              </div>
            </div>

            <Button type="submit" disabled={loading} className="w-full h-12 rounded-xl">
              {loading ? 'Creating account…' : 'Create account'}
            </Button>

            <div className="relative py-1">
              <div className="absolute inset-0 flex items-center">
                <span className="w-full border-t border-border/60" />
              </div>
              <div className="relative flex justify-center">
                <span className="bg-card px-2 text-caption text-muted-foreground">or</span>
              </div>
            </div>

            <Button
              type="button"
              variant="outline"
              className="w-full h-12 rounded-xl gap-2"
              onClick={() => base44.auth.loginWithProvider('google', '/')}
            >
              <img src="https://www.google.com/favicon.ico" alt="" className="w-4 h-4" aria-hidden="true" />
              Continue with Google
            </Button>
          </motion.form>
        ) : (
          <motion.form
            key="otp"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            onSubmit={handleVerify}
            className="space-y-4"
          >
            <AuthError>{error}</AuthError>

            <p className="text-body text-muted-foreground text-center">
              We sent a verification code to{' '}
              <span className="text-foreground font-medium">{email}</span>
            </p>

            <div className="space-y-2">
              <Label>Verification code</Label>
              <div className="relative">
                <KeyRound className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" aria-hidden="true" />
                <Input
                  placeholder="Enter code"
                  value={otpCode}
                  onChange={(e) => setOtpCode(e.target.value)}
                  className="rounded-xl h-12 pl-10 text-center text-lg tracking-widest"
                  inputMode="numeric"
                  autoComplete="one-time-code"
                  required
                />
              </div>
            </div>

            <Button type="submit" disabled={loading} className="w-full h-12 rounded-xl">
              {loading ? 'Verifying…' : 'Verify & continue'}
            </Button>

            <button
              type="button"
              onClick={handleResendOtp}
              className="w-full text-center text-caption text-primary font-medium hover:underline"
            >
              Resend code
            </button>
          </motion.form>
        )}
      </AnimatePresence>
    </AuthLayout>
  );
}
