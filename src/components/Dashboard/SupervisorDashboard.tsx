'use client';

import { useState, useEffect } from 'react';
import { collection, getDocs, query, where } from 'firebase/firestore';
import { db } from '@/lib/firebase';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/Card';
import { Button } from '@/components/ui/Button';
import {
    BookOpen,
    Users,
    FileText,
    Calendar,
    TrendingUp,
    Shield,
    GraduationCap,
    BarChart3,
    Archive,
    Award
} from 'lucide-react';
import CreateChallengeForm from '@/components/Challenge/CreateChallengeForm';
import ManageSchedule from '@/components/Schedule/ManageSchedule';
import AnnouncementsBoard from '@/components/Announcements/AnnouncementsBoard';
import TechnicalDocuments from '@/components/Documents/TechnicalDocuments';
import PerformanceAnalytics from '@/components/Analytics/PerformanceAnalytics';
import WeeklyReports from '@/components/Reports/WeeklyReports';
import DataCenterPolicies from '@/components/Policies/DataCenterPolicies';
import LearningForum from '@/components/Learning/LearningForum';
import SecurityInfo from '@/components/Security/SecurityInfo';
import { NetworkingChallenge, User, ChallengeResult } from '@/types';
import toast from 'react-hot-toast';
import WorkSchedule from "@/components/Schedule/WorkSchedule";
import TeamSchedule from "@/components/Timetable/Timetable";
import ChallengeResults from "@/components/Challenge/ChallengeResults";
import QuestionBank from '@/components/QuestionBank/QuestionBank';
import DetailedChallengeReview from '@/components/Challenge/DetailedChallengeReview';

