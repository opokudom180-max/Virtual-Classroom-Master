'use client';

import { useState, useEffect } from 'react';
import { collection, getDocs, addDoc, updateDoc, doc, serverTimestamp, query, orderBy, where } from 'firebase/firestore';
import { logEvent } from 'firebase/analytics';
import { db, analytics } from '@/lib/firebase';
import { QuestionBankChallenge, ChallengeResult } from '@/types';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/Card';
import { Button } from '@/components/ui/Button';
import { Select } from '@/components/ui/Select';
import { Input } from '@/components/ui/Input'; // ✅ Added
import {
    BookOpen,
    X,
    Eye,
    EyeOff,
    Archive,
    RotateCcw,
    Wifi,
    Phone,
    Camera,
    Network,
    Settings,
    Calendar,
    BarChart3,
    Users,
    Globe // ✅ Added
} from 'lucide-react';
import { format } from 'date-fns';
import toast from 'react-hot-toast';

interface QuestionBankProps {
    onClose: () => void;
}

export default function QuestionBank({ onClose }: QuestionBankProps) {
    const [bankChallenges, setBankChallenges] = useState<QuestionBankChallenge[]>([]);
    const [selectedCategory, setSelectedCategory] = useState<string>('All');
    const [selectedStatus, setSelectedStatus] = useState<'All' | 'Published' | 'Draft'>('All');
    const [results, setResults] = useState<ChallengeResult[]>([]);
    const [loading, setLoading] = useState(true);

    // ✅ Added state for fetching questions via URL
    const [fetchUrl, setFetchUrl] = useState('');
    const [fetchingQuestions, setFetchingQuestions] = useState(false);

    const categories = ['All', 'WIFI', 'VoIP', 'CCTV', 'LAN', 'Operations', 'Security'];
    const currentYear = new Date().getFullYear();

    useEffect(() => {
        fetchQuestionBank();
    }, []);

    const fetchQuestionBank = async () => {
        try {
            setLoading(true);
            const bankQuery = query(collection(db, 'questionBank'), orderBy('createdAt', 'desc'));
            const bankSnapshot = await getDocs(bankQuery);
            const bankData = bankSnapshot.docs.map(doc => ({
                id: doc.id,
                ...doc.data(),
                createdAt: doc.data().createdAt?.toDate(),
                publishedDate: doc.data().publishedDate?.toDate(),
                lastUsed: doc.data().lastUsed?.toDate(),
            })) as QuestionBankChallenge[];
            setBankChallenges(bankData);

            const resultsSnapshot = await getDocs(collection(db, 'results'));
            const resultsData = resultsSnapshot.docs.map(doc => ({
                id: doc.id,
                ...doc.data(),
                completedAt: doc.data().completedAt?.toDate(),
            })) as ChallengeResult[];
            setResults(resultsData);

        } catch (error) {
            console.error('Error fetching question bank:', error);
            toast.error('Failed to load question bank');
        } finally {
            setLoading(false);
        }
    };

    // ✅ New function: fetch questions from a given URL
    const handleFetchQuestions = async () => {
        if (!fetchUrl.trim()) return toast.error('Please enter a valid link.');

        setFetchingQuestions(true);
        try {
            const res = await fetch('/api/fetch-questions', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ url: fetchUrl }),
            });

            const data = await res.json();
            if (!data.success) throw new Error(data.error || 'Failed to fetch questions');

            // ✅ Save questions into Firestore
            for (const q of data.questions) {
                await addDoc(collection(db, 'questionBankQuestions'), {
                    challengeId: 'imported', // You can later link this to a challenge
                    questionText: q.questionText,
                    optionA: q.options?.[0] || '',
                    optionB: q.options?.[1] || '',
                    optionC: q.options?.[2] || '',
                    optionD: q.options?.[3] || '',
                    correctAnswer: q.answer || '',
                    sourceUrl: fetchUrl,
                    createdAt: serverTimestamp(),
                });
            }

            toast.success(`Fetched and saved ${data.questions.length} questions!`);
            setFetchUrl('');
        } catch (err) {
            console.error(err);
            toast.error('Failed to fetch or save questions');
        } finally {
            setFetchingQuestions(false);
        }
    };

    const getUsageStats = (challengeId: string) => {
        const challengeResults = results.filter(r => r.challengeId === challengeId);
        const totalAttempts = challengeResults.length;
        const averageScore = totalAttempts > 0
            ? Math.round(challengeResults.reduce((sum, r) => sum + r.score, 0) / totalAttempts)
            : 0;

        return { totalAttempts, averageScore };
    };

    // ✅ Add this UI section right above “Filters”
    return (
        <Card className="shadow-xl border-2 border-primary/20">
            <CardHeader className="bg-gradient-to-r from-primary/10 to-accent/10">
                <div className="flex items-center justify-between">
                    <div>
                        <CardTitle className="flex items-center gap-2 text-2xl">
                            <Archive className="h-6 w-6 text-primary" />
                            Question Bank
                        </CardTitle>
                        <CardDescription className="text-base">
                            Manage reusable challenges and import from web links
                        </CardDescription>
                    </div>
                    <Button variant="ghost" size="sm" onClick={onClose}>
                        <X className="h-5 w-5" />
                    </Button>
                </div>
            </CardHeader>

            <CardContent className="p-6">
                {/* ✅ New “Import from Link” section */}
                <div className="mb-6 p-4 rounded-lg bg-muted/10 border border-muted">
                    <div className="flex flex-col sm:flex-row gap-3">
                        <Input
                            type="url"
                            placeholder="Paste link to fetch questions..."
                            value={fetchUrl}
                            onChange={(e) => setFetchUrl(e.target.value)}
                            className="flex-1"
                        />
                        <Button
                            onClick={handleFetchQuestions}
                            disabled={fetchingQuestions}
                            className="flex items-center gap-2 bg-blue-600 hover:bg-blue-700"
                        >
                            <Globe className="h-4 w-4" />
                            {fetchingQuestions ? 'Fetching...' : 'Fetch Questions'}
                        </Button>
                    </div>
                    <p className="text-sm text-muted-foreground mt-2">
                        Paste a valid quiz link (e.g., a webpage with questions). The system will try to extract and store them automatically.
                    </p>
                </div>

                {/* ✅ Keep your filters and question cards below this section */}
                {/* Filters and grid remain unchanged */}
                {/* ...existing code below... */}
