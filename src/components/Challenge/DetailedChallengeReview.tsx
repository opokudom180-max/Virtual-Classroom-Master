'use client';

import { useState, useEffect } from 'react';
import { collection, getDocs, query, where } from 'firebase/firestore';
import { db } from '@/lib/firebase';
import type {ChallengeResult, DetailedChallengeReview} from '@/types';
import { User, NetworkingChallenge, Question } from '@/types';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/Card';
import { Button } from '@/components/ui/Button';
import { Select } from '@/components/ui/Select';
import { X, CheckCircle, XCircle, User as UserIcon, Clock, Award, Wifi, Phone, Camera, Network, Settings } from 'lucide-react';
import { format } from 'date-fns';
import { calculateGrade } from '@/lib/utils';
import toast from 'react-hot-toast';

interface DetailedChallengeReviewProps {
    onClose: () => void;
}

export default function DetailedChallengeReview({ onClose }: DetailedChallengeReviewProps) {
    const [reviews, setReviews] = useState<DetailedChallengeReview[]>([]);
    const [selectedIntern, setSelectedIntern] = useState<string>('All');
    const [selectedChallenge, setSelectedChallenge] = useState<string>('All');
    const [selectedReview, setSelectedReview] = useState<DetailedChallengeReview | null>(null);
    const [interns, setInterns] = useState<User[]>([]);
    const [challenges, setChallenges] = useState<NetworkingChallenge[]>([]);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        fetchDetailedReviews();
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

    const fetchDetailedReviews = async () => {
        try {
            setLoading(true);

            // Fetch all interns
            const internsQuery = query(collection(db, 'users'), where('role', '==', 'intern'));
            const internsSnapshot = await getDocs(internsQuery);
            const internsData = internsSnapshot.docs.map(doc => ({
                uid: doc.id,
                ...doc.data(),
                createdAt: doc.data().createdAt?.toDate(),
            })) as User[];
            setInterns(internsData);

            // Fetch all challenges
            const challengesSnapshot = await getDocs(collection(db, 'quizzes'));
            const challengesData = challengesSnapshot.docs.map(doc => ({
                id: doc.id,
                ...doc.data(),
                createdAt: doc.data().createdAt?.toDate(),
            })) as NetworkingChallenge[];
            setChallenges(challengesData);

            // Fetch all results with detailed answers
            const resultsSnapshot = await getDocs(collection(db, 'results'));
            const resultsWithDetails = [];

            for (const resultDoc of resultsSnapshot.docs) {
                const docData = resultDoc.data();
                const resultData = {
                    id: resultDoc.id,
                    ...docData,
                    completedAt: docData.completedAt?.toDate(),
                } as ChallengeResult;

                // Only include results that have detailed answer tracking
                if (docData.answers && docData.correctAnswers) {
                    const challenge = challengesData.find(c => c.id === resultData.challengeId);
                    const intern = internsData.find(i => i.uid === (resultData.internUid || resultData.studentUid));

                    if (challenge && intern) {
                        // Fetch questions for this challenge
                        const questionsSnapshot = await getDocs(collection(db, 'quizzes', resultData.challengeId, 'questions'));
                        const questions = questionsSnapshot.docs.map(doc => ({
                            id: doc.id,
                            ...doc.data(),
                        })) as Question[];

                        resultsWithDetails.push({
                            result: resultData,
                            challenge,
                            questions,
                            internName: intern.name,
                        });
                    }
                }
            }

            setReviews(resultsWithDetails);
        } catch (error) {
            console.error('Error fetching detailed reviews:', error);
            toast.error('Failed to load challenge reviews');
        } finally {
            setLoading(false);
        }
    };

    const filteredReviews = reviews.filter(review => {
        const internMatch = selectedIntern === 'All' || (review.result.internUid || review.result.studentUid) === selectedIntern;
        const challengeMatch = selectedChallenge === 'All' || review.result.challengeId === selectedChallenge;
        return internMatch && challengeMatch;
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

    if (selectedReview) {
        const { result, challenge, questions } = selectedReview;
        calculateGrade(result.score);
        return (
            <Card className="shadow-xl border-2 border-primary/20">
                <CardHeader className="bg-gradient-to-r from-primary/10 to-accent/10">
                    <div className="flex items-center justify-between">
                        <div>
                            <CardTitle className="flex items-center gap-2">
                                {getCategoryIcon(challenge.category || 'General')}
                                Detailed Review: {challenge.title}
                            </CardTitle>
                            <CardDescription>
                                {selectedReview.internName} • {format(result.completedAt, 'MMM dd, yyyy HH:mm')}
                            </CardDescription>
                        </div>
                        <Button variant="ghost" size="sm" onClick={() => setSelectedReview(null)}>
                            <X className="h-5 w-5" />
                        </Button>
                    </div>
                </CardHeader>

                <CardContent className="p-6">
                    {/* Performance Summary */}
                    <div className="grid gap-4 md:grid-cols-4 mb-6">
                        <Card className="bg-gradient-to-br from-blue-50 to-blue-100 dark:from-blue-950 dark:to-blue-900">
                            <CardContent className="p-4 text-center">
                                <Award className="h-6 w-6 text-blue-600 mx-auto mb-2" />
                                <div className="text-2xl font-bold text-blue-800 dark:text-blue-200">{result.score}%</div>
                                <div className="text-sm text-blue-600 dark:text-blue-400">Score</div>
                            </CardContent>
                        </Card>

                        <Card className="bg-gradient-to-br from-green-50 to-green-100 dark:from-green-950 dark:to-green-900">
                            <CardContent className="p-4 text-center">
                                <CheckCircle className="h-6 w-6 text-green-600 mx-auto mb-2" />
                                <div className="text-2xl font-bold text-green-800 dark:text-green-200">
                                    {Object.keys(result.answers || {}).filter(qId =>
                                        result.answers?.[qId] === result.correctAnswers?.[qId]
                                    ).length}
                                </div>
                                <div className="text-sm text-green-600 dark:text-green-400">Correct</div>
                            </CardContent>
                        </Card>

                        <Card className="bg-gradient-to-br from-red-50 to-red-100 dark:from-red-950 dark:to-red-900">
                            <CardContent className="p-4 text-center">
                                <XCircle className="h-6 w-6 text-red-600 mx-auto mb-2" />
                                <div className="text-2xl font-bold text-red-800 dark:text-red-200">
                                    {Object.keys(result.answers || {}).filter(qId =>
                                        result.answers?.[qId] !== result.correctAnswers?.[qId]
                                    ).length}
                                </div>
                                <div className="text-sm text-red-600 dark:text-red-400">Incorrect</div>
                            </CardContent>
                        </Card>

                        <Card className="bg-gradient-to-br from-purple-50 to-purple-100 dark:from-purple-950 dark:to-purple-900">
                            <CardContent className="p-4 text-center">
                                <Clock className="h-6 w-6 text-purple-600 mx-auto mb-2" />
                                <div className="text-2xl font-bold text-purple-800 dark:text-purple-200">
                                    {result.timeSpent || 0}
                                </div>
                                <div className="text-sm text-purple-600 dark:text-purple-400">Minutes</div>
                            </CardContent>
                        </Card>
                    </div>

                    {/* Question-by-Question Review */}
                    <div className="space-y-4">
                        <h3 className="text-xl font-bold mb-4">Question-by-Question Analysis</h3>

                        {questions.map((question, index) => {
                            const internAnswer = result.answers?.[question.id];
                            const correctAnswer = question.correctAnswer;
                            const isCorrect = internAnswer === correctAnswer;

                            return (
                                <Card key={question.id} className={`border-2 ${isCorrect ? 'border-green-200 bg-green-50 dark:bg-green-950' : 'border-red-200 bg-red-50 dark:bg-red-950'}`}>
                                    <CardHeader>
                                        <div className="flex items-start justify-between">
                                            <CardTitle className="text-base flex items-center gap-2">
                                                {isCorrect ? <CheckCircle className="h-5 w-5 text-green-600" /> : <XCircle className="h-5 w-5 text-red-600" />}
                                                Question {index + 1}
                                            </CardTitle>
                                            <span className={`inline-block rounded px-2 py-1 text-sm font-medium ${
                                                isCorrect ? 'bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-100' :
                                                    'bg-red-100 text-red-800 dark:bg-red-900 dark:text-red-100'
                                            }`}>
                        {isCorrect ? 'Correct' : 'Incorrect'}
                      </span>
                                        </div>
                                        <CardDescription className="text-base font-medium">
                                            {question.questionText}
                                        </CardDescription>
                                    </CardHeader>

                                    <CardContent>
                                        <div className="grid gap-3 sm:grid-cols-2">
                                            {(['a', 'b', 'c', 'd'] as const).map((option) => {
                                                const optionText = question[`option${option.toUpperCase()}` as keyof Question] as string;
                                                const isInternChoice = internAnswer === option;
                                                const isCorrectOption = correctAnswer === option;

                                                return (
                                                    <div
                                                        key={option}
                                                        className={`p-3 rounded-lg border-2 ${
                                                            isCorrectOption
                                                                ? 'border-green-500 bg-green-100 dark:bg-green-900'
                                                                : isInternChoice && !isCorrectOption
                                                                    ? 'border-red-500 bg-red-100 dark:bg-red-900'
                                                                    : 'border-gray-200 bg-gray-50 dark:bg-gray-800'
                                                        }`}
                                                    >
                                                        <div className="flex items-center gap-2">
                                                            {isCorrectOption && <CheckCircle className="h-4 w-4 text-green-600" />}
                                                            {isInternChoice && !isCorrectOption && <XCircle className="h-4 w-4 text-red-600" />}
                                                            <span className="font-medium">{option.toUpperCase()}.</span>
                                                            <span className={
                                                                isCorrectOption ? 'text-green-800 dark:text-green-200 font-medium' :
                                                                    isInternChoice && !isCorrectOption ? 'text-red-800 dark:text-red-200 font-medium' :
                                                                        'text-gray-700 dark:text-gray-300'
                                                            }>
                                {optionText}
                              </span>
                                                        </div>
                                                        {isInternChoice && (
                                                            <div className="text-xs mt-1 font-medium text-blue-600 dark:text-blue-400">
                                                                ← Intern&apos;s Choice
                                                            </div>
                                                        )}
                                                    </div>
                                                );
                                            })}
                                        </div>
                                    </CardContent>
                                </Card>
                            );
                        })}
                    </div>

                    <div className="flex justify-center mt-6">
                        <Button onClick={() => setSelectedReview(null)} className="hover:shadow-lg transition-shadow">
                            Back to Reviews List
                        </Button>
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
                            <Award className="h-6 w-6 text-primary" />
                            Detailed Challenge Reviews
                        </CardTitle>
                        <CardDescription className="text-base">
                            Review intern answers and identify areas for improvement
                        </CardDescription>
                    </div>
                    <Button variant="ghost" size="sm" onClick={onClose}>
                        <X className="h-5 w-5" />
                    </Button>
                </div>
            </CardHeader>

            <CardContent className="p-6">
                {/* Filters */}
                <div className="grid gap-4 md:grid-cols-2 mb-6">
                    <div className="space-y-2">
                        <label className="text-sm font-medium">Filter by Intern</label>
                        <Select
                            value={selectedIntern}
                            onChange={(e) => setSelectedIntern(e.target.value)}
                            className="hover:shadow-md transition-shadow"
                        >
                            <option value="All">All Interns</option>
                            {interns.map(intern => (
                                <option key={intern.uid} value={intern.uid}>{intern.name}</option>
                            ))}
                        </Select>
                    </div>

                    <div className="space-y-2">
                        <label className="text-sm font-medium">Filter by Challenge</label>
                        <Select
                            value={selectedChallenge}
                            onChange={(e) => setSelectedChallenge(e.target.value)}
                            className="hover:shadow-md transition-shadow"
                        >
                            <option value="All">All Challenges</option>
                            {challenges.map(challenge => (
                                <option key={challenge.id} value={challenge.id}>{challenge.title}</option>
                            ))}
                        </Select>
                    </div>
                </div>

                {/* Results List */}
                <div className="space-y-4">
                    {filteredReviews.length === 0 ? (
                        <div className="text-center py-12">
                            <Award className="h-16 w-16 text-muted-foreground mx-auto mb-4" />
                            <p className="text-lg text-muted-foreground">No detailed reviews available yet.</p>
                            <p className="text-sm text-muted-foreground">Reviews are available for challenges completed after the latest update.</p>
                        </div>
                    ) : (
                        filteredReviews.map((review) => {
                            const grade = calculateGrade(review.result.score);
                            const correctAnswers = Object.keys(review.result.answers || {}).filter(qId =>
                                review.result.answers?.[qId] === review.result.correctAnswers?.[qId]
                            ).length;
                            const totalQuestions = Object.keys(review.result.answers || {}).length;

                            return (
                                <Card
                                    key={review.result.id}
                                    className="hover:shadow-lg hover:scale-[1.01] transition-all duration-200 cursor-pointer border-2 hover:border-primary/30"
                                    onClick={() => setSelectedReview(review)}
                                >
                                    <CardContent className="p-4">
                                        <div className="flex items-center justify-between">
                                            <div className="flex items-center gap-4">
                                                <div className="flex items-center gap-2">
                                                    <UserIcon className="h-5 w-5 text-blue-600" />
                                                    <span className="font-semibold text-lg">{review.internName}</span>
                                                </div>

                                                <div className="flex items-center gap-2">
                                                    {getCategoryIcon(review.challenge.category || 'General')}
                                                    <span className="font-medium">{review.challenge.title}</span>
                                                </div>
                                            </div>

                                            <div className="flex items-center gap-4">
                                                <div className="text-center">
                                                    <div className="text-lg font-bold">{review.result.score}%</div>
                                                    <div className={`text-sm font-medium ${
                                                        grade.letter === 'A' ? 'text-green-600' :
                                                            grade.letter === 'B' ? 'text-blue-600' :
                                                                grade.letter === 'C' ? 'text-yellow-600' :
                                                                    grade.letter === 'D' ? 'text-orange-600' : 'text-red-600'
                                                    }`}>
                                                        Grade {grade.letter}
                                                    </div>
                                                </div>

                                                <div className="text-center">
                                                    <div className="text-lg font-bold text-green-600">{correctAnswers}/{totalQuestions}</div>
                                                    <div className="text-sm text-muted-foreground">Correct</div>
                                                </div>

                                                <div className="text-center">
                                                    <div className="text-lg font-bold text-blue-600">{review.result.timeSpent || 0}m</div>
                                                    <div className="text-sm text-muted-foreground">Time</div>
                                                </div>
                                            </div>
                                        </div>

                                        <div className="mt-3 text-sm text-muted-foreground">
                                            {format(review.result.completedAt, 'MMMM dd, yyyy')} • {review.challenge.category} • {review.challenge.difficulty}
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