'use client';

import Link from 'next/link';
import { useLanguage } from '../contexts/LanguageContext';

export default function AboutPage() {
  const { t, language } = useLanguage();

  return (
    <main className="min-h-screen bg-white py-10 px-4">
      <div className="max-w-6xl mx-auto">
        {/* Header */}
        <header className="mb-12">
          <div className="flex items-center justify-between">
            <h1 className="text-3xl sm:text-4xl font-semibold text-gray-900 min-h-[2.5rem] sm:min-h-[3rem] flex items-center">
              {language === 'ko' ? '소개' : 'About'}
            </h1>
            <Link
              href="/"
              className="text-sm text-gray-600 hover:text-gray-900 flex items-center gap-1"
            >
              <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10 19l-7-7m0 0l7-7m-7 7h18" />
              </svg>
              {t('back')}
            </Link>
          </div>
        </header>

        {/* Content */}
        <div className="max-w-3xl mx-auto">
        <div className="prose prose-gray max-w-none">
          {language === 'ko' ? (
            <>
              <p className="text-base text-gray-700 mb-8">
                AI 기술을 활용한 실시간 정보 검증 서비스입니다.
              </p>

              <p className="text-base text-gray-700 mb-6">
                입력한 텍스트나 질문에 대해 자동으로 웹 검색을 수행하고, 신뢰할 수 있는 출처를 기반으로 정확성을 검증합니다.
              </p>

              <p className="text-base text-gray-700 mb-8">
                "어린 학생이나 연세가 있는 분들이 LLM을 편하게 쓸 수 있게 할 수 있는 방법이 없을까?"에서 출발한 서비스입니다.
              </p>

              <h2 className="text-xl font-bold text-gray-900 mb-4 mt-8">주요 기능</h2>
              <ul className="space-y-3 mb-8">
                <li className="flex items-start">
                  <span className="text-gray-400 mr-3">•</span>
                  <span className="text-base text-gray-700">
                    실시간 검증 및 결과 제공
                  </span>
                </li>
                <li className="flex items-start">
                  <span className="text-gray-400 mr-3">•</span>
                  <span className="text-base text-gray-700">
                    신뢰할 수 있는 출처 기반 정보 검증
                  </span>
                </li>
                <li className="flex items-start">
                  <span className="text-gray-400 mr-3">•</span>
                  <span className="text-base text-gray-700">
                    다국어 지원 (한국어, 영어)
                  </span>
                </li>
                <li className="flex items-start">
                  <span className="text-gray-400 mr-3">•</span>
                  <span className="text-base text-gray-700">
                    간편한 사용자 인터페이스
                  </span>
                </li>
              </ul>

              <h2 className="text-xl font-bold text-gray-900 mb-4 mt-8">사용 방법</h2>
              <ol className="space-y-3 mb-4 list-decimal list-inside">
                <li className="text-base text-gray-700">확인하고 싶은 텍스트나 질문 입력</li>
                <li className="text-base text-gray-700">'확인' 버튼 클릭</li>
                <li className="text-base text-gray-700">AI가 자동으로 웹 검색 및 검증</li>
                <li className="text-base text-gray-700">하이라이트된 텍스트 클릭해서 출처 확인</li>
              </ol>
              <p className="text-sm text-gray-600 mb-8">
                <Link href="/help" className="text-blue-600 hover:underline">
                  더 자세한 사용법 보기 →
                </Link>
              </p>

              <div className="mt-12 pt-8 border-t border-gray-200">
                <p className="text-gray-600 text-sm text-center">
                  감사합니다.
                </p>
              </div>
            </>
          ) : (
            <>
              <p className="text-base text-gray-700 mb-8">
                Real-time information verification service powered by AI technology.
              </p>

              <p className="text-base text-gray-700 mb-6">
                Automatically searches the web and verifies accuracy based on reliable sources for any text or question you enter.
              </p>

              <p className="text-base text-gray-700 mb-8">
                This service was created to answer the question: "How can we make AI accessible for students and elderly people?"
              </p>

              <h2 className="text-xl font-bold text-gray-900 mb-4 mt-8">Key Features</h2>
              <ul className="space-y-3 mb-8">
                <li className="flex items-start">
                  <span className="text-gray-400 mr-3">•</span>
                  <span className="text-base text-gray-700">
                    Real-time verification and results
                  </span>
                </li>
                <li className="flex items-start">
                  <span className="text-gray-400 mr-3">•</span>
                  <span className="text-base text-gray-700">
                    Source-based information verification
                  </span>
                </li>
                <li className="flex items-start">
                  <span className="text-gray-400 mr-3">•</span>
                  <span className="text-base text-gray-700">
                    Multi-language support (Korean, English)
                  </span>
                </li>
                <li className="flex items-start">
                  <span className="text-gray-400 mr-3">•</span>
                  <span className="text-base text-gray-700">
                    Simple and intuitive interface
                  </span>
                </li>
              </ul>

              <h2 className="text-xl font-bold text-gray-900 mb-4 mt-8">How to Use</h2>
              <ol className="space-y-3 mb-4 list-decimal list-inside">
                <li className="text-base text-gray-700">Enter the text or question you want to verify</li>
                <li className="text-base text-gray-700">Click the 'Check' button</li>
                <li className="text-base text-gray-700">AI automatically searches the web and verifies</li>
                <li className="text-base text-gray-700">Click highlighted text to see sources</li>
              </ol>
              <p className="text-sm text-gray-600 mb-8">
                <Link href="/help" className="text-blue-600 hover:underline">
                  View detailed guide →
                </Link>
              </p>

              <div className="mt-12 pt-8 border-t border-gray-200">
                <p className="text-gray-600 text-sm text-center">
                  Thank you.
                </p>
              </div>
            </>
          )}
        </div>

        {/* CTA Button */}
        <div className="mt-12 text-center">
          <Link
            href="/"
            className="inline-flex items-center px-4 py-2 text-sm bg-black text-white rounded-md hover:bg-gray-800 transition-colors"
          >
            {language === 'ko' ? '지금 시작하기' : 'Try Now'}
            <svg className="w-4 h-4 ml-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
            </svg>
          </Link>
        </div>
        </div>
      </div>
    </main>
  );
}
