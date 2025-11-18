'use client';

import Link from 'next/link';
import { useRouter } from 'next/navigation';

export default function HelpPage() {
  const router = useRouter();

  const examples = [
    {
      text: 'What is the capital of France?',
      label: 'Question',
      color: 'orange',
      bgColor: 'bg-orange-50',
      borderColor: 'border-orange-200',
      hoverBorder: 'hover:border-orange-400',
      dotColor: 'bg-orange-400',
    },
    {
      text: 'Paris is the capital of France.',
      label: 'True claim',
      color: 'green',
      bgColor: 'bg-green-50',
      borderColor: 'border-green-200',
      hoverBorder: 'hover:border-green-400',
      dotColor: 'bg-green-400',
    },
    {
      text: 'The Earth is flat.',
      label: 'False claim',
      color: 'red',
      bgColor: 'bg-red-50',
      borderColor: 'border-red-200',
      hoverBorder: 'hover:border-red-400',
      dotColor: 'bg-red-400',
    },
  ];

  const moreExamples = [
    { text: 'When was the Eiffel Tower built?', desc: 'Historical question' },
    { text: 'The Great Wall of China is visible from space.', desc: 'Common misconception' },
    { text: '프랑스의 수도가 어디야?', desc: 'Multi-language support' },
  ];

  const handleTryExample = (text: string) => {
    router.push(`/?example=${encodeURIComponent(text)}`);
  };

  return (
    <main id="main-content" className="min-h-screen bg-white py-10 px-4">
      <div className="max-w-6xl mx-auto">
        <header className="mb-12">
          <div className="flex items-center justify-between">
            <h1 className="text-4xl sm:text-5xl font-semibold text-gray-900">
              How it works
            </h1>
            <Link
              href="/"
              className="text-sm text-gray-600 hover:text-gray-900 flex items-center gap-1"
            >
              <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10 19l-7-7m0 0l7-7m-7 7h18" />
              </svg>
              Back
            </Link>
          </div>
        </header>

        <div className="max-w-3xl mx-auto">
          <p className="text-lg text-gray-600 mb-12">
            Ask questions or verify claims — we'll check the facts.
          </p>

          {/* Interactive examples */}
          <section className="mb-12">
            <div className="space-y-4">
              {examples.map((example, idx) => (
                <button
                  key={idx}
                  onClick={() => handleTryExample(example.text)}
                  className="w-full group"
                >
                  <div className={`p-6 border-2 ${example.borderColor} ${example.bgColor} rounded-lg ${example.hoverBorder} transition-all`}>
                    <div className="flex items-start justify-between gap-4">
                      <div className="flex-1 text-left">
                        <div className="flex items-center gap-3 mb-2">
                          <span className={`inline-block w-3 h-3 ${example.dotColor} rounded-full`}></span>
                          <h3 className="font-semibold text-gray-900">{example.label}</h3>
                        </div>
                        <p className="text-gray-700 mb-2">{example.text}</p>
                        <p className="text-sm text-gray-600">Click to try →</p>
                      </div>
                    </div>
                  </div>
                </button>
              ))}
            </div>
          </section>

          {/* More examples */}
          <section className="mb-12">
            <h2 className="text-xl font-semibold text-gray-900 mb-4">More examples</h2>
            <div className="space-y-3">
              {moreExamples.map((example, idx) => (
                <button
                  key={idx}
                  onClick={() => handleTryExample(example.text)}
                  className="w-full p-4 text-left border border-gray-200 rounded-lg hover:border-gray-400 hover:bg-gray-50 transition-all"
                >
                  <p className="text-gray-900 mb-1">{example.text}</p>
                  <p className="text-sm text-gray-500">{example.desc}</p>
                </button>
              ))}
            </div>
          </section>

          {/* Tips */}
          <section className="p-6 bg-gray-50 rounded-lg border border-gray-200">
            <h2 className="text-sm font-semibold text-gray-900 mb-3">Tips</h2>
            <ul className="space-y-2 text-sm text-gray-700">
              <li>• Click highlighted text to see sources</li>
              <li>• Use <kbd className="px-1.5 py-0.5 text-xs bg-white border border-gray-300 rounded">⌘+Enter</kbd> to submit</li>
              <li>• Works in any language</li>
            </ul>
          </section>
        </div>
      </div>
    </main>
  );
}
