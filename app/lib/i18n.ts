export type Language = 'en' | 'ko';

export const translations = {
  en: {
    // Header
    help: 'Help',
    back: 'Back',

    // Main page
    checkWithMe: 'Check with me.',

    // Text Input
    placeholder: 'Paste text or ask a question…',
    clear: 'Clear',
    check: 'Check',
    checking: 'Checking…',
    characters: 'characters',
    textTooLong: 'Text is too long. Reduce by',

    // Help page
    howItWorks: 'How it works',
    helpSubtitle: 'Ask questions or verify claims.',
    question: 'Question',
    trueClaim: 'True claim',
    falseClaim: 'False claim',
    clickToTry: 'Click to try →',
    moreExamples: 'More examples',
    tips: 'Tips',
    tipClickHighlight: 'Click highlighted text to see sources',
    tipKeyboard: 'Use',
    tipKeyboardSubmit: 'to submit',
    tipMultiLanguage: 'Works in any language',

    // Examples
    exampleQuestion1: 'What is the capital of France?',
    exampleClaim1: 'Paris is the capital of France.',
    exampleClaim2: 'The Earth is flat.',
    exampleQuestion2: 'When was the Eiffel Tower built?',
    exampleClaim3: 'The Great Wall of China is visible from space.',
    exampleMultiLang: '프랑스의 수도가 어디야?',
    descHistorical: 'Historical question',
    descMisconception: 'Common misconception',
    descMultiLanguage: 'Multi-language support',

    // Result colors/labels
    questionAnswer: 'Question',
    verifiedAccurate: 'Verified as Accurate',
    flaggedInaccurate: 'Flagged as Inaccurate',
    verificationError: 'Verification Error',
    generatedAnswer: 'Verified answer to your question',
    confirmedSources: 'Confirmed by multiple reliable sources',
    contradictedSources: 'Contradicted by evidence from sources',
    couldNotVerify: 'Could not complete verification (retryable)',

    // Progress messages
    initializing: 'Initializing fact-check...',
    screening: 'Extracting verifiable claims...',
    claimsIdentified: 'Claims identified',
    searching: 'Searching for evidence...',
    verifying: 'Verifying claims...',
    complete: 'Verification complete!',
    generatingAnswer: 'Generating answer to question...',
    answeringQuestion: 'Answering question...',

    // Share & Actions
    share: 'Share',
    shareSuccess: 'Link copied!',
    retry: 'Retry',
    close: 'Close',
    sources: 'Sources',
    viewingShared: 'Viewing shared result',

    // Errors
    verificationFailed: 'Verification failed',
    failedToLoad: 'Failed to load shared result',
    errorOccurred: 'An error occurred',
    retryFactCheck: 'Retry fact-check',
    closeError: 'Close error message',

    // Empty state
    noVerificationResults: 'I tried my best to verify this, but couldn\'t find enough reliable sources with consistent information.',
    noVerificationExplanation: 'The claim might be too subjective, context-dependent, or there may not be enough authoritative sources available online yet.',
  },
  ko: {
    // Header
    help: '도움말',
    back: '뒤로',

    // Main page
    checkWithMe: '확인해 보세요.',

    // Text Input
    placeholder: '텍스트를 붙여넣거나 질문하세요…',
    clear: '지우기',
    check: '확인',
    checking: '확인 중…',
    characters: '자',
    textTooLong: '텍스트가 너무 깁니다.',

    // Help page
    howItWorks: '사용 방법',
    helpSubtitle: '질문하거나 주장을 확인해 보세요.',
    question: '질문',
    trueClaim: '사실',
    falseClaim: '거짓',
    clickToTry: '클릭하여 시도 →',
    moreExamples: '더 많은 예시',
    tips: '팁',
    tipClickHighlight: '강조된 텍스트를 클릭하여 출처 보기',
    tipKeyboard: '사용',
    tipKeyboardSubmit: '제출하기',
    tipMultiLanguage: '모든 언어 지원',

    // Examples
    exampleQuestion1: '프랑스의 수도는 어디인가요?',
    exampleClaim1: '파리는 프랑스의 수도입니다.',
    exampleClaim2: '지구는 평평하다.',
    exampleQuestion2: '에펠탑은 언제 건설되었나요?',
    exampleClaim3: '만리장성은 우주에서 볼 수 있다.',
    exampleMultiLang: 'What is the capital of France?',
    descHistorical: '역사적 질문',
    descMisconception: '일반적인 오해',
    descMultiLanguage: '다국어 지원',

    // Result colors/labels
    questionAnswer: '질문',
    verifiedAccurate: '정확함',
    flaggedInaccurate: '부정확함',
    verificationError: '확인 오류',
    generatedAnswer: '질문에 대한 검증된 답변',
    confirmedSources: '여러 신뢰할 수 있는 출처에서 확인됨',
    contradictedSources: '출처의 증거와 모순됨',
    couldNotVerify: '확인을 완료할 수 없음 (재시도 가능)',

    // Progress messages
    initializing: '팩트 체크 초기화 중...',
    screening: '확인 가능한 주장 추출 중...',
    claimsIdentified: '주장 식별됨',
    searching: '증거 검색 중...',
    verifying: '주장 확인 중...',
    complete: '확인 완료!',
    generatingAnswer: '질문에 대한 답변 생성 중...',
    answeringQuestion: '질문에 답하는 중...',

    // Share & Actions
    share: '공유',
    shareSuccess: '링크 복사됨!',
    retry: '재시도',
    close: '닫기',
    sources: '출처',
    viewingShared: '공유된 결과 보기',

    // Errors
    verificationFailed: '확인 실패',
    failedToLoad: '공유 결과를 불러오지 못했습니다',
    errorOccurred: '오류가 발생했습니다',
    retryFactCheck: '팩트 체크 재시도',
    closeError: '오류 메시지 닫기',

    // Empty state
    noVerificationResults: '최선을 다해 확인했지만, 일관된 정보를 가진 충분히 신뢰할 수 있는 출처를 찾을 수 없었습니다.',
    noVerificationExplanation: '주장이 너무 주관적이거나 맥락에 따라 달라지거나, 아직 온라인에서 검증된 출처를 찾을 수 없을 수 있습니다.',
  },
};

export function getTranslation(language: Language, key: keyof typeof translations.en): string {
  const translation = translations[language][key];

  // Fallback to English if translation is missing
  if (translation === undefined || translation === '') {
    console.warn(`Missing translation for key "${key}" in language "${language}", falling back to English`);
    return translations.en[key];
  }

  return translation;
}
