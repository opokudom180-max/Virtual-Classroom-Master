'use client';

import { useState, useEffect } from 'react';
import { collection, getDocs, addDoc, updateDoc, doc, serverTimestamp, query, orderBy, where } from 'firebase/firestore';
import { logEvent } from 'firebase/analytics';
import { db, analytics } from '@/lib/firebase';
import { QuestionBankChallenge, ChallengeResult } from '@/types';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/Card';
import { Button } from '@/components/ui/Button';
import { Select } from '@/components/ui/Select';
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
    Users
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

    const categories = ['All', 'WIFI', 'VoIP', 'CCTV', 'LAN', 'Operations', 'Security'];
    const currentYear = new Date().getFullYear();

    useEffect(() => {
        fetchQuestionBank();
    }, []);

    const getCategoryIcon = (category: string) => {
        switch (category) {
            case 'WIFI': return <Wifi className="h-5 w-5 text-blue-600" />;
            case 'VoIP': return <Phone className="h-5 w-5 text-green-600" />;
            case 'CCTV': return <Camera className="h-5 w-5 text-purple-600" />;
            case 'LAN': return <Network className="h-5 w-5 text-orange-600" />;
            case 'Operations': return <Settings className="h-5 w-5 text-gray-600" />;
            case 'Security': return <Settings className="h-5 w-5 text-red-600" />;
            default: return <BookOpen className="h-5 w-5" />;
        }
    };

    const getCategoryColor = (category: string) => {
        switch (category) {
            case 'WIFI': return 'bg-blue-100 text-blue-800 dark:bg-blue-900 dark:text-blue-100';
            case 'VoIP': return 'bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-100';
            case 'CCTV': return 'bg-purple-100 text-purple-800 dark:bg-purple-900 dark:text-purple-100';
            case 'LAN': return 'bg-orange-100 text-orange-800 dark:bg-orange-900 dark:text-orange-100';
            case 'Operations': return 'bg-gray-100 text-gray-800 dark:bg-gray-900 dark:text-gray-100';
            case 'Security': return 'bg-red-100 text-red-800 dark:bg-red-900 dark:text-red-100';
            default: return 'bg-gray-100 text-gray-800 dark:bg-gray-900 dark:text-gray-100';
        }
    };

    const getDifficultyColor = (difficulty: string) => {
        switch (difficulty) {
            case 'Beginner': return 'bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-100';
            case 'Intermediate': return 'bg-yellow-100 text-yellow-800 dark:bg-yellow-900 dark:text-yellow-100';
            case 'Advanced': return 'bg-red-100 text-red-800 dark:bg-red-900 dark:text-red-100';
            default: return 'bg-gray-100 text-gray-800 dark:bg-gray-900 dark:text-gray-100';
        }
    };

    const fetchQuestionBank = async () => {
        try {
            setLoading(true);

            // Fetch all challenges from question bank
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

            // Fetch results for analytics
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

    const publishChallenge = async (challengeId: string) => {
        try {
            await updateDoc(doc(db, 'questionBank', challengeId), {
                isPublished: true,
                publishedDate: serverTimestamp(),
                batchYear: currentYear,
            });

            // Copy to active quizzes collection for backward compatibility
            const challenge = bankChallenges.find(c => c.id === challengeId);
            if (challenge) {
                const quizRef = await addDoc(collection(db, 'quizzes'), {
                    supervisorUid: challenge.supervisorUid,
                    teacherUid: challenge.supervisorUid,
                    title: challenge.title,
                    description: challenge.description,
                    category: challenge.category,
                    difficulty: challenge.difficulty,
                    timeLimit: challenge.timeLimit,
                    questionBankId: challengeId,
                    createdAt: serverTimestamp(),
                });

                // Copy questions
                const questionsQuery = query(
                    collection(db, 'questionBankQuestions'),
                    where('challengeId', '==', challengeId)
                );
                const questionsSnapshot = await getDocs(questionsQuery);

                for (const questionDoc of questionsSnapshot.docs) {
                    const questionData = questionDoc.data();
                    await addDoc(collection(db, 'quizzes', quizRef.id, 'questions'), {
                        questionText: questionData.questionText,
                        optionA: questionData.optionA,
                        optionB: questionData.optionB,
                        optionC: questionData.optionC,
                        optionD: questionData.optionD,
                        correctAnswer: questionData.correctAnswer,
                        category: questionData.category,
                        difficulty: questionData.difficulty,
                    });
                }

                // Update usage count
                await updateDoc(doc(db, 'questionBank', challengeId), {
                    usageCount: (challenge.usageCount || 0) + 1,
                    lastUsed: serverTimestamp(),
                });

                // Log analytics
                const analyticsInstance = await analytics;
                if (analyticsInstance) {
                    logEvent(analyticsInstance, 'publish_challenge_from_bank', {
                        challenge_id: challengeId,
                        category: challenge.category,
                        difficulty: challenge.difficulty,
                        usage_count: (challenge.usageCount || 0) + 1,
                    });
                }
            }

            fetchQuestionBank();
            toast.success('Challenge published successfully!');
        } catch (error) {
            console.error('Error publishing challenge:', error);
            toast.error('Failed to publish challenge');
        }
    };

    const unpublishChallenge = async (challengeId: string) => {
        try {
            await updateDoc(doc(db, 'questionBank', challengeId), {
                isPublished: false,
                publishedDate: null,
            });

            fetchQuestionBank();
            toast.success('Challenge unpublished successfully!');
        } catch (error) {
            console.error('Error unpublishing challenge:', error);
            toast.error('Failed to unpublish challenge');
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

    const filteredChallenges = bankChallenges.filter(challenge => {
        const categoryMatch = selectedCategory === 'All' || challenge.category === selectedCategory;
        const statusMatch = selectedStatus === 'All' ||
            (selectedStatus === 'Published' && challenge.isPublished) ||
            (selectedStatus === 'Draft' && !challenge.isPublished);

        return categoryMatch && statusMatch;
    });

    if (loading) {
        return (
            <Card>
                <CardContent className="pt-6">
                    <div className="flex justify-center">
                        <div className="h-8 w-8 animate-spin rounded-full border-4 border-primary border-t-transparent"></div>
                    </div>
                </CardContent>
            </Card>
        );
    }

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
                            Manage reusable challenges for multiple intern batches across years
                        </CardDescription>
                    </div>
                    <Button variant="ghost" size="sm" onClick={onClose}>
                        <X className="h-5 w-5" />
                    </Button>
                </div>
            </CardHeader>

            <CardContent className="p-6">
                {/* Statistics Overview */}
                <div className="grid gap-4 md:grid-cols-4 mb-6">
                    <Card className="bg-gradient-to-br from-blue-50 to-blue-100 dark:from-blue-950 dark:to-blue-900 border border-blue-200">
                        <CardHeader className="pb-2">
                            <CardTitle className="text-sm text-blue-700 dark:text-blue-300">Total Challenges</CardTitle>
                        </CardHeader>
                        <CardContent>
                            <div className="text-2xl font-bold text-blue-800 dark:text-blue-200">{bankChallenges.length}</div>
                        </CardContent>
                    </Card>

                    <Card className="bg-gradient-to-br from-green-50 to-green-100 dark:from-green-950 dark:to-green-900 border border-green-200">
                        <CardHeader className="pb-2">
                            <CardTitle className="text-sm text-green-700 dark:text-green-300">Published</CardTitle>
                        </CardHeader>
                        <CardContent>
                            <div className="text-2xl font-bold text-green-800 dark:text-green-200">
                                {bankChallenges.filter(c => c.isPublished).length}
                            </div>
                        </CardContent>
                    </Card>

                    <Card className="bg-gradient-to-br from-orange-50 to-orange-100 dark:from-orange-950 dark:to-orange-900 border border-orange-200">
                        <CardHeader className="pb-2">
                            <CardTitle className="text-sm text-orange-700 dark:text-orange-300">Draft</CardTitle>
                        </CardHeader>
                        <CardContent>
                            <div className="text-2xl font-bold text-orange-800 dark:text-orange-200">
                                {bankChallenges.filter(c => !c.isPublished).length}
                            </div>
                        </CardContent>
                    </Card>

                    <Card className="bg-gradient-to-br from-purple-50 to-purple-100 dark:from-purple-950 dark:to-purple-900 border border-purple-200">
                        <CardHeader className="pb-2">
                            <CardTitle className="text-sm text-purple-700 dark:text-purple-300">Total Usage</CardTitle>
                        </CardHeader>
                        <CardContent>
                            <div className="text-2xl font-bold text-purple-800 dark:text-purple-200">
                                {bankChallenges.reduce((sum, c) => sum + (c.usageCount || 0), 0)}
                            </div>
                        </CardContent>
                    </Card>
                </div>

                {/* Filters */}
                <div className="flex flex-wrap gap-4 mb-6">
                    <div className="flex-1 min-w-48">
                        <Select
                            value={selectedCategory}
                            onChange={(e) => setSelectedCategory(e.target.value)}
                            className="hover:shadow-md transition-shadow"
                        >
                            {categories.map(cat => (
                                <option key={cat} value={cat}>{cat}</option>
                            ))}
                        </Select>
                    </div>

                    <div className="flex-1 min-w-48">
                        <Select
                            value={selectedStatus}
                            onChange={(e) => setSelectedStatus(e.target.value as 'All' | 'Published' | 'Draft')}
                            className="hover:shadow-md transition-shadow"
                        >
                            <option value="All">All Challenges</option>
                            <option value="Published">Published Only</option>
                            <option value="Draft">Draft Only</option>
                        </Select>
                    </div>
                </div>

                {/* Question Bank Grid */}
                <div className="grid gap-6 md:grid-cols-1 lg:grid-cols-2">
                    {filteredChallenges.length === 0 ? (
                        <div className="col-span-full text-center py-12">
                            <Archive className="h-16 w-16 text-muted-foreground mx-auto mb-4" />
                            <p className="text-lg text-muted-foreground">
                                {selectedCategory === 'All' && selectedStatus === 'All'
                                    ? 'No challenges in the question bank yet.'
                                    : `No ${selectedStatus.toLowerCase()} ${selectedCategory === 'All' ? '' : selectedCategory} challenges found.`}
                            </p>
                        </div>
                    ) : (
                        filteredChallenges.map((challenge) => {
                            const stats = getUsageStats(challenge.id);
                            return (
                                <Card
                                    key={challenge.id}
                                    className={`hover:shadow-xl hover:scale-[1.02] transition-all duration-300 border-2 ${
                                        challenge.isPublished
                                            ? 'border-green-200 bg-gradient-to-br from-green-50 to-green-100 dark:from-green-950 dark:to-green-900'
                                            : 'border-gray-200 bg-gradient-to-br from-gray-50 to-gray-100 dark:from-gray-950 dark:to-gray-900'
                                    }`}
                                >
                                    <CardHeader>
                                        <div className="flex items-start justify-between">
                                            <div className="flex items-start gap-3">
                                                {getCategoryIcon(challenge.category)}
                                                <div>
                                                    <CardTitle className="text-lg">{challenge.title}</CardTitle>
                                                    <CardDescription className="mt-1">
                                                        {challenge.description}
                                                    </CardDescription>
                                                    <div className="flex items-center gap-2 mt-2">
                                                        <span className={`inline-block rounded-full px-2 py-1 text-xs font-medium ${getCategoryColor(challenge.category)}`}>
                                                            {challenge.category}
                                                        </span>
                                                        <span className={`inline-block rounded-full px-2 py-1 text-xs font-medium ${getDifficultyColor(challenge.difficulty)}`}>
                                                            {challenge.difficulty}
                                                        </span>
                                                        {challenge.timeLimit && (
                                                            <span className="text-xs text-muted-foreground flex items-center gap-1">
                                                                <Calendar className="h-3 w-3" />
                                                                {challenge.timeLimit}m
                                                            </span>
                                                        )}
                                                    </div>
                                                </div>
                                            </div>
                                            <div className="flex items-center gap-2">
                                                {challenge.isPublished ? (
                                                    <div className="flex items-center gap-1 text-green-600">
                                                        <Eye className="h-4 w-4" />
                                                        <span className="text-sm font-medium">Published</span>
                                                    </div>
                                                ) : (
                                                    <div className="flex items-center gap-1 text-gray-600">
                                                        <EyeOff className="h-4 w-4" />
                                                        <span className="text-sm font-medium">Draft</span>
                                                    </div>
                                                )}
                                            </div>
                                        </div>
                                    </CardHeader>

                                    <CardContent>
                                        {/* Usage Statistics */}
                                        <div className="grid gap-4 sm:grid-cols-3 mb-4 p-3 bg-white/50 dark:bg-black/20 rounded-lg">
                                            <div className="text-center">
                                                <div className="flex items-center justify-center gap-1 text-blue-600">
                                                    <Users className="h-4 w-4" />
                                                    <span className="text-lg font-bold">{stats.totalAttempts}</span>
                                                </div>
                                                <div className="text-xs text-muted-foreground">Attempts</div>
                                            </div>

                                            <div className="text-center">
                                                <div className="flex items-center justify-center gap-1 text-green-600">
                                                    <BarChart3 className="h-4 w-4" />
                                                    <span className="text-lg font-bold">{stats.averageScore}%</span>
                                                </div>
                                                <div className="text-xs text-muted-foreground">Avg Score</div>
                                            </div>

                                            <div className="text-center">
                                                <div className="flex items-center justify-center gap-1 text-purple-600">
                                                    <RotateCcw className="h-4 w-4" />
                                                    <span className="text-lg font-bold">{challenge.usageCount || 0}</span>
                                                </div>
                                                <div className="text-xs text-muted-foreground">Uses</div>
                                            </div>
                                        </div>

                                        {/* Additional Info */}
                                        <div className="space-y-2 text-sm text-muted-foreground">
                                            <div>Created: {format(challenge.createdAt, 'MMM dd, yyyy')}</div>
                                            {challenge.lastUsed && (
                                                <div>Last Used: {format(challenge.lastUsed, 'MMM dd, yyyy')}</div>
                                            )}
                                            {challenge.batchYear && (
                                                <div>Batch Year: {challenge.batchYear}</div>
                                            )}
                                        </div>

                                        {/* Action Buttons */}
                                        <div className="flex gap-2 mt-4">
                                            {challenge.isPublished ? (
                                                <Button
                                                    size="sm"
                                                    variant="outline"
                                                    onClick={() => unpublishChallenge(challenge.id)}
                                                    className="flex-1 hover:shadow-md transition-shadow border-orange-200 text-orange-700 hover:bg-orange-50"
                                                >
                                                    <EyeOff className="mr-2 h-4 w-4" />
                                                    Unpublish
                                                </Button>
                                            ) : (
                                                <Button
                                                    size="sm"
                                                    onClick={() => publishChallenge(challenge.id)}
                                                    className="flex-1 hover:shadow-lg hover:scale-105 transition-all duration-200 bg-gradient-to-r from-green-500 to-green-600"
                                                >
                                                    <Eye className="mr-2 h-4 w-4" />
                                                    Publish for {currentYear}
                                                </Button>
                                            )}

                                            <Button
                                                size="sm"
                                                variant="outline"
                                                onClick={() => publishChallenge(challenge.id)}
                                                className="hover:shadow-md transition-shadow"
                                                disabled={challenge.isPublished}
                                            >
                                                <RotateCcw className="mr-2 h-4 w-4" />
                                                Reuse
                                            </Button>
                                        </div>
                                    </CardContent>
                                </Card>
                            );
                        })
                    )}
                </div>
            </CardContent>
        </Card>
    );
}