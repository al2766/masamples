import { useState, FormEvent } from 'react';
import { Link, useNavigate, useLocation } from 'react-router';
import { useAuth } from '../../context/AuthContext';
import { motion, AnimatePresence } from 'motion/react';
import { Button } from '../components/ui/button';
import { Input } from '../components/ui/input';
import { Label } from '../components/ui/label';
import { Card, CardContent } from '../components/ui/card';

function LoginForm({ from }: { from: string }) {
  const { login } = useAuth();
  const navigate = useNavigate();
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);

  const handleSubmit = async (e: FormEvent) => {
    e.preventDefault();
    setError('');
    setLoading(true);
    try {
      await login(email, password);
      navigate(from, { replace: true });
    } catch {
      setError('Incorrect email or password. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <>
      <div className="text-center mb-6">
        <h2 className="text-2xl font-semibold">Sign In</h2>
        <p className="text-gray-500 text-sm mt-1">Welcome back to MA Samples</p>
      </div>
      <form onSubmit={handleSubmit} className="space-y-4">
        <div>
          <Label htmlFor="login-email" className="block mb-2">Email</Label>
          <Input
            id="login-email"
            type="email"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            required
            autoComplete="email"
          />
        </div>
        <div>
          <Label htmlFor="login-password" className="block mb-2">Password</Label>
          <Input
            id="login-password"
            type="password"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            required
            autoComplete="current-password"
          />
        </div>
        {error && <p className="text-red-500 text-sm">{error}</p>}
        <Button
          type="submit"
          className="w-full bg-amber-400 hover:bg-amber-500 text-black font-semibold"
          disabled={loading}
        >
          {loading ? 'Signing in...' : 'Sign In'}
        </Button>
      </form>
      <div className="mt-6 text-center space-y-2">
        <p className="text-sm text-gray-600">
          Don't have an account?{' '}
          <Link to="/signup" state={{ from }} className="text-amber-600 hover:underline font-medium">
            Create one
          </Link>
        </p>
        <p className="text-sm text-gray-600">
          <Link to="/checkout" className="text-gray-400 hover:underline">
            Continue as guest
          </Link>
        </p>
      </div>
    </>
  );
}

function SignUpForm({ from }: { from: string }) {
  const { signup } = useAuth();
  const navigate = useNavigate();
  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);

  const handleSubmit = async (e: FormEvent) => {
    e.preventDefault();
    setError('');
    if (password.length < 6) {
      setError('Password must be at least 6 characters.');
      return;
    }
    setLoading(true);
    try {
      await signup(email, password, name);
      navigate(from, { replace: true });
    } catch (err: unknown) {
      const code = (err as { code?: string }).code;
      if (code === 'auth/email-already-in-use') {
        setError('An account with this email already exists.');
      } else {
        setError('Failed to create account. Please try again.');
      }
    } finally {
      setLoading(false);
    }
  };

  return (
    <>
      <div className="text-center mb-6">
        <h2 className="text-2xl font-semibold">Create Account</h2>
        <p className="text-gray-500 text-sm mt-1">Join MA Samples</p>
      </div>
      <form onSubmit={handleSubmit} className="space-y-4">
        <div>
          <Label htmlFor="signup-name" className="block mb-2">Full Name</Label>
          <Input
            id="signup-name"
            type="text"
            value={name}
            onChange={(e) => setName(e.target.value)}
            required
            autoComplete="name"
          />
        </div>
        <div>
          <Label htmlFor="signup-email" className="block mb-2">Email</Label>
          <Input
            id="signup-email"
            type="email"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            required
            autoComplete="email"
          />
        </div>
        <div>
          <Label htmlFor="signup-password" className="block mb-2">Password</Label>
          <Input
            id="signup-password"
            type="password"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            required
            autoComplete="new-password"
            minLength={6}
          />
          <p className="text-xs text-gray-400 mt-1">Minimum 6 characters</p>
        </div>
        {error && <p className="text-red-500 text-sm">{error}</p>}
        <Button
          type="submit"
          className="w-full bg-amber-400 hover:bg-amber-500 text-black font-semibold"
          disabled={loading}
        >
          {loading ? 'Creating account...' : 'Create Account'}
        </Button>
      </form>
      <div className="mt-6 text-center space-y-2">
        <p className="text-sm text-gray-600">
          Already have an account?{' '}
          <Link to="/login" state={{ from }} className="text-amber-600 hover:underline font-medium">
            Sign in
          </Link>
        </p>
        <p className="text-sm text-gray-600">
          <Link to="/checkout" className="text-gray-400 hover:underline">
            Continue as guest
          </Link>
        </p>
      </div>
    </>
  );
}

export function AuthPage() {
  const location = useLocation();
  const from = (location.state as { from?: string })?.from || '/';
  const isLogin = location.pathname === '/login';

  return (
    <div className="min-h-screen flex items-center justify-center bg-gray-50 py-12 px-4">
      <Card className="w-full max-w-md overflow-hidden">
        {/* Static logo — never moves */}
        <div className="pt-8 pb-2 flex justify-center">
          <div className="w-12 h-12 bg-black rounded flex items-center justify-center">
            <span className="text-white font-bold text-xl">MA</span>
          </div>
        </div>

        {/* Animated content — only the form content slides */}
        <CardContent className="pt-4 pb-8">
          <AnimatePresence mode="wait" initial={false}>
            <motion.div
              key={location.pathname}
              initial={{ opacity: 0, x: 30 }}
              animate={{ opacity: 1, x: 0 }}
              exit={{ opacity: 0, x: -30 }}
              transition={{ duration: 0.22, ease: 'easeInOut' }}
            >
              {isLogin
                ? <LoginForm from={from} />
                : <SignUpForm from={from} />
              }
            </motion.div>
          </AnimatePresence>
        </CardContent>
      </Card>
    </div>
  );
}
