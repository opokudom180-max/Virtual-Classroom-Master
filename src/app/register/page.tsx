'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { createUserWithEmailAndPassword } from 'firebase/auth';
import { doc, setDoc, serverTimestamp } from 'firebase/firestore';
import { logEvent } from 'firebase/analytics';
import { auth, db, analytics } from '@/lib/firebase';
import { Button } from '@/components/ui/Button';
import { Input } from '@/components/ui/Input';
import { Label } from '@/components/ui/Label';
import { Select } from '@/components/ui/Select';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/Card';
import { ThemeToggle } from '@/components/ThemeToggle';
import Link from 'next/link';
import toast from 'react-hot-toast';

export default function RegisterPage() {
    const router = useRouter();
    const [name, setName] = useState('');
    const [email, setEmail] = useState('');
    const [password, setPassword] = useState('');
    const [role, setRole] = useState<'intern' | 'supervisor'>('intern');
    const [loading, setLoading] = useState(false);

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();

        if (!name.trim() || !email.trim() || !password.trim()) {
            toast.error('Please fill out all fields');
            return;
        }

        if (password.length < 6) {
            toast.error('Password must be at least 6 characters');
            return;
        }

        try {
            setLoading(true);
            const userCredential = await createUserWithEmailAndPassword(auth, email, password);
            const user = userCredential.user;

            await setDoc(doc(db, 'users', user.uid), {
                name: name.trim(),
                email: email.trim(),
                role,
                createdAt: serverTimestamp(),
            });

            // Log analytics event for successful registration
            const analyticsInstance = await analytics;
            if (analyticsInstance) {
                logEvent(analyticsInstance, 'sign_up', {
                    method: 'email',
                    user_role: role,
                });
            }

            toast.success('Account created successfully!');
            router.push('/dashboard');
        } catch (error) {
            console.error('Registration error:', error);
            const firebaseError = error as { code?: string };
            if (firebaseError.code === 'auth/email-already-in-use') {
                toast.error('Email is already registered');
            } else if (firebaseError.code === 'auth/invalid-email') {
                toast.error('Invalid email format');
            } else if (firebaseError.code === 'auth/weak-password') {
                toast.error('Password is too weak');
            } else {
                toast.error('Failed to create account. Please try again.');
            }
        } finally {
            setLoading(false);
        }
    };

    return (
        <div className="flex min-h-screen flex-col">
            <nav className="border-b border-border">
                <div className="mx-auto flex max-w-7xl items-center justify-between px-4 py-4 sm:px-6 lg:px-8">
                    <Link href="/" className="flex items-center gap-3">
                        <div className="flex h-8 w-8 items-center justify-center rounded bg-primary">
                            <span className="text-sm font-bold text-primary-foreground">DC</span>
                        </div>
                        <span className="text-xl font-bold">Data Center E-Learning</span>
                    </Link>
                    <ThemeToggle/>
                </div>
            </nav>

            <div className="flex flex-1 items-center justify-center px-4 py-12 sm:px-6 lg:px-8">
                <Card className="w-full max-w-md">
                    <CardHeader>
                        <CardTitle className="text-2xl">Register</CardTitle>
                        <CardDescription>Create your account to get started</CardDescription>
                    </CardHeader>
                    <CardContent>
                        <form onSubmit={handleSubmit} className="space-y-4">
                            <div className="space-y-2">
                                <Label htmlFor="name">Full Name</Label>
                                <Input
                                    type="text"
                                    id="name"
                                    value={name}
                                    onChange={(e) => setName(e.target.value)}
                                    placeholder="John Doe"
                                    required
                                />
                            </div>

                            <div className="space-y-2">
                                <Label htmlFor="email">Email</Label>
                                <Input
                                    type="email"
                                    id="email"
                                    value={email}
                                    onChange={(e) => setEmail(e.target.value)}
                                    placeholder="you@example.com"
                                    required
                                />
                            </div>

                            <div className="space-y-2">
                                <Label htmlFor="password">Password</Label>
                                <Input
                                    type="password"
                                    id="password"
                                    value={password}
                                    onChange={(e) => setPassword(e.target.value)}
                                    placeholder="At least 6 characters"
                                    required
                                />
                            </div>

                            <div className="space-y-2">
                                <Label htmlFor="role">Role</Label>
                                <Select id="role" value={role}
                                        onChange={(e) => setRole(e.target.value as 'intern' | 'supervisor')}>
                                    <option value="intern">Intern</option>
                                    <option value="supervisor">Supervisor</option>
                                </Select>
                            </div>

                            <Button type="submit" disabled={loading} className="w-full">
                                {loading ? 'Creating account...' : 'Register'}
                            </Button>

                            <p className="text-center text-sm text-muted-foreground">
                                Already have an account?{' '}
                                <Link href="/login" className="font-medium text-primary hover:underline">
                                    Login here
                                </Link>
                            </p>
                        </form>
                    </CardContent>
                </Card>
            </div>
        </div>
    );
}