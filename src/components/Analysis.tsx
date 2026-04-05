import React, { useState, useMemo } from 'react';
import { LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, AreaChart, Area, BarChart, Bar, Legend } from 'recharts';
import { TrendingUp, ShieldCheck, Flame, Calendar as CalendarIcon, Trophy, Keyboard as KeyboardIcon, ChevronDown, ChevronUp } from 'lucide-react';
import { cn } from '../lib/utils';
import { ACHIEVEMENTS, getUnlockedAchievementIds } from '../lib/achievements';

interface AnalysisProps {
  results: any[];
  profile: any;
  darkMode: boolean;
}

const KEYBOARD_LAYOUT = [
  ['q', 'w', 'e', 'r', 't', 'y', 'u', 'i', 'o', 'p'],
  ['a', 's', 'd', 'f', 'g', 'h', 'j', 'k', 'l'],
  ['z', 'x', 'c', 'v', 'b', 'n', 'm']
];

const Analysis: React.FC<AnalysisProps> = ({ results, profile, darkMode }) => {
  const [expandedDate, setExpandedDate] = useState<string | null>(null);

  const unlockedIds = useMemo(() => getUnlockedAchievementIds(results, profile), [results, profile]);

  const dailyStats = useMemo(() => {
    const stats: Record<string, { wpmSum: number; count: number; maxWpm: number; ssc: any[]; rrb: any[] }> = {};
    
    results.forEach(r => {
      if (!r.timestamp) return;
      const date = new Date(r.timestamp.toDate ? r.timestamp.toDate() : r.timestamp).toLocaleDateString();
      if (!stats[date]) {
        stats[date] = { wpmSum: 0, count: 0, maxWpm: 0, ssc: [], rrb: [] };
      }
      stats[date].wpmSum += r.wpm;
      stats[date].count += 1;
      if (r.wpm > stats[date].maxWpm) {
        stats[date].maxWpm = r.wpm;
      }
      if (r.examType === 'SSC') {
        stats[date].ssc.push(r);
      } else {
        stats[date].rrb.push(r);
      }
    });
    return stats;
  }, [results]);

  const dailyPathway = useMemo(() => {
    return Object.keys(dailyStats).reverse().map(date => ({
      date,
      avgWpm: Math.round(dailyStats[date].wpmSum / dailyStats[date].count),
      maxWpm: dailyStats[date].maxWpm
    }));
  }, [dailyStats]);

  const mistypedKeys = useMemo(() => {
    const keys: Record<string, number> = {};
    results.forEach(r => {
      if (r.mistypedKeys) {
        Object.entries(r.mistypedKeys).forEach(([key, count]) => {
          keys[key] = (keys[key] || 0) + (count as number);
        });
      }
    });
    return keys;
  }, [results]);

  const maxMistypes = Math.max(...Object.values(mistypedKeys), 1);

  const getKeyColor = (key: string) => {
    const count = mistypedKeys[key] || 0;
    if (count === 0) return 'bg-gray-100 dark:bg-gray-800 text-gray-700 dark:text-gray-300';
    
    const intensity = count / maxMistypes;
    if (intensity > 0.7) return 'bg-red-500 text-white border-red-600';
    if (intensity > 0.4) return 'bg-orange-400 text-white border-orange-500';
    if (intensity > 0.1) return 'bg-yellow-300 text-yellow-900 border-yellow-400';
    return 'bg-yellow-100 text-yellow-800 border-yellow-200 dark:bg-yellow-900/30 dark:text-yellow-200 dark:border-yellow-900/50';
  };

  return (
    <div className="space-y-8 animate-in fade-in slide-in-from-bottom-4 duration-500">
      {/* Top Stats */}
      <div className="grid md:grid-cols-3 gap-6">
        <div className="bg-white dark:bg-gray-800 p-6 rounded-xl shadow-sm border border-gray-100 dark:border-gray-700">
          <div className="flex items-center gap-3 text-blue-600 dark:text-blue-400 mb-4">
            <TrendingUp size={20} />
            <h3 className="font-bold uppercase text-xs tracking-wider">Average Speed</h3>
          </div>
          <p className="text-4xl font-black dark:text-white">
            {results.length > 0 ? Math.round(results.reduce((a, b) => a + b.wpm, 0) / results.length) : 0}
            <span className="text-sm font-normal text-gray-500 ml-2">WPM</span>
          </p>
        </div>
        <div className="bg-white dark:bg-gray-800 p-6 rounded-xl shadow-sm border border-gray-100 dark:border-gray-700">
          <div className="flex items-center gap-3 text-green-600 dark:text-green-400 mb-4">
            <ShieldCheck size={20} />
            <h3 className="font-bold uppercase text-xs tracking-wider">Avg Accuracy</h3>
          </div>
          <p className="text-4xl font-black dark:text-white">
            {results.length > 0 ? Math.round(results.reduce((a, b) => a + b.accuracy, 0) / results.length) : 0}
            <span className="text-sm font-normal text-gray-500 ml-2">%</span>
          </p>
        </div>
        <div className="bg-white dark:bg-gray-800 p-6 rounded-xl shadow-sm border border-gray-100 dark:border-gray-700">
          <div className="flex items-center gap-3 text-orange-600 dark:text-orange-400 mb-4">
            <Flame size={20} />
            <h3 className="font-bold uppercase text-xs tracking-wider">Current Streak</h3>
          </div>
          <p className="text-4xl font-black dark:text-white">
            {profile?.streak || 0}
            <span className="text-sm font-normal text-gray-500 ml-2">Days</span>
          </p>
        </div>
      </div>

      {/* Graphs */}
      <div className="grid lg:grid-cols-2 gap-6">
        <div className="bg-white dark:bg-gray-800 p-6 rounded-xl shadow-sm border border-gray-100 dark:border-gray-700">
          <h3 className="text-lg font-bold mb-6 dark:text-white flex items-center gap-2">
            <TrendingUp size={20} className="text-blue-600" /> Average Speed (WPM)
          </h3>
          <div className="h-64 w-full">
            <ResponsiveContainer width="100%" height="100%">
              <AreaChart data={dailyPathway}>
                <defs>
                  <linearGradient id="colorAvgWpm" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="5%" stopColor="#3b82f6" stopOpacity={0.3}/>
                    <stop offset="95%" stopColor="#3b82f6" stopOpacity={0}/>
                  </linearGradient>
                </defs>
                <CartesianGrid strokeDasharray="3 3" vertical={false} stroke={darkMode ? '#374151' : '#f3f4f6'} />
                <XAxis dataKey="date" stroke={darkMode ? '#9ca3af' : '#6b7280'} fontSize={12} tickLine={false} axisLine={false} />
                <YAxis stroke={darkMode ? '#9ca3af' : '#6b7280'} fontSize={12} tickLine={false} axisLine={false} />
                <Tooltip 
                  contentStyle={{ backgroundColor: darkMode ? '#1f2937' : '#fff', border: 'none', borderRadius: '8px', boxShadow: '0 4px 6px -1px rgb(0 0 0 / 0.1)' }}
                />
                <Area type="monotone" dataKey="avgWpm" name="Avg WPM" stroke="#3b82f6" strokeWidth={3} fillOpacity={1} fill="url(#colorAvgWpm)" />
              </AreaChart>
            </ResponsiveContainer>
          </div>
        </div>

        <div className="bg-white dark:bg-gray-800 p-6 rounded-xl shadow-sm border border-gray-100 dark:border-gray-700">
          <h3 className="text-lg font-bold mb-6 dark:text-white flex items-center gap-2">
            <Flame size={20} className="text-orange-500" /> Highest Speed (WPM)
          </h3>
          <div className="h-64 w-full">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={dailyPathway}>
                <CartesianGrid strokeDasharray="3 3" vertical={false} stroke={darkMode ? '#374151' : '#f3f4f6'} />
                <XAxis dataKey="date" stroke={darkMode ? '#9ca3af' : '#6b7280'} fontSize={12} tickLine={false} axisLine={false} />
                <YAxis stroke={darkMode ? '#9ca3af' : '#6b7280'} fontSize={12} tickLine={false} axisLine={false} />
                <Tooltip 
                  contentStyle={{ backgroundColor: darkMode ? '#1f2937' : '#fff', border: 'none', borderRadius: '8px', boxShadow: '0 4px 6px -1px rgb(0 0 0 / 0.1)' }}
                  cursor={{ fill: darkMode ? '#374151' : '#f3f4f6' }}
                />
                <Bar dataKey="maxWpm" name="Max WPM" fill="#f97316" radius={[4, 4, 0, 0]} />
              </BarChart>
            </ResponsiveContainer>
          </div>
        </div>
      </div>

      {/* Keyboard Heatmap */}
      <div className="bg-white dark:bg-gray-800 p-8 rounded-xl shadow-sm border border-gray-100 dark:border-gray-700">
        <div className="flex items-center justify-between mb-6">
          <h3 className="text-xl font-bold dark:text-white flex items-center gap-2">
            <KeyboardIcon size={20} className="text-purple-500" /> Mistyped Keys Heatmap
          </h3>
          <div className="flex items-center gap-2 text-xs text-gray-500 dark:text-gray-400">
            <span>Less</span>
            <div className="flex gap-1">
              <div className="w-4 h-4 rounded bg-gray-100 dark:bg-gray-800"></div>
              <div className="w-4 h-4 rounded bg-yellow-100 dark:bg-yellow-900/30"></div>
              <div className="w-4 h-4 rounded bg-yellow-300"></div>
              <div className="w-4 h-4 rounded bg-orange-400"></div>
              <div className="w-4 h-4 rounded bg-red-500"></div>
            </div>
            <span>More</span>
          </div>
        </div>
        
        <div className="flex flex-col items-center gap-2 overflow-x-auto pb-4">
          {KEYBOARD_LAYOUT.map((row, rowIndex) => (
            <div key={rowIndex} className="flex gap-2" style={{ marginLeft: rowIndex * 20 }}>
              {row.map(key => (
                <div 
                  key={key}
                  className={cn(
                    "w-10 h-12 md:w-12 md:h-14 rounded-lg flex flex-col items-center justify-center font-bold text-lg border-b-4 transition-all relative group",
                    getKeyColor(key)
                  )}
                >
                  <span className="uppercase">{key}</span>
                  {mistypedKeys[key] > 0 && (
                    <div className="absolute -top-8 bg-gray-900 text-white text-xs px-2 py-1 rounded opacity-0 group-hover:opacity-100 transition-opacity pointer-events-none whitespace-nowrap z-10">
                      {mistypedKeys[key]} mistakes
                    </div>
                  )}
                </div>
              ))}
            </div>
          ))}
        </div>
      </div>

      {/* Recent Tests by Date */}
      <div className="bg-white dark:bg-gray-800 rounded-xl shadow-sm border border-gray-100 dark:border-gray-700 overflow-hidden">
        <div className="p-6 border-b border-gray-100 dark:border-gray-700">
          <h3 className="font-bold dark:text-white flex items-center gap-2">
            <CalendarIcon size={20} className="text-blue-500" /> Test History
          </h3>
        </div>
        <div className="divide-y divide-gray-100 dark:divide-gray-700">
          {Object.keys(dailyStats).length === 0 ? (
            <div className="p-8 text-center text-gray-500 dark:text-gray-400">
              No tests taken yet. Start practicing!
            </div>
          ) : (
            Object.keys(dailyStats).map(date => (
              <div key={date} className="flex flex-col">
                <button 
                  onClick={() => setExpandedDate(expandedDate === date ? null : date)}
                  className="flex items-center justify-between p-6 hover:bg-gray-50 dark:hover:bg-gray-700/50 transition-colors w-full text-left"
                >
                  <div className="flex items-center gap-4">
                    <div className="bg-blue-100 dark:bg-blue-900/30 text-blue-600 dark:text-blue-400 p-3 rounded-lg font-bold">
                      {new Date(date).getDate()}
                    </div>
                    <div>
                      <h4 className="font-bold dark:text-white text-lg">{date}</h4>
                      <p className="text-sm text-gray-500 dark:text-gray-400">
                        {dailyStats[date].count} tests • Avg {Math.round(dailyStats[date].wpmSum / dailyStats[date].count)} WPM
                      </p>
                    </div>
                  </div>
                  <div className="text-gray-400">
                    {expandedDate === date ? <ChevronUp size={24} /> : <ChevronDown size={24} />}
                  </div>
                </button>
                
                {expandedDate === date && (
                  <div className="bg-gray-50 dark:bg-gray-900/50 p-6 border-t border-gray-100 dark:border-gray-700">
                    <div className="grid md:grid-cols-2 gap-6">
                      {/* SSC Stats */}
                      <div className="bg-white dark:bg-gray-800 p-4 rounded-lg border border-gray-200 dark:border-gray-700">
                        <h5 className="font-bold text-blue-600 dark:text-blue-400 mb-4 flex items-center justify-between">
                          <span>SSC Exams</span>
                          <span className="bg-blue-100 dark:bg-blue-900/30 px-2 py-1 rounded text-xs">{dailyStats[date].ssc.length} taken</span>
                        </h5>
                        {dailyStats[date].ssc.length > 0 ? (
                          <div className="space-y-3">
                            {dailyStats[date].ssc.map((r, i) => (
                              <div key={i} className="flex justify-between items-center text-sm">
                                <span className="text-gray-600 dark:text-gray-400">{r.wpm} WPM</span>
                                <span className="text-green-600 dark:text-green-400">{r.accuracy}% Acc</span>
                                <span className="text-red-500">{r.errors} Err</span>
                              </div>
                            ))}
                          </div>
                        ) : (
                          <p className="text-sm text-gray-500 dark:text-gray-400 italic">No SSC tests on this day.</p>
                        )}
                      </div>
                      
                      {/* RRB Stats */}
                      <div className="bg-white dark:bg-gray-800 p-4 rounded-lg border border-gray-200 dark:border-gray-700">
                        <h5 className="font-bold text-orange-600 dark:text-orange-400 mb-4 flex items-center justify-between">
                          <span>RRB Exams</span>
                          <span className="bg-orange-100 dark:bg-orange-900/30 px-2 py-1 rounded text-xs">{dailyStats[date].rrb.length} taken</span>
                        </h5>
                        {dailyStats[date].rrb.length > 0 ? (
                          <div className="space-y-3">
                            {dailyStats[date].rrb.map((r, i) => (
                              <div key={i} className="flex justify-between items-center text-sm">
                                <span className="text-gray-600 dark:text-gray-400">{r.wpm} WPM</span>
                                <span className="text-green-600 dark:text-green-400">{r.accuracy}% Acc</span>
                                <span className="text-red-500">{r.errors} Err</span>
                              </div>
                            ))}
                          </div>
                        ) : (
                          <p className="text-sm text-gray-500 dark:text-gray-400 italic">No RRB tests on this day.</p>
                        )}
                      </div>
                    </div>
                  </div>
                )}
              </div>
            ))
          )}
        </div>
      </div>

      {/* Achievements */}
      <div className="bg-white dark:bg-gray-800 p-8 rounded-xl shadow-sm border border-gray-100 dark:border-gray-700">
        <h3 className="text-xl font-bold mb-6 dark:text-white flex items-center gap-2">
          <Trophy size={20} className="text-yellow-500" /> Your Achievements
        </h3>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {ACHIEVEMENTS.map((achievement) => {
            const isUnlocked = unlockedIds.includes(achievement.id);
            const Icon = achievement.icon;
            
            return (
              <div 
                key={achievement.id}
                className={cn(
                  "p-4 rounded-xl border-2 transition-all flex items-start gap-4",
                  isUnlocked 
                    ? "border-yellow-400 bg-yellow-50 dark:bg-yellow-900/10" 
                    : "border-gray-100 dark:border-gray-700 bg-gray-50 dark:bg-gray-800/50 opacity-60 grayscale"
                )}
              >
                <div className={cn(
                  "p-3 rounded-full text-2xl flex items-center justify-center w-12 h-12",
                  isUnlocked ? "bg-yellow-100 dark:bg-yellow-900/30" : "bg-gray-200 dark:bg-gray-700 grayscale opacity-50"
                )}>
                  {achievement.icon}
                </div>
                <div className="flex-1">
                  <div className="flex items-center justify-between">
                    <h4 className={cn("font-bold", isUnlocked ? "text-gray-900 dark:text-white" : "text-gray-500 dark:text-gray-400")}>
                      {achievement.title}
                    </h4>
                    {isUnlocked && (
                      <span className="text-xs font-bold bg-yellow-200 text-yellow-800 dark:bg-yellow-900/50 dark:text-yellow-200 px-2 py-1 rounded-full flex items-center gap-1">
                        <ShieldCheck size={12} /> Unlocked
                      </span>
                    )}
                  </div>
                  <p className="text-sm text-gray-600 dark:text-gray-400 mt-1">{achievement.description}</p>
                </div>
              </div>
            );
          })}
        </div>
      </div>
    </div>
  );
};

export default Analysis;
