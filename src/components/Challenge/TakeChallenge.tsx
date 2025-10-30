'use client';

import { useState, useEffect } from 'react';
import { collection, getDocs, addDoc, doc, getDoc, serverTimestamp } from 'firebase/firestore';
import { logEvent } from 'firebase/analytics';
import { db, auth, analytics } from '@/lib/firebase';
import { Question, NetworkingChallenge } from '@/types';
import { Button } from '@/components/ui/Button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/Card';
import { Label } from '@/components/ui/Label';
import { ArrowLeft, Clock, Wifi, Phone, Camera, Network, Settings } from 'lucide-react';
import toast from 'react-hot-toast';

interface TakeChallengeProps {
    challengeId: string;
    onComplete: () => void;
    onCancel: () => void;
}

export default function TakeChallenge({ challengeId, onComplete, onCancel }: TakeChallengeProps) {
    const [challenge, setChallenge] = useState<NetworkingChallenge | null>(null);
    const [questions, setQuestions] = useState<Question[]>([]);
    const [answers, setAnswers] = useState<{ [key: string]: 'a' | 'b' | 'c' | 'd' }>({});
    const [loading, setLoading] = useState(true);
    const [submitting, setSubmitting] = useState(false);
    const [timeLeft, setTimeLeft] = useState<number>(0);
    const [startTime] = useState<Date>(new Date());

    useEffect(() => {
        fetchChallengeData();
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [challengeId]);

    useEffect(() => {
        if (timeLeft > 0) {
            const timer = setTimeout(() => setTimeLeft(timeLeft - 1), 1000);
            return () => clearTimeout(timer);
        } else if (timeLeft === 0 && challenge) {
            handleSubmit(null);
        }
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [timeLeft, challenge]);

    const getCategoryIcon = (category: string) => {
        switch (category) {
            case 'WIFI': return <Wifi className="h-5 w-5" />;
            case 'VoIP': return <Phone className="h-5 w-5" />;
            case 'CCTV': return <Camera className="h-5 w-5" />;
            case 'LAN': return <Network className="h-5 w-5" />;
            case 'Operations': return <Settings className="h-5 w-5" />;
            default: return <Settings className="h-5 w-5" />;
        }
    };

    const fetchChallengeData = async () => {
        try {
            setLoading(true);
            const challengeDoc = await getDoc(doc(db, 'quizzes', challengeId));
            if (challengeDoc.exists()) {
                const challengeData = {
                    id: challengeDoc.id,
                    ...challengeDoc.data(),
                    createdAt: challengeDoc.data().createdAt?.toDate()
                } as NetworkingChallenge;
                setChallenge(challengeData);

                if (challengeData.timeLimit) {
                    setTimeLeft(challengeData.timeLimit * 60);
                }
            }

            const questionsSnapshot = await getDocs(collection(db, 'quizzes', challengeId, 'questions'));
            const questionsData = questionsSnapshot.docs.map(doc => ({
                id: doc.id,
                ...doc.data(),
            })) as Question[];
            setQuestions(questionsData);
        } catch (error) {
            console.error('Error fetching challenge:', error);
            toast.error('Failed to load challenge');
        } finally {
            setLoading(false);
        }
    };

    const handleSubmit = async (e: React.FormEvent | null) => {
        if (e) e.preventDefault();

        if (Object.keys(answers).length !== questions.length && timeLeft > 0) {
            toast.error('Please answer all questions');
            return;
        }

        try {
            setSubmitting(true);
            const user = auth.currentUser;
            if (!user) throw new Error('Not authenticated');

            let correctCount = 0;
            const correctAnswersMap: { [questionId: string]: 'a' | 'b' | 'c' | 'd' } = {};
            const questionDetailsMap: { [questionId: string]: string } = {};

            questions.forEach((question) => {
                correctAnswersMap[question.id] = question.correctAnswer;
                questionDetailsMap[question.id] = question.questionText;

                if (answers[question.id] === question.correctAnswer) {
                    correctCount++;
                }
            });

            const score = Math.round((correctCount / questions.length) * 100);
            const timeSpent = Math.ceil((new Date().getTime() - startTime.getTime()) / (1000 * 60));

            await addDoc(collection(db, 'results'), {
                challengeId,
                quizId: challengeId, // Backward compatibility
                internUid: user.uid,
                studentUid: user.uid, // Backward compatibility
                score,
                timeSpent,
                category: challenge?.category || 'General',
                answers: answers, // Save intern's answers
                correctAnswers: correctAnswersMap, // Save correct answers
                questionDetails: questionDetailsMap, // Save question text
                completedAt: serverTimestamp(),
            });

            // Log analytics event for challenge completion
            const analyticsInstance = await analytics;
            if (analyticsInstance) {
                logEvent(analyticsInstance, 'complete_challenge', {
                    challenge_id: challengeId,
                    category: challenge?.category,
                    difficulty: challenge?.difficulty,
                    score: score,
                    correct_answers: correctCount,
                    total_questions: questions.length,
                    time_spent: timeSpent,
                });
            }

            onComplete();
        } catch (error) {
            console.error('Error submitting challenge:', error);
            toast.error('Failed to submit challenge');
        } finally {
            setSubmitting(false);
        }
    };

    const formatTime = (seconds: number) => {
        const minutes = Math.floor(seconds / 60);
        const remainingSeconds = seconds % 60;
        return `${minutes}:${remainingSeconds.toString().padStart(2, '0')}`;
    };

    if (loading) {
        return (
            <div className="flex min-h-screen items-center justify-center">
                <div className="h-8 w-8 animate-spin rounded-full border-4 border-primary border-t-transparent"></div>
            </div>
        );
    }

    if (!challenge || questions.length === 0) {
        return (
            <div className="flex min-h-screen items-center justify-center">
                <Card className="w-full max-w-md">
                    <CardContent className="pt-6">
                        <p className="text-center text-muted-foreground">Challenge not found or has no questions.</p>
                        <Button onClick={onCancel} className="mt-4 w-full">Go Back</Button>
                    </CardContent>
                </Card>
            </div>
        );
    }

    return (
        <div className="mx-auto max-w-3xl space-y-6">
            <div className="flex items-center justify-between">
                <Button variant="ghost" onClick={onCancel}>
                    <ArrowLeft className="mr-2 h-4 w-4" />
                    Back to Dashboard
                </Button>

                {timeLeft > 0 && (
                    <div className="flex items-center gap-2 rounded-lg bg-muted px-3 py-2">
                        <Clock className="h-4 w-4" />
                        <span className="font-mono font-medium">{formatTime(timeLeft)}</span>
                    </div>
                )}
            </div>

            <Card>
                <CardHeader>
                    <div className="flex items-center gap-3">
                        {getCategoryIcon(challenge.category || 'General')}
                        <div>
                            <CardTitle>{challenge.title}</CardTitle>
                            <div className="flex items-center gap-4 text-sm text-muted-foreground mt-1">
                                <span>{challenge.category}</span>
                                <span>•</span>
                                <span>{challenge.difficulty}</span>
                                <span>•</span>
                                <span>{questions.length} questions</span>
                            </div>
                        </div>
                    </div>
                    {challenge.description && (
                        <p className="text-muted-foreground mt-2">{challenge.description}</p>
                    )}
                </CardHeader>
            </Card>

            <form onSubmit={handleSubmit} className="space-y-6">
                {questions.map((question, index) => (
                    <Card key={question.id}>
                        <CardHeader>
                            <CardTitle className="text-base">
                                Question {index + 1}: {question.questionText}
                            </CardTitle>
                        </CardHeader>
                        <CardContent className="space-y-3">
                            {(['a', 'b', 'c', 'd'] as const).map((option) => (
                                <div key={option} className="flex items-start space-x-3">
                                    <input
                                        type="radio"
                                        id={`${question.id}-${option}`}
                                        name={question.id}
                                        value={option}
                                        checked={answers[question.id] === option}
                                        onChange={() => setAnswers({ ...answers, [question.id]: option })}
                                        className="mt-1 h-4 w-4"
                                    />
                                    <Label htmlFor={`${question.id}-${option}`} className="cursor-pointer flex-1">
                                        {option.toUpperCase()}. {question[`option${option.toUpperCase()}` as keyof Question]}
                                    </Label>
                                </div>
                            ))}
                        </CardContent>
                    </Card>
                ))}

                <div className="flex gap-4">
                    <Button type="submit" disabled={submitting} className="flex-1">
                        {submitting ? 'Submitting...' : 'Submit Challenge'}
                    </Button>
                    <Button type="button" variant="outline" onClick={onCancel}>
                        Cancel
                    </Button>
                </div>
            </form>
        </div>
    );
}