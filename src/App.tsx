import React, { useState, useEffect } from 'react';
import TypingTest from './components/TypingTest';
import { Keyboard, ShieldCheck, Moon, Sun, LogIn, LogOut, BarChart3, History, User as UserIcon, TrendingUp } from 'lucide-react';
import { auth, signInWithGoogle, logout, getUserResults, getUserProfile } from './firebase';
import { onAuthStateChanged, User } from 'firebase/auth';
import { LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, AreaChart, Area } from 'recharts';
import { cn } from './lib/utils';
import { Flame } from 'lucide-react';

export default function App() {
  const [user, setUser] = useState<User | null>(null);
  const [profile, setProfile] = useState<any>(null);
  const [darkMode, setDarkMode] = useState(false);
  const [view, setView] = useState<'test' | 'analysis'>('test');
  const [results, setResults] = useState<any[]>([]);

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

  const AnalysisView = () => {
    const chartData = results.slice().reverse().map(r => ({
      date: new Date(r.timestamp?.toDate()).toLocaleDateString(),
      wpm: r.wpm,
      accuracy: r.accuracy
    }));

    const dailyStats = results.reduce((acc: any, curr) => {
      const date = new Date(curr.timestamp?.toDate()).toLocaleDateString();
      if (!acc[date]) acc[date] = { wpm: 0, count: 0 };
      acc[date].wpm += curr.wpm;
      acc[date].count += 1;
      return acc;
    }, {});

    const dailyPathway = Object.keys(dailyStats).map(date => ({
      date,
      avgWpm: Math.round(dailyStats[date].wpm / dailyStats[date].count)
    }));

    return (
      <div className="space-y-8 animate-in fade-in slide-in-from-bottom-4 duration-500">
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

        <div className="bg-white dark:bg-gray-800 p-8 rounded-xl shadow-sm border border-gray-100 dark:border-gray-700">
          <h3 className="text-xl font-bold mb-6 dark:text-white flex items-center gap-2">
            <BarChart3 size={20} className="text-blue-600" /> Daily Pathway (Avg WPM)
          </h3>
          <div className="h-80 w-full">
            <ResponsiveContainer width="100%" height="100%">
              <AreaChart data={dailyPathway}>
                <defs>
                  <linearGradient id="colorWpm" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="5%" stopColor="#3b82f6" stopOpacity={0.3}/>
                    <stop offset="95%" stopColor="#3b82f6" stopOpacity={0}/>
                  </linearGradient>
                </defs>
                <CartesianGrid strokeDasharray="3 3" vertical={false} stroke={darkMode ? '#374151' : '#f3f4f6'} />
                <XAxis dataKey="date" stroke={darkMode ? '#9ca3af' : '#6b7280'} fontSize={12} tickLine={false} axisLine={false} />
                <YAxis stroke={darkMode ? '#9ca3af' : '#6b7280'} fontSize={12} tickLine={false} axisLine={false} />
                <Tooltip 
                  contentStyle={{ backgroundColor: darkMode ? '#1f2937' : '#fff', border: 'none', borderRadius: '8px', boxShadow: '0 4px 6px -1px rgb(0 0 0 / 0.1)' }}
                  itemStyle={{ color: '#3b82f6' }}
                />
                <Area type="monotone" dataKey="avgWpm" stroke="#3b82f6" strokeWidth={3} fillOpacity={1} fill="url(#colorWpm)" />
              </AreaChart>
            </ResponsiveContainer>
          </div>
        </div>

        <div className="bg-white dark:bg-gray-800 rounded-xl shadow-sm border border-gray-100 dark:border-gray-700 overflow-hidden">
          <div className="p-6 border-b border-gray-100 dark:border-gray-700">
            <h3 className="font-bold dark:text-white">Recent Tests</h3>
          </div>
          <div className="overflow-x-auto">
            <table className="w-full text-left">
              <thead className="bg-gray-50 dark:bg-gray-900/50 text-xs uppercase font-bold text-gray-500 dark:text-gray-400">
                <tr>
                  <th className="px-6 py-4">Date</th>
                  <th className="px-6 py-4">Exam</th>
                  <th className="px-6 py-4">Speed</th>
                  <th className="px-6 py-4">Accuracy</th>
                  <th className="px-6 py-4">Errors</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-100 dark:divide-gray-700">
                {results.slice(0, 10).map((r, i) => (
                  <tr key={i} className="hover:bg-gray-50 dark:hover:bg-gray-700/50 transition-colors">
                    <td className="px-6 py-4 text-sm dark:text-gray-300">{new Date(r.timestamp?.toDate()).toLocaleDateString()}</td>
                    <td className="px-6 py-4">
                      <span className={cn(
                        "px-2 py-1 rounded text-[10px] font-bold uppercase",
                        r.examType === 'SSC' ? "bg-blue-100 text-blue-700 dark:bg-blue-900/30 dark:text-blue-400" : "bg-orange-100 text-orange-700 dark:bg-orange-900/30 dark:text-orange-400"
                      )}>
                        {r.examType}
                      </span>
                    </td>
                    <td className="px-6 py-4 font-bold dark:text-white">{r.wpm} WPM</td>
                    <td className="px-6 py-4 text-green-600 dark:text-green-400 font-medium">{r.accuracy}%</td>
                    <td className="px-6 py-4 text-red-500">{r.errors}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      </div>
    );
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
            
            {user && profile && (
              <div className="flex items-center gap-1 text-orange-500 bg-orange-50 dark:bg-orange-900/20 px-3 py-1 rounded-full border border-orange-100 dark:border-orange-900/30 animate-pulse">
                <Flame size={16} fill="currentColor" />
                <span className="font-black text-sm">{profile.streak || 0}</span>
              </div>
            )}

            <button 
              onClick={() => setDarkMode(!darkMode)}
              className="p-2 hover:bg-gray-100 dark:hover:bg-gray-700 rounded-full transition-colors"
            >
              {darkMode ? <Sun size={20} className="text-yellow-400" /> : <Moon size={20} className="text-gray-600" />}
            </button>
            
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
              <TypingTest />
            </>
          ) : (
            <AnalysisView />
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
    </div>
  );
}
