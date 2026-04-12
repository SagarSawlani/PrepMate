'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import Image from 'next/image';
import { useAuthStore } from '@/lib/store';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';

const ADMIN_PASSCODE = '1712';

export default function LoginPage() {
  const router = useRouter();
  const { login, isLoading } = useAuthStore();

  const [tab, setTab] = useState<'student' | 'admin'>('student');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [isSignUp, setIsSignUp] = useState(false);
  const [name, setName] = useState('');
  const [error, setError] = useState('');
  const [passcode, setPasscode] = useState('');
  const [adminError, setAdminError] = useState('');

  const handleStudentSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    try {
      if (isSignUp) {
        if (!name || !email || !password) { setError('Please fill in all fields'); return; }
        await useAuthStore.getState().signup(name, email, password);
      } else {
        if (!email || !password) { setError('Please fill in all fields'); return; }
        await login(email, password);
      }
      router.push('/dashboard');
    } catch {
      setError('Authentication failed. Please try again.');
    }
  };

  const handleAdminSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    setAdminError('');
    if (passcode === ADMIN_PASSCODE) {
      router.push('/admin');
    } else {
      setAdminError('Invalid passcode. Please try again.');
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-background via-background to-accent/10 flex items-center justify-center p-4">
      <div className="w-full max-w-md animate-in fade-in slide-in-from-bottom-8 duration-500">
        {/* Logo */}
        <div className="text-center mb-8">
          <div className="mb-3 inline-block">
            <Image src="/prepmate-logo.jpg" alt="PrepMate Logo" width={80} height={80} className="rounded-lg" />
          </div>
          <h1 className="text-4xl font-bold text-primary mb-2">PrepMate</h1>
          <p className="text-muted-foreground">Master your exams, choose your future</p>
        </div>

        {/* Tab switcher */}
        <div className="flex rounded-xl overflow-hidden border border-border mb-4 shadow-sm">
          <button
            onClick={() => { setTab('student'); setError(''); setAdminError(''); }}
            className={`flex-1 py-2.5 text-sm font-semibold transition-colors duration-200 ${tab === 'student' ? 'bg-primary text-primary-foreground' : 'bg-card text-muted-foreground hover:bg-accent'}`}
          >
             Student
          </button>
          <button
            onClick={() => { setTab('admin'); setError(''); setAdminError(''); }}
            className={`flex-1 py-2.5 text-sm font-semibold transition-colors duration-200 ${tab === 'admin' ? 'bg-primary text-primary-foreground' : 'bg-card text-muted-foreground hover:bg-accent'}`}
          >
            Admin
          </button>
        </div>

        {/* Student Login */}
        {tab === 'student' && (
          <Card className="shadow-lg border-border/50 animate-in fade-in slide-in-from-top-2 duration-300">
            <CardHeader className="space-y-2">
              <CardTitle>{isSignUp ? 'Create Account' : 'Welcome Back'}</CardTitle>
              <CardDescription>
                {isSignUp ? 'Sign up to start your exam preparation journey' : 'Sign in to continue your exam preparation'}
              </CardDescription>
            </CardHeader>
            <CardContent>
              <form onSubmit={handleStudentSubmit} className="space-y-4">
                {isSignUp && (
                  <div className="animate-in fade-in slide-in-from-left-4 duration-300">
                    <label className="block text-sm font-medium mb-1">Name</label>
                    <Input type="text" placeholder="John Doe" value={name} onChange={(e) => setName(e.target.value)}
                      className="focus:border-primary focus:ring-2 focus:ring-primary/20" />
                  </div>
                )}
                <div>
                  <label className="block text-sm font-medium mb-1">Email</label>
                  <Input type="email" placeholder="you@example.com" value={email} onChange={(e) => setEmail(e.target.value)}
                    className="focus:border-primary focus:ring-2 focus:ring-primary/20" />
                </div>
                <div>
                  <label className="block text-sm font-medium mb-1">Password</label>
                  <Input type="password" placeholder="••••••••" value={password} onChange={(e) => setPassword(e.target.value)}
                    className="focus:border-primary focus:ring-2 focus:ring-primary/20" />
                </div>
                {error && <div className="text-destructive text-sm animate-in fade-in duration-200">{error}</div>}
                <Button type="submit" className="w-full bg-primary hover:bg-primary/90" disabled={isLoading}>
                  {isLoading ? 'Loading...' : isSignUp ? 'Create Account' : 'Sign In'}
                </Button>
                <div className="relative my-4">
                  <div className="absolute inset-0 flex items-center"><div className="w-full border-t border-border" /></div>
                  <div className="relative flex justify-center text-xs uppercase">
                    <span className="bg-card px-2 text-muted-foreground">Or</span>
                  </div>
                </div>
                <button type="button" onClick={() => { setIsSignUp(!isSignUp); setError(''); }}
                  className="w-full py-2 text-sm text-primary hover:underline">
                  {isSignUp ? 'Already have an account? Sign In' : "Don't have an account? Sign Up"}
                </button>
              </form>
            </CardContent>
          </Card>
        )}

        {/* Admin Login */}
        {tab === 'admin' && (
          <Card className="shadow-lg border-border/50 animate-in fade-in slide-in-from-top-2 duration-300">
            <CardHeader className="space-y-2">
              <CardTitle>Admin Access</CardTitle>
              <CardDescription>Enter the admin passcode to access the portal</CardDescription>
            </CardHeader>
            <CardContent>
              <form onSubmit={handleAdminSubmit} className="space-y-4">
                <div>
                  <label className="block text-sm font-medium mb-1">Passcode</label>
                  <Input
                    type="password"
                    placeholder="••••"
                    value={passcode}
                    onChange={(e) => setPasscode(e.target.value)}
                    className="focus:border-primary focus:ring-2 focus:ring-primary/20 tracking-widest text-center text-xl"
                  />
                </div>
                {adminError && <div className="text-destructive text-sm animate-in fade-in duration-200">{adminError}</div>}
                <Button type="submit" className="w-full bg-primary hover:bg-primary/90">
                  Enter Admin Portal →
                </Button>
              </form>
            </CardContent>
          </Card>
        )}
      </div>
    </div>
  );
}
