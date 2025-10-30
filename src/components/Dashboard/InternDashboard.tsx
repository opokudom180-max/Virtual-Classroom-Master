'use client';

import { useState, useEffect } from 'react';
import { collection, getDocs } from 'firebase/firestore';
import { db, auth } from '@/lib/firebase';
import { NetworkingChallenge, ChallengeResult } from '@/types';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/Card';
import { Button } from '@/components/ui/Button';
import { BookOpen, Award, Calendar, TrendingUp, Wifi, Phone, Camera, Network, Settings, FileText, Shield, GraduationCap } from 'lucide-react';
import { calculateGPA, calculateCGPA, calculateGrade } from '@/lib/utils';
import TakeChallenge from '@/components/Challenge/TakeChallenge';
import ChallengeResults from '@/components/Challenge/ChallengeResults';
import WorkSchedule from '@/components/Schedule/WorkSchedule';
import AnnouncementsBoard from '@/components/Announcements/AnnouncementsBoard';
import TeamSchedule from '@/components/Timetable/Timetable';
import WeeklyReports from '@/components/Reports/WeeklyReports';
import DataCenterPolicies from '@/components/Policies/DataCenterPolicies';
import LearningForum from '@/components/Learning/LearningForum';
import SecurityInfo from '@/components/Security/SecurityInfo';
import toast from 'react-hot-toast';

