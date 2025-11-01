'use client';

import { useState } from 'react';

interface TextInputProps {
  onCheckFacts: (text: string) => void;
  isLoading: boolean;
}

export default function TextInput({ onCheckFacts, isLoading }: TextInputProps) {
  const [text, setText] = useState('');

  const handleSubmit = () => {
    if (text.trim()) {
      onCheckFacts(text);
    }
  };

  return (
    <div className="w-full max-w-4xl mx-auto space-y-4">
      <div>
        <label htmlFor="text-input" className="block text-sm font-medium text-gray-700 mb-2">
          Enter text to fact-check
        </label>
        <textarea
          id="text-input"
          value={text}
          onChange={(e) => setText(e.target.value)}
          placeholder="Paste or type text here to check for factual accuracy..."
          className="w-full h-64 px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent resize-none"
          disabled={isLoading}
        />
      </div>
      <div className="flex items-center justify-between">
        <p className="text-sm text-gray-500">
          {text.length} / 10,000 characters
        </p>
        <button
          onClick={handleSubmit}
          disabled={!text.trim() || isLoading}
          className="px-6 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 disabled:bg-gray-400 disabled:cursor-not-allowed transition-colors"
        >
          {isLoading ? 'Checking...' : 'Check Facts'}
        </button>
      </div>
    </div>
  );
}
