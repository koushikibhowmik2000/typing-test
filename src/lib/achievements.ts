export interface Achievement {
  id: string;
  title: string;
  description: string;
  icon: string;
  category: 'Speed' | 'Accuracy' | 'Endurance';
}

export const ACHIEVEMENTS: Achievement[] = [
  { id: 'turtle', title: 'Turtle Power', description: 'Reach 15 WPM', icon: '🐢', category: 'Speed' },
  { id: 'rabbit', title: 'The Rabbit', description: 'Reach 25 WPM', icon: '🐇', category: 'Speed' },
  { id: 'aspirant', title: 'The Aspirant', description: 'Reach 35 WPM', icon: '🎯', category: 'Speed' },
  { id: 'office', title: 'The Office Regular', description: 'Reach 45 WPM', icon: '💼', category: 'Speed' },
  { id: 'sonic', title: 'Sonic Boom', description: 'Reach 60 WPM', icon: '⚡', category: 'Speed' },
  { id: '67lover', title: '67 Lover', description: 'Get exactly 67 WPM', icon: '❤️', category: 'Speed' },
  { id: 'turbo', title: 'The Turbo Typist', description: 'Reach 80 WPM', icon: '🚀', category: 'Speed' },
  { id: 'ghost', title: 'Ghost in the Machine', description: 'Reach 100 WPM', icon: '👻', category: 'Speed' },
  
  { id: 'perfectionist', title: 'The Perfectionist', description: 'Get 100% Accuracy in a test', icon: '🎯', category: 'Accuracy' },
  { id: 'deadly', title: 'Deadly Precision', description: 'Get 100% Accuracy in 5 consecutive tests', icon: '⚡', category: 'Accuracy' },
  { id: 'zen', title: 'Zen Master', description: '100% Accuracy in RRB mode with 0 backspaces', icon: '🧘', category: 'Accuracy' },

  { id: 'weekly', title: 'Weekly Warrior', description: 'Maintain a 7-day login streak', icon: '🕒', category: 'Endurance' },
  { id: 'century', title: 'Century Club', description: 'Complete 100 tests', icon: '🏆', category: 'Endurance' },
  { id: 'millionaire', title: 'The Millionaire', description: 'Type 1,000,000 characters lifetime', icon: '💎', category: 'Endurance' },
];

export const getUnlockedAchievementIds = (results: any[], profile: any): string[] => {
  const unlocked = new Set<string>();
  
  const maxWpm = Math.max(...results.map(r => r.wpm || 0), 0);
  const maxAccuracy = Math.max(...results.map(r => r.accuracy || 0), 0);
  const totalTests = results.length;
  const totalChars = results.reduce((acc, r) => acc + (r.totalChars || 0), 0);
  const streak = profile?.streak || 0;

  let maxConsecutive100 = 0;
  let currentConsecutive100 = 0;
  const chronologicalResults = [...results].reverse();
  for (const r of chronologicalResults) {
    if (r.accuracy === 100) {
      currentConsecutive100++;
      maxConsecutive100 = Math.max(maxConsecutive100, currentConsecutive100);
    } else {
      currentConsecutive100 = 0;
    }
  }

  const hasZenMaster = results.some(r => r.examType === 'RRB' && r.accuracy === 100 && r.backspaceCount === 0);

  if (maxWpm >= 15) unlocked.add('turtle');
  if (maxWpm >= 25) unlocked.add('rabbit');
  if (maxWpm >= 35) unlocked.add('aspirant');
  if (maxWpm >= 45) unlocked.add('office');
  if (maxWpm >= 60) unlocked.add('sonic');
  if (results.some(r => r.wpm === 67)) unlocked.add('67lover');
  if (maxWpm >= 80) unlocked.add('turbo');
  if (maxWpm >= 100) unlocked.add('ghost');

  if (maxAccuracy === 100) unlocked.add('perfectionist');
  if (maxConsecutive100 >= 5) unlocked.add('deadly');
  if (hasZenMaster) unlocked.add('zen');

  if (streak >= 7) unlocked.add('weekly');
  if (totalTests >= 100) unlocked.add('century');
  if (totalChars >= 1000000) unlocked.add('millionaire');

  return Array.from(unlocked);
};