export default function InternDashboard() {
    const [challenges, setChallenges] = useState<NetworkingChallenge[]>([]);
    const [results, setResults] = useState<ChallengeResult[]>([]);
    const [selectedChallenge, setSelectedChallenge] = useState<string | null>(null);
    const [showResults, setShowResults] = useState(false);
    const [showWeeklyReports, setShowWeeklyReports] = useState(false);
    const [showPolicies, setShowPolicies] = useState(false);
    const [showLearningForum, setShowLearningForum] = useState(false);
    const [showSecurity, setShowSecurity] = useState(false);
    const [gpa, setGpa] = useState(0);
    const [cgpa, setCgpa] = useState(0);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        fetchData();
    }, []);

    const fetchData = async () => {
        try {
            setLoading(true);
            const user = auth.currentUser;
            if (!user) return;

            // Fetch challenges
            const challengesSnapshot = await getDocs(collection(db, 'quizzes'));
            const challengesData = challengesSnapshot.docs.map(doc => ({
                id: doc.id,
                ...doc.data(),
                createdAt: doc.data().createdAt?.toDate(),
            })) as NetworkingChallenge[];
            setChallenges(challengesData);

            // Fetch results for this intern (check both internUid and studentUid for backward compatibility)
            const resultsSnapshot = await getDocs(collection(db, 'results'));
            const allResults = resultsSnapshot.docs.map(doc => ({
                id: doc.id,
                ...doc.data(),
                completedAt: doc.data().completedAt?.toDate(),
            })) as ChallengeResult[];

            // Filter results for current intern
            const internResults = allResults.filter(result =>
                result.internUid === user.uid || result.studentUid === user.uid
            );

            setResults(internResults);

            const gpaValue = calculateGPA(internResults);
            const cgpaValue = calculateCGPA(internResults);
            setGpa(gpaValue);
            setCgpa(cgpaValue);
        } catch (error) {
            console.error('Error fetching data:', error);
            toast.error('Failed to load dashboard data');
        } finally {
            setLoading(false);
        }
    };

    const getCategoryIcon = (category: string) => {
        switch (category) {
            case 'WIFI': return <Wifi className="h-5 w-5" />;
            case 'VoIP': return <Phone className="h-5 w-5" />;
            case 'CCTV': return <Camera className="h-5 w-5" />;
            case 'LAN': return <Network className="h-5 w-5" />;
            case 'Operations': return <Settings className="h-5 w-5" />;
            case 'Security': return <Settings className="h-5 w-5" />;
            default: return <BookOpen className="h-5 w-5" />;
        }
    };

    const getCategoryStats = (category: string) => {
        const categoryResults = results.filter(r => {
            const challenge = challenges.find(c => c.id === r.challengeId);
            return challenge?.category === category;
        });
        const average = categoryResults.length > 0
            ? categoryResults.reduce((sum, r) => sum + r.score, 0) / categoryResults.length
            : 0;
        return {
            count: categoryResults.length,
            average: Math.round(average)
        };
    };

    const getSkillLevel = (average: number) => {
        if (average >= 90) return { level: 'Expert', color: 'text-green-600' };
        if (average >= 80) return { level: 'Advanced', color: 'text-blue-600' };
        if (average >= 70) return { level: 'Intermediate', color: 'text-yellow-600' };
        if (average >= 60) return { level: 'Beginner', color: 'text-orange-600' };
        return { level: 'Learning', color: 'text-red-600' };
    };

    if (loading) {
        return (
            <div className="flex min-h-screen items-center justify-center">
                <div className="h-8 w-8 animate-spin rounded-full border-4 border-primary border-t-transparent"></div>
            </div>
        );
    }

    if (selectedChallenge) {
        return (
            <TakeChallenge
                challengeId={selectedChallenge}
                onComplete={() => {
                    setSelectedChallenge(null);
                    fetchData();
                    toast.success('Challenge completed successfully!');
                }}
                onCancel={() => setSelectedChallenge(null)}
            />
        );
    }

    return (
        <div className="space-y-8">
            <div>
                <h1 className="text-3xl font-bold">Intern Dashboard</h1>
                <p className="text-muted-foreground mt-2">Welcome to the KNUST Data Center E-Learning platform.</p>
            </div>

            {/* Key Performance Metrics */}
            <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-4">
                <Card>
                    <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                        <CardTitle className="text-sm font-medium">Performance Score</CardTitle>
                        <TrendingUp className="h-4 w-4 text-muted-foreground" />
                    </CardHeader>
                    <CardContent>
                        <div className="text-2xl font-bold">{gpa.toFixed(1)}/4.0</div>
                        <p className="text-xs text-muted-foreground">Last 5 challenges average</p>
                    </CardContent>
                </Card>

                <Card>
                    <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                        <CardTitle className="text-sm font-medium">Overall Rating</CardTitle>
                        <Award className="h-4 w-4 text-muted-foreground" />
                    </CardHeader>
                    <CardContent>
                        <div className="text-2xl font-bold">{cgpa.toFixed(1)}/4.0</div>
                        <p className="text-xs text-muted-foreground">Overall performance</p>
                    </CardContent>
                </Card>

                <Card>
                    <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                        <CardTitle className="text-sm font-medium">Challenges Completed</CardTitle>
                        <BookOpen className="h-4 w-4 text-muted-foreground" />
                    </CardHeader>
                    <CardContent>
                        <div className="text-2xl font-bold">{results.length}</div>
                        <p className="text-xs text-muted-foreground">Total submissions</p>
                    </CardContent>
                </Card>

                <Card>
                    <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                        <CardTitle className="text-sm font-medium">Available Challenges</CardTitle>
                        <Calendar className="h-4 w-4 text-muted-foreground" />
                    </CardHeader>
                    <CardContent>
                        <div className="text-2xl font-bold">{challenges.length}</div>
                        <p className="text-xs text-muted-foreground">Ready to tackle</p>
                    </CardContent>
                </Card>
            </div>

            {/* Networking Domain Skills */}
            <Card>
                <CardHeader>
                    <CardTitle>Networking Domain Skills</CardTitle>
                    <CardDescription>Your performance across different networking areas</CardDescription>
                </CardHeader>
                <CardContent>
                    <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-5">
                        {['WIFI', 'VoIP', 'CCTV', 'LAN', 'Operations'].map((category) => {
                            const stats = getCategoryStats(category);
                            const skill = getSkillLevel(stats.average);
                            return (
                                <div key={category} className="rounded-lg border border-border p-4">
                                    <div className="flex items-center justify-between mb-2">
                                        <div className="flex items-center gap-2">
                                            {getCategoryIcon(category)}
                                            <span className="font-medium text-sm">{category}</span>
                                        </div>
                                    </div>
                                    <div className="space-y-2">
                                        <div className="text-2xl font-bold">{stats.average}%</div>
                                        <div className={`text-xs font-medium ${skill.color}`}>{skill.level}</div>
                                        <div className="text-xs text-muted-foreground">{stats.count} challenges</div>
                                        <div className="w-full bg-muted rounded-full h-2">
                                            <div
                                                className="bg-primary h-2 rounded-full transition-all duration-300"
                                                style={{ width: `${stats.average}%` }}
                                            />
                                        </div>
                                    </div>
                                </div>
                            );
                        })}
                    </div>
                </CardContent>
            </Card>

            {/* Available Challenges and Recent Results */}
            <div className="grid gap-6 lg:grid-cols-2">
                <Card>
                    <CardHeader>
                        <CardTitle>Available Challenges</CardTitle>
                        <CardDescription>Select a challenge to begin your training</CardDescription>
                    </CardHeader>
                    <CardContent>
                        <div className="space-y-4">
                            {challenges.length === 0 ? (
                                <p className="text-sm text-muted-foreground">No challenges available yet. Your supervisor will publish challenges soon.</p>
                            ) : (
                                challenges.map((challenge) => {
                                    const attempted = results.find(r => r.challengeId === challenge.id);
                                    const difficultyColor =
                                        challenge.difficulty === 'Beginner' ? 'bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-100' :
                                            challenge.difficulty === 'Intermediate' ? 'bg-yellow-100 text-yellow-800 dark:bg-yellow-900 dark:text-yellow-100' :
                                                'bg-red-100 text-red-800 dark:bg-red-900 dark:text-red-100';

                                    return (
                                        <div
                                            key={challenge.id}
                                            className="flex items-start justify-between rounded-lg border border-border p-4 hover:bg-muted/50 transition-colors"
                                        >
                                            <div className="flex items-start gap-3 flex-1">
                                                {getCategoryIcon(challenge.category || 'General')}
                                                <div className="flex-1">
                                                    <h4 className="font-medium">{challenge.title}</h4>
                                                    <div className="flex items-center gap-2 mt-1">
                            <span className={`inline-block rounded-full px-2 py-1 text-xs font-medium ${difficultyColor}`}>
                              {challenge.difficulty || 'N/A'}
                            </span>
                                                        <span className="text-xs text-muted-foreground">•</span>
                                                        <span className="text-xs text-muted-foreground">{challenge.category}</span>
                                                        {challenge.timeLimit && (
                                                            <>
                                                                <span className="text-xs text-muted-foreground">•</span>
                                                                <span className="text-xs text-muted-foreground">{challenge.timeLimit} min</span>
                                                            </>
                                                        )}
                                                    </div>
                                                    {challenge.description && (
                                                        <p className="text-sm text-muted-foreground mt-2 line-clamp-2">{challenge.description}</p>
                                                    )}
                                                    {attempted && (
                                                        <p className="text-sm text-green-600 mt-2 font-medium">
                                                            Previous Score: {attempted.score}%
                                                            {attempted.timeSpent && ` (${attempted.timeSpent} min)`}
                                                        </p>
                                                    )}
                                                </div>
                                            </div>
                                            <Button
                                                onClick={() => setSelectedChallenge(challenge.id)}
                                                variant={attempted ? 'outline' : 'default'}
                                                size="sm"
                                            >
                                                {attempted ? 'Retry' : 'Start'}
                                            </Button>
                                        </div>
                                    );
                                })
                            )}
                        </div>
                    </CardContent>
                </Card>

                <Card>
                    <CardHeader>
                        <CardTitle>Recent Results</CardTitle>
                        <CardDescription>Your latest performance and progress</CardDescription>
                    </CardHeader>
                    <CardContent>
                        {results.length === 0 ? (
                            <div className="text-center py-8">
                                <BookOpen className="h-12 w-12 text-muted-foreground mx-auto mb-4" />
                                <p className="text-sm text-muted-foreground">No results yet.</p>
                                <p className="text-sm text-muted-foreground">Complete a challenge to see your scores.</p>
                            </div>
                        ) : (
                            <div className="space-y-4">
                                {results.slice(0, 5).map((result) => {
                                    const challenge = challenges.find(c => c.id === result.challengeId);
                                    const grade = calculateGrade(result.score);
                                    return (
                                        <div
                                            key={result.id}
                                            className="flex items-center justify-between rounded-lg border border-border p-4 hover:bg-muted/50 transition-colors"
                                        >
                                            <div className="flex items-center gap-3">
                                                {getCategoryIcon(challenge?.category || 'General')}
                                                <div>
                                                    <h4 className="font-medium text-sm">{challenge?.title || 'Unknown Challenge'}</h4>
                                                    <div className="flex items-center gap-2 text-xs text-muted-foreground">
                                                        <span>{result.completedAt?.toLocaleDateString()}</span>
                                                        <span>•</span>
                                                        <span>{challenge?.category}</span>
                                                        {result.timeSpent && (
                                                            <>
                                                                <span>•</span>
                                                                <span>{result.timeSpent} min</span>
                                                            </>
                                                        )}
                                                    </div>
                                                </div>
                                            </div>
                                            <div className="text-right">
                                                <div className="text-lg font-bold">{result.score}%</div>
                                                <div className={`text-sm font-medium ${grade.letter === 'A' ? 'text-green-600' :
                                                    grade.letter === 'B' ? 'text-blue-600' :
                                                        grade.letter === 'C' ? 'text-yellow-600' :
                                                            grade.letter === 'D' ? 'text-orange-600' : 'text-red-600'}`}>
                                                    Grade: {grade.letter}
                                                </div>
                                            </div>
                                        </div>
                                    );
                                })}
                                {results.length > 5 && (
                                    <Button variant="outline" className="w-full" onClick={() => setShowResults(true)}>
                                        View All {results.length} Results
                                    </Button>
                                )}
                            </div>
                        )}
                    </CardContent>
                </Card>
            </div>

            {/* Work Schedule and Team Schedule */}
            {/* Enhanced Navigation Tabs */}
            <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-5">
                <Card className="cursor-pointer hover:shadow-xl hover:scale-105 hover:border-primary/50 transition-all duration-300 bg-gradient-to-br from-blue-50 to-blue-100 dark:from-blue-950 dark:to-blue-900 border-2"
                      onClick={() => setShowWeeklyReports(true)}>
                    <CardHeader className="pb-3">
                        <CardTitle className="flex items-center gap-2 text-blue-700 dark:text-blue-300">
                            <FileText className="h-5 w-5" />
                            Weekly Reports
                        </CardTitle>
                        <CardDescription className="text-blue-600 dark:text-blue-400">
                            Submit team experience reports
                        </CardDescription>
                    </CardHeader>
                </Card>

                <Card className="cursor-pointer hover:shadow-xl hover:scale-105 hover:border-primary/50 transition-all duration-300 bg-gradient-to-br from-green-50 to-green-100 dark:from-green-950 dark:to-green-900 border-2"
                      onClick={() => setShowLearningForum(true)}>
                    <CardHeader className="pb-3">
                        <CardTitle className="flex items-center gap-2 text-green-700 dark:text-green-300">
                            <GraduationCap className="h-5 w-5" />
                            Learning Forum
                        </CardTitle>
                        <CardDescription className="text-green-600 dark:text-green-400">
                            Access training materials
                        </CardDescription>
                    </CardHeader>
                </Card>

                <Card className="cursor-pointer hover:shadow-xl hover:scale-105 hover:border-primary/50 transition-all duration-300 bg-gradient-to-br from-purple-50 to-purple-100 dark:from-purple-950 dark:to-purple-900 border-2"
                      onClick={() => setShowPolicies(true)}>
                    <CardHeader className="pb-3">
                        <CardTitle className="flex items-center gap-2 text-purple-700 dark:text-purple-300">
                            <Shield className="h-5 w-5" />
                            Policies
                        </CardTitle>
                        <CardDescription className="text-purple-600 dark:text-purple-400">
                            Data center rules & regulations
                        </CardDescription>
                    </CardHeader>
                </Card>

                <Card className="cursor-pointer hover:shadow-xl hover:scale-105 hover:border-primary/50 transition-all duration-300 bg-gradient-to-br from-red-50 to-red-100 dark:from-red-950 dark:to-red-900 border-2"
                      onClick={() => setShowSecurity(true)}>
                    <CardHeader className="pb-3">
                        <CardTitle className="flex items-center gap-2 text-red-700 dark:text-red-300">
                            <Shield className="h-5 w-5" />
                            Security Center
                        </CardTitle>
                        <CardDescription className="text-red-600 dark:text-red-400">
                            Emergency contacts & passwords
                        </CardDescription>
                    </CardHeader>
                </Card>

                <Card className="cursor-pointer hover:shadow-xl hover:scale-105 hover:border-primary/50 transition-all duration-300 bg-gradient-to-br from-orange-50 to-orange-100 dark:from-orange-950 dark:to-orange-900 border-2">
                    <CardHeader className="pb-3">
                        <CardTitle className="flex items-center gap-2 text-orange-700 dark:text-orange-300">
                            <Calendar className="h-5 w-5" />
                            Quick Actions
                        </CardTitle>
                        <CardDescription className="text-orange-600 dark:text-orange-400">
                            Common tasks & shortcuts
                        </CardDescription>
                    </CardHeader>
                </Card>
            </div>

            <div className="grid gap-6 lg:grid-cols-2">
                <WorkSchedule />
                <TeamSchedule />
            </div>

            {/* Announcements Board */}
            <AnnouncementsBoard />

            {/* Enhanced Modals with Backdrop */}
            {showResults && (
                <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/30 backdrop-blur-sm">
                    <ChallengeResults onClose={() => setShowResults(false)} />
                </div>
            )}

            {showWeeklyReports && (
                <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/30 backdrop-blur-md">
                    <div className="max-h-[95vh] w-full max-w-4xl overflow-y-auto">
                        <WeeklyReports userRole="intern" onClose={() => setShowWeeklyReports(false)} />
                    </div>
                </div>
            )}

            {showPolicies && (
                <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/30 backdrop-blur-md">
                    <div className="max-h-[95vh] w-full max-w-4xl overflow-y-auto">
                        <DataCenterPolicies userRole="intern" onClose={() => setShowPolicies(false)} />
                    </div>
                </div>
            )}

            {showLearningForum && (
                <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/30 backdrop-blur-md">
                    <div className="max-h-[95vh] w-full max-w-6xl overflow-y-auto">
                        <LearningForum userRole="intern" onClose={() => setShowLearningForum(false)} />
                    </div>
                </div>
            )}

            {showSecurity && (
                <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/30 backdrop-blur-md">
                    <div className="max-h-[95vh] w-full max-w-4xl overflow-y-auto">
                        <SecurityInfo userRole="intern" onClose={() => setShowSecurity(false)} />
                    </div>
                </div>
            )}
        </div>
    );
}