import { useState, useEffect } from 'react';
import './index.css';
import questionsData from './data/questions.json';
import { motion, AnimatePresence } from 'framer-motion';
import { Brain, Play, RotateCcw, CheckCircle2, XCircle } from 'lucide-react';
import { App as CapApp } from '@capacitor/app';

export default function App() {
  const [gameState, setGameState] = useState('start'); // start, quiz, result
  const [questions, setQuestions] = useState([]);
  const [currentIndex, setCurrentIndex] = useState(0);
  const [score, setScore] = useState(0);
  const [selectedAnswer, setSelectedAnswer] = useState(null);
  const [isAnimating, setIsAnimating] = useState(false);
  const [showAbout, setShowAbout] = useState(false);

  useEffect(() => {
    setQuestions(questionsData);

    // Handle Android Hardware Back Button
    const backButtonListener = CapApp.addListener('backButton', () => {
      setShowAbout(isAboutOpen => {
        if (isAboutOpen) {
          return false; // Close modal if open
        } else {
          setGameState(currentState => {
            if (currentState !== 'start') {
              return 'start'; // Go back to start screen
            } else {
              CapApp.exitApp(); // Exit app if already at start screen
              return currentState;
            }
          });
          return isAboutOpen;
        }
      });
    });

    return () => {
      backButtonListener.then(listener => listener.remove());
    };
  }, []);

  const startGame = () => {
    setGameState('quiz');
    setCurrentIndex(0);
    setScore(0);
    setSelectedAnswer(null);
  };

  const handleAnswerSelect = (option) => {
    if (selectedAnswer) return; // Prevent multiple clicks

    setSelectedAnswer(option);

    if (option === questions[currentIndex].answer) {
      setScore(s => s + 1);
    }

    setIsAnimating(true);

    // Auto-advance after 1.5s
    setTimeout(() => {
      if (currentIndex < questions.length - 1) {
        setCurrentIndex(c => c + 1);
        setSelectedAnswer(null);
        setIsAnimating(false);
      } else {
        setGameState('result');
      }
    }, 1500);
  };

  // Views Renderers
  const renderStartScreen = () => (
    <motion.div
      initial={{ opacity: 0, scale: 0.9 }}
      animate={{ opacity: 1, scale: 1 }}
      exit={{ opacity: 0, scale: 1.1 }}
      className="glass-panel start-screen"
    >
      <div className="logo-container">
        {/* We use the logo.png from public folder as requested. If not found, a fallback icon */}
        <img src="/logo.png" alt="Quick Ai test Logo" onError={(e) => { e.target.style.display = 'none' }} />
        <Brain size={64} className="mx-auto text-indigo-400 mb-4" />
      </div>
      <h1>Quick Ai test</h1>
      <p className="subtitle">Master Artificial Intelligence in 100 Questions</p>

      <button className="btn-primary" onClick={startGame}>
        <Play size={24} /> Start Learning
      </button>

      <button className="btn-secondary" onClick={() => setShowAbout(true)} style={{ marginTop: '1rem', background: 'transparent', border: '1px solid rgba(255,255,255,0.2)', fontSize: '0.9rem', width: '100%', padding: '10px', borderRadius: '8px', color: 'var(--text-muted)' }}>
        Privacy & About
      </button>
    </motion.div>
  );

  const renderQuizEngine = () => {
    if (questions.length === 0) return null;
    const currentQ = questions[currentIndex];

    return (
      <motion.div
        key={currentIndex}
        initial={{ opacity: 0, x: 50 }}
        animate={{ opacity: 1, x: 0 }}
        exit={{ opacity: 0, x: -50 }}
        transition={{ type: 'spring', stiffness: 300, damping: 30 }}
        className="glass-panel"
        style={{ textAlign: 'left' }}
      >
        <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '2rem', alignItems: 'center' }}>
          <span style={{ color: 'var(--text-muted)' }}>Question {currentIndex + 1} / {questions.length}</span>
          <span style={{ background: 'var(--primary-glow)', padding: '5px 15px', borderRadius: '20px', fontSize: '0.9rem', color: 'white' }}>
            Score: {score}
          </span>
        </div>

        <h2 style={{ fontSize: '1.6rem', lineHeight: '1.4', marginBottom: '2rem' }}>
          {currentQ.question}
        </h2>

        <div style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
          {currentQ.options.map((option, idx) => {
            const isSelected = selectedAnswer === option;
            const isCorrect = option === currentQ.answer;
            const showCorrect = selectedAnswer && isCorrect;
            const showWrong = isSelected && !isCorrect;

            let btnStyle = {
              background: 'rgba(255, 255, 255, 0.05)',
              border: '1px solid rgba(255, 255, 255, 0.1)',
              padding: '1.2rem 1.5rem',
              borderRadius: '12px',
              color: 'var(--text-main)',
              fontSize: '1.1rem',
              cursor: selectedAnswer ? 'default' : 'pointer',
              display: 'flex',
              justifyContent: 'space-between',
              alignItems: 'center',
              transition: 'all 0.2s',
              fontFamily: 'Outfit, sans-serif'
            };

            if (showCorrect) {
              btnStyle.background = 'var(--secondary-glow)';
              btnStyle.border = '1px solid var(--secondary)';
            } else if (showWrong) {
              btnStyle.background = 'var(--danger-glow)';
              btnStyle.border = '1px solid var(--danger)';
            }

            return (
              <motion.button
                whileHover={!selectedAnswer ? { scale: 1.02, backgroundColor: 'rgba(255,255,255,0.1)' } : {}}
                whileTap={!selectedAnswer ? { scale: 0.98 } : {}}
                key={idx}
                style={btnStyle}
                onClick={() => handleAnswerSelect(option)}
                disabled={!!selectedAnswer}
              >
                <span>{option}</span>
                {showCorrect && <CheckCircle2 color="var(--secondary)" />}
                {showWrong && <XCircle color="var(--danger)" />}
              </motion.button>
            );
          })}
        </div>
      </motion.div>
    );
  };

  const renderResultScreen = () => {
    const percentage = Math.round((score / questions.length) * 100);
    return (
      <motion.div
        initial={{ opacity: 0, scale: 0.8 }}
        animate={{ opacity: 1, scale: 1 }}
        className="glass-panel"
      >
        <Brain size={64} style={{ color: 'var(--secondary)', margin: '0 auto 1rem' }} />
        <h1>Test Complete!</h1>
        <p className="subtitle">Here is your AI mastery score:</p>

        <div className="score-display">
          {percentage}%
        </div>

        <p style={{ color: 'var(--text-muted)', marginBottom: '2rem', fontSize: '1.2rem' }}>
          You answered {score} out of {questions.length} questions correctly.
        </p>

        <button className="btn-primary" onClick={startGame}>
          <RotateCcw size={24} /> Play Again
        </button>
      </motion.div>
    );
  };

  const renderAboutModal = () => (
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0 }}
      className="modal-overlay"
      style={{
        position: 'fixed', top: 0, left: 0, width: '100%', height: '100%',
        background: 'rgba(0,0,0,0.8)', display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 100
      }}
      onClick={() => setShowAbout(false)}
    >
      <motion.div
        initial={{ y: 50 }}
        animate={{ y: 0 }}
        onClick={e => e.stopPropagation()}
        className="glass-panel"
        style={{ width: '90%', maxWidth: '90vw', maxHeight: '80vh', overflowY: 'auto', textAlign: 'left', minWidth: 0, boxSizing: 'border-box' }}
      >
        <h2 style={{ fontSize: '1.5rem', marginBottom: '1rem', color: 'var(--secondary)' }}>Privacy Policy</h2>
        <p style={{ marginBottom: '0.5rem', fontSize: '0.85rem', color: 'var(--text-muted)' }}>Effective Date: March 3, 2026</p>

        <p style={{ marginBottom: '1rem', fontSize: '0.95rem', color: 'var(--text-main)', lineHeight: '1.4' }}>
          Quick Ai Test ("we", "our", or "us") respects your privacy.
        </p>

        <h3 style={{ fontSize: '1.1rem', marginBottom: '0.5rem', color: 'var(--text-main)' }}>1. Information We Collect</h3>
        <p style={{ marginBottom: '0.5rem', fontSize: '0.95rem', color: 'var(--text-muted)' }}>
          Quick Ai Test does not collect, store, or share any personal information.
        </p>
        <ul style={{ marginBottom: '1rem', fontSize: '0.95rem', color: 'var(--text-muted)', paddingLeft: '1.2rem' }}>
          <li>No account registration required</li>
          <li>No personal data collected</li>
          <li>No analytics tracking</li>
          <li>No advertisements</li>
          <li>No background data collection</li>
        </ul>

        <h3 style={{ fontSize: '1.1rem', marginBottom: '0.5rem', color: 'var(--text-main)' }}>2. Internet Usage</h3>
        <p style={{ marginBottom: '1rem', fontSize: '0.95rem', color: 'var(--text-muted)' }}>This app works completely offline and does not require an internet connection.</p>

        <h3 style={{ fontSize: '1.1rem', marginBottom: '0.5rem', color: 'var(--text-main)' }}>3. Data Storage</h3>
        <p style={{ marginBottom: '1rem', fontSize: '0.95rem', color: 'var(--text-muted)' }}>All app content remains locally on your device. We do not transmit any data to external servers.</p>

        <h3 style={{ fontSize: '1.1rem', marginBottom: '0.5rem', color: 'var(--text-main)' }}>4. Third-Party Services</h3>
        <p style={{ marginBottom: '1rem', fontSize: '0.95rem', color: 'var(--text-muted)' }}>Quick Ai Test does not use any third-party services, advertising networks, or analytics tools.</p>

        <h3 style={{ fontSize: '1.1rem', marginBottom: '0.5rem', color: 'var(--text-main)' }}>5. Children's Privacy</h3>
        <p style={{ marginBottom: '1rem', fontSize: '0.95rem', color: 'var(--text-muted)' }}>Quick Ai Test does not knowingly collect any information from children or any users.</p>

        <h3 style={{ fontSize: '1.1rem', marginBottom: '0.5rem', color: 'var(--text-main)' }}>6. Contact Us</h3>
        <p style={{ marginBottom: '2rem', fontSize: '0.95rem', color: 'var(--text-muted)' }}>
          If you have any questions, contact us at: <br /> 📧 help@quickaitest.in
        </p>

        <button className="btn-primary" onClick={() => setShowAbout(false)} style={{ width: '100%' }}>
          Close
        </button>
      </motion.div>
    </motion.div>
  );

  return (
    <>
      <AnimatePresence mode="wait">
        {gameState === 'start' && renderStartScreen()}
        {gameState === 'quiz' && renderQuizEngine()}
        {gameState === 'result' && renderResultScreen()}
      </AnimatePresence>
      <AnimatePresence>
        {showAbout && renderAboutModal()}
      </AnimatePresence>
    </>
  );
}
