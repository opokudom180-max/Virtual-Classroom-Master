export interface User {
    uid: string;
    name: string;
    email: string;
    role: 'intern' | 'supervisor';
    department?: string;
    team?: string;
    createdAt: Date;
}

export interface NetworkingChallenge {
    id: string;
    supervisorUid: string;
    title: string;
    description: string;
    category: 'WIFI' | 'VoIP' | 'CCTV' | 'LAN' | 'Operations' | 'Security';
    difficulty: 'Beginner' | 'Intermediate' | 'Advanced';
    timeLimit?: number; // in minutes
    createdAt: Date;
}

export interface Question {
    id: string;
    questionText: string;
    optionA: string;
    optionB: string;
    optionC: string;
    optionD: string;
    correctAnswer: 'a' | 'b' | 'c' | 'd';
    category: 'WIFI' | 'VoIP' | 'CCTV' | 'LAN' | 'Operations' | 'Security';
    difficulty: 'Beginner' | 'Intermediate' | 'Advanced';
}

export interface ChallengeResult {
    id: string;
    challengeId: string;
    internUid?: string;
    studentUid?: string; // Backward compatibility
    score: number;
    timeSpent?: number; // in minutes
    completedAt: Date;
    category?: 'WIFI' | 'VoIP' | 'CCTV' | 'LAN' | 'Operations' | 'Security';
    answers?: { [questionId: string]: 'a' | 'b' | 'c' | 'd' }; // Track intern's answers
    correctAnswers?: { [questionId: string]: 'a' | 'b' | 'c' | 'd' }; // Track correct answers
    questionDetails?: { [questionId: string]: string }; // Track question text for review
}

export interface DetailedChallengeReview {
    result: ChallengeResult;
    challenge: NetworkingChallenge;
    questions: Question[];
    internName: string;
}

export interface WorkSchedule {
    id: string;
    internUid?: string;
    studentUid?: string; // Backward compatibility
    month: string; // e.g., 'September', 'October', 'November'
    year: number;
    assignment: string; // e.g., 'WIFI', 'VoIP/LAN', 'CCTV/LAN'
    classDate?: string; // Backward compatibility
    status?: 'Present' | 'Absent' | 'Scheduled'; // Backward compatibility
    createdAt?: Date;
}

export interface TeamScheduleEntry {
    internUid: string;
    internName: string;
    september?: string;
    october?: string;
    november?: string;
}

export interface Announcement {
    id: string;
    supervisorUid: string;
    title: string;
    content: string;
    priority: 'Low' | 'Medium' | 'High' | 'Critical';
    category: 'General' | 'Technical' | 'Maintenance' | 'Training';
    createdAt: Date;
}

export interface TechnicalDocument {
    id: string;
    supervisorUid: string;
    title: string;
    description: string;
    fileName: string;
    fileUrl: string;
    category: 'Manual' | 'Procedure' | 'Troubleshooting' | 'Reference';
    uploadedAt: Date;
}

export interface PerformanceMetric {
    id: string;
    internUid: string;
    month: string;
    year: number;
    wifiScore: number;
    voipScore: number;
    cctvScore: number;
    lanScore: number;
    operationsScore: number;
    overallRating: number;
    feedback?: string;
    createdAt: Date;
}

export interface TeamMember {
    name: string;
    september: string;
    october: string;
    november: string;
}

// Add these new interfaces to the existing types

export interface WeeklyReport {
    id: string;
    internUid: string;
    week: number; // 1, 2, 3, 4
    month: string;
    year: number;
    teamAssignment: string;
    learnings: string;
    difficulties: string;
    teamLeadRating: number; // 1-5 scale
    additionalComments?: string;
    submittedAt: Date;
}

export interface DataCenterPolicy {
    id: string;
    supervisorUid: string;
    title: string;
    content: string;
    category: 'Safety' | 'Security' | 'Operations' | 'General';
    priority: 'Low' | 'Medium' | 'High' | 'Critical';
    effectiveDate: Date;
    createdAt: Date;
}

export interface LearningModule {
    id: string;
    supervisorUid: string;
    title: string;
    description: string;
    content: string;
    category: 'WIFI' | 'VoIP' | 'CCTV' | 'LAN' | 'Operations' | 'Security';
    difficulty: 'Beginner' | 'Intermediate' | 'Advanced';
    estimatedTime: number; // in minutes
    createdAt: Date;
}

export interface SecurityInfo {
    id: string;
    supervisorUid: string;
    title: string;
    type: 'Emergency Contact' | 'Password' | 'Procedure';
    contact?: string;
    username?: string;
    password?: string;
    description: string;
    category: 'Emergency' | 'Systems' | 'Network' | 'General';
    lastUpdated: Date;
}

export interface QuestionBankChallenge {
    id: string;
    supervisorUid: string;
    title: string;
    description: string;
    category: 'WIFI' | 'VoIP' | 'CCTV' | 'LAN' | 'Operations' | 'Security';
    difficulty: 'Beginner' | 'Intermediate' | 'Advanced';
    timeLimit?: number;
    isPublished: boolean; // Key field for visibility control
    publishedDate?: Date;
    createdAt: Date;
    lastUsed?: Date;
    usageCount: number; // Track how many times it's been used
    batchYear?: number; // Track which year/batch it was used for
}

export interface QuestionBankEntry {
    id: string;
    challengeId: string;
    questionText: string;
    optionA: string;
    optionB: string;
    optionC: string;
    optionD: string;
    correctAnswer: 'a' | 'b' | 'c' | 'd';
    category: 'WIFI' | 'VoIP' | 'CCTV' | 'LAN' | 'Operations' | 'Security';
    difficulty: 'Beginner' | 'Intermediate' | 'Advanced';
}

// Legacy aliases for backward compatibility
export type Quiz = NetworkingChallenge;
export type Result = ChallengeResult;
export type Attendance = WorkSchedule;
export type UploadedFile = TechnicalDocument;