'use client';

import { FormEvent, KeyboardEvent, useState } from 'react';
import { useLanguage } from '../contexts/LanguageContext';

interface TextInputProps {
  onCheckFacts: (text: string) => void;
  isLoading: boolean;
  text?: string;
  onTextChange?: (text: string) => void;
  dreamMode?: boolean;
  onDreamModeChange?: (enabled: boolean) => void;
}

const MAX_CHARACTERS = 1000;

export default function TextInput({ onCheckFacts, isLoading, text: controlledText, onTextChange, dreamMode = false, onDreamModeChange }: TextInputProps) {
  const { t } = useLanguage();
  const [internalText, setInternalText] = useState('');
  const text = controlledText !== undefined ? controlledText : internalText;
  const setText = onTextChange || setInternalText;
  const handleSubmit = (event?: FormEvent) => {
    event?.preventDefault();
    if (text.trim() && text.length <= MAX_CHARACTERS) {
      onCheckFacts(text);
    }
  };

  const handleKeyDown = (event: KeyboardEvent<HTMLTextAreaElement>) => {
    if (event.key === 'Enter' && (event.metaKey || event.ctrlKey)) {
      event.preventDefault();
      handleSubmit();
    }
  };

  const isOverLimit = text.length > MAX_CHARACTERS;

  return (
    <form onSubmit={handleSubmit} className="w-full space-y-3">
      <label htmlFor="text-input" className="sr-only">
        {t('checkWithMe')}
      </label>
      <textarea
        id="text-input"
        value={text}
        onChange={(e) => setText(e.target.value)}
        onKeyDown={handleKeyDown}
        placeholder={t('placeholder')}
        className="w-full h-56 border border-black/10 rounded-md px-4 py-3 text-base text-gray-900 placeholder:text-gray-400 focus:outline-none focus:border-black"
        disabled={isLoading}
        maxLength={MAX_CHARACTERS + 100}
        aria-describedby="character-count"
      />

      {/* Dream Mode Toggle */}
      {onDreamModeChange && (
        <div className="flex items-center gap-3 py-2 px-3 border border-gray-200 rounded-md bg-gray-50">
          <div className="flex items-center gap-2">
            <span className="text-sm text-gray-700">💭 {t('dreamMode')}</span>
            <button
              type="button"
              onClick={() => onDreamModeChange(!dreamMode)}
              disabled={isLoading}
              className={`px-3 py-1 text-xs font-medium rounded transition-colors ${
                dreamMode
                  ? 'bg-purple-600 text-white hover:bg-purple-700'
                  : 'bg-gray-300 text-gray-700 hover:bg-gray-400'
              } disabled:opacity-50 disabled:cursor-not-allowed`}
              aria-label={t('dreamModeToggle')}
            >
              {dreamMode ? t('dreamModeOn') : t('dreamModeOff')}
            </button>
          </div>
          <p className="text-xs text-gray-600 flex-1">
            {t('dreamModeHelper')}
          </p>
        </div>
      )}

      <div className="flex flex-wrap items-center gap-3">
        <p
          id="character-count"
          className={`text-xs ${isOverLimit ? 'text-red-600' : 'text-gray-600'}`}
          aria-live="polite"
        >
          {text.length.toLocaleString()} / {MAX_CHARACTERS.toLocaleString()} {t('characters')}
        </p>
        <div className="flex gap-2 ml-auto">
          {text && (
            <button
              type="button"
              onClick={() => setText('')}
              className="px-3 py-1.5 text-sm border border-gray-300 rounded-md text-gray-700 hover:bg-gray-100"
            >
              {t('clear')}
            </button>
          )}
          <button
            type="submit"
            disabled={!text.trim() || isLoading || isOverLimit}
            className="inline-flex items-center justify-center gap-2 px-4 py-2 bg-black text-white text-sm font-medium rounded hover:bg-gray-900 focus:outline-none disabled:bg-gray-300 disabled:text-gray-600 disabled:cursor-not-allowed"
          >
            {isLoading ? (
              t('checking')
            ) : (
              <>
                <span>{t('check')}</span>
                <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
                </svg>
              </>
            )}
          </button>
        </div>
      </div>

      {isOverLimit && (
        <p className="text-xs text-gray-600">
          {t('textTooLong')} {(text.length - MAX_CHARACTERS).toLocaleString()} {t('characters')}.
        </p>
      )}
    </form>
  );
}
