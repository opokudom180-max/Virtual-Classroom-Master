'use client';

import { useState } from 'react';
import { collection, addDoc, serverTimestamp } from 'firebase/firestore';
import { logEvent } from 'firebase/analytics';
import { db, auth, analytics } from '@/lib/firebase';
import { Button } from '@/components/ui/Button';
import { Input } from '@/components/ui/Input';
import { Label } from '@/components/ui/Label';
import { Select } from '@/components/ui/Select';
import { Textarea } from '@/components/ui/Textarea';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/Card';
import { PlusCircle, X, Wifi, Phone, Camera, Network, Settings } from 'lucide-react';
import toast from 'react-hot-toast';

interface QuestionForm {
    questionText: string;
    optionA: string;
    optionB: string;
    optionC: string;
    optionD: string;
    correctAnswer: 'a' | 'b' | 'c' | 'd';
    category: 'WIFI' | 'VoIP' | 'CCTV' | 'LAN' | 'Operations' | 'Security';
    difficulty: 'Beginner' | 'Intermediate' | 'Advanced';
}

interface CreateChallengeFormProps {
    onSuccess: () => void;
    onCancel: () => void;
}

export default function CreateChallengeForm({ onSuccess, onCancel }: CreateChallengeFormProps) {
    const [title, setTitle] = useState('');
    const [description, setDescription] = useState('');
    const [category, setCategory] = useState<'WIFI' | 'VoIP' | 'CCTV' | 'LAN' | 'Operations' | 'Security'>('WIFI');
    const [difficulty, setDifficulty] = useState<'Beginner' | 'Intermediate' | 'Advanced'>('Beginner');
    const [timeLimit, setTimeLimit] = useState<number>(30);
    const [questions, setQuestions] = useState<QuestionForm[]>([
        {
            questionText: '',
            optionA: '',
            optionB: '',
            optionC: '',
            optionD: '',
            correctAnswer: 'a',
            category: 'WIFI',
            difficulty: 'Beginner'
        },
    ]);
    const [loading, setLoading] = useState(false);

    const getCategoryIcon = (cat: string) => {
        switch (cat) {
            case 'WIFI': return <Wifi className="h-4 w-4" />;
            case 'VoIP': return <Phone className="h-4 w-4" />;
            case 'CCTV': return <Camera className="h-4 w-4" />;
            case 'LAN': return <Network className="h-4 w-4" />;
            case 'Operations': return <Settings className="h-4 w-4" />;
            default: return <Settings className="h-4 w-4" />;
        }
    };

    const addQuestion = () => {
        setQuestions([...questions, {
            questionText: '',
            optionA: '',
            optionB: '',
            optionC: '',
            optionD: '',
            correctAnswer: 'a',
            category: category,
            difficulty: difficulty
        }]);
    };

    const removeQuestion = (index: number) => {
        if (questions.length > 1) {
            setQuestions(questions.filter((_, i) => i !== index));
        }
    };

    const updateQuestion = (index: number, field: keyof QuestionForm, value: string) => {
        const updated = [...questions];
        updated[index] = { ...updated[index], [field]: value };
        setQuestions(updated);
    };

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();

        if (!title.trim() || !description.trim()) {
            toast.error('Please enter challenge title and description');
            return;
        }

        const invalidQuestion = questions.find(
            q => !q.questionText.trim() || !q.optionA.trim() || !q.optionB.trim() || !q.optionC.trim() || !q.optionD.trim()
        );

        if (invalidQuestion) {
            toast.error('Please fill out all question fields');
            return;
        }

        try {
            setLoading(true);
            const user = auth.currentUser;
            if (!user) throw new Error('Not authenticated');

            // Save to Question Bank first
            const bankChallengeRef = await addDoc(collection(db, 'questionBank'), {
                supervisorUid: user.uid,
                title: title.trim(),
                description: description.trim(),
                category,
                difficulty,
                timeLimit,
                isPublished: true, // Auto-publish new challenges
                publishedDate: serverTimestamp(),
                usageCount: 1,
                batchYear: new Date().getFullYear(),
                createdAt: serverTimestamp(),
            });

            // Save questions to Question Bank
            for (const question of questions) {
                await addDoc(collection(db, 'questionBankQuestions'), {
                    challengeId: bankChallengeRef.id,
                    questionText: question.questionText.trim(),
                    optionA: question.optionA.trim(),
                    optionB: question.optionB.trim(),
                    optionC: question.optionC.trim(),
                    optionD: question.optionD.trim(),
                    correctAnswer: question.correctAnswer,
                    category: question.category,
                    difficulty: question.difficulty,
                });
            }

            // Also save to active quizzes for backward compatibility
            const challengeRef = await addDoc(collection(db, 'quizzes'), {
                supervisorUid: user.uid,
                teacherUid: user.uid, // Backward compatibility
                title: title.trim(),
                description: description.trim(),
                category,
                difficulty,
                timeLimit,
                questionBankId: bankChallengeRef.id,
                createdAt: serverTimestamp(),
            });

            for (const question of questions) {
                await addDoc(collection(db, 'quizzes', challengeRef.id, 'questions'), {
                    questionText: question.questionText.trim(),
                    optionA: question.optionA.trim(),
                    optionB: question.optionB.trim(),
                    optionC: question.optionC.trim(),
                    optionD: question.optionD.trim(),
                    correctAnswer: question.correctAnswer,
                    category: question.category,
                    difficulty: question.difficulty,
                });
            }

            // Log analytics event for challenge creation
            const analyticsInstance = await analytics;
            if (analyticsInstance) {
                logEvent(analyticsInstance, 'create_challenge', {
                    challenge_title: title.trim(),
                    category: category,
                    difficulty: difficulty,
                    question_count: questions.length,
                });
            }

            onSuccess();
        } catch (error) {
            console.error('Error creating challenge:', error);
            toast.error('Failed to create challenge');
        } finally {
            setLoading(false);
        }
    };

    return (
        <form onSubmit={handleSubmit} className="space-y-6">
            <div className="flex items-center justify-between">
                <h2 className="text-2xl font-bold">Create Networking Challenge</h2>
                <Button type="button" variant="ghost" size="sm" onClick={onCancel}>
                    <X className="h-5 w-5" />
                </Button>
            </div>

            <div className="grid gap-4 sm:grid-cols-2">
                <div className="space-y-2">
                    <Label htmlFor="title">Challenge Title</Label>
                    <Input
                        id="title"
                        value={title}
                        onChange={(e) => setTitle(e.target.value)}
                        placeholder="e.g., WIFI Configuration Troubleshooting"
                        required
                    />
                </div>

                <div className="space-y-2">
                    <Label htmlFor="category">Category</Label>
                    <Select
                        id="category"
                        value={category}
                        onChange={(e) => setCategory(e.target.value as 'WIFI' | 'VoIP' | 'CCTV' | 'LAN' | 'Operations' | 'Security')}
                    >
                        <option value="WIFI">WIFI</option>
                        <option value="VoIP">VoIP</option>
                        <option value="CCTV">CCTV</option>
                        <option value="LAN">LAN</option>
                        <option value="Operations">Operations</option>
                        <option value="Security">Security</option>
                    </Select>
                </div>

                <div className="space-y-2">
                    <Label htmlFor="difficulty">Difficulty</Label>
                    <Select
                        id="difficulty"
                        value={difficulty}
                        onChange={(e) => setDifficulty(e.target.value as 'Beginner' | 'Intermediate' | 'Advanced')}
                    >
                        <option value="Beginner">Beginner</option>
                        <option value="Intermediate">Intermediate</option>
                        <option value="Advanced">Advanced</option>
                    </Select>
                </div>

                <div className="space-y-2">
                    <Label htmlFor="timeLimit">Time Limit (minutes)</Label>
                    <Input
                        id="timeLimit"
                        type="number"
                        value={timeLimit}
                        onChange={(e) => setTimeLimit(Number(e.target.value))}
                        min="5"
                        max="120"
                    />
                </div>
            </div>

            <div className="space-y-2">
                <Label htmlFor="description">Description</Label>
                <Textarea
                    id="description"
                    value={description}
                    onChange={(e) => setDescription(e.target.value)}
                    placeholder="Describe the networking scenario and what interns need to solve..."
                    rows={3}
                    required
                />
            </div>

            <div className="space-y-4">
                <div className="flex items-center justify-between">
                    <Label>Questions</Label>
                    <Button type="button" variant="outline" size="sm" onClick={addQuestion}>
                        <PlusCircle className="mr-2 h-4 w-4" />
                        Add Question
                    </Button>
                </div>

                {questions.map((question, index) => (
                    <Card key={index}>
                        <CardHeader>
                            <CardTitle className="flex items-center justify-between text-base">
                                <div className="flex items-center gap-2">
                                    {getCategoryIcon(question.category)}
                                    Question {index + 1}
                                </div>
                                {questions.length > 1 && (
                                    <Button type="button" variant="ghost" size="sm" onClick={() => removeQuestion(index)}>
                                        <X className="h-4 w-4" />
                                    </Button>
                                )}
                            </CardTitle>
                        </CardHeader>
                        <CardContent className="space-y-4">
                            <div className="space-y-2">
                                <Label>Question Text</Label>
                                <Textarea
                                    value={question.questionText}
                                    onChange={(e) => updateQuestion(index, 'questionText', e.target.value)}
                                    placeholder="Enter networking question..."
                                    rows={2}
                                    required
                                />
                            </div>

                            <div className="grid gap-4 sm:grid-cols-2">
                                <div className="space-y-2">
                                    <Label>Option A</Label>
                                    <Input
                                        value={question.optionA}
                                        onChange={(e) => updateQuestion(index, 'optionA', e.target.value)}
                                        placeholder="Option A"
                                        required
                                    />
                                </div>
                                <div className="space-y-2">
                                    <Label>Option B</Label>
                                    <Input
                                        value={question.optionB}
                                        onChange={(e) => updateQuestion(index, 'optionB', e.target.value)}
                                        placeholder="Option B"
                                        required
                                    />
                                </div>
                                <div className="space-y-2">
                                    <Label>Option C</Label>
                                    <Input
                                        value={question.optionC}
                                        onChange={(e) => updateQuestion(index, 'optionC', e.target.value)}
                                        placeholder="Option C"
                                        required
                                    />
                                </div>
                                <div className="space-y-2">
                                    <Label>Option D</Label>
                                    <Input
                                        value={question.optionD}
                                        onChange={(e) => updateQuestion(index, 'optionD', e.target.value)}
                                        placeholder="Option D"
                                        required
                                    />
                                </div>
                            </div>

                            <div className="space-y-2">
                                <Label>Correct Answer</Label>
                                <Select
                                    value={question.correctAnswer}
                                    onChange={(e) => updateQuestion(index, 'correctAnswer', e.target.value as 'a' | 'b' | 'c' | 'd')}
                                >
                                    <option value="a">Option A</option>
                                    <option value="b">Option B</option>
                                    <option value="c">Option C</option>
                                    <option value="d">Option D</option>
                                </Select>
                            </div>
                        </CardContent>
                    </Card>
                ))}
            </div>

            <div className="flex gap-4">
                <Button type="submit" disabled={loading} className="flex-1">
                    {loading ? 'Creating...' : 'Create Challenge'}
                </Button>
                <Button type="button" variant="outline" onClick={onCancel}>
                    Cancel
                </Button>
            </div>
        </form>
    );
}