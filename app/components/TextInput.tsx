'use client';

import { useState } from 'react';

interface TextInputProps {
  onCheckFacts: (text: string) => void;
  isLoading: boolean;
}

const MAX_CHARACTERS = 1000;

export default function TextInput({ onCheckFacts, isLoading }: TextInputProps) {
  const [text, setText] = useState('');

  const handleSubmit = () => {
    if (text.trim() && text.length <= MAX_CHARACTERS) {
      onCheckFacts(text);
    }
  };

  const isOverLimit = text.length > MAX_CHARACTERS;

  return (
    <div className="w-full space-y-3">
      <div>
        <textarea
          id="text-input"
          value={text}
          onChange={(e) => setText(e.target.value)}
          placeholder="Paste your text here..."
          className="w-full h-64 px-4 py-3 border border-gray-300 rounded focus:outline-none focus:border-black resize-none text-base"
          disabled={isLoading}
          maxLength={MAX_CHARACTERS + 100}
        />
      </div>
      <div className="flex items-center justify-between">
        <p className={`text-sm ${isOverLimit ? 'text-black font-medium' : 'text-gray-500'}`}>
          {text.length} / {MAX_CHARACTERS.toLocaleString()} characters
        </p>
        <button
          onClick={handleSubmit}
          disabled={!text.trim() || isLoading || isOverLimit}
          className="px-4 py-2 bg-black text-white text-sm rounded hover:bg-gray-800 disabled:bg-gray-300 disabled:cursor-not-allowed"
        >
          {isLoading ? 'Checking...' : 'Check'}
        </button>
      </div>
      {isOverLimit && (
        <p className="text-sm text-gray-600">
          Text is too long. Please reduce by {text.length - MAX_CHARACTERS} characters.
        </p>
      )}
    </div>
  );
}
