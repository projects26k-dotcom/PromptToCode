import React, { useState } from 'react';
import {
  HelpCircle,
  Sparkles,
  CheckCircle2,
  XCircle,
  RotateCcw,
  ArrowRight,
  Trophy,
  Loader2,
  X
} from 'lucide-react';
import { useSettingsStore } from '../store/useSettingsStore';
import { useProjectStore } from '../store/useProjectStore';
import { generateQuiz } from '../lib/ai/quizPrompt';

export default function QuizCard({ explanations = [], messageId }) {
  const { geminiKey, selectedModel, learnLevel, openSettings } = useSettingsStore();
  const { files } = useProjectStore();

  const [isOpen, setIsOpen] = useState(false);
  const [loading, setLoading] = useState(false);
  const [questions, setQuestions] = useState([]);
  const [error, setError] = useState(null);

  const [currentIndex, setCurrentIndex] = useState(0);
  const [selectedOption, setSelectedOption] = useState(null); // Selected answerIndex for current question
  const [userAnswers, setUserAnswers] = useState([]); // [{ questionIndex, selectedOption, isCorrect }]
  const [quizFinished, setQuizFinished] = useState(false);

  const handleStartQuiz = async () => {
    if (!geminiKey) {
      openSettings();
      return;
    }

    setIsOpen(true);
    setLoading(true);
    setError(null);
    setCurrentIndex(0);
    setSelectedOption(null);
    setUserAnswers([]);
    setQuizFinished(false);

    try {
      const generated = await generateQuiz({
        apiKey: geminiKey,
        model: selectedModel,
        explanations,
        files,
        level: learnLevel,
      });

      setQuestions(generated);
    } catch (err) {
      setError(err.message || 'Failed to generate quiz. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  const handleSelectOption = (optionIdx) => {
    if (selectedOption !== null) return; // Already answered this question
    setSelectedOption(optionIdx);

    const currentQ = questions[currentIndex];
    const isCorrect = optionIdx === currentQ.answerIndex;

    setUserAnswers((prev) => [
      ...prev,
      {
        questionIndex: currentIndex,
        selectedOption: optionIdx,
        isCorrect,
      },
    ]);
  };

  const handleNext = () => {
    if (currentIndex < questions.length - 1) {
      setCurrentIndex((prev) => prev + 1);
      setSelectedOption(null);
    } else {
      setQuizFinished(true);
    }
  };

  const currentQ = questions[currentIndex];
  const score = userAnswers.filter((a) => a.isCorrect).length;

  if (!isOpen) {
    return (
      <div className="pt-1">
        <button
          type="button"
          onClick={handleStartQuiz}
          className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-amber-950/60 hover:bg-amber-900/80 border border-amber-500/40 hover:border-amber-400 text-amber-200 text-xs font-semibold shadow-xs transition-all cursor-pointer group"
          title="Test your understanding with 3 quick questions"
        >
          <HelpCircle className="w-3.5 h-3.5 text-amber-400 group-hover:rotate-12 transition-transform" />
          <span>Quiz me (3 questions)</span>
        </button>
      </div>
    );
  }

  return (
    <div className="w-full rounded-2xl bg-slate-950 border border-amber-500/40 p-4 shadow-xl text-xs space-y-3 animate-in fade-in duration-200">
      {/* Quiz Header */}
      <div className="flex items-center justify-between border-b border-slate-800 pb-2.5">
        <div className="flex items-center gap-2">
          <div className="p-1.5 rounded-lg bg-amber-500/20 text-amber-300">
            <Sparkles className="w-3.5 h-3.5 text-amber-400" />
          </div>
          <div>
            <h4 className="font-semibold text-slate-100 text-xs">Knowledge Check</h4>
            <p className="text-[10px] text-slate-400">
              {quizFinished
                ? 'Quiz Completed!'
                : `Question ${currentIndex + 1} of ${questions.length || 3}`}
            </p>
          </div>
        </div>

        <button
          type="button"
          onClick={() => setIsOpen(false)}
          className="p-1 rounded-lg text-slate-400 hover:text-white hover:bg-slate-800 transition-colors cursor-pointer"
          title="Close Quiz"
        >
          <X className="w-4 h-4" />
        </button>
      </div>

      {/* Loading State */}
      {loading && (
        <div className="py-8 flex flex-col items-center justify-center gap-2 text-center text-slate-400">
          <Loader2 className="w-6 h-6 animate-spin text-amber-400" />
          <p className="text-xs font-medium text-slate-300">Forging 3 questions from your code...</p>
          <p className="text-[11px] text-slate-500">Analyzing concepts and structure</p>
        </div>
      )}

      {/* Error State */}
      {error && !loading && (
        <div className="py-4 space-y-3 text-center">
          <div className="p-3 rounded-xl bg-rose-950/60 border border-rose-800/60 text-rose-300 text-xs">
            {error}
          </div>
          <button
            type="button"
            onClick={handleStartQuiz}
            className="flex items-center gap-1.5 px-3 py-1.5 mx-auto rounded-xl bg-amber-600 hover:bg-amber-500 text-white font-medium text-xs transition-colors cursor-pointer"
          >
            <RotateCcw className="w-3.5 h-3.5" />
            <span>Retry Quiz</span>
          </button>
        </div>
      )}

      {/* Question Active State */}
      {!loading && !error && !quizFinished && currentQ && (
        <div className="space-y-3">
          {/* Question Text */}
          <p className="font-medium text-slate-200 text-[13px] leading-snug">
            {currentQ.question}
          </p>

          {/* Options Grid */}
          <div className="space-y-1.5">
            {currentQ.options.map((option, idx) => {
              const isSelected = selectedOption === idx;
              const isCorrectAnswer = idx === currentQ.answerIndex;
              const hasAnswered = selectedOption !== null;

              let btnStyle = 'bg-slate-900 border-slate-800 text-slate-300 hover:border-amber-500/50 hover:bg-slate-850';

              if (hasAnswered) {
                if (isCorrectAnswer) {
                  btnStyle = 'bg-emerald-950/80 border-emerald-500/60 text-emerald-200 ring-1 ring-emerald-500/30';
                } else if (isSelected && !isCorrectAnswer) {
                  btnStyle = 'bg-rose-950/80 border-rose-500/60 text-rose-200 ring-1 ring-rose-500/30';
                } else {
                  btnStyle = 'bg-slate-900/50 border-slate-850 text-slate-500 opacity-60';
                }
              }

              return (
                <button
                  key={idx}
                  type="button"
                  onClick={() => handleSelectOption(idx)}
                  disabled={hasAnswered}
                  className={`w-full flex items-start gap-2.5 p-2.5 rounded-xl border text-left transition-all ${btnStyle} cursor-pointer disabled:cursor-default`}
                >
                  <span className="w-5 h-5 rounded-lg bg-slate-800 border border-slate-700/60 flex items-center justify-center font-mono text-[10px] font-bold text-slate-300 shrink-0 mt-0.5">
                    {String.fromCharCode(65 + idx)}
                  </span>
                  <span className="flex-1 text-xs leading-normal">{option}</span>
                  {hasAnswered && isCorrectAnswer && (
                    <CheckCircle2 className="w-4 h-4 text-emerald-400 shrink-0 mt-0.5" />
                  )}
                  {hasAnswered && isSelected && !isCorrectAnswer && (
                    <XCircle className="w-4 h-4 text-rose-400 shrink-0 mt-0.5" />
                  )}
                </button>
              );
            })}
          </div>

          {/* Explanation Feedback Banner */}
          {selectedOption !== null && (
            <div className="p-3 rounded-xl bg-slate-900/90 border border-slate-800 space-y-1 animate-in fade-in duration-150">
              <div className="flex items-center gap-1.5 font-semibold text-[11px]">
                {selectedOption === currentQ.answerIndex ? (
                  <span className="text-emerald-400 flex items-center gap-1">
                    <CheckCircle2 className="w-3.5 h-3.5" /> Correct!
                  </span>
                ) : (
                  <span className="text-rose-400 flex items-center gap-1">
                    <XCircle className="w-3.5 h-3.5" /> Not quite
                  </span>
                )}
              </div>
              <p className="text-[11px] text-slate-300 leading-relaxed">
                {currentQ.explanation}
              </p>
            </div>
          )}

          {/* Next Button */}
          {selectedOption !== null && (
            <div className="flex justify-end pt-1">
              <button
                type="button"
                onClick={handleNext}
                className="flex items-center gap-1.5 px-4 py-2 rounded-xl bg-amber-600 hover:bg-amber-500 text-white font-semibold text-xs transition-all shadow-xs cursor-pointer"
              >
                <span>{currentIndex < questions.length - 1 ? 'Next Question' : 'View Results'}</span>
                <ArrowRight className="w-3.5 h-3.5" />
              </button>
            </div>
          )}
        </div>
      )}

      {/* Finished State / Scorecard */}
      {!loading && !error && quizFinished && (
        <div className="py-4 text-center space-y-3">
          <div className="w-12 h-12 rounded-2xl bg-amber-500/20 border border-amber-500/40 flex items-center justify-center mx-auto text-amber-400 shadow-lg shadow-amber-500/10">
            <Trophy className="w-6 h-6" />
          </div>

          <div>
            <h3 className="text-sm font-bold text-white">Quiz Completed!</h3>
            <p className="text-xs text-slate-300 font-mono mt-0.5">
              Score: <strong className="text-amber-400 text-sm">{score}</strong> / {questions.length}
            </p>
            <p className="text-[11px] text-slate-400 mt-1">
              {score === questions.length
                ? '🌟 Perfect score! You mastered this concept.'
                : score >= 2
                ? '👍 Great job! You have a solid grasp of this code.'
                : '💡 Keep practicing! Review the explanation cards above.'}
            </p>
          </div>

          <div className="flex items-center justify-center gap-2 pt-2">
            <button
              type="button"
              onClick={handleStartQuiz}
              className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-200 text-xs font-medium transition-colors cursor-pointer"
            >
              <RotateCcw className="w-3 h-3" />
              <span>Try New Questions</span>
            </button>
            <button
              type="button"
              onClick={() => setIsOpen(false)}
              className="px-3 py-1.5 rounded-xl bg-amber-600 hover:bg-amber-500 text-white text-xs font-semibold transition-colors cursor-pointer"
            >
              Done
            </button>
          </div>
        </div>
      )}
    </div>
  );
}
