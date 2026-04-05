import React, { useState, useEffect } from 'react';
import TypingTest from './components/TypingTest';
import { Keyboard, ShieldCheck, Moon, Sun, LogIn, LogOut, BarChart3, History, User as UserIcon, TrendingUp, Trophy, XCircle } from 'lucide-react';
import { auth, signInWithGoogle, logout, getUserResults, getUserProfile } from './firebase';
import { onAuthStateChanged, User } from 'firebase/auth';
import { LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, AreaChart, Area } from 'recharts';
import { cn } from './lib/utils';
import { Flame } from 'lucide-react';
import AchievementsModal from './components/Achievements';
import PracticeCalendar from './components/Calendar';

import Analysis from './components/Analysis';

export default function App() {
  const [user, setUser] = useState<User | null>(null);
  const [profile, setProfile] = useState<any>(null);
  const [darkMode, setDarkMode] = useState(false);
  const [view, setView] = useState<'test' | 'analysis'>('test');
  const [results, setResults] = useState<any[]>([]);
  const [showAchievements, setShowAchievements] = useState(false);
  const [showCalendar, setShowCalendar] = useState(false);

  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, (user) => {
      setUser(user);
      if (user) {
        getUserResults(user.uid, (data) => {
          setResults(data);
        });
        getUserProfile(user.uid, (data) => {
          setProfile(data);
        });
      } else {
        setResults([]);
        setProfile(null);
      }
    });
    return () => unsubscribe();
  }, []);

  useEffect(() => {
    if (darkMode) {
      document.documentElement.classList.add('dark');
    } else {
      document.documentElement.classList.remove('dark');
    }
  }, [darkMode]);

  const handleLogin = async () => {
    try {
      await signInWithGoogle();
    } catch (error) {
      console.error("Login failed", error);
    }
  };

  return (
    <div className="min-h-screen flex flex-col bg-gray-50 dark:bg-gray-900 transition-colors duration-300">
      {/* Header */}
      <header className="bg-white dark:bg-gray-800 border-b border-gray-200 dark:border-gray-700 py-4 px-6 sticky top-0 z-10 shadow-sm">
        <div className="max-w-7xl mx-auto flex justify-between items-center">
          <div className="flex items-center gap-3 cursor-pointer" onClick={() => setView('test')}>
            <div className="bg-blue-600 p-2 rounded-lg text-white">
              <Keyboard size={24} />
            </div>
            <div>
              <h1 className="text-xl font-bold text-gray-900 dark:text-white tracking-tight">ProType <span className="text-blue-600">Exam</span></h1>
              <p className="text-[10px] text-gray-500 dark:text-gray-400 uppercase font-bold tracking-widest">Official Mock Platform</p>
            </div>
          </div>
          
          <div className="hidden md:flex items-center gap-6 text-sm font-medium text-gray-600 dark:text-gray-300">
            <button onClick={() => setView('test')} className={cn("hover:text-blue-600 transition-colors", view === 'test' && "text-blue-600")}>Typing Test</button>
            {user && (
              <button onClick={() => setView('analysis')} className={cn("hover:text-blue-600 transition-colors", view === 'analysis' && "text-blue-600")}>Analysis</button>
            )}
            <div className="h-4 w-px bg-gray-200 dark:bg-gray-700" />
            
            {user && (
              <button 
                onClick={() => setShowAchievements(true)}
                className="flex items-center gap-1 text-yellow-600 bg-yellow-50 dark:bg-yellow-900/20 px-3 py-1 rounded-full border border-yellow-200 dark:border-yellow-900/30 hover:bg-yellow-100 dark:hover:bg-yellow-900/40 transition-colors"
                title="View Achievements"
              >
                <Trophy size={16} fill="currentColor" />
                <span className="font-black text-sm">Achievements</span>
              </button>
            )}

            {user && (
              <button 
                onClick={() => setShowCalendar(true)}
                className="flex items-center gap-1 text-orange-600 bg-orange-50 dark:bg-orange-900/20 px-3 py-1 rounded-full border border-orange-200 dark:border-orange-900/30 hover:bg-orange-100 dark:hover:bg-orange-900/40 transition-colors"
                title="View Practice History"
              >
                <Flame size={16} fill="currentColor" className={profile?.streak > 0 ? 'animate-pulse' : ''} />
                <span className="font-black text-sm">{profile?.streak || 0}</span>
              </button>
            )}
            
            {user ? (
              <div className="flex items-center gap-4">
                <div className="flex items-center gap-2">
                  <img src={user.photoURL || ''} alt="" className="w-8 h-8 rounded-full border border-gray-200 dark:border-gray-600" />
                  <span className="text-xs font-bold dark:text-white">{user.displayName}</span>
                </div>
                <button onClick={logout} className="p-2 text-gray-400 hover:text-red-500 transition-colors">
                  <LogOut size={20} />
                </button>
              </div>
            ) : (
              <button 
                onClick={handleLogin}
                className="flex items-center gap-2 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors font-bold text-xs"
              >
                <LogIn size={16} /> Sign In
              </button>
            )}
          </div>
        </div>
      </header>

      {/* Main Content */}
      <main className="flex-grow">
        <div className="max-w-7xl mx-auto py-12 px-4">
          {view === 'test' ? (
            <>
              <div className="text-center mb-12">
                <h2 className="text-4xl font-extrabold text-gray-900 dark:text-white sm:text-5xl">
                  Master Your <span className="text-blue-600">Typing Speed</span>
                </h2>
                <p className="mt-4 text-xl text-gray-600 dark:text-gray-400 max-w-2xl mx-auto">
                  Simulate real-world exam environments for RRB and SSC with precise timing and rule enforcement.
                </p>
              </div>
              <TypingTest results={results} profile={profile} />
            </>
          ) : (
            <Analysis results={results} profile={profile} darkMode={darkMode} />
          )}
        </div>
      </main>

      {/* Footer */}
      <footer className="bg-white dark:bg-gray-800 border-t border-gray-200 dark:border-gray-700 py-8 px-6">
        <div className="max-w-7xl mx-auto flex flex-col md:flex-row justify-between items-center gap-4">
          <div className="text-gray-500 dark:text-gray-400 text-sm">
            © 2026 ProType Exam. All rights reserved.
          </div>
          <div className="flex gap-6 text-sm text-gray-400 dark:text-gray-500">
            <a href="#" className="hover:text-gray-600">Privacy Policy</a>
            <a href="#" className="hover:text-gray-600">Terms of Service</a>
            <a href="#" className="hover:text-gray-600">Contact Support</a>
          </div>
        </div>
      </footer>

      {showAchievements && (
        <AchievementsModal 
          results={results} 
          profile={profile} 
          onClose={() => setShowAchievements(false)} 
        />
      )}

      {showCalendar && (
        <div className="fixed inset-0 bg-black/60 backdrop-blur-sm flex items-center justify-center z-[100] p-4" onClick={() => setShowCalendar(false)}>
          <div className="relative" onClick={e => e.stopPropagation()}>
            <button 
              onClick={() => setShowCalendar(false)}
              className="absolute -top-4 -right-4 bg-white dark:bg-gray-800 rounded-full p-1 shadow-lg text-gray-500 hover:text-gray-700 dark:text-gray-400 dark:hover:text-gray-200 z-10"
            >
              <XCircle size={24} />
            </button>
            <PracticeCalendar practiceDates={results.map(r => {
              if (!r.timestamp) return new Date(); // Optimistic update for serverTimestamp
              if (typeof r.timestamp.toDate === 'function') return r.timestamp.toDate();
              return new Date(r.timestamp);
            }).filter(Boolean) as Date[]} />
          </div>
        </div>
      )}
    </div>
  );
}
