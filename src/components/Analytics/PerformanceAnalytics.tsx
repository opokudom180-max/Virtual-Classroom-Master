'use client';

import { useState, useEffect } from 'react';
import { collection, getDocs, query, where } from 'firebase/firestore';
import { db } from '@/lib/firebase';
import { ChallengeResult, NetworkingChallenge, User } from '@/types';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/Card';
import { Button } from '@/components/ui/Button';
import { Select } from '@/components/ui/Select';
import { X, TrendingUp, Users, Award, Clock } from 'lucide-react';
import toast from 'react-hot-toast';

interface PerformanceAnalyticsProps {
    onClose: () => void;
}

export default function PerformanceAnalytics({ onClose }: PerformanceAnalyticsProps) {
    const [results, setResults] = useState<ChallengeResult[]>([]);
    const [challenges, setChallenges] = useState<NetworkingChallenge[]>([]);
    const [interns, setInterns] = useState<User[]>([]);
    const [selectedCategory, setSelectedCategory] = useState<string>('All');
    const [selectedTimePeriod, setSelectedTimePeriod] = useState<string>('All');
    const [loading, setLoading] = useState(true);

    const categories = ['All', 'WIFI', 'VoIP', 'CCTV', 'LAN', 'Operations', 'Security'];
    const timePeriods = ['All', 'Last 7 days', 'Last 30 days', 'Last 90 days'];

    useEffect(() => {
        fetchData();
    }, []);

    const fetchData = async () => {
        try {
            setLoading(true);

            // Fetch all data
            const [resultsSnapshot, challengesSnapshot, internsSnapshot] = await Promise.all([
                getDocs(collection(db, 'results')),
                getDocs(collection(db, 'quizzes')),
                getDocs(query(collection(db, 'users'), where('role', '==', 'intern')))
            ]);

            const resultsData = resultsSnapshot.docs.map(doc => ({
                id: doc.id,
                ...doc.data(),
                completedAt: doc.data().completedAt?.toDate(),
            })) as ChallengeResult[];

            const challengesData = challengesSnapshot.docs.map(doc => ({
                id: doc.id,
                ...doc.data(),
                createdAt: doc.data().createdAt?.toDate(),
            })) as NetworkingChallenge[];

            const internsData = internsSnapshot.docs.map(doc => ({
                uid: doc.id,
                ...doc.data(),
                createdAt: doc.data().createdAt?.toDate(),
            })) as User[];

            setResults(resultsData);
            setChallenges(challengesData);
            setInterns(internsData);
        } catch (error) {
            console.error('Error fetching analytics data:', error);
            toast.error('Failed to load analytics data');
        } finally {
            setLoading(false);
        }
    };

    const getFilteredResults = () => {
        let filtered = results;

        // Filter by category
        if (selectedCategory !== 'All') {
            filtered = filtered.filter(result => {
                const challenge = challenges.find(c => c.id === result.challengeId);
                return challenge?.category === selectedCategory;
            });
        }

        // Filter by time period
        if (selectedTimePeriod !== 'All' && filtered.length > 0) {
            const now = new Date();
            let cutoffDate: Date;

            switch (selectedTimePeriod) {
                case 'Last 7 days':
                    cutoffDate = new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000);
                    break;
                case 'Last 30 days':
                    cutoffDate = new Date(now.getTime() - 30 * 24 * 60 * 60 * 1000);
                    break;
                case 'Last 90 days':
                    cutoffDate = new Date(now.getTime() - 90 * 24 * 60 * 60 * 1000);
                    break;
                default:
                    cutoffDate = new Date(0);
            }

            filtered = filtered.filter(result =>
                result.completedAt && result.completedAt >= cutoffDate
            );
        }

        return filtered;
    };

    const getAnalyticsData = () => {
        const filteredResults = getFilteredResults();

        const totalAttempts = filteredResults.length;
        const averageScore = totalAttempts > 0
            ? Math.round(filteredResults.reduce((sum, r) => sum + r.score, 0) / totalAttempts)
            : 0;

        const averageTime = totalAttempts > 0
            ? Math.round(filteredResults.reduce((sum, r) => sum + (r.timeSpent || 0), 0) / totalAttempts)
            : 0;

        const activeInterns = new Set(filteredResults.map(r => r.internUid || r.studentUid)).size;

        const categoryPerformance = categories.slice(1).map(category => {
            const categoryResults = filteredResults.filter(result => {
                const challenge = challenges.find(c => c.id === result.challengeId);
                return challenge?.category === category;
            });

            const avg = categoryResults.length > 0
                ? Math.round(categoryResults.reduce((sum, r) => sum + r.score, 0) / categoryResults.length)
                : 0;

            return {
                category,
                average: avg,
                attempts: categoryResults.length,
            };
        });

        const topPerformers = interns
            .map(intern => {
                const internResults = filteredResults.filter(r =>
                    r.internUid === intern.uid || r.studentUid === intern.uid
                );
                const avg = internResults.length > 0
                    ? Math.round(internResults.reduce((sum, r) => sum + r.score, 0) / internResults.length)
                    : 0;

                return {
                    name: intern.name,
                    average: avg,
                    attempts: internResults.length,
                };
            })
            .filter(p => p.attempts > 0)
            .sort((a, b) => b.average - a.average)
            .slice(0, 5);

        return {
            totalAttempts,
            averageScore,
            averageTime,
            activeInterns,
            categoryPerformance,
            topPerformers,
        };
    };

    if (loading) {
        return (
            <div className="fixed inset-0 z-50 flex items-center justify-center bg-background/80 backdrop-blur-sm">
                <div className="h-8 w-8 animate-spin rounded-full border-4 border-primary border-t-transparent"></div>
            </div>
        );
    }

    const analytics = getAnalyticsData();

    return (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-background/80 backdrop-blur-sm">
            <Card className="max-h-[90vh] w-full max-w-6xl overflow-y-auto">
                <CardHeader>
                    <div className="flex items-center justify-between">
                        <CardTitle>Performance Analytics</CardTitle>
                        <Button variant="ghost" size="sm" onClick={onClose}>
                            <X className="h-5 w-5" />
                        </Button>
                    </div>
                    <CardDescription>Detailed insights into intern performance and engagement</CardDescription>
                </CardHeader>

                <CardContent className="space-y-6">
                    {/* Filters */}
                    <div className="flex gap-4">
                        <div className="flex-1">
                            <Select
                                value={selectedCategory}
                                onChange={(e) => setSelectedCategory(e.target.value)}
                            >
                                {categories.map(category => (
                                    <option key={category} value={category}>{category}</option>
                                ))}
                            </Select>
                        </div>
                        <div className="flex-1">
                            <Select
                                value={selectedTimePeriod}
                                onChange={(e) => setSelectedTimePeriod(e.target.value)}
                            >
                                {timePeriods.map(period => (
                                    <option key={period} value={period}>{period}</option>
                                ))}
                            </Select>
                        </div>
                    </div>

                    {/* Key Metrics */}
                    <div className="grid gap-4 md:grid-cols-4">
                        <Card>
                            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                                <CardTitle className="text-sm font-medium">Total Attempts</CardTitle>
                                <TrendingUp className="h-4 w-4 text-muted-foreground" />
                            </CardHeader>
                            <CardContent>
                                <div className="text-2xl font-bold">{analytics.totalAttempts}</div>
                            </CardContent>
                        </Card>

                        <Card>
                            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                                <CardTitle className="text-sm font-medium">Average Score</CardTitle>
                                <Award className="h-4 w-4 text-muted-foreground" />
                            </CardHeader>
                            <CardContent>
                                <div className="text-2xl font-bold">{analytics.averageScore}%</div>
                            </CardContent>
                        </Card>

                        <Card>
                            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                                <CardTitle className="text-sm font-medium">Active Interns</CardTitle>
                                <Users className="h-4 w-4 text-muted-foreground" />
                            </CardHeader>
                            <CardContent>
                                <div className="text-2xl font-bold">{analytics.activeInterns}</div>
                            </CardContent>
                        </Card>

                        <Card>
                            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                                <CardTitle className="text-sm font-medium">Avg. Time</CardTitle>
                                <Clock className="h-4 w-4 text-muted-foreground" />
                            </CardHeader>
                            <CardContent>
                                <div className="text-2xl font-bold">{analytics.averageTime}m</div>
                            </CardContent>
                        </Card>
                    </div>

                    {/* Category Performance */}
                    <Card>
                        <CardHeader>
                            <CardTitle>Performance by Category</CardTitle>
                        </CardHeader>
                        <CardContent>
                            <div className="space-y-4">
                                {analytics.categoryPerformance.map((category) => (
                                    <div key={category.category} className="flex items-center justify-between">
                                        <div className="flex items-center gap-3">
                                            <div className="font-medium">{category.category}</div>
                                            <div className="text-sm text-muted-foreground">({category.attempts} attempts)</div>
                                        </div>
                                        <div className="flex items-center gap-2">
                                            <div className="w-32 bg-muted rounded-full h-2">
                                                <div
                                                    className="bg-primary h-2 rounded-full"
                                                    style={{ width: `${category.average}%` }}
                                                />
                                            </div>
                                            <div className="text-sm font-medium">{category.average}%</div>
                                        </div>
                                    </div>
                                ))}
                            </div>
                        </CardContent>
                    </Card>

                    {/* Top Performers */}
                    <Card>
                        <CardHeader>
                            <CardTitle>Top Performers</CardTitle>
                        </CardHeader>
                        <CardContent>
                            <div className="space-y-3">
                                {analytics.topPerformers.map((performer, index) => (
                                    <div key={performer.name} className="flex items-center justify-between">
                                        <div className="flex items-center gap-3">
                                            <div className="flex h-8 w-8 items-center justify-center rounded-full bg-primary text-primary-foreground text-sm font-medium">
                                                {index + 1}
                                            </div>
                                            <div>
                                                <div className="font-medium">{performer.name}</div>
                                                <div className="text-sm text-muted-foreground">{performer.attempts} challenges completed</div>
                                            </div>
                                        </div>
                                        <div className="text-lg font-bold">{performer.average}%</div>
                                    </div>
                                ))}
                            </div>
                        </CardContent>
                    </Card>
                </CardContent>
            </Card>
        </div>
    );
}