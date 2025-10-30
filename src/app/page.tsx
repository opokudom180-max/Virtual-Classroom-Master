'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { createUserWithEmailAndPassword } from 'firebase/auth';
import { setDoc, doc } from 'firebase/firestore';
import { auth, db } from '@/lib/firebase';
import toast from 'react-hot-toast';
import { Button } from '@/components/ui/Button';

export default function RegisterPage() {
    const router = useRouter();
    const [name, setName] = useState('');
    const [email, setEmail] = useState('');
    const [password, setPassword] = useState('');
    const [role, setRole] = useState<'intern' | 'supervisor'>('intern');
    const [loading, setLoading] = useState(false);

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        setLoading(true);

        try {
            // Create account in Firebase Auth
            const userCredential = await createUserWithEmailAndPassword(auth, email, password);
            const user = userCredential.user;

            // Store user info in Firestore
            await setDoc(doc(db, 'users', user.uid), {
                name,
                email,
                role,
                createdAt: new Date(),
            });

            toast.success('Account created successfully!');
            router.push('/login');
        } catch (error: any) {
            console.error('Registration error:', error);
            if (error.code === 'auth/email-already-in-use') toast.error('Email already in use');
            else toast.error('Failed to register');
        } finally {
            setLoading(false);
        }
    };

    return (
        <div className="flex min-h-screen flex-col items-center justify-center bg-background px-4">
            <div className="w-full max-w-md rounded-lg border border-border bg-card p-8 shadow-md">
                <h1 className="mb-6 text-center text-2xl font-bold text-primary">Create an Account</h1>

                <form onSubmit={handleSubmit} className="flex flex-col gap-4">
                    <input
                        type="text"
                        placeholder="Full Name"
                        value={name}
                        onChange={(e) => setName(e.target.value)}
                        required
                        className="rounded border border-input bg-background p-2"
                    />

                    <input
                        type="email"
                        placeholder="Email Address"
                        value={email}
                        onChange={(e) => setEmail(e.target.value)}
                        required
                        className="rounded border border-input bg-background p-2"
                    />

                    <input
                        type="password"
                        placeholder="Password"
                        value={password}
                        onChange={(e) => setPassword(e.target.value)}
                        required
                        className="rounded border border-input bg-background p-2"
                    />

                    <select
                        value={role}
                        onChange={(e) => setRole(e.target.value as 'intern' | 'supervisor')}
                        className="rounded border border-input bg-background p-2"
                    >
                        <option value="intern">Intern</option>
                        <option value="supervisor">Supervisor</option>
                    </select>

                    <Button type="submit" disabled={loading} className="w-full">
                        {loading ? 'Creating Account...' : 'Register'}
                    </Button>
                </form>

                <p className="mt-4 text-center text-sm text-muted-foreground">
                    Already have an account?{' '}
                    <span
                        className="cursor-pointer text-primary hover:underline"
                        onClick={() => router.push('/login')}
                    >
            Login
          </span>
                </p>
            </div>
        </div>
    );
}
