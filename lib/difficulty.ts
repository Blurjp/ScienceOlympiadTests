// Map competition level values to database-compatible difficulty values.
// The tests.difficulty CHECK constraint accepts both competition levels
// and difficulty names; legacy code mapped levels to Easy/Medium/Hard, so
// keep that behavior for saved tests.
export function mapDifficultyForDatabase(difficulty: string | undefined | null): string {
  const competitionLevelMap: Record<string, string> = {
    'Invitational': 'Easy',
    'Regional': 'Medium',
    'State': 'Medium',
    'National': 'Hard',
  };
  return competitionLevelMap[difficulty || ''] || difficulty || 'Medium';
}