export default function SupervisorDashboard() {
    const [showCreateChallenge, setShowCreateChallenge] = useState(false);
    const [showManageSchedule, setShowManageSchedule] = useState(false);
    const [showDocuments, setShowDocuments] = useState(false);
    const [showAnalytics, setShowAnalytics] = useState(false);
    const [showWeeklyReports, setShowWeeklyReports] = useState(false);
    const [showPolicies, setShowPolicies] = useState(false);
    const [showLearningForum, setShowLearningForum] = useState(false);
    const [showSecurity, setShowSecurity] = useState(false);
    const [showResults, setShowResults] = useState(false);
    const [showActiveChallenge, setShowActiveChallenge] = useState(false);
    const [showQuestionBank, setShowQuestionBank] = useState(false);
    const [showDetailedReview, setShowDetailedReview] = useState(false);
    const [challenges, setChallenges] = useState<NetworkingChallenge[]>([]);
    const [interns, setInterns] = useState<User[]>([]);
    const [results, setResults] = useState<ChallengeResult[]>([]);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        fetchData();
    }, []);

    const fetchData = async () => {
        try {
            setLoading(true);

            const challengesSnapshot = await getDocs(collection(db, 'quizzes'));
            const challengesData = challengesSnapshot.docs.map(doc => ({
                id: doc.id,
                ...doc.data(),
                createdAt: doc.data().createdAt?.toDate(),
            })) as NetworkingChallenge[];
            setChallenges(challengesData);

            const internsQuery = query(collection(db, 'users'), where('role', '==', 'intern'));
            const internsSnapshot = await getDocs(internsQuery);
            const internsData = internsSnapshot.docs.map(doc => ({
                uid: doc.id,
                ...doc.data(),
                createdAt: doc.data().createdAt?.toDate(),
            })) as User[];
            setInterns(internsData);

            const resultsSnapshot = await getDocs(collection(db, 'results'));
            const resultsData = resultsSnapshot.docs.map(doc => ({
                id: doc.id,
                ...doc.data(),
                completedAt: doc.data().completedAt?.toDate(),
            })) as ChallengeResult[];
            setResults(resultsData);
        } catch (error) {
            console.error('Error fetching data:', error);
            toast.error('Failed to load dashboard data');
        } finally {
            setLoading(false);
        }
    };

    const getCategoryStats = () => {
        const categories = ['WIFI', 'VoIP', 'CCTV', 'LAN', 'Operations'];
        return categories.map(category => {
            const categoryResults = results.filter(r => {
                const challenge = challenges.find(c => c.id === r.challengeId);
                return challenge?.category === category;
            });
            const average = categoryResults.length > 0
                ? categoryResults.reduce((sum, r) => sum + r.score, 0) / categoryResults.length
                : 0;
            return {
                category,
                count: categoryResults.length,
                average: Math.round(average)
            };
        });
    };

    const getRecentSubmissions = () => {
        return results
            .sort((a, b) => (b.completedAt?.getTime() || 0) - (a.completedAt?.getTime() || 0))
            .slice(0, 10)
            .map(result => {
                const challenge = challenges.find(c => c.id === result.challengeId);
                const intern = interns.find(i => i.uid === (result.internUid || result.studentUid));
                return {
                    ...result,
                    challengeTitle: challenge?.title || 'Unknown Challenge',
                    challengeCategory: challenge?.category || 'General',
                    internName: intern?.name || 'Unknown Intern',
                };
            });
    };

    if (loading) {
        return (
            <div className="flex min-h-screen items-center justify-center">
                <div className="h-8 w-8 animate-spin rounded-full border-4 border-primary border-t-transparent"></div>
            </div>
        );
    }

    return (
        <div className="space-y-8">
            <div>
                <h1 className="text-3xl font-bold">Supervisor Dashboard</h1>
                <p className="text-muted-foreground mt-2">Manage interns, create challenges, and track performance.</p>
            </div>

            <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-4">
                <Card>
                    <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                        <CardTitle className="text-sm font-medium">Total Interns</CardTitle>
                        <Users className="h-4 w-4 text-muted-foreground" />
                    </CardHeader>
                    <CardContent>
                        <div className="text-2xl font-bold">{interns.length}</div>
                        <p className="text-xs text-muted-foreground">Active interns</p>
                    </CardContent>
                </Card>

                <Card>
                    <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                        <CardTitle className="text-sm font-medium">Active Challenges</CardTitle>
                        <BookOpen className="h-4 w-4 text-muted-foreground" />
                    </CardHeader>
                    <CardContent>
                        <div className="text-2xl font-bold">{challenges.length}</div>
                        <p className="text-xs text-muted-foreground">Published challenges</p>
                    </CardContent>
                </Card>

                <Card>
                    <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                        <CardTitle className="text-sm font-medium">Total Submissions</CardTitle>
                        <FileText className="h-4 w-4 text-muted-foreground" />
                    </CardHeader>
                    <CardContent>
                        <div className="text-2xl font-bold">{results.length}</div>
                        <p className="text-xs text-muted-foreground">Challenge attempts</p>
                    </CardContent>
                </Card>

                <Card>
                    <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                        <CardTitle className="text-sm font-medium">Average Score</CardTitle>
                        <TrendingUp className="h-4 w-4 text-muted-foreground" />
                    </CardHeader>
                    <CardContent>
                        <div className="text-2xl font-bold">
                            {results.length > 0
                                ? Math.round(results.reduce((sum, r) => sum + r.score, 0) / results.length)
                                : 0}%
                        </div>
                        <p className="text-xs text-muted-foreground">Overall performance</p>
                    </CardContent>
                </Card>
            </div>

            {/* Category Performance Overview */}
            <Card>
                <CardHeader>
                    <CardTitle>Performance by Category</CardTitle>
                    <CardDescription>Average scores across networking domains</CardDescription>
                </CardHeader>
                <CardContent>
                    <div className="grid gap-4 md:grid-cols-5">
                        {getCategoryStats().map((stat) => (
                            <div key={stat.category} className="flex flex-col items-center space-y-2 rounded-lg border border-border p-4">
                                <div className="text-sm font-medium">{stat.category}</div>
                                <div className="text-2xl font-bold">{stat.average}%</div>
                                <div className="text-xs text-muted-foreground">{stat.count} attempts</div>
                            </div>
                        ))}
                    </div>
                </CardContent>
            </Card>

            {/* Enhanced Management Tabs */}
            <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
                <Card className="cursor-pointer hover:shadow-xl hover:scale-105 hover:border-primary/50 transition-all duration-300 bg-gradient-to-br from-blue-50 to-blue-100 dark:from-blue-950 dark:to-blue-900 border-2"
                      onClick={() => setShowCreateChallenge(true)}>
                    <CardHeader>
                        <CardTitle className="flex items-center gap-2 text-blue-700 dark:text-blue-300">
                            <BookOpen className="h-5 w-5" />
                            Create Challenge
                        </CardTitle>
                        <CardDescription className="text-blue-600 dark:text-blue-400">Design networking problems for interns</CardDescription>
                    </CardHeader>
                </Card>

                <Card className="cursor-pointer hover:shadow-xl hover:scale-105 hover:border-primary/50 transition-all duration-300 bg-gradient-to-br from-green-50 to-green-100 dark:from-green-950 dark:to-green-900 border-2"
                      onClick={() => setShowManageSchedule(true)}>
                    <CardHeader>
                        <CardTitle className="flex items-center gap-2 text-green-700 dark:text-green-300">
                            <Calendar className="h-5 w-5" />
                            Manage Schedule
                        </CardTitle>
                        <CardDescription className="text-green-600 dark:text-green-400">Assign interns to networking teams</CardDescription>
                    </CardHeader>
                </Card>

                <Card className="cursor-pointer hover:shadow-xl hover:scale-105 hover:border-primary/50 transition-all duration-300 bg-gradient-to-br from-purple-50 to-purple-100 dark:from-purple-950 dark:to-purple-900 border-2"
                      onClick={() => setShowDocuments(true)}>
                    <CardHeader>
                        <CardTitle className="flex items-center gap-2 text-purple-700 dark:text-purple-300">
                            <FileText className="h-5 w-5" />
                            Technical Docs
                        </CardTitle>
                        <CardDescription className="text-purple-600 dark:text-purple-400">Upload manuals and procedures</CardDescription>
                    </CardHeader>
                </Card>

                <Card className="cursor-pointer hover:shadow-xl hover:scale-105 hover:border-primary/50 transition-all duration-300 bg-gradient-to-br from-orange-50 to-orange-100 dark:from-orange-950 dark:to-orange-900 border-2"
                      onClick={() => setShowAnalytics(true)}>
                    <CardHeader>
                        <CardTitle className="flex items-center gap-2 text-orange-700 dark:text-orange-300">
                            <BarChart3 className="h-5 w-5" />
                            Analytics
                        </CardTitle>
                        <CardDescription className="text-orange-600 dark:text-orange-400">Detailed performance insights</CardDescription>
                    </CardHeader>
                </Card>

                <Card className="cursor-pointer hover:shadow-xl hover:scale-105 hover:border-primary/50 transition-all duration-300 bg-gradient-to-br from-cyan-50 to-cyan-100 dark:from-cyan-950 dark:to-cyan-900 border-2"
                      onClick={() => setShowWeeklyReports(true)}>
                    <CardHeader>
                        <CardTitle className="flex items-center gap-2 text-cyan-700 dark:text-cyan-300">
                            <FileText className="h-5 w-5" />
                            Weekly Reports
                        </CardTitle>
                        <CardDescription className="text-cyan-600 dark:text-cyan-400">Review intern reports</CardDescription>
                    </CardHeader>
                </Card>

                <Card className="cursor-pointer hover:shadow-xl hover:scale-105 hover:border-primary/50 transition-all duration-300 bg-gradient-to-br from-indigo-50 to-indigo-100 dark:from-indigo-950 dark:to-indigo-900 border-2"
                      onClick={() => setShowPolicies(true)}>
                    <CardHeader>
                        <CardTitle className="flex items-center gap-2 text-indigo-700 dark:text-indigo-300">
                            <Shield className="h-5 w-5" />
                            Policies
                        </CardTitle>
                        <CardDescription className="text-indigo-600 dark:text-indigo-400">Manage data center policies</CardDescription>
                    </CardHeader>
                </Card>

                <Card className="cursor-pointer hover:shadow-xl hover:scale-105 hover:border-primary/50 transition-all duration-300 bg-gradient-to-br from-emerald-50 to-emerald-100 dark:from-emerald-950 dark:to-emerald-900 border-2"
                      onClick={() => setShowLearningForum(true)}>
                    <CardHeader>
                        <CardTitle className="flex items-center gap-2 text-emerald-700 dark:text-emerald-300">
                            <GraduationCap className="h-5 w-5" />
                            Learning Forum
                        </CardTitle>
                        <CardDescription className="text-emerald-600 dark:text-emerald-400">Create learning modules</CardDescription>
                    </CardHeader>
                </Card>

                <Card className="cursor-pointer hover:shadow-xl hover:scale-105 hover:border-primary/50 transition-all duration-300 bg-gradient-to-br from-red-50 to-red-100 dark:from-red-950 dark:to-red-900 border-2"
                      onClick={() => setShowSecurity(true)}>
                    <CardHeader>
                        <CardTitle className="flex items-center gap-2 text-red-700 dark:text-red-300">
                            <Shield className="h-5 w-5" />
                            Security Center
                        </CardTitle>
                        <CardDescription className="text-red-600 dark:text-red-400">Manage emergency info</CardDescription>
                    </CardHeader>
                </Card>

                <Card className="cursor-pointer hover:shadow-xl hover:scale-105 hover:border-primary/50 transition-all duration-300 bg-gradient-to-br from-violet-50 to-violet-100 dark:from-violet-950 dark:to-violet-900 border-2"
                      onClick={() => setShowQuestionBank(true)}>
                    <CardHeader>
                        <CardTitle className="flex items-center gap-2 text-violet-700 dark:text-violet-300">
                            <Archive className="h-5 w-5" />
                            Question Bank
                        </CardTitle>
                        <CardDescription className="text-violet-600 dark:text-violet-400">Manage reusable challenges</CardDescription>
                    </CardHeader>
                </Card>

                <Card className="cursor-pointer hover:shadow-xl hover:scale-105 hover:border-primary/50 transition-all duration-300 bg-gradient-to-br from-pink-50 to-pink-100 dark:from-pink-950 dark:to-pink-900 border-2"
                      onClick={() => setShowDetailedReview(true)}>
                    <CardHeader>
                        <CardTitle className="flex items-center gap-2 text-pink-700 dark:text-pink-300">
                            <Award className="h-5 w-5" />
                            Review Answers
                        </CardTitle>
                        <CardDescription className="text-pink-600 dark:text-pink-400">See intern mistakes & answers</CardDescription>
                    </CardHeader>
                </Card>
            </div>

            <div className="grid gap-6 lg:grid-cols-2">
                <WorkSchedule />
                <TeamSchedule />
            </div>

            {/* Enhanced Announcements Board */}
            <div className="rounded-xl border-2 border-primary/20 shadow-lg overflow-hidden">
                <AnnouncementsBoard />
            </div>

            {/* All Modals with Enhanced Styling */}
            {showResults && (
                <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/30 backdrop-blur-sm">
                    <ChallengeResults onClose={() => setShowResults(false)} />
                </div>
            )}

            {showQuestionBank && (
                <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/30 backdrop-blur-md">
                    <div className="max-h-[95vh] w-full max-w-7xl overflow-y-auto">
                        <QuestionBank onClose={() => setShowQuestionBank(false)} />
                    </div>
                </div>
            )}

            {showDetailedReview && (
                <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/30 backdrop-blur-md">
                    <div className="max-h-[95vh] w-full max-w-7xl overflow-y-auto">
                        <DetailedChallengeReview onClose={() => setShowDetailedReview(false)} />
                    </div>
                </div>
            )}

            {showWeeklyReports && (
                <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/30 backdrop-blur-md">
                    <div className="max-h-[95vh] w-full max-w-5xl overflow-y-auto">
                        <WeeklyReports userRole="supervisor" onClose={() => setShowWeeklyReports(false)} />
                    </div>
                </div>
            )}

            {showPolicies && (
                <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/30 backdrop-blur-md">
                    <div className="max-h-[95vh] w-full max-w-4xl overflow-y-auto">
                        <DataCenterPolicies userRole="supervisor" onClose={() => setShowPolicies(false)} />
                    </div>
                </div>
            )}

            {showLearningForum && (
                <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/30 backdrop-blur-md">
                    <div className="max-h-[95vh] w-full max-w-6xl overflow-y-auto">
                        <LearningForum userRole="supervisor" onClose={() => setShowLearningForum(false)} />
                    </div>
                </div>
            )}

            {showSecurity && (
                <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/30 backdrop-blur-md">
                    <div className="max-h-[95vh] w-full max-w-4xl overflow-y-auto">
                        <SecurityInfo userRole="supervisor" onClose={() => setShowSecurity(false)} />
                    </div>
                </div>
            )}

            {/* Active Challenges Overview */}
            <div className="grid gap-6 lg:grid-cols-2">
                <Card>
                    <CardHeader>
                        <div className="flex items-center justify-between">
                            <CardTitle>Active Challenges</CardTitle>
                            <Button variant="outline" size="sm" onClick={() => setShowActiveChallenge(!showActiveChallenge)}>
                                {showActiveChallenge ? 'Hide Details' : 'View All'}
                            </Button>
                        </div>
                        <CardDescription>Published challenges and performance overview</CardDescription>
                    </CardHeader>
                    <CardContent>
                        {challenges.length === 0 ? (
                            <p className="text-center text-muted-foreground">No challenges created yet.</p>
                        ) : (
                            <div className="space-y-4">
                                {(showActiveChallenge ? challenges : challenges.slice(0, 3)).map((challenge) => {
                                    const challengeResults = results.filter(r => r.challengeId === challenge.id);
                                    const avgScore = challengeResults.length > 0
                                        ? Math.round(challengeResults.reduce((sum, r) => sum + r.score, 0) / challengeResults.length)
                                        : 0;
                                    return (
                                        <div key={challenge.id} className="flex items-center justify-between rounded-lg border border-border p-4 hover:shadow-md hover:bg-muted/50 transition-all duration-200">
                                            <div>
                                                <h4 className="font-medium">{challenge.title}</h4>
                                                <p className="text-sm text-muted-foreground">
                                                    {challenge.category} • {challenge.difficulty} • {challengeResults.length} submissions
                                                </p>
                                                {challenge.description && (
                                                    <p className="text-xs text-muted-foreground mt-1 max-w-md truncate">{challenge.description}</p>
                                                )}
                                            </div>
                                            <div className="text-right">
                                                <div className="text-lg font-bold">{avgScore}%</div>
                                                <div className="text-sm text-muted-foreground">Average Score</div>
                                                <Button
                                                    size="sm"
                                                    variant="outline"
                                                    className="mt-2 hover:shadow-md transition-shadow"
                                                    onClick={() => setShowResults(true)}
                                                >
                                                    View Details
                                                </Button>
                                            </div>
                                        </div>
                                    );
                                })}
                            </div>
                        )}
                    </CardContent>
                </Card>

                {/* Recent Submissions */}
                <Card>
                    <CardHeader>
                        <CardTitle>Recent Submissions</CardTitle>
                        <CardDescription>Latest intern challenge attempts</CardDescription>
                    </CardHeader>
                    <CardContent>
                        {results.length === 0 ? (
                            <p className="text-center text-muted-foreground">No submissions yet.</p>
                        ) : (
                            <div className="space-y-3">
                                {getRecentSubmissions().map((submission) => (
                                    <div key={submission.id} className="flex items-center justify-between rounded-lg border border-border p-3">
                                        <div>
                                            <div className="font-medium text-sm">{submission.internName}</div>
                                            <div className="text-xs text-muted-foreground">{submission.challengeTitle}</div>
                                            <div className="text-xs text-muted-foreground">
                                                {submission.challengeCategory} • {submission.completedAt?.toLocaleDateString()}
                                            </div>
                                        </div>
                                        <div className="text-right">
                                            <div className="font-bold">{submission.score}%</div>
                                            {submission.timeSpent && (
                                                <div className="text-xs text-muted-foreground">{submission.timeSpent}m</div>
                                            )}
                                        </div>
                                    </div>
                                ))}
                            </div>
                        )}
                    </CardContent>
                </Card>
            </div>

            <AnnouncementsBoard />

            {/* Modal Components */}
            {showCreateChallenge && (
                <div className="fixed inset-0 z-50 flex items-center justify-center bg-background/80 backdrop-blur-sm">
                    <div className="max-h-[90vh] w-full max-w-2xl overflow-y-auto rounded-lg bg-background p-6 shadow-lg">
                        <CreateChallengeForm
                            onSuccess={() => {
                                setShowCreateChallenge(false);
                                fetchData();
                                toast.success('Challenge created successfully!');
                            }}
                            onCancel={() => setShowCreateChallenge(false)}
                        />
                    </div>
                </div>
            )}

            {showManageSchedule && (
                <div className="fixed inset-0 z-50 flex items-center justify-center bg-background/80 backdrop-blur-sm">
                    <div className="max-h-[90vh] w-full max-w-4xl overflow-y-auto rounded-lg bg-background p-6 shadow-lg">
                        <ManageSchedule
                            onSuccess={() => {
                                setShowManageSchedule(false);
                                fetchData();
                                toast.success('Schedule updated successfully!');
                            }}
                            onCancel={() => setShowManageSchedule(false)}
                        />
                    </div>
                </div>
            )}

            {showDocuments && (
                <div className="fixed inset-0 z-50 flex items-center justify-center bg-background/80 backdrop-blur-sm">
                    <div className="max-h-[90vh] w-full max-w-2xl overflow-y-auto rounded-lg bg-background p-6 shadow-lg">
                        <TechnicalDocuments
                            onSuccess={() => {
                                setShowDocuments(false);
                                toast.success('Document uploaded successfully!');
                            }}
                            onCancel={() => setShowDocuments(false)}
                        />
                    </div>
                </div>
            )}

            {showAnalytics && (
                <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/30 backdrop-blur-md">
                    <div className="max-h-[95vh] w-full max-w-6xl overflow-y-auto">
                        <PerformanceAnalytics
                            onClose={() => setShowAnalytics(false)}
                        />
                    </div>
                </div>
            )}

            {showWeeklyReports && (
                <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/30 backdrop-blur-md">
                    <div className="max-h-[95vh] w-full max-w-5xl overflow-y-auto">
                        <WeeklyReports userRole="supervisor" onClose={() => setShowWeeklyReports(false)} />
                    </div>
                </div>
            )}

            {showPolicies && (
                <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/30 backdrop-blur-md">
                    <div className="max-h-[95vh] w-full max-w-4xl overflow-y-auto">
                        <DataCenterPolicies userRole="supervisor" onClose={() => setShowPolicies(false)} />
                    </div>
                </div>
            )}

            {showLearningForum && (
                <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/30 backdrop-blur-md">
                    <div className="max-h-[95vh] w-full max-w-6xl overflow-y-auto">
                        <LearningForum userRole="supervisor" onClose={() => setShowLearningForum(false)} />
                    </div>
                </div>
            )}

            {showSecurity && (
                <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/30 backdrop-blur-md">
                    <div className="max-h-[95vh] w-full max-w-4xl overflow-y-auto">
                        <SecurityInfo userRole="supervisor" onClose={() => setShowSecurity(false)} />
                    </div>
                </div>
            )}

            {showResults && (
                <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/30 backdrop-blur-sm">
                    <ChallengeResults onClose={() => setShowResults(false)} />
                </div>
            )}
        </div>
    );
}