'use client';

import { useState, useEffect } from 'react';
import { collection, getDocs } from 'firebase/firestore';
import { db, auth } from '@/lib/firebase';
import { ChallengeResult, NetworkingChallenge } from '@/types';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/Card';
import { Button } from '@/components/ui/Button';
import { X, Wifi, Phone, Camera, Network, Settings } from 'lucide-react';
import { calculateGrade } from '@/lib/utils';
import { format } from 'date-fns';
import toast from 'react-hot-toast';

interface ChallengeResultsProps {
    onClose: () => void;
}

export default function ChallengeResults({ onClose }: ChallengeResultsProps) {
    const [results, setResults] = useState<ChallengeResult[]>([]);
    const [challenges, setChallenges] = useState<{ [key: string]: NetworkingChallenge }>({});
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        fetchResults();
    }, []);

    const getCategoryIcon = (category: string) => {
        switch (category) {
            case 'WIFI': return <Wifi className="h-4 w-4" />;
            case 'VoIP': return <Phone className="h-4 w-4" />;
            case 'CCTV': return <Camera className="h-4 w-4" />;
            case 'LAN': return <Network className="h-4 w-4" />;
            case 'Operations': return <Settings className="h-4 w-4" />;
            default: return <Settings className="h-4 w-4" />;
        }
    };

    const getCategoryColor = (category: string) => {
        switch (category) {
            case 'WIFI': return 'bg-blue-100 text-blue-800 dark:bg-blue-900 dark:text-blue-100';
            case 'VoIP': return 'bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-100';
            case 'CCTV': return 'bg-purple-100 text-purple-800 dark:bg-purple-900 dark:text-purple-100';
            case 'LAN': return 'bg-orange-100 text-orange-800 dark:bg-orange-900 dark:text-orange-100';
            case 'Operations': return 'bg-gray-100 text-gray-800 dark:bg-gray-900 dark:text-gray-100';
            default: return 'bg-gray-100 text-gray-800 dark:bg-gray-900 dark:text-gray-100';
        }
    };

    const fetchResults = async () => {
        try {
            setLoading(true);
            const user = auth.currentUser;
            if (!user) return;

            // Try to fetch with both field names for backward compatibility
            const resultsSnapshot = await getDocs(collection(db, 'results'));
            const allResults = resultsSnapshot.docs.map(doc => ({
                id: doc.id,
                ...doc.data(),
                completedAt: doc.data().completedAt?.toDate(),
            })) as ChallengeResult[];

            // Filter results for current user (check both internUid and studentUid)
            const userResults = allResults.filter(result =>
                result.internUid === user.uid || result.studentUid === user.uid
            );
            setResults(userResults);

            const challengesSnapshot = await getDocs(collection(db, 'quizzes'));
            const challengesMap: { [key: string]: NetworkingChallenge } = {};
            challengesSnapshot.docs.forEach(doc => {
                challengesMap[doc.id] = {
                    id: doc.id,
                    ...doc.data(),
                    createdAt: doc.data().createdAt?.toDate(),
                } as NetworkingChallenge;
            });
            setChallenges(challengesMap);
        } catch (error) {
            console.error('Error fetching results:', error);
            toast.error('Failed to load results');
        } finally {
            setLoading(false);
        }
    };

    if (loading) {
        return (
            <div className="fixed inset-0 z-50 flex items-center justify-center bg-background/80 backdrop-blur-sm">
                <div className="h-8 w-8 animate-spin rounded-full border-4 border-primary border-t-transparent"></div>
            </div>
        );
    }

    return (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-background/80 backdrop-blur-sm">
            <Card className="max-h-[90vh] w-full max-w-5xl overflow-y-auto">
                <CardHeader>
                    <div className="flex items-center justify-between">
                        <CardTitle>All Challenge Results</CardTitle>
                        <Button variant="ghost" size="sm" onClick={onClose}>
                            <X className="h-5 w-5" />
                        </Button>
                    </div>
                </CardHeader>
                <CardContent>
                    {results.length === 0 ? (
                        <p className="text-center text-muted-foreground">No results to display.</p>
                    ) : (
                        <div className="overflow-x-auto">
                            <table className="w-full">
                                <thead>
                                <tr className="border-b border-border">
                                    <th className="p-3 text-left font-medium">Challenge</th>
                                    <th className="p-3 text-left font-medium">Category</th>
                                    <th className="p-3 text-left font-medium">Date</th>
                                    <th className="p-3 text-right font-medium">Time</th>
                                    <th className="p-3 text-right font-medium">Score</th>
                                    <th className="p-3 text-right font-medium">Grade</th>
                                </tr>
                                </thead>
                                <tbody>
                                {results.map((result) => {
                                    const challenge = challenges[result.challengeId];
                                    const grade = calculateGrade(result.score);
                                    return (
                                        <tr key={result.id} className="border-b border-border hover:bg-muted/50">
                                            <td className="p-3">
                                                <div className="font-medium">{challenge?.title || 'Unknown Challenge'}</div>
                                                <div className="text-sm text-muted-foreground">{challenge?.difficulty || 'N/A'}</div>
                                            </td>
                                            <td className="p-3">
                                                <div className="flex items-center gap-2">
                                                    {getCategoryIcon(result.category || challenge?.category || 'General')}
                                                    <span className={`inline-block rounded-full px-2 py-1 text-xs font-medium ${getCategoryColor(result.category || challenge?.category || 'General')}`}>
                              {result.category || challenge?.category || 'General'}
                            </span>
                                                </div>
                                            </td>
                                            <td className="p-3">
                                                {result.completedAt ? format(result.completedAt, 'MMM dd, yyyy') : 'N/A'}
                                            </td>
                                            <td className="p-3 text-right">
                                                {result.timeSpent ? `${result.timeSpent} min` : 'N/A'}
                                            </td>
                                            <td className="p-3 text-right font-medium">{result.score}%</td>
                                            <td className="p-3 text-right">
                          <span className={`inline-block rounded px-2 py-1 text-sm font-medium ${
                              grade.letter === 'A' ? 'bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-100' :
                                  grade.letter === 'B' ? 'bg-blue-100 text-blue-800 dark:bg-blue-900 dark:text-blue-100' :
                                      grade.letter === 'C' ? 'bg-yellow-100 text-yellow-800 dark:bg-yellow-900 dark:text-yellow-100' :
                                          grade.letter === 'D' ? 'bg-orange-100 text-orange-800 dark:bg-orange-900 dark:text-orange-100' :
                                              'bg-red-100 text-red-800 dark:bg-red-900 dark:text-red-100'
                          }`}>
                            {grade.letter}
                          </span>
                                            </td>
                                        </tr>
                                    );
                                })}
                                </tbody>
                            </table>
                        </div>
                    )}
                </CardContent>
            </Card>
        </div>
    );
}
