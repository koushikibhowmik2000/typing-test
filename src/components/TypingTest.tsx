import React, { useState, useEffect, useRef } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { Timer, Keyboard, Award, RotateCcw, AlertCircle, CheckCircle2, ChevronRight, Volume2, VolumeX, ArrowLeft, Play, XCircle, Music, Trophy } from 'lucide-react';
import { EXAM_TEXTS } from '../constants/texts';
import { ExamType, TestStats, TypingState } from '../types';
import { cn } from '../lib/utils';
import confetti from 'canvas-confetti';
import { auth, saveTestResult, getUserResults } from '../firebase';
import { ACHIEVEMENTS, getUnlockedAchievementIds, Achievement } from '../lib/achievements';

interface TypingTestProps {
  results: any[];
  profile: any;
}

const TypingTest: React.FC<TypingTestProps> = ({ results, profile }) => {
  const [examType, setExamType] = useState<ExamType | null>(null);
  const [sscDuration, setSscDuration] = useState<number>(15);
  const [textWords, setTextWords] = useState<string[]>([]);
  const [state, setState] = useState<TypingState>({
    isActive: false,
    isFinished: false,
    startTime: null,
    currentWordIndex: 0,
    userInput: '',
    errors: 0,
    incorrectWords: [],
    originalText: '',
    backspaceCount: 0,
    mistypedKeys: {},
    stats: null,
  });
  const [timeLeft, setTimeLeft] = useState(15 * 60);
  const [soundEnabled, setSoundEnabled] = useState(true);
  const [countdown, setCountdown] = useState<number | null>(null);
  const [isPlayingAudio, setIsPlayingAudio] = useState(false);
  const [justUnlocked, setJustUnlocked] = useState<Achievement[]>([]);
  const audioRef = useRef<HTMLAudioElement | null>(null);
  
  const inputRef = useRef<HTMLTextAreaElement>(null);
  const timerRef = useRef<NodeJS.Timeout | null>(null);
  const scrollRef = useRef<HTMLDivElement>(null);
  const typingAreaRef = useRef<HTMLDivElement>(null);
  const activeWordRef = useRef<HTMLSpanElement>(null);

  useEffect(() => {
    activeWordRef.current?.scrollIntoView({ behavior: 'smooth', block: 'center' });
  }, [state.currentWordIndex]);

  useEffect(() => {
    const audio = new Audio('https://res.cloudinary.com/speed-searches/video/upload/v1775368031/ntpctyping_ssctyping_typingsound_railwaytyping_TYPING_SOUND_TYPING_HALL_ENVIRONMENT_SOUND_onh0pq.mp3');
    audio.loop = true;
    audioRef.current = audio;
    return () => {
      audio.pause();
      audio.src = '';
    };
  }, []);

  useEffect(() => {
    if (auth.currentUser) {
      getUserResults(auth.currentUser.uid, (results) => {
        // Results are passed as props now, no need to fetch here
      });
    }
  }, [auth.currentUser]);
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

  const getDuration = (type: ExamType | null) => {
    if (type === 'RRB') return 10 * 60;
    if (type === 'SSC') return sscDuration * 60;
    return 15 * 60;
  };

  const startTest = () => {
    const randomText = EXAM_TEXTS[Math.floor(Math.random() * EXAM_TEXTS.length)];
    setTextWords(randomText.split(' '));
    setState({
      isActive: true,
      isFinished: false,
      startTime: Date.now(),
      currentWordIndex: 0,
      userInput: '',
      errors: 0,
      incorrectWords: [],
      originalText: randomText,
      backspaceCount: 0,
      mistypedKeys: {},
      stats: null,
    });
    setTimeLeft(getDuration(examType));
    
    console.log('TypingTest: startTest called, audioRef.current:', audioRef.current);
    if (audioRef.current) {
      console.log('TypingTest: Attempting to play audio');
      try {
        audioRef.current.play();
        setIsPlayingAudio(true);
      } catch (e) {
        console.error('TypingTest: Error playing audio:', e);
      }
    }

    setTimeout(() => {
      typingAreaRef.current?.scrollIntoView({ behavior: 'smooth' });
      inputRef.current?.focus();
    }, 100);
  };

  const resetTest = () => {
    if (audioRef.current) {
      try {
        audioRef.current.pause();
        audioRef.current.currentTime = 0;
        setIsPlayingAudio(false);
      } catch (e) {
        console.error('TypingTest: Error pausing audio:', e);
      }
    }
    setExamType(null);
    setCountdown(null);
    setState({
      isActive: false,
      isFinished: false,
      startTime: null,
      currentWordIndex: 0,
      userInput: '',
      errors: 0,
      incorrectWords: [],
      originalText: '',
      backspaceCount: 0,
      mistypedKeys: {},
      stats: null,
    });
    setJustUnlocked([]);
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

  const finishTest = async (finalInput?: string, finalWordIndex?: number, finalIncorrectWords?: any[]) => {
    if (audioRef.current) {
      try {
        audioRef.current.pause();
        audioRef.current.currentTime = 0;
        setIsPlayingAudio(false);
      } catch (e) {
        console.error('TypingTest: Error pausing audio:', e);
      }
    }
    
    const duration = getDuration(examType);
    const isEarly = timeLeft > 0;
    
    const inputToUse = finalInput !== undefined ? finalInput : state.userInput;
    const wordIndexToUse = finalWordIndex !== undefined ? finalWordIndex : state.currentWordIndex;
    const incorrectWordsToUse = finalIncorrectWords !== undefined ? finalIncorrectWords : state.incorrectWords;

    const finalStats = calculateStats(duration, inputToUse, wordIndexToUse, incorrectWordsToUse);
    setState(prev => ({ ...prev, isActive: false, isFinished: true, stats: finalStats }));
    
    if (auth.currentUser && finalStats) {
      const newResult = {
        examType,
        wpm: finalStats.netWpm,
        accuracy: finalStats.accuracy,
        errors: finalStats.errors,
        totalChars: inputToUse.length,
        timeElapsed: Math.round(duration - timeLeft),
        isEarlyEnd: isEarly,
        backspaceCount: state.backspaceCount,
        mistypedKeys: state.mistypedKeys,
      };

      // Restore achievement logic
      const oldUnlocked = getUnlockedAchievementIds(results, profile);
      const newUnlocked = getUnlockedAchievementIds([newResult, ...results], profile);
      const newlyUnlockedIds = newUnlocked.filter(id => !oldUnlocked.includes(id));
      
      if (newlyUnlockedIds.length > 0) {
        setJustUnlocked(ACHIEVEMENTS.filter(a => newlyUnlockedIds.includes(a.id)));
      }

      try {
        await saveTestResult(auth.currentUser.uid, newResult);
      } catch (error) {
        console.error("Error saving result:", error);
      }
    }

    confetti({
      particleCount: 100,
      spread: 70,
      origin: { y: 0.6 }
    });
  };

  const calculateStats = (duration: number, input: string, wordIdx: number, incorrectWordsList: any[]) => {
    const totalChars = input.length;
    const timeInMinutes = (duration - timeLeft) / 60 || 0.01;
    
    // Standard WPM: (characters / 5) / minutes
    const grossWpm = Math.round((totalChars / 5) / timeInMinutes);
    
    // Accuracy based on words
    const accuracy = wordIdx > 0 ? Math.round(((wordIdx - incorrectWordsList.length) / wordIdx) * 100) : 0;
    
    // Net WPM
    const netWpm = Math.max(0, Math.round(grossWpm * (accuracy / 100)));

    return {
      wpm: netWpm,
      accuracy,
      errors: incorrectWordsList.length,
      totalChars: totalChars,
      timeElapsed: Math.round(duration - timeLeft),
      grossWpm,
      netWpm
    };
  };

  const handleInput = (e: React.ChangeEvent<HTMLTextAreaElement>) => {
    if (!state.isActive || state.isFinished) return;

    const value = e.target.value;

    // Prevent double spaces
    if (value.endsWith('  ')) return;

    // RRB Mode: Disable backspace
    if (examType === 'RRB' && value.length < state.userInput.length) {
      return;
    }

    const typedWords = value.split(' ');
    const currentWordIndex = typedWords.length - 1;

    let errors = 0;
    const incorrectWords: { expected: string; actual: string; index: number }[] = [];

    for (let i = 0; i < typedWords.length; i++) {
      const typed = typedWords[i];
      const expected = textWords[i];
      
      // If it's a completed word (not the last one being typed)
      if (i < currentWordIndex) {
        if (typed !== expected) {
          errors++;
          incorrectWords.push({ expected: expected || '', actual: typed, index: i });
        }
      } else {
        // For the current word, we only count it as an error if it's already longer or different
        // and doesn't match the start of the expected word.
        // However, standard typing tests usually only count errors on completed words.
        // To be "systematic", we'll stick to completed words for the error count
        // but we could track real-time errors here if needed.
      }
    }

    setState(prev => ({
      ...prev,
      userInput: value,
      currentWordIndex,
      errors,
      incorrectWords
    }));

    if (typedWords.length > textWords.length) {
      finishTest(value, currentWordIndex, incorrectWords);
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
                <div className="flex gap-2 justify-center mt-2">
                  {[5, 10, 15].map(m => (
                    <button 
                      key={m}
                      onClick={(e) => {
                        e.stopPropagation();
                        setSscDuration(m);
                      }}
                      className={cn(
                        "px-3 py-1 rounded-md text-xs font-bold transition-all",
                        sscDuration === m 
                          ? "bg-blue-600 text-white shadow-md" 
                          : "bg-gray-100 dark:bg-gray-700 text-gray-500 hover:bg-gray-200"
                      )}
                    >
                      {m} Min
                    </button>
                  ))}
                </div>
              </div>
              <ul className="text-left space-y-2 text-sm text-gray-600 dark:text-gray-400 w-full">
                <li className="flex items-center gap-2"><CheckCircle2 size={16} className="text-green-500" /> Standard SSC CHSL/CGL Pattern</li>
                <li className="flex items-center gap-2"><CheckCircle2 size={16} className="text-green-500" /> Full Backspace Support</li>
                <li className="flex items-center gap-2"><CheckCircle2 size={16} className="text-green-500" /> Real-time Accuracy Tracking</li>
              </ul>
              <button className="w-full mt-4 flex items-center justify-center gap-2 bg-blue-600 hover:bg-blue-700 text-white font-bold py-3 px-6 rounded-full transition-all shadow-lg hover:shadow-blue-500/30">
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
              <button className="w-full mt-4 flex items-center justify-center gap-2 bg-orange-600 hover:bg-orange-700 text-white font-bold py-3 px-6 rounded-full transition-all shadow-lg hover:shadow-orange-500/30">
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
                <p className="text-5xl font-black text-blue-700 dark:text-blue-300">{state.stats?.netWpm} <span className="text-sm font-normal">WPM</span></p>
              </motion.div>
              <motion.div 
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.2 }}
                className="p-6 bg-green-50 dark:bg-green-900/20 rounded-2xl border border-green-100 dark:border-green-900/30"
              >
                <p className="text-green-600 dark:text-green-400 text-xs font-bold uppercase tracking-widest mb-1">Accuracy</p>
                <p className="text-5xl font-black text-green-700 dark:text-green-300">{state.stats?.accuracy}%</p>
              </motion.div>
              <motion.div 
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.3 }}
                className="p-6 bg-gray-50 dark:bg-gray-800 rounded-2xl border border-gray-100 dark:border-gray-700"
              >
                <p className="text-gray-500 dark:text-gray-400 text-xs font-bold uppercase tracking-widest mb-1">Gross Speed</p>
                <p className="text-5xl font-black text-gray-700 dark:text-gray-200">{state.stats?.grossWpm} <span className="text-sm font-normal">WPM</span></p>
              </motion.div>
              <motion.div 
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.4 }}
                className="p-6 bg-red-50 dark:bg-red-900/20 rounded-2xl border border-red-100 dark:border-red-900/30"
              >
                <p className="text-red-600 dark:text-red-400 text-xs font-bold uppercase tracking-widest mb-1">Errors</p>
                <p className="text-5xl font-black text-red-700 dark:text-red-300">{state.stats?.errors}</p>
              </motion.div>
            </div>

            <div className="text-left bg-gray-50 dark:bg-gray-900 p-6 rounded-2xl border border-gray-100 dark:border-gray-800">
              <h3 className="text-lg font-bold mb-4">Your Typed Text</h3>
              <p className="text-lg leading-relaxed">
                {state.userInput.trim().split(/\s+/).map((typedWord, index) => {
                  if (!typedWord) return null;
                  const expectedWord = textWords[index];
                  const isCorrect = typedWord === expectedWord;
                  
                  if (!isCorrect && expectedWord) {
                    return (
                      <span key={index} className="text-red-500 font-bold">
                        {typedWord} <span className="opacity-75">({expectedWord})</span>{' '}
                      </span>
                    );
                  }
                  return <span key={index} className="text-gray-900 dark:text-white">{typedWord}{' '}</span>;
                })}
              </p>
            </div>

            <div className="flex flex-col md:flex-row gap-4 justify-center pt-6">
              <button onClick={() => initiateTest(examType)} className="btn-primary flex items-center gap-2">
                <RotateCcw size={18} /> Retake Test
              </button>
              <button onClick={resetTest} className="btn-outline dark:border-blue-400 dark:text-blue-400">
                Back to Selection
              </button>
            </div>

            {/* Achievement Popup */}
            <AnimatePresence>
              {justUnlocked.length > 0 && (
                <motion.div
                  initial={{ opacity: 0, y: 50 }}
                  animate={{ opacity: 1, y: 0 }}
                  exit={{ opacity: 0, scale: 0.9 }}
                  className="fixed bottom-8 right-8 z-50 flex flex-col gap-4"
                >
                  {justUnlocked.map((achievement) => (
                    <div key={achievement.id} className="bg-white dark:bg-gray-800 rounded-2xl shadow-2xl border border-yellow-200 dark:border-yellow-900/50 p-4 flex items-center gap-4 min-w-[300px] relative overflow-hidden">
                      <div className="absolute top-0 left-0 w-1 h-full bg-yellow-400"></div>
                      <div className="p-3 bg-yellow-50 dark:bg-yellow-900/20 rounded-xl text-3xl">
                        {achievement.icon}
                      </div>
                      <div className="flex-1">
                        <p className="text-xs font-bold text-yellow-600 dark:text-yellow-500 uppercase tracking-wider mb-1">Achievement Unlocked!</p>
                        <h4 className="font-bold text-gray-900 dark:text-white">{achievement.title}</h4>
                        <p className="text-xs text-gray-500 dark:text-gray-400">{achievement.description}</p>
                      </div>
                      <button onClick={() => setJustUnlocked(prev => prev.filter(a => a.id !== achievement.id))} className="text-gray-400 hover:text-gray-600 dark:hover:text-gray-200">
                        <XCircle size={20} />
                      </button>
                    </div>
                  ))}
                </motion.div>
              )}
            </AnimatePresence>
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
                  onClick={() => {
                    if (isPlayingAudio) {
                      try {
                        audioRef.current?.pause();
                        audioRef.current!.currentTime = 0;
                      } catch (e) {
                        console.error('TypingTest: Error pausing audio:', e);
                      }
                    } else {
                      try {
                        audioRef.current?.play();
                      } catch (e) {
                        console.error('TypingTest: Error playing audio:', e);
                      }
                    }
                    setIsPlayingAudio(!isPlayingAudio);
                  }}
                  className={cn(
                    "p-2 transition-colors",
                    isPlayingAudio ? "text-blue-500" : "text-gray-400 hover:text-blue-500"
                  )}
                  title={isPlayingAudio ? "Pause Background Audio" : "Play Background Audio"}
                >
                  <Music size={20} />
                </button>
                <button 
                  onClick={() => finishTest()}
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

            <div className="hidden">
            </div>

            <div ref={typingAreaRef} className="exam-card dark:bg-gray-800 dark:border-gray-700 p-8 space-y-6 shadow-xl">
              <div 
                ref={scrollRef}
                className="relative text-2xl leading-relaxed font-mono text-gray-400 dark:text-gray-600 select-none h-72 overflow-y-auto pr-4 custom-scrollbar bg-gray-50/50 dark:bg-gray-900/30 p-6 rounded-xl border border-gray-100 dark:border-gray-800 block"
              >
                {textWords.map((word, index) => {
                  return (
                    <span key={index} ref={index === state.currentWordIndex ? activeWordRef : null} className="text-gray-700 dark:text-gray-300 mr-2 inline-block mb-2">
                      {word}
                    </span>
                  );
                })}
              </div>

              <textarea
                ref={inputRef}
                value={state.userInput}
                onChange={handleInput}
                onKeyDown={(e) => {
                  if (e.key === 'Backspace') {
                    setState(prev => ({ ...prev, backspaceCount: prev.backspaceCount + 1 }));
                  } else if (e.key.length === 1 && state.userInput.length < state.originalText.length) {
                    const expectedChar = state.originalText[state.userInput.length];
                    if (e.key !== expectedChar) {
                      setState(prev => ({
                        ...prev,
                        mistypedKeys: {
                          ...prev.mistypedKeys,
                          [expectedChar.toLowerCase()]: (prev.mistypedKeys[expectedChar.toLowerCase()] || 0) + 1
                        }
                      }));
                    }
                  }
                }}
                disabled={!state.isActive}
                className="w-full h-32 p-4 border-2 border-gray-200 dark:border-gray-700 dark:bg-gray-900 dark:text-white rounded-lg focus:border-blue-500 focus:ring-2 focus:ring-blue-200 dark:focus:ring-blue-900 outline-none transition-all font-mono text-lg resize-none"
                placeholder="Start typing here..."
                autoFocus
              />
            </div>

            <div className="flex justify-between items-center text-sm text-gray-500 dark:text-gray-400 px-2">
              <div className="flex gap-6">
                <span>Words: {state.currentWordIndex} / {textWords.length}</span>
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
