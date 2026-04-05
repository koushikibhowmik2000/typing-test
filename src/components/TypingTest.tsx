import React, { useState, useEffect, useRef } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { Timer, Keyboard, Award, RotateCcw, AlertCircle, CheckCircle2, ChevronRight, Volume2, VolumeX, ArrowLeft, Play, XCircle } from 'lucide-react';
import { EXAM_TEXTS } from '../constants/texts';
import { ExamType, TestStats, TypingState } from '../types';
import { cn } from '../lib/utils';
import confetti from 'canvas-confetti';
import { auth, saveTestResult } from '../firebase';

const TypingTest: React.FC = () => {
  const [examType, setExamType] = useState<ExamType | null>(null);
  const [text, setText] = useState('');
  const [state, setState] = useState<TypingState>({
    isActive: false,
    isFinished: false,
    startTime: null,
    currentIndex: 0,
    userInput: '',
    errors: 0,
  });
  const [timeLeft, setTimeLeft] = useState(15 * 60);
  const [stats, setStats] = useState<TestStats | null>(null);
  const [soundEnabled, setSoundEnabled] = useState(true);
  const [countdown, setCountdown] = useState<number | null>(null);
  
  const inputRef = useRef<HTMLTextAreaElement>(null);
  const timerRef = useRef<NodeJS.Timeout | null>(null);
  const scrollRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (scrollRef.current) {
      const activeChar = scrollRef.current.querySelector('.animate-pulse');
      if (activeChar) {
        activeChar.scrollIntoView({ behavior: 'smooth', block: 'center' });
      }
    }
  }, [state.currentIndex]);

  const initiateTest = (type: ExamType) => {
    setExamType(type);
    setCountdown(5);
  };

  useEffect(() => {
    if (countdown !== null && countdown > 0) {
      const timer = setTimeout(() => setCountdown(countdown - 1), 1000);
      return () => clearTimeout(timer);
    } else if (countdown === 0) {
      setCountdown(null);
      startTest();
    }
  }, [countdown]);

  const getDuration = (type: ExamType | null) => type === 'RRB' ? 10 * 60 : 15 * 60;

  const startTest = () => {
    const randomText = EXAM_TEXTS[Math.floor(Math.random() * EXAM_TEXTS.length)];
    setText(randomText);
    setState({
      isActive: true,
      isFinished: false,
      startTime: Date.now(),
      currentIndex: 0,
      userInput: '',
      errors: 0,
    });
    setTimeLeft(getDuration(examType));
    setStats(null);
    
    setTimeout(() => {
      inputRef.current?.focus();
    }, 100);
  };

  const resetTest = () => {
    setExamType(null);
    setCountdown(null);
    setState({
      isActive: false,
      isFinished: false,
      startTime: null,
      currentIndex: 0,
      userInput: '',
      errors: 0,
    });
    setStats(null);
    if (timerRef.current) clearInterval(timerRef.current);
  };

  useEffect(() => {
    if (state.isActive && timeLeft > 0) {
      timerRef.current = setInterval(() => {
        setTimeLeft((prev) => {
          if (prev <= 1) {
            finishTest();
            return 0;
          }
          return prev - 1;
        });
      }, 1000);
    } else {
      if (timerRef.current) clearInterval(timerRef.current);
    }
    return () => {
      if (timerRef.current) clearInterval(timerRef.current);
    };
  }, [state.isActive]);

  const finishTest = async () => {
    const duration = getDuration(examType);
    const isEarly = timeLeft > 0;
    setState(prev => ({ ...prev, isActive: false, isFinished: true }));
    const finalStats = calculateStats(duration);
    
    if (auth.currentUser && finalStats) {
      await saveTestResult(auth.currentUser.uid, {
        examType,
        wpm: finalStats.netWpm,
        accuracy: finalStats.accuracy,
        errors: finalStats.errors,
        totalChars: finalStats.totalChars,
        timeElapsed: duration - timeLeft,
        isEarlyEnd: isEarly
      });
    }

    confetti({
      particleCount: 100,
      spread: 70,
      origin: { y: 0.6 }
    });
  };

  const calculateStats = (duration: number) => {
    const timeInMinutes = (duration - timeLeft) / 60 || 0.01;
    const totalChars = state.userInput.length;
    const wordsTyped = totalChars / 5;
    const grossWpm = Math.round(wordsTyped / timeInMinutes);
    
    let correctChars = 0;
    for (let i = 0; i < state.userInput.length; i++) {
      if (state.userInput[i] === text[i]) {
        correctChars++;
      }
    }
    
    const netWpm = Math.round((correctChars / 5) / timeInMinutes);
    const accuracy = totalChars > 0 ? Math.round((correctChars / totalChars) * 100) : 0;

    const finalStats = {
      wpm: netWpm,
      accuracy,
      errors: state.errors,
      totalChars,
      timeElapsed: duration - timeLeft,
      grossWpm,
      netWpm
    };
    setStats(finalStats);
    return finalStats;
  };

  const handleInput = (e: React.ChangeEvent<HTMLTextAreaElement>) => {
    if (!state.isActive || state.isFinished) return;

    const value = e.target.value;
    
    if (examType === 'RRB' && value.length < state.userInput.length) {
      return;
    }

    const lastChar = value[value.length - 1];
    const expectedChar = text[value.length - 1];
    
    let newErrors = state.errors;
    if (value.length > state.userInput.length && lastChar !== expectedChar) {
      newErrors++;
    }

    setState(prev => ({
      ...prev,
      userInput: value,
      currentIndex: value.length,
      errors: newErrors
    }));

    if (value.length === text.length) {
      finishTest();
    }
  };

  const formatTime = (seconds: number) => {
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return `${mins.toString().padStart(2, '0')}:${secs.toString().padStart(2, '0')}`;
  };

  return (
    <div className="max-w-5xl mx-auto px-4 py-8">
      <AnimatePresence mode="wait">
        {countdown !== null ? (
          <motion.div
            key="countdown"
            initial={{ opacity: 0, scale: 0.5 }}
            animate={{ opacity: 1, scale: 1 }}
            exit={{ opacity: 0, scale: 1.5 }}
            className="flex flex-col items-center justify-center h-96"
          >
            <h2 className="text-2xl font-bold mb-4 text-gray-500 dark:text-gray-400">Get Ready!</h2>
            <div className="text-9xl font-black text-blue-600 dark:text-blue-400 animate-bounce">
              {countdown === 0 ? "GO!" : countdown}
            </div>
          </motion.div>
        ) : !examType ? (
          <motion.div 
            key="selection"
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -20 }}
            className="grid md:grid-cols-2 gap-8 mt-12"
          >
            <div className="exam-card dark:bg-gray-800 dark:border-gray-700 p-8 flex flex-col items-center text-center space-y-6 hover:border-blue-400 transition-all cursor-pointer group" onClick={() => initiateTest('SSC')}>
              <div className="w-20 h-20 bg-blue-100 dark:bg-blue-900/30 rounded-full flex items-center justify-center text-blue-600 dark:text-blue-400 group-hover:scale-110 transition-transform">
                <Keyboard size={40} />
              </div>
              <div>
                <h2 className="text-2xl font-bold text-gray-800 dark:text-white">SSC Typing Test</h2>
                <p className="text-gray-500 dark:text-gray-400 mt-2">15 Minutes | Backspace Allowed | High Accuracy</p>
              </div>
              <ul className="text-left space-y-2 text-sm text-gray-600 dark:text-gray-400 w-full">
                <li className="flex items-center gap-2"><CheckCircle2 size={16} className="text-green-500" /> Standard SSC CHSL/CGL Pattern</li>
                <li className="flex items-center gap-2"><CheckCircle2 size={16} className="text-green-500" /> Full Backspace Support</li>
                <li className="flex items-center gap-2"><CheckCircle2 size={16} className="text-green-500" /> Real-time Accuracy Tracking</li>
              </ul>
              <button className="btn-primary w-full mt-4 flex items-center justify-center gap-2">
                Start SSC Test <ChevronRight size={18} />
              </button>
            </div>

            <div className="exam-card dark:bg-gray-800 dark:border-gray-700 p-8 flex flex-col items-center text-center space-y-6 hover:border-orange-400 transition-all cursor-pointer group" onClick={() => initiateTest('RRB')}>
              <div className="w-20 h-20 bg-orange-100 dark:bg-orange-900/30 rounded-full flex items-center justify-center text-orange-600 dark:text-orange-400 group-hover:scale-110 transition-transform">
                <AlertCircle size={40} />
              </div>
              <div>
                <h2 className="text-2xl font-bold text-gray-800 dark:text-white">RRB Typing Test</h2>
                <p className="text-gray-500 dark:text-gray-400 mt-2">10 Minutes | No Backspace | Precision Mode</p>
              </div>
              <ul className="text-left space-y-2 text-sm text-gray-600 dark:text-gray-400 w-full">
                <li className="flex items-center gap-2"><CheckCircle2 size={16} className="text-green-500" /> NTPC/Clerical Exam Pattern</li>
                <li className="flex items-center gap-2"><AlertCircle size={16} className="text-orange-500" /> Backspace Disabled</li>
                <li className="flex items-center gap-2"><CheckCircle2 size={16} className="text-green-500" /> Focus on First-time Accuracy</li>
              </ul>
              <button className="btn-primary bg-orange-600 hover:bg-orange-700 w-full mt-4 flex items-center justify-center gap-2">
                Start RRB Test <ChevronRight size={18} />
              </button>
            </div>
          </motion.div>
        ) : state.isFinished ? (
          <motion.div 
            key="results"
            initial={{ opacity: 0, scale: 0.9 }}
            animate={{ opacity: 1, scale: 1 }}
            className="exam-card dark:bg-gray-800 dark:border-gray-700 p-12 text-center space-y-8"
          >
            <div className="flex justify-center">
              <div className="w-24 h-24 bg-yellow-100 dark:bg-yellow-900/30 rounded-full flex items-center justify-center text-yellow-600">
                <Award size={60} />
              </div>
            </div>
            <h2 className="text-3xl font-bold dark:text-white">Test Results - {examType}</h2>
            
            <div className="grid grid-cols-2 md:grid-cols-4 gap-6">
              <motion.div 
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.1 }}
                className="p-6 bg-blue-50 dark:bg-blue-900/20 rounded-2xl border border-blue-100 dark:border-blue-900/30"
              >
                <p className="text-blue-600 dark:text-blue-400 text-xs font-bold uppercase tracking-widest mb-1">Net Speed</p>
                <p className="text-5xl font-black text-blue-700 dark:text-blue-300">{stats?.netWpm} <span className="text-sm font-normal">WPM</span></p>
              </motion.div>
              <motion.div 
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.2 }}
                className="p-6 bg-green-50 dark:bg-green-900/20 rounded-2xl border border-green-100 dark:border-green-900/30"
              >
                <p className="text-green-600 dark:text-green-400 text-xs font-bold uppercase tracking-widest mb-1">Accuracy</p>
                <p className="text-5xl font-black text-green-700 dark:text-green-300">{stats?.accuracy}%</p>
              </motion.div>
              <motion.div 
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.3 }}
                className="p-6 bg-gray-50 dark:bg-gray-800 rounded-2xl border border-gray-100 dark:border-gray-700"
              >
                <p className="text-gray-500 dark:text-gray-400 text-xs font-bold uppercase tracking-widest mb-1">Gross Speed</p>
                <p className="text-5xl font-black text-gray-700 dark:text-gray-200">{stats?.grossWpm} <span className="text-sm font-normal">WPM</span></p>
              </motion.div>
              <motion.div 
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.4 }}
                className="p-6 bg-red-50 dark:bg-red-900/20 rounded-2xl border border-red-100 dark:border-red-900/30"
              >
                <p className="text-red-600 dark:text-red-400 text-xs font-bold uppercase tracking-widest mb-1">Errors</p>
                <p className="text-5xl font-black text-red-700 dark:text-red-300">{stats?.errors}</p>
              </motion.div>
            </div>

            <div className="flex flex-col md:flex-row gap-4 justify-center pt-6">
              <button onClick={() => initiateTest(examType)} className="btn-primary flex items-center gap-2">
                <RotateCcw size={18} /> Retake Test
              </button>
              <button onClick={resetTest} className="btn-outline dark:border-blue-400 dark:text-blue-400">
                Back to Selection
              </button>
            </div>
          </motion.div>
        ) : (
          <motion.div 
            key="test"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            className="space-y-6"
          >
            <div className="flex justify-between items-center bg-white dark:bg-gray-800 p-4 rounded-lg shadow-sm border border-gray-200 dark:border-gray-700">
              <div className="flex items-center gap-4">
                <button onClick={resetTest} className="p-2 text-gray-400 hover:text-blue-500 transition-colors" title="Back">
                  <ArrowLeft size={20} />
                </button>
                <span className={cn(
                  "px-3 py-1 rounded-full text-xs font-bold uppercase tracking-wider",
                  examType === 'SSC' ? "bg-blue-100 text-blue-700 dark:bg-blue-900/30 dark:text-blue-400" : "bg-orange-100 text-orange-700 dark:bg-orange-900/30 dark:text-orange-400"
                )}>
                  {examType} Mode
                </span>
                <div className="flex items-center gap-2 text-gray-600 dark:text-gray-300 font-mono text-xl">
                  <Timer size={20} />
                  {formatTime(timeLeft)}
                </div>
              </div>
              <div className="flex items-center gap-4">
                <button 
                  onClick={finishTest}
                  className="flex items-center gap-2 px-4 py-2 bg-red-50 text-red-600 hover:bg-red-100 rounded-md transition-colors text-sm font-bold"
                  title="End Test Early"
                >
                  <XCircle size={18} /> End Early
                </button>
                <button 
                  onClick={() => setSoundEnabled(!soundEnabled)}
                  className="p-2 text-gray-400 hover:text-blue-500 transition-colors"
                  title={soundEnabled ? "Disable Sound" : "Enable Sound"}
                >
                  {soundEnabled ? <Volume2 size={20} /> : <VolumeX size={20} />}
                </button>
                <button onClick={resetTest} className="text-gray-400 hover:text-red-500 transition-colors" title="Reset">
                  <RotateCcw size={20} />
                </button>
              </div>
            </div>

            <div className="exam-card dark:bg-gray-800 dark:border-gray-700 p-8 space-y-6 shadow-xl">
              <div 
                ref={scrollRef}
                className="relative text-2xl leading-relaxed font-mono text-gray-400 dark:text-gray-600 select-none h-72 overflow-y-auto pr-4 custom-scrollbar bg-gray-50/50 dark:bg-gray-900/30 p-6 rounded-xl border border-gray-100 dark:border-gray-800"
              >
                {text.split('').map((char, index) => {
                  let color = 'text-gray-400 dark:text-gray-500';
                  let underline = '';
                  
                  if (index < state.userInput.length) {
                    const isCorrect = state.userInput[index] === text[index];
                    color = isCorrect 
                      ? 'text-green-600 dark:text-green-400 font-bold' 
                      : 'text-white bg-red-500 rounded-sm px-0.5';
                  }
                  
                  if (index === state.userInput.length) {
                    underline = 'bg-blue-100 dark:bg-blue-900/40 border-b-2 border-blue-500 animate-pulse';
                    color = 'text-gray-900 dark:text-white font-bold';
                  }

                  return (
                    <span key={index} className={cn(color, underline)}>
                      {char}
                    </span>
                  );
                })}
              </div>

              <textarea
                ref={inputRef}
                value={state.userInput}
                onChange={handleInput}
                disabled={!state.isActive}
                className="w-full h-32 p-4 border-2 border-gray-200 dark:border-gray-700 dark:bg-gray-900 dark:text-white rounded-lg focus:border-blue-500 focus:ring-2 focus:ring-blue-200 dark:focus:ring-blue-900 outline-none transition-all font-mono text-lg resize-none"
                placeholder="Start typing here..."
                autoFocus
              />
            </div>

            <div className="flex justify-between items-center text-sm text-gray-500 dark:text-gray-400 px-2">
              <div className="flex gap-6">
                <span>Characters: {state.userInput.length} / {text.length}</span>
                <span>Errors: <span className="text-red-500 font-bold">{state.errors}</span></span>
              </div>
              <div className="flex items-center gap-2">
                <AlertCircle size={14} />
                {examType === 'RRB' ? "Backspace is disabled in RRB mode" : "Backspace is allowed in SSC mode"}
              </div>
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
};

export default TypingTest;
