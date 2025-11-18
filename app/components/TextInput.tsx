'use client';

import { FormEvent, KeyboardEvent, useState } from 'react';

interface TextInputProps {
  onCheckFacts: (text: string) => void;
  isLoading: boolean;
  text?: string;
  onTextChange?: (text: string) => void;
}

const MAX_CHARACTERS = 1000;

export default function TextInput({ onCheckFacts, isLoading, text: controlledText, onTextChange }: TextInputProps) {
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
        Check with me
      </label>
      <textarea
        id="text-input"
        value={text}
        onChange={(e) => setText(e.target.value)}
        onKeyDown={handleKeyDown}
        placeholder="Paste text or ask a question…"
        className="w-full h-56 border border-black/10 rounded-md px-4 py-3 text-base text-gray-900 placeholder:text-gray-400 focus:outline-none focus:border-black"
        disabled={isLoading}
        maxLength={MAX_CHARACTERS + 100}
        aria-describedby="character-count"
      />

      <div className="flex flex-wrap items-center gap-3">
        <p
          id="character-count"
          className={`text-xs ${isOverLimit ? 'text-red-600' : 'text-gray-600'}`}
          aria-live="polite"
        >
          {text.length.toLocaleString()} / {MAX_CHARACTERS.toLocaleString()} characters
        </p>
        <div className="flex gap-2 ml-auto">
          {text && (
            <button
              type="button"
              onClick={() => setText('')}
              className="px-3 py-1.5 text-sm border border-gray-300 rounded-md text-gray-700 hover:bg-gray-100"
            >
              Clear
            </button>
          )}
          <button
            type="submit"
            disabled={!text.trim() || isLoading || isOverLimit}
            className="inline-flex items-center justify-center gap-2 px-4 py-2 bg-black text-white text-sm font-medium rounded hover:bg-gray-900 focus:outline-none disabled:bg-gray-300 disabled:text-gray-600 disabled:cursor-not-allowed"
          >
            {isLoading ? (
              'Checking…'
            ) : (
              <>
                <span>Check</span>
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
          Text is too long. Reduce by {(text.length - MAX_CHARACTERS).toLocaleString()} characters.
        </p>
      )}
    </form>
  );
}
