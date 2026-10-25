// Map competition level values to database-compatible difficulty values.
// Deployed databases created before the widened CHECK still enforce
// difficulty IN ('Easy', 'Medium', 'Hard') — CREATE TABLE IF NOT EXISTS
// never rewrites an existing table's constraints. Every persisted test
// therefore needs a mapped value; raw levels like 'Regional' are rejected
// with SQLITE_CONSTRAINT on those databases.
export function mapDifficultyForDatabase(difficulty: string | undefined | null): string {
  const competitionLevelMap: Record<string, string> = {
    'Invitational': 'Easy',
    'Regional': 'Medium',
    'State': 'Medium',
    'National': 'Hard',
  };
  return competitionLevelMap[difficulty || ''] || difficulty || 'Medium';
}
