/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState, useEffect } from 'react';
import { 
  Home, 
  BookOpen, 
  FileText, 
  HelpCircle, 
  User, 
  Search, 
  Filter, 
  Play, 
  ChevronRight, 
  Bell, 
  Menu,
  ArrowLeft,
  Download,
  Settings,
  LogOut,
  CheckCircle2,
  XCircle,
  ArrowRight,
  Clock,
  X,
  ShieldCheck,
  CreditCard,
  MessageSquare,
  Info,
  Eye
} from 'lucide-react';
import { motion, AnimatePresence } from 'motion/react';

import ReactMarkdown from 'react-markdown';

// --- Types ---
type Screen = 'home' | 'courses' | 'notes' | 'quiz' | 'profile' | 'settings' | 'admin' | 'video-player' | 'note-viewer' | 'course-details';

interface Lesson {
  id: string;
  course_id: string;
  title: string;
  duration: string;
  note_content: string;
  note_url?: string;
  video_url?: string;
}

interface Course {
  id: string;
  title: string;
  lessons: number;
  image: string;
  price?: number;
  oldPrice?: number;
  type: 'free' | 'premium';
  category: string;
  lessonList?: Lesson[];
}

interface Note {
  id: string;
  title: string;
  lessons: number;
  category: string;
  type?: 'free' | 'premium';
  url?: string;
  content?: string;
}

interface Question {
  id: string;
  text: string;
  options: string[];
  correctAnswer: number;
  explanation?: string;
}

interface Quiz {
  id: string;
  topic: string;
  questions: Question[];
}

interface AuthUser {
  id: string;
  name: string;
  email: string;
}

interface StoredUser extends AuthUser {
  password: string;
}

interface AdminUser extends AuthUser {
  grantedCourseIds: string[];
}

const AUTH_STORAGE_KEY = 'rbs-academy-users';
const THEME_STORAGE_KEY = 'rbs-academy-theme';
const USER_SESSION_KEY = 'rbs-academy-user-session';
const ADMIN_SESSION_KEY = 'rbs-academy-admin-session';
const ADMIN_USERNAME = '9810RBS';
const ADMIN_PASSWORD = '9810337844';
const APPS_SCRIPT_URL = (import.meta.env.VITE_APPS_SCRIPT_URL || '').trim();

const apiGet = async (resource: 'courses' | 'notes' | 'quizzes' | 'users', params?: Record<string, string>) => {
  const query = new URLSearchParams(params || {});
  query.set('resource', resource);
  const endpoint = APPS_SCRIPT_URL
    ? `${APPS_SCRIPT_URL}?${query.toString()}`
    : `/api/${resource}`;

  return fetch(endpoint);
};

const apiAuthPost = async (
  action: 'login' | 'signup',
  payload: Record<string, unknown>
) => {
  if (APPS_SCRIPT_URL) {
    return fetch(APPS_SCRIPT_URL, {
      method: 'POST',
      headers: { 'Content-Type': 'text/plain;charset=utf-8' },
      body: JSON.stringify({ action, ...payload })
    });
  }

  return fetch(action === 'signup' ? '/api/signup' : '/api/login', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(payload)
  });
};

const apiPost = async (action: string, payload: Record<string, unknown>) => {
  if (APPS_SCRIPT_URL) {
    return fetch(APPS_SCRIPT_URL, {
      method: 'POST',
      headers: { 'Content-Type': 'text/plain;charset=utf-8' },
      body: JSON.stringify({ action, ...payload })
    });
  }

  return fetch('/api/' + action, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(payload)
  });
};

const normalizeAuthUser = (
  user: any,
  fallback: { name?: string; email?: string } = {}
): AuthUser => ({
  id: String(user?.id || `u${Date.now()}`),
  name: String(user?.name || fallback.name || 'Student'),
  email: String(user?.email || fallback.email || ''),
});

const getStoredUsers = (): StoredUser[] => {
  if (typeof window === 'undefined') {
    return [];
  }

  const rawUsers = window.localStorage.getItem(AUTH_STORAGE_KEY);
  if (!rawUsers) {
    return [{ id: 'u1', name: 'Rahul Sharma', email: 'rahul@example.com', password: '123456' }];
  }

  try {
    const parsedUsers = JSON.parse(rawUsers) as StoredUser[];
    return parsedUsers.length ? parsedUsers : [{ id: 'u1', name: 'Rahul Sharma', email: 'rahul@example.com', password: '123456' }];
  } catch {
    return [{ id: 'u1', name: 'Rahul Sharma', email: 'rahul@example.com', password: '123456' }];
  }
};

const saveStoredUsers = (users: StoredUser[]) => {
  if (typeof window !== 'undefined') {
    window.localStorage.setItem(AUTH_STORAGE_KEY, JSON.stringify(users));
  }
};

const getStoredSessionUser = (): AuthUser | null => {
  if (typeof window === 'undefined') {
    return null;
  }

  const rawUser = window.localStorage.getItem(USER_SESSION_KEY);
  if (!rawUser) {
    return null;
  }

  try {
    return JSON.parse(rawUser) as AuthUser;
  } catch {
    return null;
  }
};

const saveSessionUser = (user: AuthUser | null) => {
  if (typeof window === 'undefined') {
    return;
  }

  if (!user) {
    window.localStorage.removeItem(USER_SESSION_KEY);
    return;
  }

  window.localStorage.setItem(USER_SESSION_KEY, JSON.stringify(user));
};

const getAdminSession = () => {
  if (typeof window === 'undefined') {
    return false;
  }

  return window.localStorage.getItem(ADMIN_SESSION_KEY) === 'true';
};

const saveAdminSession = (enabled: boolean) => {
  if (typeof window === 'undefined') {
    return;
  }

  if (enabled) {
    window.localStorage.setItem(ADMIN_SESSION_KEY, 'true');
  } else {
    window.localStorage.removeItem(ADMIN_SESSION_KEY);
  }
};

