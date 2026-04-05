import React from 'react';
import { Trophy, XCircle, CheckCircle2 } from 'lucide-react';
import { ACHIEVEMENTS, getUnlockedAchievementIds } from '../lib/achievements';

interface AchievementsProps {
  results: any[];
  profile: any;
  onClose: () => void;
}

const AchievementsModal: React.FC<AchievementsProps> = ({ results, profile, onClose }) => {
  const unlockedIds = getUnlockedAchievementIds(results, profile);

  return (
    <div className="fixed inset-0 bg-black/60 backdrop-blur-sm flex items-center justify-center z-[100] p-4" onClick={onClose}>
      <div className="bg-white dark:bg-gray-900 rounded-3xl shadow-2xl max-w-4xl w-full max-h-[85vh] overflow-hidden flex flex-col border border-gray-200 dark:border-gray-800" onClick={e => e.stopPropagation()}>
        <div className="p-6 border-b border-gray-100 dark:border-gray-800 flex justify-between items-center bg-gray-50 dark:bg-gray-800/50">
          <div className="flex items-center gap-3">
            <Trophy className="text-yellow-500" size={28} />
            <h2 className="text-2xl font-black text-gray-900 dark:text-white">Achievements</h2>
          </div>
          <button onClick={onClose} className="text-gray-500 hover:text-gray-700 dark:text-gray-400 dark:hover:text-gray-200 transition-colors">
            <XCircle size={24} />
          </button>
        </div>
        
        <div className="p-6 overflow-y-auto custom-scrollbar flex-1 bg-gray-50/30 dark:bg-gray-900/30">
          <div className="space-y-8">
            {(['Speed', 'Accuracy', 'Endurance'] as const).map(category => (
              <div key={category}>
                <h3 className="text-lg font-bold text-gray-800 dark:text-gray-200 mb-4 uppercase tracking-wider text-sm flex items-center gap-2">
                  {category === 'Speed' ? '🚀' : category === 'Accuracy' ? '🎯' : '🕒'} {category} Milestones
                </h3>
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                  {ACHIEVEMENTS.filter(a => a.category === category).map(achievement => {
                    const isUnlocked = unlockedIds.includes(achievement.id);
                    return (
                      <div 
                        key={achievement.id} 
                        className={`p-4 rounded-2xl border-2 transition-all ${
                          isUnlocked 
                            ? 'bg-white dark:bg-gray-800 border-yellow-400 dark:border-yellow-500/50 shadow-md' 
                            : 'bg-gray-50 dark:bg-gray-800/50 border-gray-200 dark:border-gray-700 opacity-60 grayscale'
                        }`}
                      >
                        <div className="flex items-start gap-4">
                          <div className={`p-3 rounded-xl text-2xl ${isUnlocked ? 'bg-yellow-50 dark:bg-yellow-900/20' : 'bg-gray-200 dark:bg-gray-700'}`}>
                            {achievement.icon}
                          </div>
                          <div>
                            <h4 className={`font-bold ${isUnlocked ? 'text-gray-900 dark:text-white' : 'text-gray-500 dark:text-gray-400'}`}>
                              {achievement.title}
                            </h4>
                            <p className="text-xs text-gray-500 dark:text-gray-400 mt-1 leading-relaxed">
                              {achievement.description}
                            </p>
                          </div>
                        </div>
                        {isUnlocked && (
                          <div className="mt-3 flex items-center gap-1 text-xs font-bold text-green-600 dark:text-green-400 bg-green-50 dark:bg-green-900/20 w-fit px-2 py-1 rounded-md">
                            <CheckCircle2 size={16} className="text-green-500" /> Unlocked
                          </div>
                        )}
                      </div>
                    );
                  })}
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
};

export default AchievementsModal;
