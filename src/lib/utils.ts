export function cn(...inputs: (string | undefined | null | false)[]) {
    return inputs.filter(Boolean).join(' ');
}

export function calculateGrade(score: number): { letter: string; points: number } {
    if (score >= 80) return { letter: 'A', points: 4.0 };
    if (score >= 70) return { letter: 'B', points: 3.0 };
    if (score >= 60) return { letter: 'C', points: 2.0 };
    if (score >= 50) return { letter: 'D', points: 1.0 };
    return { letter: 'F', points: 0.0 };
}

export function calculateGPA(results: { score: number }[]): number {
    if (results.length === 0) return 0.0;
    const recentResults = results.slice(0, 5);
    const totalPoints = recentResults.reduce((sum, result) => {
        return sum + calculateGrade(result.score).points;
    }, 0);
    return parseFloat((totalPoints / recentResults.length).toFixed(2));
}

export function calculateCGPA(results: { score: number }[]): number {
    if (results.length === 0) return 0.0;
    const totalPoints = results.reduce((sum, result) => {
        return sum + calculateGrade(result.score).points;
    }, 0);
    return parseFloat((totalPoints / results.length).toFixed(2));
}