const fallbackQuizzes: Quiz[] = [
  {
    id: 'q1',
    topic: 'Chemistry',
    questions: [
      {
        id: 'qn1',
        text: 'Which of the following is a decomposition reaction?',
        options: ['H2 + O2 -> H2O', 'CaCO3 -> CaO + CO2', 'Zn + HCl -> ZnCl2 + H2', 'NaOH + HCl -> NaCl + H2O'],
        correctAnswer: 1,
        explanation: 'CaCO3 breaking into CaO and CO2 is a decomposition reaction.'
      },
      {
        id: 'qn2',
        text: 'What is the pH of a neutral solution?',
        options: ['0', '14', '7', '1'],
        correctAnswer: 2,
        explanation: 'A neutral solution has pH 7.'
      },
      {
        id: 'qn3',
        text: 'Which gas is evolved when zinc reacts with dilute sulphuric acid?',
        options: ['Oxygen', 'Hydrogen', 'Carbon Dioxide', 'Nitrogen'],
        correctAnswer: 1,
        explanation: 'Zinc reacts with dilute sulphuric acid to release hydrogen gas.'
      }
    ]
  },
  {
    id: 'q2',
    topic: 'Physics',
    questions: [
      {
        id: 'qn4',
        text: 'The focal length of a plane mirror is:',
        options: ['Zero', 'Infinite', '25 cm', '-25 cm'],
        correctAnswer: 1,
        explanation: 'A plane mirror has infinite focal length.'
      },
      {
        id: 'qn5',
        text: 'The unit of power of a lens is:',
        options: ['Meter', 'Dioptre', 'Watt', 'Joule'],
        correctAnswer: 1,
        explanation: 'Lens power is measured in dioptre.'
      },
      {
        id: 'qn6',
        text: 'Which mirror is used as a rear-view mirror in vehicles?',
        options: ['Concave', 'Convex', 'Plane', 'None'],
        correctAnswer: 1,
        explanation: 'Convex mirrors provide a wider field of view.'
      }
    ]
  },
  {
    id: 'q3',
    topic: 'Biology',
    questions: [
      {
        id: 'qn7',
        text: 'Which part of the cell is known as the control center?',
        options: ['Nucleus', 'Cytoplasm', 'Cell membrane', 'Ribosome'],
        correctAnswer: 0,
        explanation: 'The nucleus controls major cell activities.'
      },
      {
        id: 'qn8',
        text: 'Photosynthesis mainly takes place in which part of the plant cell?',
        options: ['Mitochondria', 'Chloroplast', 'Vacuole', 'Nucleus'],
        correctAnswer: 1,
        explanation: 'Chloroplasts contain chlorophyll and are the site of photosynthesis.'
      },
      {
        id: 'qn9',
        text: 'Which blood vessel carries blood away from the heart?',
        options: ['Vein', 'Capillary', 'Artery', 'Nerve'],
        correctAnswer: 2,
        explanation: 'Arteries carry blood away from the heart.'
      }
    ]
  },
  {
    id: 'q4',
    topic: 'Mathematics',
    questions: [
      {
        id: 'qn10',
        text: 'What is the value of sin 90 degrees?',
        options: ['0', '1', '1/2', 'sqrt(3)/2'],
        correctAnswer: 1,
        explanation: 'sin 90 degrees equals 1.'
      },
      {
        id: 'qn11',
        text: 'If x + 7 = 15, what is the value of x?',
        options: ['6', '7', '8', '9'],
        correctAnswer: 2,
        explanation: 'Subtract 7 from both sides to get x = 8.'
      },
      {
        id: 'qn12',
        text: 'What is the area of a rectangle with length 8 cm and breadth 5 cm?',
        options: ['13 cm2', '26 cm2', '40 cm2', '80 cm2'],
        correctAnswer: 2,
        explanation: 'Area = length x breadth = 40 cm2.'
      }
    ]
  },
  {
    id: 'q5',
    topic: 'English',
    questions: [
      {
        id: 'qn13',
        text: 'Which of the following is a noun?',
        options: ['Quickly', 'Beautiful', 'Honesty', 'Run'],
        correctAnswer: 2,
        explanation: 'Honesty is an abstract noun.'
      },
      {
        id: 'qn14',
        text: 'Choose the correct synonym of "rapid".',
        options: ['Slow', 'Fast', 'Weak', 'Silent'],
        correctAnswer: 1,
        explanation: 'Rapid means fast.'
      },
      {
        id: 'qn15',
        text: 'Which sentence is in the past tense?',
        options: ['She sings well.', 'They are playing.', 'He went to school.', 'I will call you.'],
        correctAnswer: 2,
        explanation: 'The verb "went" is in the past tense.'
      }
    ]
  },
  {
    id: 'q6',
    topic: 'History',
    questions: [
      {
        id: 'qn16',
        text: 'Who was the first Prime Minister of independent India?',
        options: ['Mahatma Gandhi', 'Sardar Patel', 'Jawaharlal Nehru', 'Subhas Chandra Bose'],
        correctAnswer: 2,
        explanation: 'Jawaharlal Nehru became the first Prime Minister in 1947.'
      },
      {
        id: 'qn17',
        text: 'In which year did India gain independence?',
        options: ['1945', '1947', '1950', '1952'],
        correctAnswer: 1,
        explanation: 'India became independent in 1947.'
      },
      {
        id: 'qn18',
        text: 'The Harappan civilization is also known as the:',
        options: ['Vedic civilization', 'Indus Valley civilization', 'Mauryan civilization', 'Gupta civilization'],
        correctAnswer: 1,
        explanation: 'Harappan civilization is another name for the Indus Valley civilization.'
      }
    ]
  },
  {
    id: 'q7',
    topic: 'Computer Science',
    questions: [
      {
        id: 'qn19',
        text: 'What does CPU stand for?',
        options: ['Central Processing Unit', 'Computer Primary Unit', 'Central Program Utility', 'Control Processing Utility'],
        correctAnswer: 0,
        explanation: 'CPU stands for Central Processing Unit.'
      },
      {
        id: 'qn20',
        text: 'Which of the following is an output device?',
        options: ['Keyboard', 'Mouse', 'Monitor', 'Scanner'],
        correctAnswer: 2,
        explanation: 'A monitor is an output device.'
      },
      {
        id: 'qn21',
        text: 'Binary language uses which two digits?',
        options: ['0 and 1', '1 and 2', '2 and 3', '0 and 9'],
        correctAnswer: 0,
        explanation: 'Binary uses only 0 and 1.'
      },
      {
    id: 'q21',
    topic: 'Computer Science',
    questions: [
      {
        id: 'Q21',
        text: 'What does KAJAL KHAYEGA?',
        options: ['DAL BHAT', 'MASU BHAT', 'DAL BAHAT', 'Control Processing Utility'],
        correctAnswer: 0,
        explanation: 'CPU stands for Central Processing Unit.'
      },
    ]
  }
];

const mergeQuizzes = (apiQuizzes: Quiz[]): Quiz[] => {
  const quizMap = new Map(
    fallbackQuizzes.map((quiz) => [quiz.topic.toLowerCase(), quiz])
  );

  apiQuizzes.forEach((quiz) => {
    const key = quiz.topic.toLowerCase();
    const fallbackQuiz = quizMap.get(key);
    quizMap.set(key, {
      ...(fallbackQuiz || quiz),
      ...quiz,
      questions: quiz.questions?.length ? quiz.questions : fallbackQuiz?.questions || []
    });
  });

  return Array.from(quizMap.values());
};

// --- Components ---

const LoginScreen = ({ onLogin }: { onLogin: (user: any) => void }) => {
  const [isSignup, setIsSignup] = useState(false);
  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError('');

    if (isSignup && password !== confirmPassword) {
      setError('Passwords do not match');
      setLoading(false);
      return;
    }

    try {
      const payload = isSignup ? { name, email, password } : { email, password };

      const res = await apiAuthPost(isSignup ? 'signup' : 'login', payload);
      const data = await res.json();
      if (data.success) {
        onLogin(normalizeAuthUser(data.user, { name, email }));
      } else {
        setError(data.message || (isSignup ? 'Signup failed' : 'Login failed'));
      }
    } catch (err) {
      const storedUsers = getStoredUsers();

      if (isSignup) {
        const existingUser = storedUsers.find((user) => user.email.toLowerCase() === email.toLowerCase());
        if (existingUser) {
          setError('Email already registered');
          setLoading(false);
          return;
        }

        const newUser: StoredUser = {
          id: `u${Date.now()}`,
          name,
          email,
          password
        };

        saveStoredUsers([...storedUsers, newUser]);
        onLogin(normalizeAuthUser(newUser, { name, email }));
      } else {
        const matchedUser = storedUsers.find(
          (user) => user.email.toLowerCase() === email.toLowerCase() && user.password === password
        );

        if (!matchedUser) {
          setError('Invalid credentials');
          setLoading(false);
          return;
        }

        onLogin(normalizeAuthUser(matchedUser, { email }));
      }
    } finally {
      setLoading(false);
    }
  };

  return (
    <motion.div 
      initial={{ opacity: 0, y: 20 }} 
      animate={{ opacity: 1, y: 0 }} 
      className="flex-1 flex flex-col items-center justify-center p-6 bg-white"
    >
      <div className="w-20 h-20 bg-primary rounded-2xl flex items-center justify-center text-white mb-8 shadow-xl shadow-blue-100">
        <BookOpen size={40} />
      </div>
      <h1 className="text-3xl font-bold text-gray-800 mb-2">RBS Academy</h1>
      <p className="text-gray-500 mb-10">{isSignup ? 'Create your account to start learning' : 'Your Journey to Excellence Starts Here'}</p>

      <div className="w-full bg-gray-100 rounded-2xl p-1 flex mb-6">
        <button
          type="button"
          onClick={() => {
            setIsSignup(false);
            setError('');
            setConfirmPassword('');
          }}
          className={`flex-1 rounded-xl py-3 text-sm font-bold transition-colors ${!isSignup ? 'bg-white text-primary shadow-sm' : 'text-gray-500'}`}
        >
          Sign In
        </button>
        <button
          type="button"
          onClick={() => {
            setIsSignup(true);
            setError('');
          }}
          className={`flex-1 rounded-xl py-3 text-sm font-bold transition-colors ${isSignup ? 'bg-white text-primary shadow-sm' : 'text-gray-500'}`}
        >
          Sign Up
        </button>
      </div>

      <form onSubmit={handleSubmit} className="w-full space-y-4">
        {isSignup && (
          <div>
            <label className="block text-xs font-bold text-gray-400 uppercase tracking-wider mb-2">Full Name</label>
            <input 
              type="text"
              required
              className="w-full bg-gray-50 border border-gray-100 rounded-xl px-4 py-4 text-sm focus:outline-none focus:ring-2 focus:ring-primary/20"
              placeholder="Rahul Sharma"
              value={name}
              onChange={(e) => setName(e.target.value)}
            />
          </div>
        )}
        <div>
          <label className="block text-xs font-bold text-gray-400 uppercase tracking-wider mb-2">Email Address</label>
          <input 
            type="email" 
            required
            className="w-full bg-gray-50 border border-gray-100 rounded-xl px-4 py-4 text-sm focus:outline-none focus:ring-2 focus:ring-primary/20"
            placeholder="name@example.com"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
          />
        </div>
        <div>
          <label className="block text-xs font-bold text-gray-400 uppercase tracking-wider mb-2">Password</label>
          <input 
            type="password" 
            required
            className="w-full bg-gray-50 border border-gray-100 rounded-xl px-4 py-4 text-sm focus:outline-none focus:ring-2 focus:ring-primary/20"
            placeholder="••••••••"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
          />
        </div>

        {isSignup && (
          <div>
            <label className="block text-xs font-bold text-gray-400 uppercase tracking-wider mb-2">Confirm Password</label>
            <input 
              type="password"
              required
              className="w-full bg-gray-50 border border-gray-100 rounded-xl px-4 py-4 text-sm focus:outline-none focus:ring-2 focus:ring-primary/20"
              placeholder="Confirm password"
              value={confirmPassword}
              onChange={(e) => setConfirmPassword(e.target.value)}
            />
          </div>
        )}
        
        {error && <p className="text-red-500 text-xs font-medium">{error}</p>}

        <button 
          type="submit"
          disabled={loading}
          className="w-full bg-primary text-white py-4 rounded-xl font-bold shadow-lg shadow-blue-100 flex items-center justify-center gap-2"
        >
          {loading ? <div className="w-5 h-5 border-2 border-white border-t-transparent rounded-full animate-spin"></div> : (isSignup ? 'Create Account' : 'Sign In')}
        </button>
      </form>

      <p className="mt-8 text-sm text-gray-500">
        {isSignup ? 'Already have an account? ' : "Don't have an account? "}
        <button
          type="button"
          onClick={() => {
            setIsSignup(!isSignup);
            setError('');
            setPassword('');
            setConfirmPassword('');
          }}
          className="text-primary font-bold"
        >
          {isSignup ? 'Sign In' : 'Sign Up'}
        </button>
      </p>
    </motion.div>
  );
};

const Loading = () => (
  <div className="flex-1 flex flex-col items-center justify-center">
    <div className="w-10 h-10 border-4 border-primary border-t-transparent rounded-full animate-spin mb-4"></div>
    <p className="text-gray-500 text-sm animate-pulse">Loading Academy...</p>
  </div>
);

const AccessCodeModal = ({ 
  isOpen, 
  onClose, 
  onUnlock, 
  courseTitle 
}: { 
  isOpen: boolean, 
  onClose: () => void, 
  onUnlock: (code: string) => Promise<{ success: boolean; message?: string }>,
  courseTitle: string
}) => {
  const [code, setCode] = useState('');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);

  const handleUnlock = async () => {
    if (!code.trim()) {
      setError('Please enter access code');
      return;
    }

    setLoading(true);
    const result = await onUnlock(code);
    if (!result.success) {
      setError(result.message || 'Invalid access code');
    }
    setLoading(false);
  };

  const handleWhatsApp = () => {
    const message = encodeURIComponent(`Hello Admin, I want to buy the course: ${courseTitle}. Please provide the access code.`);
    window.open(`https://wa.me/919876543210?text=${message}`, '_blank');
  };

  return (
    <AnimatePresence>
      {isOpen && (
        <>
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            onClick={onClose}
            className="fixed inset-0 bg-black/60 z-[100] backdrop-blur-sm flex items-center justify-center p-6"
          >
            <motion.div
              initial={{ scale: 0.9, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              exit={{ scale: 0.9, opacity: 0 }}
              onClick={(e) => e.stopPropagation()}
              className="bg-white w-full max-w-sm rounded-3xl overflow-hidden shadow-2xl"
            >
              <div className="bg-primary p-6 text-white text-center relative">
                <button onClick={onClose} className="absolute top-4 right-4 text-white/60 hover:text-white"><X size={20} /></button>
                <div className="w-16 h-16 bg-white/20 rounded-full flex items-center justify-center mx-auto mb-4">
                  <ShieldCheck size={32} />
                </div>
                <h3 className="text-xl font-bold">Unlock Course</h3>
                <p className="text-white/70 text-xs mt-1">{courseTitle}</p>
              </div>

              <div className="p-6 space-y-4">
                <div>
                  <label className="block text-[10px] font-bold text-gray-400 uppercase tracking-widest mb-2">Enter Access Code</label>
                  <input 
                    type="text" 
                    className="w-full bg-gray-50 border border-gray-100 rounded-xl px-4 py-3 text-center font-mono text-lg tracking-[0.5em] focus:outline-none focus:ring-2 focus:ring-primary/20"
                    placeholder="••••••"
                    value={code}
                    onChange={(e) => {
                      setCode(e.target.value.toUpperCase());
                      setError('');
                    }}
                  />
                  {error && <p className="text-red-500 text-[10px] mt-1 text-center font-medium">{error}</p>}
                </div>

                <button 
                  onClick={handleUnlock}
                  disabled={loading}
                  className="w-full bg-primary text-white py-4 rounded-xl font-bold shadow-lg shadow-blue-100 transition-transform active:scale-95"
                >
                  {loading ? 'Checking...' : 'Unlock Now'}
                </button>

                <div className="relative py-2">
                  <div className="absolute inset-0 flex items-center"><div className="w-full border-t border-gray-100"></div></div>
                  <div className="relative flex justify-center text-[10px] uppercase font-bold text-gray-300"><span className="bg-white px-2">OR</span></div>
                </div>

                <button 
                  onClick={handleWhatsApp}
                  className="w-full bg-[#25D366] text-white py-4 rounded-xl font-bold shadow-lg shadow-green-100 flex items-center justify-center gap-2 transition-transform active:scale-95"
                >
                  <MessageSquare size={20} />
                  Buy on WhatsApp
                </button>

                <p className="text-[10px] text-gray-400 text-center leading-relaxed">
                  Contact admin on WhatsApp to get your unique access code after payment.
                </p>
              </div>
            </motion.div>
          </motion.div>
        </>
      )}
    </AnimatePresence>
  );
};

const BottomNav = ({ activeScreen, setScreen, onQuizClick }: { activeScreen: Screen, setScreen: (s: Screen) => void, onQuizClick?: () => void }) => (
  <nav className="nav-bottom">
    <button onClick={() => setScreen('home')} className={`nav-item ${activeScreen === 'home' ? 'active' : ''}`}>
      <Home size={24} />
      <span className="text-[10px] font-medium">Home</span>
    </button>
    <button onClick={() => setScreen('courses')} className={`nav-item ${activeScreen === 'courses' ? 'active' : ''}`}>
      <BookOpen size={24} />
      <span className="text-[10px] font-medium">Courses</span>
    </button>
    <button onClick={() => setScreen('notes')} className={`nav-item ${activeScreen === 'notes' ? 'active' : ''}`}>
      <FileText size={24} />
      <span className="text-[10px] font-medium">Notes</span>
    </button>
    <button onClick={() => onQuizClick ? onQuizClick() : setScreen('quiz')} className={`nav-item ${activeScreen === 'quiz' ? 'active' : ''}`}>
      <HelpCircle size={24} />
      <span className="text-[10px] font-medium">Quiz</span>
    </button>
    <button onClick={() => setScreen('profile')} className={`nav-item ${activeScreen === 'profile' ? 'active' : ''}`}>
      <User size={24} />
      <span className="text-[10px] font-medium">Profile</span>
    </button>
  </nav>
);

const Header = ({ title, showBack, onBack, onMenuClick }: { title: string, showBack?: boolean, onBack?: () => void, onMenuClick?: () => void }) => (
  <header className="bg-primary text-white px-4 py-4 flex items-center justify-between sticky top-0 z-40">
    <div className="flex items-center gap-3">
      {showBack ? (
        <button onClick={onBack} className="p-1"><ArrowLeft size={24} /></button>
      ) : (
        <button onClick={onMenuClick} className="p-1"><Menu size={24} /></button>
      )}
      <h1 className="text-lg font-bold">{title}</h1>
    </div>
    <div className="flex items-center gap-4">
      <Bell size={20} />
      <div className="w-8 h-8 rounded-full bg-white/20 flex items-center justify-center overflow-hidden border border-white/30">
        <img src="https://api.dicebear.com/7.x/avataaars/svg?seed=Rahul" alt="Avatar" referrerPolicy="no-referrer" />
      </div>
    </div>
  </header>
);

const SectionHeader = ({ title, onSeeAll }: { title: string, onSeeAll?: () => void }) => (
  <div className="flex items-center justify-between mb-4">
    <h2 className="text-lg font-bold text-gray-800">{title}</h2>
    {onSeeAll && (
      <button onClick={onSeeAll} className="text-primary text-sm font-medium">See All</button>
    )}
  </div>
);

const ImageSlider = () => {
  const images = [
    'https://picsum.photos/seed/slide1/800/400',
    'https://picsum.photos/seed/slide2/800/400',
    'https://picsum.photos/seed/slide3/800/400',
  ];
  const [currentIndex, setCurrentIndex] = useState(0);

  useEffect(() => {
    const timer = setInterval(() => {
      setCurrentIndex((prev) => (prev + 1) % images.length);
    }, 3000);
    return () => clearInterval(timer);
  }, []);

  return (
    <div className="relative w-full h-48 rounded-2xl overflow-hidden mb-6 shadow-lg">
      <AnimatePresence mode="wait">
        <motion.img
          key={currentIndex}
          src={images[currentIndex]}
          initial={{ opacity: 0, x: 50 }}
          animate={{ opacity: 1, x: 0 }}
          exit={{ opacity: 0, x: -50 }}
          transition={{ duration: 0.5 }}
          className="absolute inset-0 w-full h-full object-cover"
          referrerPolicy="no-referrer"
        />
      </AnimatePresence>
      <div className="absolute bottom-3 left-0 right-0 flex justify-center gap-2">
        {images.map((_, idx) => (
          <button
            key={idx}
            onClick={() => setCurrentIndex(idx)}
            className={`w-2 h-2 rounded-full transition-all ${currentIndex === idx ? 'bg-white w-4' : 'bg-white/50'}`}
          />
        ))}
      </div>
      <div className="absolute inset-0 bg-gradient-to-t from-black/40 to-transparent pointer-events-none"></div>
      <div className="absolute bottom-6 left-6 text-white">
        <h2 className="text-xl font-bold">Welcome to Academy</h2>
        <p className="text-xs text-white/80">Start your learning journey today</p>
      </div>
    </div>
  );
};

const SideDrawer = ({ isOpen, onClose, user, setScreen }: { isOpen: boolean, onClose: () => void, user: any, setScreen: (s: Screen) => void }) => {
  const menuItems = [
    { icon: <ShieldCheck size={20} />, label: 'Privacy Policy' },
    { icon: <CreditCard size={20} />, label: 'Payment History' },
    { icon: <MessageSquare size={20} />, label: 'Support Chat' },
    { icon: <Info size={20} />, label: 'About Us' },
    { icon: <Settings size={20} />, label: 'Settings' },
  ];

  return (
    <AnimatePresence>
      {isOpen && (
        <>
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            onClick={onClose}
            className="fixed inset-0 bg-black/50 z-[60] backdrop-blur-sm"
          />
          <motion.div
            initial={{ x: '-100%' }}
            animate={{ x: 0 }}
            exit={{ x: '-100%' }}
            transition={{ type: 'spring', damping: 25, stiffness: 200 }}
            className="fixed top-0 left-0 bottom-0 w-[280px] bg-white z-[70] shadow-2xl flex flex-col"
          >
            <div className="bg-primary p-6 text-white relative overflow-hidden">
              <button 
                onClick={onClose}
                className="absolute top-4 right-4 p-2 bg-white/10 rounded-full hover:bg-white/20 transition-colors"
              >
                <X size={20} />
              </button>
              <div className="relative z-10">
                <div className="w-16 h-16 rounded-full border-2 border-white/30 p-1 mb-4">
                  <img 
                    src={`https://api.dicebear.com/7.x/avataaars/svg?seed=${user?.name || 'Rahul'}`} 
                    alt="Profile" 
                    className="w-full h-full rounded-full bg-white" 
                    referrerPolicy="no-referrer" 
                  />
                </div>
                <h3 className="text-lg font-bold">{user?.name || 'Rahul Sharma'}</h3>
                <p className="text-white/70 text-xs">{user?.email || 'student@academy.com'}</p>
              </div>
              <div className="absolute -right-10 -bottom-10 w-32 h-32 bg-white/10 rounded-full blur-2xl"></div>
            </div>

            <div className="flex-1 overflow-y-auto py-4">
              <div className="px-4 mb-2">
                <p className="text-[10px] font-bold text-gray-400 uppercase tracking-widest">Main Menu</p>
              </div>
              {menuItems.map((item, idx) => (
                <button 
                  key={idx} 
                  className="w-full flex items-center gap-4 px-6 py-4 hover:bg-gray-50 transition-colors text-gray-700"
                  onClick={() => {
                    if (item.label === 'Settings') {
                      setScreen('settings');
                    }
                    onClose();
                  }}
                >
                  <div className="text-primary">{item.icon}</div>
                  <span className="text-sm font-medium">{item.label}</span>
                </button>
              ))}
            </div>

            <div className="p-6 border-t border-gray-100">
              <div className="bg-primary/5 p-4 rounded-xl">
                <p className="text-xs font-bold text-primary mb-1">Academy Pro</p>
                <p className="text-[10px] text-gray-500 mb-3">Get unlimited access to all courses and notes.</p>
                <button className="w-full bg-primary text-white py-2 rounded-lg text-xs font-bold shadow-lg shadow-blue-100">
                  Upgrade Now
                </button>
              </div>
            </div>
          </motion.div>
        </>
      )}
    </AnimatePresence>
  );
};

// --- Screens ---

const HomeScreen = ({ 
  setScreen, 
  courses, 
  unlockedCourseIds, 
  onBuyClick,
  onCourseSelect
}: { 
  setScreen: (s: Screen) => void, 
  courses: Course[],
  unlockedCourseIds: string[],
  onBuyClick: (course: Course) => void,
  onCourseSelect: (course: Course) => void
}) => {
  return (
    <motion.div 
      initial={{ opacity: 0 }} 
      animate={{ opacity: 1 }} 
      className="flex-1 overflow-y-auto pb-24 px-4 pt-4"
    >
      <ImageSlider />

      {/* My Premium Courses (Unlocked) */}
      {courses.filter(c => c.type === 'premium' && unlockedCourseIds.includes(c.id)).length > 0 && (
        <div className="mt-6 mb-4">
          <SectionHeader title="My Premium Courses" />
          <div className="flex gap-4 overflow-x-auto pb-2 no-scrollbar">
            {courses
              .filter(c => c.type === 'premium' && unlockedCourseIds.includes(c.id))
              .map(course => (
                <button 
                  key={course.id} 
                  onClick={() => {
                    onCourseSelect(course);
                    setScreen('course-details');
                  }}
                  className="min-w-[280px] bg-white rounded-2xl overflow-hidden border border-primary/20 shadow-md shadow-primary/5 text-left flex items-center p-3 gap-3"
                >
                  <img src={course.image} alt={course.title} className="w-20 h-20 rounded-xl object-cover" referrerPolicy="no-referrer" />
                  <div className="flex-1">
                    <div className="flex items-center gap-1 mb-1">
                      <ShieldCheck size={12} className="text-primary" />
                      <span className="text-[10px] font-bold text-primary uppercase tracking-wider">Unlocked</span>
                    </div>
                    <h3 className="text-sm font-bold text-gray-800 line-clamp-1">{course.title}</h3>
                    <p className="text-[10px] text-gray-500 mt-1">Continue Learning</p>
                    <div className="w-full h-1 bg-gray-100 rounded-full mt-2 overflow-hidden">
                      <div className="w-1/3 h-full bg-primary"></div>
                    </div>
                  </div>
                </button>
              ))}
          </div>
        </div>
      )}

      {/* Main Actions */}
      <div className="grid grid-cols-2 gap-4 mb-8">
        <button onClick={() => setScreen('courses')} className="card-gradient-green p-4 rounded-xl text-white text-left flex flex-col justify-between h-32 shadow-lg shadow-green-100">
          <BookOpen size={24} className="mb-2" />
          <div>
            <p className="font-bold">Free Courses</p>
            <span className="text-xs bg-white/20 px-2 py-0.5 rounded-full">Start Learning</span>
          </div>
        </button>
        <button onClick={() => setScreen('courses')} className="card-gradient-orange p-4 rounded-xl text-white text-left flex flex-col justify-between h-32 shadow-lg shadow-orange-100">
          <Bell size={24} className="mb-2" />
          <div>
            <p className="font-bold">Premium Course</p>
            <span className="text-xs bg-white/20 px-2 py-0.5 rounded-full">Upgrade Now</span>
          </div>
        </button>
        <button onClick={() => setScreen('notes')} className="card-gradient-blue p-4 rounded-xl text-white text-left flex flex-col justify-between h-32 shadow-lg shadow-blue-100">
          <FileText size={24} className="mb-2" />
          <div>
            <p className="font-bold">Free Notes</p>
            <span className="text-xs bg-white/20 px-2 py-0.5 rounded-full">Download</span>
          </div>
        </button>
        <button onClick={() => setScreen('quiz')} className="card-gradient-red p-4 rounded-xl text-white text-left flex flex-col justify-between h-32 shadow-lg shadow-red-100">
          <HelpCircle size={24} className="mb-2" />
          <div>
            <p className="font-bold">Practice Quiz</p>
            <span className="text-xs bg-white/20 px-2 py-0.5 rounded-full">Test Skills</span>
          </div>
        </button>
      </div>

      {/* Popular Courses */}
      <SectionHeader title="Popular Courses" onSeeAll={() => setScreen('courses')} />
      <div className="flex gap-4 overflow-x-auto pb-4 no-scrollbar">
        {courses.slice(0, 4).map(course => {
          const isUnlocked = course.type === 'free' || unlockedCourseIds.includes(course.id);
          return (
            <button 
              key={course.id} 
              onClick={() => {
                onCourseSelect(course);
                setScreen('course-details');
              }}
              className="min-w-[160px] bg-white rounded-xl overflow-hidden border border-gray-100 shadow-sm text-left relative"
            >
              <img src={course.image} alt={course.title} className="w-full h-24 object-cover" referrerPolicy="no-referrer" />
              {!isUnlocked && (
                <div className="absolute top-2 right-2 bg-black/60 text-white p-1 rounded-full backdrop-blur-sm">
                  <ShieldCheck size={12} />
                </div>
              )}
              <div className="p-3">
                <h3 className="text-sm font-bold text-gray-800 line-clamp-1">{course.title}</h3>
                <p className="text-[10px] text-gray-500">{course.lessons}+ Video Lessons</p>
              </div>
            </button>
          );
        })}
      </div>

      {/* Recent Updates */}
      <div className="mt-6">
        <SectionHeader title="Recent Updates" />
        <div className="bg-white rounded-xl p-4 border border-gray-100 shadow-sm space-y-3">
          <div className="flex items-center gap-3">
            <div className="w-2 h-2 rounded-full bg-primary"></div>
            <p className="text-sm text-gray-700">New Chemistry Lecture Added!</p>
          </div>
          <div className="flex items-center gap-3">
            <div className="w-2 h-2 rounded-full bg-primary"></div>
            <p className="text-sm text-gray-700">Biology Notes Uploaded</p>
          </div>
        </div>
      </div>
    </motion.div>
  );
};

const CoursesScreen = ({ 
  setScreen, 
  courses, 
  unlockedCourseIds, 
  onBuyClick,
  onCourseSelect
}: { 
  setScreen: (s: Screen) => void, 
  courses: Course[],
  unlockedCourseIds: string[],
  onBuyClick: (course: Course) => void,
  onCourseSelect: (course: Course) => void
}) => {
  const [activeTab, setActiveTab] = useState<'free' | 'premium'>('free');
  const [searchQuery, setSearchQuery] = useState('');

  const filteredCourses = courses.filter(c => 
    c.type === activeTab && 
    c.title.toLowerCase().includes(searchQuery.toLowerCase())
  );

  return (
    <motion.div 
      initial={{ opacity: 0 }} 
      animate={{ opacity: 1 }} 
      className="flex-1 flex flex-col overflow-hidden"
    >
      <div className="px-4 pt-4 pb-2 bg-white border-b border-gray-100">
        {/* Search Bar */}
        <div className="relative mb-4">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" size={18} />
          <input 
            type="text" 
            placeholder="Search courses..." 
            className="w-full bg-gray-100 rounded-lg py-2.5 pl-10 pr-4 text-sm focus:outline-none focus:ring-2 focus:ring-primary/20"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
          />
          <button className="absolute right-3 top-1/2 -translate-y-1/2 bg-primary text-white p-1 rounded">
            <Filter size={14} />
          </button>
        </div>

        {/* Tabs */}
        <div className="flex bg-gray-100 p-1 rounded-lg">
          <button 
            onClick={() => setActiveTab('free')}
            className={`flex-1 py-2 text-sm font-medium rounded-md transition-all ${activeTab === 'free' ? 'bg-white text-primary shadow-sm' : 'text-gray-500'}`}
          >
            Free Courses
          </button>
          <button 
            onClick={() => setActiveTab('premium')}
            className={`flex-1 py-2 text-sm font-medium rounded-md transition-all ${activeTab === 'premium' ? 'bg-white text-primary shadow-sm' : 'text-gray-500'}`}
          >
            Premium Courses
          </button>
        </div>
      </div>

      <div className="flex-1 overflow-y-auto p-4 pb-24 space-y-4">
        {filteredCourses.map(course => {
          const isUnlocked = course.type === 'free' || unlockedCourseIds.includes(course.id);
          
          return (
            <div key={course.id} className="bg-white rounded-xl overflow-hidden border border-gray-100 shadow-sm flex flex-col">
              <div className="relative h-40">
                <img src={course.image} alt={course.title} className="w-full h-full object-cover" referrerPolicy="no-referrer" />
                <button 
                  onClick={() => {
                    onCourseSelect(course);
                    setScreen('course-details');
                  }}
                  className="absolute inset-0 flex items-center justify-center bg-black/20 group hover:bg-black/40 transition-all"
                >
                  <div className="w-12 h-12 bg-white/90 rounded-full flex items-center justify-center text-primary shadow-lg group-hover:scale-110 transition-transform">
                    {isUnlocked ? <Play size={24} fill="currentColor" /> : <ShieldCheck size={24} />}
                  </div>
                </button>
              </div>
              <div className="p-4 flex justify-between items-center">
                <div>
                  <h3 className="font-bold text-gray-800">{course.title}</h3>
                  <p className="text-xs text-gray-500">{course.lessons}+ Video Lessons & Notes</p>
                  {course.type === 'premium' && (
                    <div className="flex items-center gap-2 mt-1">
                      <span className="text-primary font-bold">₹{course.price}</span>
                      <span className="text-gray-400 text-[10px] line-through">₹{course.oldPrice}</span>
                    </div>
                  )}
                </div>
                <button 
                  onClick={() => {
                    onCourseSelect(course);
                    setScreen('course-details');
                  }}
                  className={`${isUnlocked ? 'bg-primary' : 'bg-orange-500'} text-white px-4 py-2 rounded-lg text-sm font-bold shadow-lg shadow-orange-100 transition-transform active:scale-95`}
                >
                  {isUnlocked ? 'View Details' : 'Buy Now'}
                </button>
              </div>
            </div>
          );
        })}
      </div>
    </motion.div>
  );
};

const VideoPlayerScreen = ({ 
  onBack, 
  course, 
  onLessonSelect, 
  onViewNotes 
}: { 
  onBack: () => void, 
  course: Course | null,
  onLessonSelect: (lesson: Lesson) => void,
  onViewNotes: (lesson: Lesson) => void
}) => {
  const [currentLesson, setCurrentLesson] = useState<Lesson | null>(course?.lessonList?.[0] || null);

  if (!course) return null;

  return (
    <motion.div 
      initial={{ y: '100%' }} 
      animate={{ y: 0 }} 
      exit={{ y: '100%' }}
      className="flex-1 bg-white flex flex-col z-50"
    >
      <div className="bg-black aspect-video relative">
        {currentLesson?.video_url ? (
          <iframe 
            src={currentLesson.video_url} 
            className="w-full h-full" 
            allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture" 
            allowFullScreen
          ></iframe>
        ) : (
          <div className="w-full h-full flex items-center justify-center text-white/50 flex-col gap-2">
            <Play size={48} />
            <p>Video not available</p>
          </div>
        )}
        <button 
          onClick={onBack} 
          className="absolute top-4 left-4 w-8 h-8 bg-black/50 backdrop-blur-md rounded-full flex items-center justify-center text-white z-10"
        >
          <ArrowLeft size={20} />
        </button>
      </div>

      <div className="p-4 flex-1 overflow-y-auto">
        <h2 className="text-xl font-bold text-gray-800 mb-2">{currentLesson?.title || course.title}</h2>
        <p className="text-sm text-gray-500 mb-6">{course.title} • {currentLesson?.duration || '10:00'} mins</p>

        <div className="flex gap-4 mb-8">
          <button 
            onClick={() => currentLesson && onViewNotes(currentLesson)}
            className="flex-1 bg-gray-100 py-3 rounded-xl flex items-center justify-center gap-2 text-sm font-medium text-gray-700 transition-colors hover:bg-gray-200"
          >
            <Eye size={18} />
            View Notes
          </button>
          <button className="flex-1 bg-primary py-3 rounded-xl flex items-center justify-center gap-2 text-sm font-medium text-white shadow-lg shadow-blue-100 transition-transform active:scale-95">
            <HelpCircle size={18} />
            Take Quiz
          </button>
        </div>

        <SectionHeader title="Course Lessons" />
        <div className="space-y-3">
          {course.lessonList?.map((lesson, idx) => (
            <button 
              key={lesson.id} 
              onClick={() => setCurrentLesson(lesson)}
              className={`w-full flex items-center gap-4 p-3 rounded-xl border transition-colors text-left group ${currentLesson?.id === lesson.id ? 'border-primary bg-primary/5' : 'border-gray-100 hover:bg-gray-50'}`}
            >
              <div className={`w-12 h-12 rounded-lg flex items-center justify-center transition-colors ${currentLesson?.id === lesson.id ? 'bg-primary text-white' : 'bg-gray-100 text-gray-400 group-hover:bg-primary/10 group-hover:text-primary'}`}>
                <Play size={20} />
              </div>
              <div className="flex-1">
                <h4 className={`text-sm font-bold transition-colors ${currentLesson?.id === lesson.id ? 'text-primary' : 'text-gray-800'}`}>{lesson.title}</h4>
                <p className="text-[10px] text-gray-500">Lesson {idx + 1} • {lesson.duration} mins</p>
              </div>
              <ChevronRight size={18} className={currentLesson?.id === lesson.id ? 'text-primary' : 'text-gray-300'} />
            </button>
          ))}
        </div>
      </div>
    </motion.div>
  );
};

const CourseDetailsScreen = ({ 
  course, 
  onBack, 
  onStartLearning, 
  onViewNotes, 
  onTakeQuiz,
  isUnlocked
}: { 
  course: Course | null, 
  onBack: () => void,
  onStartLearning: () => void,
  onViewNotes: (lesson: Lesson) => void,
  onTakeQuiz: () => void,
  isUnlocked: boolean
}) => {
  if (!course) return null;

  return (
    <motion.div 
      initial={{ opacity: 0, x: 20 }} 
      animate={{ opacity: 1, x: 0 }} 
      exit={{ opacity: 0, x: -20 }}
      className="flex-1 overflow-y-auto pb-24"
    >
      <div className="relative h-56">
        <img src={course.image} alt={course.title} className="w-full h-full object-cover" referrerPolicy="no-referrer" />
        <div className="absolute inset-0 bg-gradient-to-t from-black/80 via-black/20 to-transparent flex flex-col justify-end p-6">
          <div className="flex items-center gap-2 mb-2">
            <span className="bg-primary text-white text-[10px] font-bold px-2 py-1 rounded uppercase tracking-wider">{course.category}</span>
            <span className="bg-white/20 backdrop-blur-md text-white text-[10px] font-bold px-2 py-1 rounded uppercase tracking-wider">{course.type}</span>
          </div>
          <h2 className="text-2xl font-bold text-white mb-1">{course.title}</h2>
          <p className="text-white/70 text-sm">{course.lessons}+ Video Lessons • {isUnlocked ? 'Unlocked' : 'Locked'}</p>
        </div>
        <button 
          onClick={onBack}
          className="absolute top-4 left-4 w-10 h-10 bg-white/20 backdrop-blur-md rounded-full flex items-center justify-center text-white border border-white/30"
        >
          <ArrowLeft size={24} />
        </button>
      </div>

      <div className="p-4">
        <div className="flex gap-4 mb-8">
          <button 
            onClick={onStartLearning}
            className="flex-1 bg-primary text-white py-4 rounded-xl font-bold shadow-lg shadow-blue-100 flex items-center justify-center gap-2"
          >
            <Play size={20} fill="currentColor" />
            {isUnlocked ? 'Continue Learning' : 'Unlock Course'}
          </button>
        </div>

        <div className="space-y-8">
          <section>
            <SectionHeader title="Course Lessons" />
            <div className="space-y-3">
              {course.lessonList?.map((lesson, idx) => (
                <div 
                  key={lesson.id}
                  className="flex items-center gap-4 p-3 rounded-xl border border-gray-100 bg-white shadow-sm"
                >
                  <div className="w-10 h-10 bg-gray-100 rounded-lg flex items-center justify-center text-gray-400 font-bold text-sm">
                    {idx + 1}
                  </div>
                  <div className="flex-1">
                    <h4 className="text-sm font-bold text-gray-800">{lesson.title}</h4>
                    <p className="text-[10px] text-gray-500">{lesson.duration} mins</p>
                  </div>
                  {isUnlocked && (
                    <button 
                      onClick={() => onViewNotes(lesson)}
                      className="text-primary p-2 hover:bg-primary/5 rounded-full transition-colors"
                    >
                      <FileText size={18} />
                    </button>
                  )}
                </div>
              ))}
            </div>
          </section>

          <section>
            <SectionHeader title="Study Material & Quizzes" />
            <div className="grid grid-cols-2 gap-4">
              <div className="bg-blue-50 p-4 rounded-xl border border-blue-100">
                <div className="w-10 h-10 bg-blue-500 text-white rounded-lg flex items-center justify-center mb-3">
                  <FileText size={20} />
                </div>
                <h4 className="font-bold text-blue-900 text-sm mb-1">Course Notes</h4>
                <p className="text-[10px] text-blue-700 mb-3">PDF & Text materials</p>
                <button 
                  onClick={() => course.lessonList?.[0] && onViewNotes(course.lessonList[0])}
                  className="text-xs font-bold text-blue-600 flex items-center gap-1"
                >
                  View All <ChevronRight size={12} />
                </button>
              </div>
              <div className="bg-red-50 p-4 rounded-xl border border-red-100">
                <div className="w-10 h-10 bg-red-500 text-white rounded-lg flex items-center justify-center mb-3">
                  <HelpCircle size={20} />
                </div>
                <h4 className="font-bold text-red-900 text-sm mb-1">Topic Quiz</h4>
                <p className="text-[10px] text-red-700 mb-3">Test your knowledge</p>
                <button 
                  onClick={onTakeQuiz}
                  className="text-xs font-bold text-red-600 flex items-center gap-1"
                >
                  Start Quiz <ChevronRight size={12} />
                </button>
              </div>
            </div>
          </section>

          <section className="bg-gray-50 p-6 rounded-2xl border border-gray-100">
            <h3 className="font-bold text-gray-800 mb-2">About this course</h3>
            <p className="text-sm text-gray-600 leading-relaxed">
              This comprehensive course on {course.title} covers everything from fundamental concepts to advanced applications. 
              Designed for students of {course.category}, it includes high-quality video lectures, detailed notes, and practice quizzes to ensure complete mastery of the subject.
            </p>
          </section>
        </div>
      </div>
    </motion.div>
  );
};

const NotesScreen = ({ 
  notes, 
  onViewNote 
}: { 
  notes: Note[], 
  onViewNote: (note: Note) => void 
}) => {
  return (
    <motion.div 
      initial={{ opacity: 0 }} 
      animate={{ opacity: 1 }} 
      className="flex-1 p-4 overflow-y-auto pb-24"
    >
      <div className="flex gap-2 mb-6 overflow-x-auto no-scrollbar">
        {['Chemistry', 'Physics', 'Biology', 'Maths'].map((cat, idx) => (
          <button key={cat} className={`px-4 py-2 rounded-full text-xs font-medium whitespace-nowrap ${idx === 0 ? 'bg-primary text-white' : 'bg-gray-100 text-gray-600'}`}>
            {cat}
          </button>
        ))}
      </div>

      <div className="space-y-4">
        {notes.map(note => (
          <div key={note.id} className="bg-white p-4 rounded-xl border border-gray-100 shadow-sm flex items-center gap-4 hover:shadow-md transition-shadow">
            <div className="w-12 h-12 bg-blue-50 rounded-xl flex items-center justify-center text-primary">
              <FileText size={24} />
            </div>
            <div className="flex-1">
              <h3 className="text-sm font-bold text-gray-800">{note.title}</h3>
              <p className="text-[10px] text-gray-500">{note.lessons} Detailed Chapters</p>
            </div>
            <button 
              onClick={() => onViewNote(note)}
              className="px-4 py-2 text-primary bg-primary/5 rounded-lg text-xs font-bold hover:bg-primary hover:text-white transition-all"
            >
              View
            </button>
          </div>
        ))}
      </div>
    </motion.div>
  );
};

const QuizScreen = ({ quizzes, initialQuiz }: { quizzes: Quiz[], initialQuiz?: Quiz | null }) => {
  const [selectedQuiz, setSelectedQuiz] = useState<Quiz | null>(initialQuiz || null);
  const [isQuizStarted, setIsQuizStarted] = useState(!!initialQuiz);
  const [currentQuestionIndex, setCurrentQuestionIndex] = useState(0);
  const [score, setScore] = useState(0);
  const [showResults, setShowResults] = useState(false);
  const [selectedOption, setSelectedOption] = useState<number | null>(null);
  const [isAnswered, setIsAnswered] = useState(false);

  const playSound = (type: 'correct' | 'incorrect') => {
    const correctSound = new Audio('https://assets.mixkit.co/active_storage/sfx/2000/2000-preview.mp3');
    const incorrectSound = new Audio('https://assets.mixkit.co/active_storage/sfx/2003/2003-preview.mp3');
    
    if (type === 'correct') {
      correctSound.play().catch(e => console.log('Audio play blocked'));
    } else {
      incorrectSound.play().catch(e => console.log('Audio play blocked'));
    }
  };

  const handleSelectQuiz = (quiz: Quiz) => {
    setSelectedQuiz(quiz);
    setIsQuizStarted(false);
    setCurrentQuestionIndex(0);
    setScore(0);
    setShowResults(false);
    setSelectedOption(null);
    setIsAnswered(false);
  };

  const handleStartQuiz = () => {
    setIsQuizStarted(true);
  };

  const handleOptionSelect = (index: number) => {
    if (isAnswered) return;
    
    setSelectedOption(index);
    setIsAnswered(true);
    
    const isCorrect = index === selectedQuiz?.questions[currentQuestionIndex].correctAnswer;
    if (isCorrect) {
      setScore(prev => prev + 1);
      playSound('correct');
    } else {
      playSound('incorrect');
    }
  };

  const handleNextQuestion = () => {
    if (currentQuestionIndex + 1 < (selectedQuiz?.questions.length || 0)) {
      setCurrentQuestionIndex(currentQuestionIndex + 1);
      setSelectedOption(null);
      setIsAnswered(false);
    } else {
      setShowResults(true);
    }
  };

  const handleRestart = () => {
    setSelectedQuiz(null);
    setIsQuizStarted(false);
    setCurrentQuestionIndex(0);
    setScore(0);
    setShowResults(false);
    setSelectedOption(null);
    setIsAnswered(false);
  };

  if (!selectedQuiz) {
    return (
      <motion.div 
        initial={{ opacity: 0 }} 
        animate={{ opacity: 1 }} 
        className="flex-1 p-4 overflow-y-auto pb-24"
      >
        <SectionHeader title="Choose Subject" />
        <p className="text-xs text-gray-500 mb-6 -mt-4">Select a subject to test your knowledge</p>
        <div className="grid grid-cols-1 gap-4">
          {quizzes.map((quiz) => (
            <button 
              key={quiz.id} 
              onClick={() => handleSelectQuiz(quiz)}
              className="bg-white p-6 rounded-xl border border-gray-100 shadow-sm flex items-center justify-between group hover:border-primary transition-all"
            >
              <div className="flex items-center gap-4">
                <div className="w-12 h-12 bg-primary/10 rounded-xl flex items-center justify-center text-primary">
                  <HelpCircle size={24} />
                </div>
                <div className="text-left">
                  <h3 className="font-bold text-gray-800">{quiz.topic} Quiz</h3>
                  <p className="text-xs text-gray-500">{quiz.questions.length} Questions Available</p>
                </div>
              </div>
              <ChevronRight size={20} className="text-gray-300 group-hover:text-primary transition-colors" />
            </button>
          ))}
        </div>
      </motion.div>
    );
  }

  if (!isQuizStarted) {
    return (
      <motion.div 
        initial={{ y: 20, opacity: 0 }} 
        animate={{ y: 0, opacity: 1 }} 
        className="flex-1 p-6 flex flex-col items-center justify-center text-center"
      >
        <div className="w-20 h-20 bg-primary/10 rounded-full flex items-center justify-center text-primary mb-6">
          <HelpCircle size={40} />
        </div>
        <h2 className="text-2xl font-bold text-gray-800 mb-2">{selectedQuiz.topic} Quiz</h2>
        <p className="text-gray-500 mb-8 max-w-[280px]">
          Test your knowledge in {selectedQuiz.topic}. This quiz contains {selectedQuiz.questions.length} questions.
        </p>
        
        <div className="w-full space-y-4 max-w-xs">
          <button 
            onClick={handleStartQuiz}
            className="w-full bg-primary text-white py-4 rounded-xl font-bold text-lg shadow-lg shadow-blue-100 transition-transform active:scale-95"
          >
            Play Quiz
          </button>
          <button 
            onClick={() => setSelectedQuiz(null)}
            className="w-full bg-gray-100 text-gray-600 py-4 rounded-xl font-bold"
          >
            Back to Subjects
          </button>
        </div>
      </motion.div>
    );
  }

  if (showResults) {
    const percentage = Math.round((score / selectedQuiz.questions.length) * 100);
    return (
      <motion.div 
        initial={{ scale: 0.9, opacity: 0 }} 
        animate={{ scale: 1, opacity: 1 }} 
        className="flex-1 flex flex-col items-center justify-center p-6 text-center"
      >
        <div className="w-24 h-24 bg-primary/10 rounded-full flex items-center justify-center text-primary mb-6">
          <CheckCircle2 size={48} />
        </div>
        <h2 className="text-2xl font-bold text-gray-800 mb-2">Quiz Completed!</h2>
        <p className="text-gray-500 mb-8">You scored {score} out of {selectedQuiz.questions.length}</p>
        
        <div className="w-full max-w-xs bg-gray-50 rounded-2xl p-6 mb-8">
          <div className="text-4xl font-black text-primary mb-1">{percentage}%</div>
          <div className="text-xs text-gray-400 uppercase font-bold tracking-widest">Accuracy Score</div>
        </div>

        <button 
          onClick={handleRestart}
          className="w-full max-w-xs bg-primary text-white py-4 rounded-xl font-bold shadow-lg shadow-blue-100"
        >
          Try Another Quiz
        </button>
      </motion.div>
    );
  }

  const currentQuestion = selectedQuiz.questions[currentQuestionIndex];
  const progress = ((currentQuestionIndex + 1) / selectedQuiz.questions.length) * 100;

  return (
    <motion.div 
      initial={{ opacity: 0 }} 
      animate={{ opacity: 1 }} 
      className="flex-1 flex flex-col p-4 overflow-y-auto pb-24"
    >
      <div className="mb-8">
        <div className="flex justify-between items-center mb-2">
          <span className="text-xs font-bold text-primary uppercase tracking-wider">Question {currentQuestionIndex + 1} of {selectedQuiz.questions.length}</span>
          <span className="text-xs text-gray-400">Score: {score}</span>
        </div>
        <div className="h-2 bg-gray-100 rounded-full overflow-hidden">
          <motion.div 
            initial={{ width: 0 }} 
            animate={{ width: `${progress}%` }} 
            className="h-full bg-primary"
          />
        </div>
      </div>

      <div className="flex-1">
        <h2 className="text-xl font-bold text-gray-800 mb-8">{currentQuestion.text}</h2>
        <div className="space-y-3">
          {currentQuestion.options.map((option, idx) => {
            let variant = 'default';
            if (isAnswered) {
              if (idx === currentQuestion.correctAnswer) variant = 'correct';
              else if (idx === selectedOption) variant = 'incorrect';
            }

            return (
              <button 
                key={idx}
                disabled={isAnswered}
                onClick={() => handleOptionSelect(idx)}
                className={`w-full p-4 rounded-xl border text-left transition-all flex items-center justify-between ${
                  variant === 'correct' ? 'bg-green-50 border-green-500 text-green-700' :
                  variant === 'incorrect' ? 'bg-red-50 border-red-500 text-red-700' :
                  selectedOption === idx ? 'bg-primary/5 border-primary text-primary' :
                  'bg-white border-gray-100 text-gray-700 hover:border-primary/30'
                }`}
              >
                <div className="flex items-center gap-4">
                  <div className={`w-8 h-8 rounded-full flex items-center justify-center border text-sm ${
                    variant === 'correct' ? 'border-green-500 bg-green-500 text-white' :
                    variant === 'incorrect' ? 'border-red-500 bg-red-500 text-white' :
                    selectedOption === idx ? 'border-primary bg-primary text-white' :
                    'border-gray-200 text-gray-400'
                  }`}>
                    {String.fromCharCode(65 + idx)}
                  </div>
                  <span className="font-medium">{option}</span>
                </div>
                {variant === 'correct' && <CheckCircle2 size={18} className="text-green-500" />}
                {variant === 'incorrect' && <XCircle size={18} className="text-red-500" />}
              </button>
            );
          })}
        </div>

        <AnimatePresence>
          {isAnswered && (
            <motion.div 
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              className={`mt-6 p-4 rounded-xl border ${
                selectedOption === currentQuestion.correctAnswer 
                  ? 'bg-green-50 border-green-100' 
                  : 'bg-red-50 border-red-100'
              }`}
            >
              <div className="flex items-center justify-between mb-3">
                <div className={`flex items-center gap-2 font-bold text-sm ${
                  selectedOption === currentQuestion.correctAnswer ? 'text-green-700' : 'text-red-700'
                }`}>
                  {selectedOption === currentQuestion.correctAnswer ? (
                    <><CheckCircle2 size={18} /> Correct Answer!</>
                  ) : (
                    <><XCircle size={18} /> Wrong Answer!</>
                  )}
                </div>
                <div className="text-[10px] uppercase tracking-widest font-black opacity-30">Feedback</div>
              </div>
              
              <div className="space-y-2">
                <div className="flex items-center gap-2 text-blue-800 font-bold text-xs">
                  <HelpCircle size={14} />
                  Explanation
                </div>
                <p className={`text-sm leading-relaxed ${
                  selectedOption === currentQuestion.correctAnswer ? 'text-green-800/80' : 'text-red-800/80'
                }`}>
                  {currentQuestion.explanation || "No explanation available for this question."}
                </p>
              </div>
            </motion.div>
          )}
        </AnimatePresence>
      </div>

      <button 
        disabled={!isAnswered}
        onClick={handleNextQuestion}
        className={`mt-8 w-full py-4 rounded-xl font-bold flex items-center justify-center gap-2 transition-all ${
          !isAnswered 
            ? 'bg-gray-100 text-gray-400 cursor-not-allowed' 
            : 'bg-primary text-white shadow-lg shadow-blue-100'
        }`}
      >
        {currentQuestionIndex + 1 === selectedQuiz.questions.length ? 'Finish Quiz' : 'Next Question'}
        <ArrowRight size={18} />
      </button>
    </motion.div>
  );
};

const ProfileScreen = ({ user, onLogout, onOpenSettings }: { user: any, onLogout: () => void, onOpenSettings: () => void }) => {
  const menuItems = [
    { icon: <BookOpen size={20} />, label: 'My Courses' },
    { icon: <HelpCircle size={20} />, label: 'Quiz Results' },
    { icon: <Download size={20} />, label: 'Download Notes' },
    { icon: <Bell size={20} />, label: 'Subscriptions' },
    { icon: <Settings size={20} />, label: 'Settings' },
  ];

  return (
    <motion.div 
      initial={{ opacity: 0 }} 
      animate={{ opacity: 1 }} 
      className="flex-1 flex flex-col overflow-hidden"
    >
      <div className="bg-primary pt-8 pb-12 px-6 text-center relative">
        <div className="relative z-10 flex flex-col items-center">
          <div className="w-24 h-24 rounded-full border-4 border-white/30 p-1 mb-4">
            <img src={`https://api.dicebear.com/7.x/avataaars/svg?seed=${user?.name || 'Rahul'}`} alt="Profile" className="w-full h-full rounded-full bg-white" referrerPolicy="no-referrer" />
          </div>
          <h2 className="text-xl font-bold text-white">{user?.name || 'Rahul Sharma'}</h2>
          <p className="text-white/70 text-sm">{user?.email || 'rahul.sharma@gmail.com'}</p>
        </div>
        <div className="absolute bottom-0 left-0 right-0 h-8 bg-gray-50 rounded-t-[32px]"></div>
      </div>

      <div className="flex-1 bg-gray-50 px-6 pb-24 overflow-y-auto">
        <div className="bg-white rounded-2xl shadow-sm border border-gray-100 overflow-hidden">
          {menuItems.map((item, idx) => (
            <button
              key={idx}
              onClick={() => {
                if (item.label === 'Settings') {
                  onOpenSettings();
                }
              }}
              className={`w-full flex items-center justify-between p-4 hover:bg-gray-50 transition-colors ${idx !== menuItems.length - 1 ? 'border-b border-gray-50' : ''}`}
            >
              <div className="flex items-center gap-4">
                <div className="text-primary">{item.icon}</div>
                <span className="text-sm font-medium text-gray-700">{item.label}</span>
              </div>
              <ChevronRight size={18} className="text-gray-300" />
            </button>
          ))}
        </div>

        <button 
          onClick={onLogout}
          className="w-full mt-6 py-4 rounded-xl border border-gray-200 text-gray-500 font-bold flex items-center justify-center gap-2"
        >
          <LogOut size={20} />
          Logout
        </button>
      </div>
    </motion.div>
  );
};

const SettingsScreen = ({
  user,
  darkModeEnabled,
  onToggleDarkMode
}: {
  user: any,
  darkModeEnabled: boolean,
  onToggleDarkMode: () => void
}) => {
  const [notificationsEnabled, setNotificationsEnabled] = useState(true);
  const [downloadOnWifi, setDownloadOnWifi] = useState(true);

  const toggleRow = (
    label: string,
    description: string,
    enabled: boolean,
    onToggle: () => void
  ) => (
    <div className="bg-white rounded-2xl border border-gray-100 p-4 shadow-sm flex items-center justify-between gap-4">
      <div>
        <h3 className="text-sm font-bold text-gray-800">{label}</h3>
        <p className="text-xs text-gray-500 mt-1">{description}</p>
      </div>
      <button
        type="button"
        onClick={onToggle}
        className={`w-14 h-8 rounded-full p-1 transition-colors ${enabled ? 'bg-primary' : 'bg-gray-200'}`}
      >
        <div className={`w-6 h-6 rounded-full bg-white shadow-sm transition-transform ${enabled ? 'translate-x-6' : 'translate-x-0'}`}></div>
      </button>
    </div>
  );

  const infoRow = (label: string, value: string) => (
    <div className="bg-white rounded-2xl border border-gray-100 p-4 shadow-sm flex items-center justify-between gap-4">
      <div>
        <h3 className="text-sm font-bold text-gray-800">{label}</h3>
        <p className="text-xs text-gray-500 mt-1">{value}</p>
      </div>
      <ChevronRight size={18} className="text-gray-300" />
    </div>
  );

  return (
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      className="flex-1 overflow-y-auto p-4 pb-24 bg-gray-50"
    >
      <div className="bg-[linear-gradient(135deg,#0b56c4_0%,#00357f_100%)] rounded-[28px] p-5 text-white shadow-xl shadow-blue-100 mb-5">
        <p className="text-[11px] font-bold uppercase tracking-[0.2em] text-white/70 mb-2">Preferences</p>
        <h2 className="text-2xl font-bold mb-2">Settings</h2>
        <p className="text-sm text-white/75">Manage account preferences, notifications, and study experience.</p>

        <div className="mt-5 bg-white/10 rounded-2xl p-4 flex items-center gap-3">
          <div className="w-12 h-12 rounded-full overflow-hidden border border-white/30 bg-white/10">
            <img src={`https://api.dicebear.com/7.x/avataaars/svg?seed=${user?.name || 'Rahul'}`} alt="Profile" className="w-full h-full" referrerPolicy="no-referrer" />
          </div>
          <div>
            <div className="font-bold">{user?.name || 'Rahul Sharma'}</div>
            <div className="text-xs text-white/70">{user?.email || 'rahul@example.com'}</div>
          </div>
        </div>
      </div>

      <div className="space-y-5">
        <section>
          <SectionHeader title="App Preferences" />
          <div className="space-y-3">
            {toggleRow('Push Notifications', 'Get updates for new lessons, notes, and quizzes.', notificationsEnabled, () => setNotificationsEnabled(!notificationsEnabled))}
            {toggleRow('Dark Mode', 'Switch the entire academy app to a darker reading theme.', darkModeEnabled, onToggleDarkMode)}
            {toggleRow('Download on Wi-Fi Only', 'Use Wi-Fi when downloading study material.', downloadOnWifi, () => setDownloadOnWifi(!downloadOnWifi))}
          </div>
        </section>

        <section>
          <SectionHeader title="Account" />
          <div className="space-y-3">
            {infoRow('Profile Information', 'Update name, email, and student details')}
            {infoRow('Security', 'Password and account protection settings')}
            {infoRow('Language', 'English')}
          </div>
        </section>

        <section>
          <SectionHeader title="Support" />
          <div className="space-y-3">
            {infoRow('Help Center', 'Get help with courses, notes, and quizzes')}
            {infoRow('Privacy Policy', 'How your data is used in the academy app')}
            {infoRow('App Version', 'RBS Academy v1.0.0')}
          </div>
        </section>
      </div>
    </motion.div>
  );
};

const AdminLoginScreen = ({
  onLogin
}: {
  onLogin: () => void
}) => {
  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (username === ADMIN_USERNAME && password === ADMIN_PASSWORD) {
      onLogin();
      return;
    }

    setError('Invalid admin credentials');
  };

  return (
    <motion.div
      initial={{ opacity: 0, y: 16 }}
      animate={{ opacity: 1, y: 0 }}
      className="min-h-screen w-full px-6 py-10 lg:px-10"
    >
      <div className="max-w-6xl mx-auto grid lg:grid-cols-[1.2fr_0.8fr] gap-8 items-stretch">
        <div className="rounded-[32px] p-8 lg:p-10 bg-[linear-gradient(135deg,#0b56c4_0%,#082f75_100%)] text-white shadow-2xl shadow-blue-100 border border-white/10 min-h-[520px] flex flex-col justify-between">
          <div>
            <div className="inline-flex items-center gap-2 px-4 py-2 rounded-full bg-white/10 text-xs font-bold uppercase tracking-[0.2em] mb-8">
              <ShieldCheck size={14} />
              RBS Admin
            </div>
            <h1 className="text-4xl lg:text-5xl font-black leading-tight max-w-xl">Professional control panel for academy content and access.</h1>
            <p className="mt-5 text-base text-white/75 max-w-xl leading-7">
              Manage free courses, premium releases, lesson video URLs, hosted notes, quizzes, questions, and access codes from one protected dashboard.
            </p>
          </div>

          <div className="grid sm:grid-cols-3 gap-4">
            <div className="rounded-2xl bg-white/10 p-4 backdrop-blur-sm">
              <div className="text-2xl font-black">Courses</div>
              <div className="text-sm text-white/70 mt-1">Free and premium catalog control</div>
            </div>
            <div className="rounded-2xl bg-white/10 p-4 backdrop-blur-sm">
              <div className="text-2xl font-black">Notes</div>
              <div className="text-sm text-white/70 mt-1">Hosted URLs and content publishing</div>
            </div>
            <div className="rounded-2xl bg-white/10 p-4 backdrop-blur-sm">
              <div className="text-2xl font-black">Quizzes</div>
              <div className="text-sm text-white/70 mt-1">Topic, questions, and answers</div>
            </div>
          </div>
        </div>
        <div className="bg-white rounded-[32px] border border-gray-100 shadow-2xl shadow-slate-200/60 p-8 lg:p-10 flex flex-col justify-center">
          <div className="w-16 h-16 rounded-2xl bg-primary text-white flex items-center justify-center mb-6 shadow-lg shadow-blue-100">
            <ShieldCheck size={30} />
          </div>
          <p className="text-[11px] font-bold uppercase tracking-[0.2em] text-primary/70 mb-2">Restricted</p>
          <h2 className="text-3xl font-black text-gray-900 mb-2">Admin Login</h2>
          <p className="text-sm text-gray-500 mb-8">Enter the admin credentials to open the desktop control panel.</p>

          <form onSubmit={handleSubmit} className="space-y-4">
            <div>
              <label className="block text-xs font-bold text-gray-400 uppercase tracking-wider mb-2">Username</label>
              <input
                className="w-full bg-gray-50 border border-gray-100 rounded-2xl px-4 py-3.5 text-sm"
                placeholder="Username"
                value={username}
                onChange={(e) => {
                  setUsername(e.target.value);
                  setError('');
                }}
              />
            </div>
            <div>
              <label className="block text-xs font-bold text-gray-400 uppercase tracking-wider mb-2">Password</label>
              <input
                type="password"
                className="w-full bg-gray-50 border border-gray-100 rounded-2xl px-4 py-3.5 text-sm"
                placeholder="Password"
                value={password}
                onChange={(e) => {
                  setPassword(e.target.value);
                  setError('');
                }}
              />
            </div>
            {error && <p className="text-red-500 text-xs font-medium">{error}</p>}
            <button type="submit" className="w-full bg-primary text-white py-3.5 rounded-2xl font-bold shadow-lg shadow-blue-100">
              Login to Admin Panel
            </button>
          </form>
        </div>
      </div>
    </motion.div>
  );
};

const AdminPanelScreen = ({
  courses,
  notes,
  quizzes,
  users,
  onRefresh,
  onLogout
}: {
  courses: Course[],
  notes: Note[],
  quizzes: Quiz[],
  users: AdminUser[],
  onRefresh: () => Promise<void>,
  onLogout: () => void
}) => {
  const [activeTab, setActiveTab] = useState<'dashboard' | 'course' | 'lesson' | 'note' | 'quiz' | 'question' | 'user'>('dashboard');
  const [loading, setLoading] = useState(false);
  const [message, setMessage] = useState('');

  const [courseForm, setCourseForm] = useState({
    title: '',
    lessons: '0',
    image: '',
    price: '0',
    oldPrice: '0',
    type: 'free',
    category: 'Chemistry',
    access_code: '',
  });
  const [accessForm, setAccessForm] = useState({
    courseId: '',
    accessCode: '',
  });
  const [lessonForm, setLessonForm] = useState({
    course_id: '',
    title: '',
    duration: '',
    note_content: '',
    note_url: '',
    video_url: '',
  });
  const [noteForm, setNoteForm] = useState({
    title: '',
    lessons: '1',
    category: 'Chemistry',
    type: 'free',
    url: '',
    content: '',
  });
  const [quizForm, setQuizForm] = useState({
    topic: '',
    type: 'free',
  });
  const [questionForm, setQuestionForm] = useState({
    id: '',
    quiz_id: '',
    text: '',
    optionsText: '',
    correctAnswer: '0',
    explanation: '',
  });
  const [editingCourseId, setEditingCourseId] = useState('');
  const [editingLessonId, setEditingLessonId] = useState('');
  const [editingNoteId, setEditingNoteId] = useState('');
  const [editingQuizId, setEditingQuizId] = useState('');
  const [editingQuestionId, setEditingQuestionId] = useState('');

  const tabs = [
    { id: 'dashboard', label: 'Dashboard', icon: <Home size={18} /> },
    { id: 'course', label: 'Courses', icon: <BookOpen size={18} /> },
    { id: 'lesson', label: 'Videos', icon: <Play size={18} /> },
    { id: 'note', label: 'Notes', icon: <FileText size={18} /> },
    { id: 'quiz', label: 'Quizzes', icon: <HelpCircle size={18} /> },
    { id: 'question', label: 'Questions', icon: <MessageSquare size={18} /> },
    { id: 'user', label: 'Users', icon: <User size={18} /> },
  ] as const;

  const cardClass = 'bg-white rounded-2xl border border-gray-100 p-4 shadow-sm';
  const lessons = courses.flatMap((course) => course.lessonList || []);
  const questions = quizzes.flatMap((quiz) => quiz.questions.map((question) => ({ ...question, topic: quiz.topic })));

  const submitAction = async (action: string, payload: Record<string, unknown>, reset: () => void) => {
    setLoading(true);
    setMessage('');
    try {
      const response = await apiPost(action, payload);
      const data = await response.json();
      if (!data.success) {
        setMessage(data.message || 'Request failed');
        setLoading(false);
        return;
      }
      reset();
      await onRefresh();
      setMessage('Saved successfully');
    } catch (error) {
      setMessage('Unable to save data');
    } finally {
      setLoading(false);
    }
  };

  return (
    <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="min-h-screen w-full px-6 py-8 lg:px-8">
      <div className="max-w-[1500px] mx-auto">
        <div className="grid lg:grid-cols-[280px_minmax(0,1fr)] gap-6">
          <aside className="rounded-[32px] overflow-hidden bg-[linear-gradient(180deg,#0b3e9c_0%,#072d79_100%)] text-white shadow-2xl shadow-blue-200 min-h-[880px] flex flex-col">
            <div className="px-6 py-7 border-b border-white/10">
              <div className="flex items-center gap-3">
                <div className="w-12 h-12 rounded-2xl bg-white/15 flex items-center justify-center shadow-lg shadow-blue-900/30">
                  <ShieldCheck size={24} />
                </div>
                <div>
                  <div className="text-3xl font-black leading-none">RBS</div>
                  <div className="text-sm text-white/70 -mt-0.5">Academy Admin</div>
                </div>
              </div>
            </div>

            <div className="p-4 flex-1">
              <div className="text-[11px] font-bold uppercase tracking-[0.2em] text-white/45 mb-4 px-3">Navigation</div>
            <div className="space-y-2">
              {tabs.map((tab) => (
                <button
                  key={tab.id}
                  onClick={() => {
                    setActiveTab(tab.id);
                    setMessage('');
                  }}
                  className={`w-full flex items-center gap-3 text-left px-4 py-3.5 rounded-2xl text-sm font-bold transition-colors ${activeTab === tab.id ? 'bg-[#081f53] text-white shadow-xl shadow-black/20' : 'text-white/80 hover:bg-white/10'}`}
                >
                  {tab.icon}
                  {tab.label}
                </button>
              ))}
            </div>

            <div className="mt-8 rounded-[28px] bg-white/10 p-5 backdrop-blur-sm">
              <p className="text-sm font-bold mb-2">Production Notes</p>
              <div className="text-xs text-white/70 space-y-2 leading-5">
                <p>Premium access codes are managed from Courses.</p>
                <p>Deleting a course removes its lessons.</p>
                <p>Deleting a quiz removes its questions.</p>
              </div>
            </div>
            </div>

            <div className="p-4">
              <button onClick={onLogout} className="w-full px-4 py-3.5 rounded-2xl bg-white text-primary text-sm font-bold shadow-lg shadow-blue-900/20">
                Logout
              </button>
            </div>
          </aside>

          <main className="space-y-5">
            <div className="bg-white rounded-[32px] border border-gray-100 shadow-xl shadow-slate-200/60 p-6 lg:p-7">
              <div className="flex flex-col lg:flex-row lg:items-center lg:justify-between gap-5">
                <div>
                  <h1 className="text-3xl lg:text-4xl font-black text-slate-900 mb-2">Admin Dashboard</h1>
                  <p className="text-sm text-slate-500">Control academy catalog, media, notes, and quiz content from one place.</p>
                </div>
                <div className="flex items-center gap-3 self-start lg:self-auto">
                  <button onClick={onRefresh} className="px-4 py-3 rounded-2xl bg-primary text-white text-sm font-bold shadow-lg shadow-blue-100">
                    Refresh Data
                  </button>
                  <div className="px-4 py-2 rounded-2xl border border-gray-100 bg-gray-50 flex items-center gap-3">
                    <div className="w-11 h-11 rounded-full bg-primary/10 text-primary flex items-center justify-center">
                      <User size={20} />
                    </div>
                    <div>
                      <div className="text-sm font-bold text-slate-900">Admin</div>
                      <div className="text-xs text-slate-500">Protected session</div>
                    </div>
                  </div>
                </div>
              </div>
            </div>

            {message && (
              <div className={`${cardClass} ${message.includes('success') || message.includes('Saved') ? 'border-green-100 bg-green-50' : 'border-red-100 bg-red-50'}`}>
                <p className="text-sm font-medium">{message}</p>
              </div>
            )}

      {activeTab === 'dashboard' && (
        <div className="space-y-6">
          <div className="bg-white rounded-[28px] border border-gray-100 shadow-xl shadow-slate-200/60 p-5">
            <div className="flex items-center justify-between border-b border-gray-100 pb-4 mb-5">
              <h3 className="text-2xl font-black text-slate-900">Welcome Admin</h3>
              <div className="text-sm text-slate-500">Live Google Sheet sync</div>
            </div>

            <div className="grid md:grid-cols-2 xl:grid-cols-4 gap-4">
              <div className="rounded-2xl p-5 text-white bg-[linear-gradient(135deg,#1d4ed8_0%,#2563eb_100%)] shadow-lg shadow-blue-100">
                <div className="text-sm text-white/70 mb-2">Total Courses</div>
                <div className="text-4xl font-black">{courses.length}</div>
              </div>
              <div className="rounded-2xl p-5 text-white bg-[linear-gradient(135deg,#f97316_0%,#ef4444_100%)] shadow-lg shadow-orange-100">
                <div className="text-sm text-white/70 mb-2">Total Lessons</div>
                <div className="text-4xl font-black">{lessons.length}</div>
              </div>
              <div className="rounded-2xl p-5 text-white bg-[linear-gradient(135deg,#10b981_0%,#059669_100%)] shadow-lg shadow-emerald-100">
                <div className="text-sm text-white/70 mb-2">Notes Published</div>
                <div className="text-4xl font-black">{notes.length}</div>
              </div>
              <div className="rounded-2xl p-5 text-white bg-[linear-gradient(135deg,#ec4899_0%,#ef4444_100%)] shadow-lg shadow-pink-100">
                <div className="text-sm text-white/70 mb-2">Quiz Questions</div>
                <div className="text-4xl font-black">{questions.length}</div>
              </div>
            </div>
          </div>

          <div className="grid xl:grid-cols-[1.2fr_0.8fr] gap-6">
            <div className="bg-white rounded-[28px] border border-gray-100 shadow-xl shadow-slate-200/60 p-5">
              <div className="flex items-center justify-between border-b border-gray-100 pb-4 mb-5">
                <h3 className="text-2xl font-black text-slate-900">Manage Courses</h3>
                <button onClick={() => setActiveTab('course')} className="px-4 py-2 rounded-xl bg-primary text-white text-sm font-bold shadow-lg shadow-blue-100">
                  + Add Course
                </button>
              </div>
              <div className="space-y-3">
                {courses.slice(0, 4).map((course) => (
                  <div key={course.id} className="rounded-2xl border border-gray-100 p-4 flex items-center justify-between gap-4">
                    <div className="flex items-center gap-4 min-w-0">
                      <img src={course.image} alt={course.title} className="w-28 h-16 rounded-2xl object-cover" referrerPolicy="no-referrer" />
                      <div className="min-w-0">
                        <div className="font-bold text-lg text-slate-900 truncate">{course.title}</div>
                        <div className="text-sm text-slate-500 mt-1">{course.category} • {course.type} • {course.lessons} lessons</div>
                      </div>
                    </div>
                    <button onClick={() => {
                      setActiveTab('course');
                      setEditingCourseId(course.id);
                      setCourseForm({
                        title: course.title,
                        lessons: String(course.lessons || 0),
                        image: course.image,
                        price: String(course.price || 0),
                        oldPrice: String(course.oldPrice || 0),
                        type: course.type,
                        category: course.category,
                        access_code: '',
                      });
                    }} className="px-3 py-2 rounded-xl bg-gray-100 text-gray-700 text-sm font-bold">
                      Manage
                    </button>
                  </div>
                ))}
              </div>
            </div>

            <div className="space-y-6">
              <div className="bg-white rounded-[28px] border border-gray-100 shadow-xl shadow-slate-200/60 p-5">
                <div className="flex items-center justify-between border-b border-gray-100 pb-4 mb-5">
                  <h3 className="text-2xl font-black text-slate-900">Quiz Activity</h3>
                  <button onClick={() => setActiveTab('quiz')} className="px-4 py-2 rounded-xl bg-primary text-white text-sm font-bold shadow-lg shadow-blue-100">
                    + Create Quiz
                  </button>
                </div>
                <div className="grid grid-cols-2 gap-4 mb-4">
                  <div className="rounded-2xl bg-gray-50 p-4">
                    <div className="text-sm text-slate-500 mb-1">Quizzes</div>
                    <div className="text-3xl font-black text-slate-900">{quizzes.length}</div>
                  </div>
                  <div className="rounded-2xl bg-gray-50 p-4">
                    <div className="text-sm text-slate-500 mb-1">Questions</div>
                    <div className="text-3xl font-black text-slate-900">{questions.length}</div>
                  </div>
                </div>
                <div className="space-y-3">
                  {quizzes.slice(0, 5).map((quiz) => (
                    <div key={quiz.id} className="flex items-center justify-between gap-4 rounded-2xl border border-gray-100 p-4">
                      <div>
                        <div className="font-bold text-slate-900">{quiz.topic}</div>
                        <div className="text-sm text-slate-500 mt-1">{quiz.questions.length} questions</div>
                      </div>
                      <button onClick={() => setActiveTab('question')} className="text-sm font-bold text-primary">
                        Manage
                      </button>
                    </div>
                  ))}
                </div>
              </div>

              <div className="bg-white rounded-[28px] border border-gray-100 shadow-xl shadow-slate-200/60 p-5">
                <h3 className="text-2xl font-black text-slate-900 mb-5">Publishing Snapshot</h3>
                <div className="space-y-4 text-sm text-slate-600">
                  <div className="flex items-center justify-between">
                    <span>Free notes published</span>
                    <span className="font-black text-slate-900">{notes.filter((note) => (note.type || 'free') === 'free').length}</span>
                  </div>
                  <div className="flex items-center justify-between">
                    <span>Premium courses</span>
                    <span className="font-black text-slate-900">{courses.filter((course) => course.type === 'premium').length}</span>
                  </div>
                  <div className="flex items-center justify-between">
                    <span>Video lessons</span>
                    <span className="font-black text-slate-900">{lessons.length}</span>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      )}

      {activeTab === 'course' && (
        <div className="space-y-4">
          <div className={cardClass}>
            <h3 className="font-bold text-gray-800 mb-4">{editingCourseId ? 'Edit Course' : 'Add Course'}</h3>
            <div className="space-y-3">
              <input className="w-full bg-gray-50 border border-gray-100 rounded-xl px-4 py-3 text-sm" placeholder="Course title" value={courseForm.title} onChange={(e) => setCourseForm({ ...courseForm, title: e.target.value })} />
              <input className="w-full bg-gray-50 border border-gray-100 rounded-xl px-4 py-3 text-sm" placeholder="Thumbnail image URL" value={courseForm.image} onChange={(e) => setCourseForm({ ...courseForm, image: e.target.value })} />
              <div className="grid grid-cols-2 gap-3">
                <input className="w-full bg-gray-50 border border-gray-100 rounded-xl px-4 py-3 text-sm" placeholder="Lesson count" value={courseForm.lessons} onChange={(e) => setCourseForm({ ...courseForm, lessons: e.target.value })} />
                <select className="w-full bg-gray-50 border border-gray-100 rounded-xl px-4 py-3 text-sm" value={courseForm.type} onChange={(e) => setCourseForm({ ...courseForm, type: e.target.value })}>
                  <option value="free">Free</option>
                  <option value="premium">Premium</option>
                </select>
              </div>
              <div className="grid grid-cols-2 gap-3">
                <input className="w-full bg-gray-50 border border-gray-100 rounded-xl px-4 py-3 text-sm" placeholder="Price" value={courseForm.price} onChange={(e) => setCourseForm({ ...courseForm, price: e.target.value })} />
                <input className="w-full bg-gray-50 border border-gray-100 rounded-xl px-4 py-3 text-sm" placeholder="Old price" value={courseForm.oldPrice} onChange={(e) => setCourseForm({ ...courseForm, oldPrice: e.target.value })} />
              </div>
              <input className="w-full bg-gray-50 border border-gray-100 rounded-xl px-4 py-3 text-sm" placeholder="Category" value={courseForm.category} onChange={(e) => setCourseForm({ ...courseForm, category: e.target.value })} />
              {courseForm.type === 'premium' && (
                <input className="w-full bg-gray-50 border border-gray-100 rounded-xl px-4 py-3 text-sm" placeholder="Premium access code" value={courseForm.access_code} onChange={(e) => setCourseForm({ ...courseForm, access_code: e.target.value.toUpperCase() })} />
              )}
              <button
                disabled={loading}
                onClick={() => submitAction(editingCourseId ? 'updateCourse' : 'createCourse', {
                  ...(editingCourseId ? { id: editingCourseId } : {}),
                  ...courseForm,
                  lessons: Number(courseForm.lessons || 0),
                  price: Number(courseForm.price || 0),
                  oldPrice: Number(courseForm.oldPrice || 0),
                }, () => {
                  setCourseForm({ title: '', lessons: '0', image: '', price: '0', oldPrice: '0', type: 'free', category: 'Chemistry', access_code: '' });
                  setEditingCourseId('');
                })}
                className="w-full bg-primary text-white py-3 rounded-xl font-bold"
              >
                {loading ? 'Saving...' : editingCourseId ? 'Update Course' : 'Save Course'}
              </button>
              {editingCourseId && (
                <button onClick={() => {
                  setEditingCourseId('');
                  setCourseForm({ title: '', lessons: '0', image: '', price: '0', oldPrice: '0', type: 'free', category: 'Chemistry', access_code: '' });
                }} className="w-full bg-gray-100 text-gray-700 py-3 rounded-xl font-bold">
                  Cancel Edit
                </button>
              )}
            </div>
          </div>

          <div className={cardClass}>
            <h3 className="font-bold text-gray-800 mb-4">Update Premium Access Code</h3>
            <div className="space-y-3">
              <select className="w-full bg-gray-50 border border-gray-100 rounded-xl px-4 py-3 text-sm" value={accessForm.courseId} onChange={(e) => setAccessForm({ ...accessForm, courseId: e.target.value })}>
                <option value="">Select premium course</option>
                {courses.filter((course) => course.type === 'premium').map((course) => (
                  <option key={course.id} value={course.id}>{course.title}</option>
                ))}
              </select>
              <input className="w-full bg-gray-50 border border-gray-100 rounded-xl px-4 py-3 text-sm" placeholder="New access code" value={accessForm.accessCode} onChange={(e) => setAccessForm({ ...accessForm, accessCode: e.target.value.toUpperCase() })} />
              <button
                disabled={loading}
                onClick={() => submitAction('updateCourseAccess', accessForm, () => setAccessForm({ courseId: '', accessCode: '' }))}
                className="w-full bg-gray-900 text-white py-3 rounded-xl font-bold"
              >
                {loading ? 'Updating...' : 'Update Access Code'}
              </button>
            </div>
          </div>

          <div className={cardClass}>
            <h3 className="font-bold text-gray-800 mb-4">Manage Courses</h3>
            <div className="space-y-3">
              {courses.map((course) => (
                <div key={course.id} className="border border-gray-100 rounded-xl p-3">
                  <div className="flex items-start justify-between gap-3">
                    <div>
                      <div className="font-bold text-sm text-gray-800">{course.title}</div>
                      <div className="text-xs text-gray-500 mt-1">{course.category} • {course.type}</div>
                    </div>
                    <div className="flex gap-2">
                      <button onClick={() => {
                        setEditingCourseId(course.id);
                        setCourseForm({
                          title: course.title,
                          lessons: String(course.lessons || 0),
                          image: course.image,
                          price: String(course.price || 0),
                          oldPrice: String(course.oldPrice || 0),
                          type: course.type,
                          category: course.category,
                          access_code: '',
                        });
                        setActiveTab('course');
                      }} className="px-3 py-1.5 rounded-lg bg-primary/10 text-primary text-xs font-bold">Edit</button>
                      <button onClick={() => submitAction('deleteCourse', { id: course.id }, () => {})} className="px-3 py-1.5 rounded-lg bg-red-50 text-red-600 text-xs font-bold">Delete</button>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>
      )}

      {activeTab === 'lesson' && (
        <div className="space-y-4">
        <div className={cardClass}>
          <h3 className="font-bold text-gray-800 mb-4">{editingLessonId ? 'Edit Lesson' : 'Add Lesson'}</h3>
          <div className="space-y-3">
            <select className="w-full bg-gray-50 border border-gray-100 rounded-xl px-4 py-3 text-sm" value={lessonForm.course_id} onChange={(e) => setLessonForm({ ...lessonForm, course_id: e.target.value })}>
              <option value="">Select course</option>
              {courses.map((course) => <option key={course.id} value={course.id}>{course.title}</option>)}
            </select>
            <input className="w-full bg-gray-50 border border-gray-100 rounded-xl px-4 py-3 text-sm" placeholder="Lesson title" value={lessonForm.title} onChange={(e) => setLessonForm({ ...lessonForm, title: e.target.value })} />
            <input className="w-full bg-gray-50 border border-gray-100 rounded-xl px-4 py-3 text-sm" placeholder="Duration e.g. 20:15" value={lessonForm.duration} onChange={(e) => setLessonForm({ ...lessonForm, duration: e.target.value })} />
            <input className="w-full bg-gray-50 border border-gray-100 rounded-xl px-4 py-3 text-sm" placeholder="Video embed URL" value={lessonForm.video_url} onChange={(e) => setLessonForm({ ...lessonForm, video_url: e.target.value })} />
            <input className="w-full bg-gray-50 border border-gray-100 rounded-xl px-4 py-3 text-sm" placeholder="Lesson note URL (optional)" value={lessonForm.note_url} onChange={(e) => setLessonForm({ ...lessonForm, note_url: e.target.value })} />
            <textarea className="w-full bg-gray-50 border border-gray-100 rounded-xl px-4 py-3 text-sm min-h-28" placeholder="Lesson note content (optional)" value={lessonForm.note_content} onChange={(e) => setLessonForm({ ...lessonForm, note_content: e.target.value })} />
            <button
              disabled={loading}
              onClick={() => submitAction(editingLessonId ? 'updateLesson' : 'createLesson', {
                ...(editingLessonId ? { id: editingLessonId } : {}),
                ...lessonForm
              }, () => {
                setLessonForm({ course_id: '', title: '', duration: '', note_content: '', note_url: '', video_url: '' });
                setEditingLessonId('');
              })}
              className="w-full bg-primary text-white py-3 rounded-xl font-bold"
            >
              {loading ? 'Saving...' : editingLessonId ? 'Update Lesson' : 'Save Lesson'}
            </button>
            {editingLessonId && (
              <button onClick={() => {
                setEditingLessonId('');
                setLessonForm({ course_id: '', title: '', duration: '', note_content: '', note_url: '', video_url: '' });
              }} className="w-full bg-gray-100 text-gray-700 py-3 rounded-xl font-bold">
                Cancel Edit
              </button>
            )}
          </div>
        </div>
        <div className={cardClass}>
          <h3 className="font-bold text-gray-800 mb-4">Manage Lessons</h3>
          <div className="space-y-3">
            {lessons.map((lesson) => (
              <div key={lesson.id} className="border border-gray-100 rounded-xl p-3">
                <div className="flex items-start justify-between gap-3">
                  <div>
                    <div className="font-bold text-sm text-gray-800">{lesson.title}</div>
                    <div className="text-xs text-gray-500 mt-1">{courses.find((course) => course.id === lesson.course_id)?.title || lesson.course_id}</div>
                  </div>
                  <div className="flex gap-2">
                    <button onClick={() => {
                      setEditingLessonId(lesson.id);
                      setLessonForm({
                        course_id: lesson.course_id,
                        title: lesson.title,
                        duration: lesson.duration,
                        note_content: lesson.note_content,
                        note_url: lesson.note_url || '',
                        video_url: lesson.video_url || '',
                      });
                      setActiveTab('lesson');
                    }} className="px-3 py-1.5 rounded-lg bg-primary/10 text-primary text-xs font-bold">Edit</button>
                    <button onClick={() => submitAction('deleteLesson', { id: lesson.id }, () => {})} className="px-3 py-1.5 rounded-lg bg-red-50 text-red-600 text-xs font-bold">Delete</button>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>
        </div>
      )}

      {activeTab === 'note' && (
        <div className="space-y-4">
        <div className={cardClass}>
          <h3 className="font-bold text-gray-800 mb-4">{editingNoteId ? 'Edit Note' : 'Add Note'}</h3>
          <div className="space-y-3">
            <input className="w-full bg-gray-50 border border-gray-100 rounded-xl px-4 py-3 text-sm" placeholder="Note title" value={noteForm.title} onChange={(e) => setNoteForm({ ...noteForm, title: e.target.value })} />
            <div className="grid grid-cols-2 gap-3">
              <input className="w-full bg-gray-50 border border-gray-100 rounded-xl px-4 py-3 text-sm" placeholder="Lesson count" value={noteForm.lessons} onChange={(e) => setNoteForm({ ...noteForm, lessons: e.target.value })} />
              <select className="w-full bg-gray-50 border border-gray-100 rounded-xl px-4 py-3 text-sm" value={noteForm.type} onChange={(e) => setNoteForm({ ...noteForm, type: e.target.value })}>
                <option value="free">Free</option>
                <option value="premium">Premium</option>
              </select>
            </div>
            <input className="w-full bg-gray-50 border border-gray-100 rounded-xl px-4 py-3 text-sm" placeholder="Category" value={noteForm.category} onChange={(e) => setNoteForm({ ...noteForm, category: e.target.value })} />
            <input className="w-full bg-gray-50 border border-gray-100 rounded-xl px-4 py-3 text-sm" placeholder="Hosted note URL (optional)" value={noteForm.url} onChange={(e) => setNoteForm({ ...noteForm, url: e.target.value })} />
            <textarea className="w-full bg-gray-50 border border-gray-100 rounded-xl px-4 py-3 text-sm min-h-28" placeholder="Note content markdown/text (optional)" value={noteForm.content} onChange={(e) => setNoteForm({ ...noteForm, content: e.target.value })} />
            <button
              disabled={loading}
              onClick={() => submitAction(editingNoteId ? 'updateNote' : 'createNote', { ...(editingNoteId ? { id: editingNoteId } : {}), ...noteForm, lessons: Number(noteForm.lessons || 0) }, () => {
                setNoteForm({ title: '', lessons: '1', category: 'Chemistry', type: 'free', url: '', content: '' });
                setEditingNoteId('');
              })}
              className="w-full bg-primary text-white py-3 rounded-xl font-bold"
            >
              {loading ? 'Saving...' : editingNoteId ? 'Update Note' : 'Save Note'}
            </button>
            {editingNoteId && (
              <button onClick={() => {
                setEditingNoteId('');
                setNoteForm({ title: '', lessons: '1', category: 'Chemistry', type: 'free', url: '', content: '' });
              }} className="w-full bg-gray-100 text-gray-700 py-3 rounded-xl font-bold">
                Cancel Edit
              </button>
            )}
          </div>
        </div>
        <div className={cardClass}>
          <h3 className="font-bold text-gray-800 mb-4">Manage Notes</h3>
          <div className="space-y-3">
            {notes.map((note) => (
              <div key={note.id} className="border border-gray-100 rounded-xl p-3">
                <div className="flex items-start justify-between gap-3">
                  <div>
                    <div className="font-bold text-sm text-gray-800">{note.title}</div>
                    <div className="text-xs text-gray-500 mt-1">{note.category} • {note.type || 'free'}</div>
                  </div>
                  <div className="flex gap-2">
                    <button onClick={() => {
                      setEditingNoteId(note.id);
                      setNoteForm({
                        title: note.title,
                        lessons: String(note.lessons || 1),
                        category: note.category,
                        type: note.type || 'free',
                        url: note.url || '',
                        content: note.content || '',
                      });
                      setActiveTab('note');
                    }} className="px-3 py-1.5 rounded-lg bg-primary/10 text-primary text-xs font-bold">Edit</button>
                    <button onClick={() => submitAction('deleteNote', { id: note.id }, () => {})} className="px-3 py-1.5 rounded-lg bg-red-50 text-red-600 text-xs font-bold">Delete</button>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>
        </div>
      )}

      {activeTab === 'quiz' && (
        <div className="space-y-4">
        <div className={cardClass}>
          <h3 className="font-bold text-gray-800 mb-4">{editingQuizId ? 'Edit Quiz' : 'Add Quiz'}</h3>
          <div className="space-y-3">
            <input className="w-full bg-gray-50 border border-gray-100 rounded-xl px-4 py-3 text-sm" placeholder="Quiz topic" value={quizForm.topic} onChange={(e) => setQuizForm({ ...quizForm, topic: e.target.value })} />
            <select className="w-full bg-gray-50 border border-gray-100 rounded-xl px-4 py-3 text-sm" value={quizForm.type} onChange={(e) => setQuizForm({ ...quizForm, type: e.target.value })}>
              <option value="free">Free</option>
              <option value="premium">Premium</option>
            </select>
            <button
              disabled={loading}
              onClick={() => submitAction(editingQuizId ? 'updateQuiz' : 'createQuiz', { ...(editingQuizId ? { id: editingQuizId } : {}), ...quizForm }, () => {
                setQuizForm({ topic: '', type: 'free' });
                setEditingQuizId('');
              })}
              className="w-full bg-primary text-white py-3 rounded-xl font-bold"
            >
              {loading ? 'Saving...' : editingQuizId ? 'Update Quiz' : 'Save Quiz'}
            </button>
            {editingQuizId && (
              <button onClick={() => {
                setEditingQuizId('');
                setQuizForm({ topic: '', type: 'free' });
              }} className="w-full bg-gray-100 text-gray-700 py-3 rounded-xl font-bold">
                Cancel Edit
              </button>
            )}
          </div>
        </div>
        <div className={cardClass}>
          <h3 className="font-bold text-gray-800 mb-4">Manage Quizzes</h3>
          <div className="space-y-3">
            {quizzes.map((quiz) => (
              <div key={quiz.id} className="border border-gray-100 rounded-xl p-3">
                <div className="flex items-start justify-between gap-3">
                  <div>
                    <div className="font-bold text-sm text-gray-800">{quiz.topic}</div>
                    <div className="text-xs text-gray-500 mt-1">{quiz.questions.length} questions</div>
                  </div>
                  <div className="flex gap-2">
                    <button onClick={() => {
                      setEditingQuizId(quiz.id);
                      setQuizForm({ topic: quiz.topic, type: (quiz as any).type || 'free' });
                      setActiveTab('quiz');
                    }} className="px-3 py-1.5 rounded-lg bg-primary/10 text-primary text-xs font-bold">Edit</button>
                    <button onClick={() => submitAction('deleteQuiz', { id: quiz.id }, () => {})} className="px-3 py-1.5 rounded-lg bg-red-50 text-red-600 text-xs font-bold">Delete</button>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>
        </div>
      )}

      {activeTab === 'question' && (
        <div className="space-y-4">
        <div className={cardClass}>
          <h3 className="font-bold text-gray-800 mb-4">{editingQuestionId ? 'Edit Question' : 'Add Question'}</h3>
          <div className="space-y-3">
            <select className="w-full bg-gray-50 border border-gray-100 rounded-xl px-4 py-3 text-sm" value={questionForm.quiz_id} onChange={(e) => setQuestionForm({ ...questionForm, quiz_id: e.target.value })}>
              <option value="">Select quiz</option>
              {quizzes.map((quiz) => <option key={quiz.id} value={quiz.id}>{quiz.topic}</option>)}
            </select>
            <textarea className="w-full bg-gray-50 border border-gray-100 rounded-xl px-4 py-3 text-sm min-h-24" placeholder="Question text" value={questionForm.text} onChange={(e) => setQuestionForm({ ...questionForm, text: e.target.value })} />
            <textarea className="w-full bg-gray-50 border border-gray-100 rounded-xl px-4 py-3 text-sm min-h-28" placeholder={'Options, one per line\nOption 1\nOption 2\nOption 3\nOption 4'} value={questionForm.optionsText} onChange={(e) => setQuestionForm({ ...questionForm, optionsText: e.target.value })} />
            <input className="w-full bg-gray-50 border border-gray-100 rounded-xl px-4 py-3 text-sm" placeholder="Correct answer index (0-3)" value={questionForm.correctAnswer} onChange={(e) => setQuestionForm({ ...questionForm, correctAnswer: e.target.value })} />
            <textarea className="w-full bg-gray-50 border border-gray-100 rounded-xl px-4 py-3 text-sm min-h-24" placeholder="Explanation" value={questionForm.explanation} onChange={(e) => setQuestionForm({ ...questionForm, explanation: e.target.value })} />
            <button
              disabled={loading}
              onClick={() => submitAction(editingQuestionId ? 'updateQuestion' : 'createQuestion', {
                ...(editingQuestionId ? { id: editingQuestionId } : {}),
                quiz_id: questionForm.quiz_id,
                text: questionForm.text,
                options: questionForm.optionsText.split('\n').map((item) => item.trim()).filter(Boolean),
                correctAnswer: Number(questionForm.correctAnswer || 0),
                explanation: questionForm.explanation,
              }, () => {
                setQuestionForm({ id: '', quiz_id: '', text: '', optionsText: '', correctAnswer: '0', explanation: '' });
                setEditingQuestionId('');
              })}
              className="w-full bg-primary text-white py-3 rounded-xl font-bold"
            >
              {loading ? 'Saving...' : editingQuestionId ? 'Update Question' : 'Save Question'}
            </button>
            {editingQuestionId && (
              <button onClick={() => {
                setEditingQuestionId('');
                setQuestionForm({ id: '', quiz_id: '', text: '', optionsText: '', correctAnswer: '0', explanation: '' });
              }} className="w-full bg-gray-100 text-gray-700 py-3 rounded-xl font-bold">
                Cancel Edit
              </button>
            )}
          </div>
        </div>
        <div className={cardClass}>
          <h3 className="font-bold text-gray-800 mb-4">Manage Questions</h3>
          <div className="space-y-3">
            {questions.map((question) => (
              <div key={question.id} className="border border-gray-100 rounded-xl p-3">
                <div className="flex items-start justify-between gap-3">
                  <div>
                    <div className="font-bold text-sm text-gray-800">{question.text}</div>
                    <div className="text-xs text-gray-500 mt-1">{(question as any).topic}</div>
                  </div>
                  <div className="flex gap-2">
                    <button onClick={() => {
                      setEditingQuestionId(question.id);
                      setQuestionForm({
                        id: question.id,
                        quiz_id: question.quiz_id,
                        text: question.text,
                        optionsText: question.options.join('\n'),
                        correctAnswer: String(question.correctAnswer),
                        explanation: question.explanation || '',
                      });
                      setActiveTab('question');
                    }} className="px-3 py-1.5 rounded-lg bg-primary/10 text-primary text-xs font-bold">Edit</button>
                    <button onClick={() => submitAction('deleteQuestion', { id: question.id }, () => {})} className="px-3 py-1.5 rounded-lg bg-red-50 text-red-600 text-xs font-bold">Delete</button>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>
        </div>
      )}

      <div className={`${cardClass} mt-5`}>
        <div className="flex items-center justify-between mb-3">
          <h3 className="font-bold text-gray-800">Current Content Snapshot</h3>
          <button onClick={onRefresh} className="text-primary text-sm font-bold">Refresh</button>
        </div>
        <div className="text-xs text-gray-500 space-y-2">
          <p>{courses.length} courses loaded from Sheets</p>
          <p>{quizzes.length} quizzes loaded from Sheets</p>
          {courses.slice(0, 5).map((course) => (
            <div key={course.id} className="flex justify-between gap-3">
              <span className="truncate">{course.title}</span>
              <span className="uppercase">{course.type}</span>
            </div>
          ))}
        </div>
      </div>
          </main>
        </div>
      </div>
    </motion.div>
  );
};

const NoteViewerScreen = ({ 
  onBack, 
  lesson 
}: { 
  onBack: () => void, 
  lesson: Lesson | null
}) => {
  if (!lesson) return null;

  return (
    <motion.div 
      initial={{ x: '100%' }} 
      animate={{ x: 0 }} 
      exit={{ x: '100%' }}
      className="flex-1 bg-white flex flex-col z-50 fixed inset-0"
    >
      <div className="bg-primary p-4 text-white flex items-center justify-between sticky top-0 z-10">
        <div className="flex items-center gap-3">
          <button onClick={onBack} className="p-2 hover:bg-white/10 rounded-full transition-colors">
            <ArrowLeft size={20} />
          </button>
          <div>
            <h3 className="font-bold text-sm">{lesson.title}</h3>
            <p className="text-[10px] text-white/70">Academy Study Material</p>
          </div>
        </div>
        <div className="p-2 bg-white/20 rounded-lg">
          <FileText size={20} />
        </div>
      </div>

      <div className="flex-1 overflow-y-auto p-6 bg-gray-50">
        <div className="bg-white p-8 rounded-2xl shadow-sm border border-gray-100 min-h-full">
          <h1 className="text-2xl font-bold text-gray-800 mb-6 border-b pb-4">{lesson.title} Notes</h1>

          {lesson.note_url ? (
            <div className="space-y-4">
              <a
                href={lesson.note_url}
                target="_blank"
                rel="noreferrer"
                className="inline-flex items-center gap-2 px-4 py-2 rounded-xl bg-primary text-white text-sm font-bold shadow-lg shadow-blue-100"
              >
                <Eye size={16} />
                Open Note URL
              </a>
              <iframe
                src={lesson.note_url}
                className="w-full min-h-[70vh] rounded-2xl border border-gray-100"
                title={lesson.title}
              />
            </div>
          ) : (
            <div className="markdown-body prose prose-sm max-w-none">
              <ReactMarkdown>{lesson.note_content}</ReactMarkdown>
            </div>
          )}
        </div>
      </div>

      <div className="p-4 bg-white border-t border-gray-100 flex gap-3">
        <button className="flex-1 bg-gray-100 text-gray-700 py-3 rounded-xl font-bold text-sm flex items-center justify-center gap-2">
          <Download size={18} />
          Download PDF
        </button>
        <button className="flex-1 bg-primary text-white py-3 rounded-xl font-bold text-sm shadow-lg shadow-blue-100">
          Mark as Read
        </button>
      </div>
    </motion.div>
  );
};

// --- Main App ---

export default function App() {
  const isAdminRoute = typeof window !== 'undefined' && window.location.pathname === '/adminlogin';
  const [screen, setScreen] = useState<Screen>('home');
  const [courses, setCourses] = useState<Course[]>([]);
  const [notes, setNotes] = useState<Note[]>([]);
  const [quizzes, setQuizzes] = useState<Quiz[]>([]);
  const [adminUsers, setAdminUsers] = useState<AdminUser[]>([]);
  const [loading, setLoading] = useState(true);
  const [user, setUser] = useState<AuthUser | null>(() => getStoredSessionUser());
  const [isAdminAuthenticated, setIsAdminAuthenticated] = useState(() => getAdminSession());
  const [darkModeEnabled, setDarkModeEnabled] = useState(() => {
    if (typeof window === 'undefined') return false;
    return window.localStorage.getItem(THEME_STORAGE_KEY) === 'dark';
  });
  const [isDrawerOpen, setIsDrawerOpen] = useState(false);
  const [unlockedCourseIds, setUnlockedCourseIds] = useState<string[]>([]);
  const [selectedCourseForUnlock, setSelectedCourseForUnlock] = useState<Course | null>(null);
  const [selectedCourse, setSelectedCourse] = useState<Course | null>(null);
  const [selectedLesson, setSelectedLesson] = useState<Lesson | null>(null);
  const [selectedQuizTopic, setSelectedQuizTopic] = useState<Quiz | null>(null);
  const [previousScreen, setPreviousScreen] = useState<Screen>('home');

  const fetchAppData = async () => {
    try {
      const requests: Promise<Response>[] = [
        apiGet('courses'),
        apiGet('notes'),
        apiGet('quizzes')
      ];

      if (isAdminRoute) {
        requests.push(apiGet('users'));
      }

      const responses = await Promise.all(requests);
      const payloads = await Promise.all(responses.map((response) => response.json()));
      const [coursesData, notesData, quizzesData, usersData] = payloads;

      setCourses(coursesData);
      setNotes(notesData);
      setQuizzes(mergeQuizzes(quizzesData));
      if (isAdminRoute) {
        setAdminUsers(usersData || []);
      }
    } catch (error) {
      console.error("Error fetching data:", error);
      setQuizzes(fallbackQuizzes);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchAppData();
  }, []);

  useEffect(() => {
    if (typeof window === 'undefined') return;

    document.body.classList.toggle('dark-mode', darkModeEnabled);
    window.localStorage.setItem(THEME_STORAGE_KEY, darkModeEnabled ? 'dark' : 'light');
  }, [darkModeEnabled]);

  useEffect(() => {
    const loadUserAccess = async () => {
      if (!user || !APPS_SCRIPT_URL) {
        return;
      }

      try {
        const response = await apiGet('users');
        const users = await response.json();
        const matchedUser = (users || []).find((item: AdminUser) => item.id === user.id);
        setUnlockedCourseIds(matchedUser?.grantedCourseIds || []);
      } catch (error) {
        console.error('Error loading user access:', error);
      }
    };

    loadUserAccess();
  }, [user]);

  const handleLogin = (userData: AuthUser) => {
    const normalizedUser = normalizeAuthUser(userData);
    setUser(normalizedUser);
    saveSessionUser(normalizedUser);
    if ((userData as any).grantedCourseIds) {
      setUnlockedCourseIds((userData as any).grantedCourseIds);
    }
    setScreen('home');
  };

  const handleLogout = () => {
    setUser(null);
    saveSessionUser(null);
    setUnlockedCourseIds([]);
    setScreen('home');
    setIsDrawerOpen(false);
  };

  const handleAdminLogin = () => {
    setIsAdminAuthenticated(true);
    saveAdminSession(true);
    setScreen('admin');
  };

  const handleAdminLogout = () => {
    setIsAdminAuthenticated(false);
    saveAdminSession(false);
    if (typeof window !== 'undefined') {
      window.location.href = '/';
    }
  };

  const handleUnlockCourse = async (code: string) => {
    if (!selectedCourseForUnlock) {
      return { success: false, message: 'No course selected' };
    }

    try {
      const response = await apiPost('verifyCourseAccess', {
        courseId: selectedCourseForUnlock.id,
        accessCode: code
      });
      const data = await response.json();

      if (!data.success) {
        return { success: false, message: data.message || 'Invalid access code' };
      }

      setUnlockedCourseIds(prev => prev.includes(selectedCourseForUnlock.id) ? prev : [...prev, selectedCourseForUnlock.id]);
      setSelectedCourseForUnlock(null);
      setScreen('video-player');
      return { success: true };
    } catch (error) {
      if (code === 'RBS123') {
        setUnlockedCourseIds(prev => prev.includes(selectedCourseForUnlock.id) ? prev : [...prev, selectedCourseForUnlock.id]);
        setSelectedCourseForUnlock(null);
        setScreen('video-player');
        return { success: true };
      }

      return { success: false, message: 'Invalid Access Code. Please contact admin on WhatsApp.' };
    }
  };

  const renderScreen = () => {
    if (isAdminRoute) {
      if (!isAdminAuthenticated) {
        return <AdminLoginScreen onLogin={handleAdminLogin} />;
      }
      return <AdminPanelScreen courses={courses} notes={notes} quizzes={quizzes} users={adminUsers} onRefresh={fetchAppData} onLogout={handleAdminLogout} />;
    }

    if (loading) return <Loading />;
    if (!user) return <LoginScreen onLogin={handleLogin} />;

    switch (screen) {
      case 'home': return (
        <HomeScreen 
          setScreen={setScreen} 
          courses={courses} 
          unlockedCourseIds={unlockedCourseIds}
          onBuyClick={(course) => setSelectedCourseForUnlock(course)}
          onCourseSelect={(course) => setSelectedCourse(course)}
        />
      );
      case 'courses': return (
        <CoursesScreen 
          setScreen={setScreen} 
          courses={courses} 
          unlockedCourseIds={unlockedCourseIds}
          onBuyClick={(course) => setSelectedCourseForUnlock(course)}
          onCourseSelect={(course) => setSelectedCourse(course)}
        />
      );
      case 'notes': return (
        <NotesScreen 
          notes={notes} 
          onViewNote={(note) => {
            setSelectedLesson({
              id: note.id,
              course_id: '',
              title: note.title,
              duration: '',
              note_content: note.content || 'This is a detailed study material for ' + note.title,
              note_url: note.url
            });
            setPreviousScreen('notes');
            setScreen('note-viewer');
          }}
        />
      );
      case 'quiz': return <QuizScreen quizzes={quizzes} initialQuiz={selectedQuizTopic} />;
      case 'profile': return <ProfileScreen user={user} onLogout={handleLogout} onOpenSettings={() => setScreen('settings')} />;
      case 'settings': return (
        <SettingsScreen
          user={user}
          darkModeEnabled={darkModeEnabled}
          onToggleDarkMode={() => setDarkModeEnabled((prev) => !prev)}
        />
      );
      case 'admin': return <HomeScreen 
        setScreen={setScreen} 
        courses={courses} 
        unlockedCourseIds={unlockedCourseIds}
        onBuyClick={(course) => setSelectedCourseForUnlock(course)}
        onCourseSelect={(course) => setSelectedCourse(course)}
      />;
      case 'video-player': return (
        <VideoPlayerScreen 
          onBack={() => setScreen('courses')} 
          course={selectedCourse}
          onLessonSelect={(lesson) => setSelectedLesson(lesson)}
          onViewNotes={(lesson) => {
            setSelectedLesson(lesson);
            setPreviousScreen('video-player');
            setScreen('note-viewer');
          }}
        />
      );
      case 'note-viewer': return (
        <NoteViewerScreen 
          onBack={() => setScreen(previousScreen)} 
          lesson={selectedLesson} 
        />
      );
      case 'course-details': return (
        <CourseDetailsScreen 
          course={selectedCourse}
          onBack={() => setScreen('courses')}
          onStartLearning={() => {
            if (selectedCourse) {
              const isUnlocked = selectedCourse.type === 'free' || unlockedCourseIds.includes(selectedCourse.id);
              if (isUnlocked) {
                setScreen('video-player');
              } else {
                setSelectedCourseForUnlock(selectedCourse);
              }
            }
          }}
          onViewNotes={(lesson) => {
            setSelectedLesson(lesson);
            setPreviousScreen('course-details');
            setScreen('note-viewer');
          }}
          onTakeQuiz={() => {
            const quiz = quizzes.find(q => q.topic.toLowerCase().includes(selectedCourse?.category.toLowerCase() || ''));
            setSelectedQuizTopic(quiz || null);
            setScreen('quiz');
          }}
          isUnlocked={!!selectedCourse && (selectedCourse.type === 'free' || unlockedCourseIds.includes(selectedCourse.id))}
        />
      );
      default: return (
        <HomeScreen 
          setScreen={setScreen} 
          courses={courses} 
          unlockedCourseIds={unlockedCourseIds}
          onBuyClick={(course) => setSelectedCourseForUnlock(course)}
          onCourseSelect={(course) => setSelectedCourse(course)}
        />
      );
    }
  };

  const getTitle = () => {
    switch (screen) {
      case 'home': return 'RBS Academy';
      case 'courses': return 'Courses';
      case 'notes': return 'Notes';
      case 'quiz': return 'Practice Quiz';
      case 'profile': return 'My Profile';
      case 'settings': return 'Settings';
      case 'video-player': return 'Video Player';
      case 'course-details': return 'Course Details';
      default: return 'RBS Academy';
    }
  };

  return (
    <div className={isAdminRoute ? 'admin-shell' : 'mobile-container'}>
      {!isAdminRoute && screen !== 'video-player' && screen !== 'note-viewer' && screen !== 'course-details' && (
        <Header 
          title={getTitle()} 
          showBack={screen !== 'home'} 
          onBack={() => setScreen('home')} 
          onMenuClick={() => setIsDrawerOpen(true)}
        />
      )}
      
      {!isAdminRoute && (
        <SideDrawer 
          isOpen={isDrawerOpen} 
          onClose={() => setIsDrawerOpen(false)} 
          user={user}
          setScreen={setScreen}
        />
      )}

      <AccessCodeModal 
        isOpen={!!selectedCourseForUnlock}
        onClose={() => setSelectedCourseForUnlock(null)}
        onUnlock={handleUnlockCourse}
        courseTitle={selectedCourseForUnlock?.title || ''}
      />

      <AnimatePresence mode="wait">
        {renderScreen()}
      </AnimatePresence>

      {!isAdminRoute && screen !== 'video-player' && screen !== 'note-viewer' && screen !== 'course-details' && (
        <BottomNav 
          activeScreen={screen} 
          setScreen={setScreen} 
          onQuizClick={() => {
            setSelectedQuizTopic(null);
            setScreen('quiz');
          }}
        />
      )}
    </div>
  );
}
