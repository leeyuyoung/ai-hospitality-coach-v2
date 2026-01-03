import { useState, useEffect, useRef } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { DiagnosisData, ChatMessage as ChatMessageType, ChatOption } from '@/types/diagnosis';
import { requiredQuestions, optionalQuestions } from '@/data/chatQuestions';
import { ChevronRight, SkipForward, Building2, Send, Image, X, ArrowLeft, RotateCcw } from 'lucide-react';
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from '@/components/ui/alert-dialog';

interface ChatbotScreenProps {
  diagnosisData: DiagnosisData;
  onUpdateData: (field: string, value: string | boolean) => void;
  onComplete: () => void;
  onBack: () => void;
}

const ChatbotScreen = ({ diagnosisData, onUpdateData, onComplete, onBack }: ChatbotScreenProps) => {
  const [messages, setMessages] = useState<ChatMessageType[]>([]);
  const [currentQuestionIndex, setCurrentQuestionIndex] = useState(0);
  const [isOptionalPhase, setIsOptionalPhase] = useState(false);
  const [isTyping, setIsTyping] = useState(false);
  const [showOptions, setShowOptions] = useState(false);
  const [questionHistory, setQuestionHistory] = useState<{ index: number; isOptional: boolean }[]>([]);
  const [showBackConfirm, setShowBackConfirm] = useState(false);
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const hasInitialized = useRef(false);

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  };

  useEffect(() => {
    scrollToBottom();
  }, [messages, showOptions]);

  useEffect(() => {
    if (!hasInitialized.current) {
      hasInitialized.current = true;
      // Show welcome message first
      setIsTyping(true);
      setTimeout(() => {
        setMessages([requiredQuestions[0]]);
        setIsTyping(false);
        // Then show first question after a delay
        setTimeout(() => {
          showNextQuestion(1);
        }, 1000);
      }, 500);
    }
  }, []);

  const showNextQuestion = (index: number) => {
    const questions = isOptionalPhase ? optionalQuestions : requiredQuestions;
    
    if (index >= questions.length) {
      if (!isOptionalPhase) {
        // Move to optional phase
        setIsOptionalPhase(true);
        setCurrentQuestionIndex(0);
        showOptionalIntro();
      } else {
        onComplete();
      }
      return;
    }

    setShowOptions(false);
    setIsTyping(true);
    
    setTimeout(() => {
      setMessages(prev => [...prev, questions[index]]);
      setCurrentQuestionIndex(index);
      setIsTyping(false);
      
      // Show options after message appears
      setTimeout(() => {
        setShowOptions(true);
      }, 300);
    }, 800);
  };

  const showOptionalIntro = () => {
    setShowOptions(false);
    setIsTyping(true);
    setTimeout(() => {
      setMessages(prev => [...prev, optionalQuestions[0]]);
      setCurrentQuestionIndex(0);
      setIsTyping(false);
      setTimeout(() => {
        setShowOptions(true);
      }, 300);
    }, 800);
  };

  const handleOptionSelect = (option: ChatOption, field?: string) => {
    setShowOptions(false);
    
    // Handle custom text input trigger
    if (option.value === 'custom') {
      return; // Will be handled by text input UI
    }
    
    // Add user response
    const userMessage: ChatMessageType = {
      id: `user-${Date.now()}`,
      type: 'user',
      content: option.label,
    };
    setMessages(prev => [...prev, userMessage]);

    // Save to history for back navigation
    setQuestionHistory(prev => [...prev, { index: currentQuestionIndex, isOptional: isOptionalPhase }]);

    // Handle special cases
    if (field === 'continueOptional') {
      if (option.value === 'no') {
        setTimeout(() => onComplete(), 500);
        return;
      } else {
        setTimeout(() => showNextQuestion(1), 500);
        return;
      }
    }

    // Update data
    if (field) {
      onUpdateData(field, option.value);
    }

    // Show next question
    setTimeout(() => showNextQuestion(currentQuestionIndex + 1), 500);
  };

  const handleTextSubmit = (text: string, imageUrl?: string) => {
    setShowOptions(false);
    
    const displayContent = imageUrl ? `${text || ''}\n[이미지 첨부됨]` : text;
    const userMessage: ChatMessageType = {
      id: `user-${Date.now()}`,
      type: 'user',
      content: displayContent.trim() || '입력 완료',
    };
    setMessages(prev => [...prev, userMessage]);

    // Save to history for back navigation
    setQuestionHistory(prev => [...prev, { index: currentQuestionIndex, isOptional: isOptionalPhase }]);

    // Update data
    if (currentQuestion?.field) {
      onUpdateData(currentQuestion.field, text || (imageUrl ? '[이미지 첨부]' : ''));
    }

    // Show next question
    setTimeout(() => showNextQuestion(currentQuestionIndex + 1), 500);
  };

  const handleSkip = () => {
    setShowOptions(false);
    const userMessage: ChatMessageType = {
      id: `user-${Date.now()}`,
      type: 'user',
      content: '건너뛰기',
    };
    setMessages(prev => [...prev, userMessage]);
    setQuestionHistory(prev => [...prev, { index: currentQuestionIndex, isOptional: isOptionalPhase }]);
    setTimeout(() => showNextQuestion(currentQuestionIndex + 1), 500);
  };

  const handleReEdit = (messageIndex: number) => {
    // Find the corresponding history entry for this message
    const userMessageIndices = messages
      .map((msg, idx) => ({ msg, idx }))
      .filter(({ msg }) => msg.type === 'user');
    
    const targetUserIndex = userMessageIndices.findIndex(({ idx }) => idx === messageIndex);
    if (targetUserIndex === -1) return;
    
    // Calculate how many steps to go back
    const stepsToGoBack = userMessageIndices.length - targetUserIndex;
    
    // Go back to the question before this answer
    const historyIndex = questionHistory.length - stepsToGoBack;
    if (historyIndex < 0) return;
    
    const targetHistory = questionHistory[historyIndex];
    
    // Remove the user message and all messages after it, 
    // but also remove the AI question before it (messageIndex - 1)
    const startRemoveIndex = messageIndex - 1; // Include the AI question before user answer
    setMessages(prev => prev.slice(0, startRemoveIndex > 0 ? startRemoveIndex : messageIndex));
    
    // Update history
    setQuestionHistory(prev => prev.slice(0, historyIndex));
    
    // Reset to target question
    setIsOptionalPhase(targetHistory.isOptional);
    setCurrentQuestionIndex(targetHistory.index);
    setShowOptions(false);
    
    // Re-show the question
    setTimeout(() => {
      const questions = targetHistory.isOptional ? optionalQuestions : requiredQuestions;
      setMessages(prev => [...prev, questions[targetHistory.index]]);
      setTimeout(() => setShowOptions(true), 300);
    }, 300);
  };

  const handleBackClick = () => {
    if (questionHistory.length > 0) {
      setShowBackConfirm(true);
    } else {
      onBack();
    }
  };

  const canGoBack = questionHistory.length > 0 && !isTyping;

  const currentQuestion = isOptionalPhase 
    ? optionalQuestions[currentQuestionIndex] 
    : requiredQuestions[currentQuestionIndex];

  const progress = isOptionalPhase 
    ? 100 
    : Math.round((currentQuestionIndex / (requiredQuestions.length - 1)) * 100);

  return (
    <div className="min-h-screen flex flex-col">
      {/* Header */}
      <header className="py-4 px-6 border-b border-border/50 bg-background/80 backdrop-blur-sm sticky top-0 z-10">
        <div className="max-w-4xl mx-auto flex items-center justify-between">
          <div className="flex items-center gap-4">
            {/* Back to Main Button */}
            <button
              onClick={handleBackClick}
              className="p-2 rounded-lg transition-colors hover:bg-secondary text-foreground"
              title="메인 화면으로"
            >
              <ArrowLeft className="w-5 h-5" />
            </button>
            <div className="flex items-center gap-2">
              <div className="w-8 h-8 rounded-lg bg-primary flex items-center justify-center">
                <Building2 className="w-5 h-5 text-primary-foreground" />
              </div>
              <span className="font-semibold text-foreground hidden sm:block">스페이스플래닝</span>
            </div>
            <div className="h-6 w-px bg-border hidden sm:block" />
            <div>
              <h1 className="font-semibold text-foreground text-sm sm:text-base">AI 사전진단</h1>
              <p className="text-xs text-muted-foreground">
                {isOptionalPhase ? '추가 정보 입력' : `${Math.max(1, currentQuestionIndex)}/${requiredQuestions.length - 1} 필수 항목`}
              </p>
            </div>
          </div>
          <div className="flex items-center gap-3">
            <div className="w-24 sm:w-32 h-2 bg-secondary rounded-full overflow-hidden">
              <div 
                className="h-full bg-primary transition-all duration-500"
                style={{ width: `${progress}%` }}
              />
            </div>
            <span className="text-sm text-muted-foreground w-10">{progress}%</span>
          </div>
        </div>
      </header>

      {/* Chat Area - Desktop optimized */}
      <main className="flex-1 overflow-y-auto">
        <div className="max-w-4xl mx-auto px-4 sm:px-6 py-8">
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
            {/* Chat Messages */}
            <div className="lg:col-span-2 space-y-4">
              {messages.map((message, index) => (
                <ChatMessage 
                  key={message.id} 
                  message={message} 
                  onOptionSelect={handleOptionSelect}
                  onTextSubmit={handleTextSubmit}
                  isLast={index === messages.length - 1}
                  showOptions={showOptions && index === messages.length - 1}
                  onSkip={message.skippable ? handleSkip : undefined}
                  onReEdit={() => handleReEdit(index)}
                  canReEdit={message.type === 'user' && index < messages.length - 1 && !isTyping}
                />
              ))}
              
              {isTyping && <TypingIndicator />}
              
              <div ref={messagesEndRef} />
            </div>

            {/* Desktop Sidebar - Progress Info */}
            <div className="hidden lg:block">
              <div className="sticky top-24 space-y-4">
                <div className="glass-card rounded-xl p-5">
                  <h3 className="font-semibold text-foreground mb-4">진단 진행 상황</h3>
                  <div className="space-y-3">
                    <ProgressItem 
                      label="기본 정보" 
                      isActive={currentQuestionIndex <= 4} 
                      isComplete={currentQuestionIndex > 4}
                    />
                    <ProgressItem 
                      label="규모 및 예산" 
                      isActive={currentQuestionIndex > 4 && currentQuestionIndex <= 10} 
                      isComplete={currentQuestionIndex > 10}
                    />
                    <ProgressItem 
                      label="추가 정보 (선택)" 
                      isActive={isOptionalPhase} 
                      isComplete={false}
                    />
                    <ProgressItem 
                      label="AI 분석" 
                      isActive={false} 
                      isComplete={false}
                    />
                  </div>
                </div>
                
                <div className="glass-card rounded-xl p-5">
                  <p className="text-sm text-muted-foreground">
                    💡 정확한 답변이 어려우시다면 대략적인 값을 선택해도 괜찮습니다. AI가 보수적으로 분석합니다.
                  </p>
                </div>
              </div>
            </div>
          </div>
        </div>
      </main>

      {/* Back Confirmation Dialog */}
      <AlertDialog open={showBackConfirm} onOpenChange={setShowBackConfirm}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>진단을 중단하시겠습니까?</AlertDialogTitle>
            <AlertDialogDescription>
              메인 화면으로 돌아가면 현재까지 입력한 내용이 모두 사라집니다.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>계속 진행</AlertDialogCancel>
            <AlertDialogAction onClick={onBack}>메인으로 돌아가기</AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
};

const ProgressItem = ({ label, isActive, isComplete }: { label: string; isActive: boolean; isComplete: boolean }) => (
  <div className="flex items-center gap-3">
    <div className={`w-3 h-3 rounded-full border-2 transition-colors ${
      isComplete ? 'bg-primary border-primary' : 
      isActive ? 'border-primary' : 'border-muted-foreground/30'
    }`}>
      {isComplete && (
        <svg className="w-full h-full text-primary-foreground" viewBox="0 0 12 12" fill="none">
          <path d="M2.5 6L5 8.5L9.5 4" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
        </svg>
      )}
    </div>
    <span className={`text-sm ${isActive ? 'text-foreground font-medium' : isComplete ? 'text-muted-foreground' : 'text-muted-foreground/50'}`}>
      {label}
    </span>
  </div>
);

const ChatMessage = ({ 
  message, 
  onOptionSelect, 
  onTextSubmit,
  isLast,
  showOptions,
  onSkip,
  onReEdit,
  canReEdit,
}: { 
  message: ChatMessageType; 
  onOptionSelect: (option: ChatOption, field?: string) => void;
  onTextSubmit: (text: string, imageUrl?: string) => void;
  isLast: boolean;
  showOptions: boolean;
  onSkip?: () => void;
  onReEdit?: () => void;
  canReEdit?: boolean;
}) => {
  const isAI = message.type === 'ai';
  const [showTextInput, setShowTextInput] = useState(false);

  return (
    <div className={`flex ${isAI ? 'justify-start' : 'justify-end'} animate-fade-in-up`}>
      <div className={`max-w-[90%] sm:max-w-[85%] ${isAI ? '' : ''}`}>
        {isAI ? (
          <div className="space-y-4">
            <div className="chat-bubble-ai">
              <p className="text-foreground whitespace-pre-line leading-relaxed">{message.content}</p>
            </div>
            
            {isLast && showOptions && (
              <div className="space-y-4 pl-2 animate-fade-in-up">
                {message.inputType === 'textWithImage' ? (
                  <TextWithImageInput 
                    onSubmit={onTextSubmit}
                    allowImage={message.allowImageUpload}
                  />
                ) : (
                  <>
                    {message.options && message.options.length > 0 && (
                      <OptionSelector 
                        options={message.options} 
                        inputType={message.inputType}
                        onSelect={(option) => {
                          if (option.value === 'custom') {
                            setShowTextInput(true);
                          } else {
                            onOptionSelect(option, message.field);
                          }
                        }}
                      />
                    )}
                    {showTextInput && message.allowTextInput && (
                      <TextInputField 
                        onSubmit={(text) => onTextSubmit(text)}
                        onCancel={() => setShowTextInput(false)}
                      />
                    )}
                  </>
                )}
                {onSkip && (
                  <button 
                    onClick={onSkip}
                    className="flex items-center gap-1 text-sm text-muted-foreground hover:text-primary transition-colors"
                  >
                    <SkipForward className="w-4 h-4" />
                    건너뛰기
                  </button>
                )}
              </div>
            )}
          </div>
        ) : (
          <div className="group relative">
            <div className="chat-bubble-user">
              <p className="text-foreground whitespace-pre-line">{message.content}</p>
            </div>
            {canReEdit && onReEdit && (
              <button
                onClick={onReEdit}
                className="absolute -left-16 top-1/2 -translate-y-1/2 opacity-0 group-hover:opacity-100 transition-opacity flex items-center gap-1 text-xs text-muted-foreground hover:text-primary px-2 py-1 rounded-lg hover:bg-secondary/50"
              >
                <RotateCcw className="w-3 h-3" />
                수정
              </button>
            )}
          </div>
        )}
      </div>
    </div>
  );
};

const TextInputField = ({ 
  onSubmit, 
  onCancel 
}: { 
  onSubmit: (text: string) => void; 
  onCancel: () => void;
}) => {
  const [text, setText] = useState('');

  const handleSubmit = () => {
    if (text.trim()) {
      onSubmit(text.trim());
    }
  };

  return (
    <div className="space-y-2">
      <div className="flex gap-2">
        <Input
          value={text}
          onChange={(e) => setText(e.target.value)}
          placeholder="직접 입력해주세요..."
          className="bg-secondary/50 border-border"
          onKeyDown={(e) => e.key === 'Enter' && handleSubmit()}
        />
        <Button variant="cyan" size="icon" onClick={handleSubmit} disabled={!text.trim()}>
          <Send className="w-4 h-4" />
        </Button>
        <Button variant="ghost" size="icon" onClick={onCancel}>
          <X className="w-4 h-4" />
        </Button>
      </div>
    </div>
  );
};

const TextWithImageInput = ({ 
  onSubmit,
  allowImage = true,
}: { 
  onSubmit: (text: string, imageUrl?: string) => void;
  allowImage?: boolean;
}) => {
  const [text, setText] = useState('');
  const [imagePreview, setImagePreview] = useState<string | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const handleImageSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      const reader = new FileReader();
      reader.onload = (event) => {
        setImagePreview(event.target?.result as string);
      };
      reader.readAsDataURL(file);
    }
  };

  const handleSubmit = () => {
    if (text.trim() || imagePreview) {
      onSubmit(text.trim(), imagePreview || undefined);
    }
  };

  const removeImage = () => {
    setImagePreview(null);
    if (fileInputRef.current) {
      fileInputRef.current.value = '';
    }
  };

  return (
    <div className="space-y-3">
      {imagePreview && (
        <div className="relative inline-block">
          <img 
            src={imagePreview} 
            alt="첨부 이미지" 
            className="max-w-[200px] rounded-lg border border-border"
          />
          <button 
            onClick={removeImage}
            className="absolute -top-2 -right-2 w-6 h-6 rounded-full bg-destructive flex items-center justify-center"
          >
            <X className="w-3 h-3 text-destructive-foreground" />
          </button>
        </div>
      )}
      <div className="flex gap-2">
        <Input
          value={text}
          onChange={(e) => setText(e.target.value)}
          placeholder="텍스트로 설명해주세요..."
          className="bg-secondary/50 border-border"
          onKeyDown={(e) => e.key === 'Enter' && handleSubmit()}
        />
        {allowImage && (
          <>
            <input
              ref={fileInputRef}
              type="file"
              accept="image/*"
              onChange={handleImageSelect}
              className="hidden"
            />
            <Button 
              variant="ghost" 
              size="icon" 
              onClick={() => fileInputRef.current?.click()}
              className="flex-shrink-0"
            >
              <Image className="w-4 h-4" />
            </Button>
          </>
        )}
        <Button 
          variant="cyan" 
          size="icon" 
          onClick={handleSubmit} 
          disabled={!text.trim() && !imagePreview}
          className="flex-shrink-0"
        >
          <Send className="w-4 h-4" />
        </Button>
      </div>
    </div>
  );
};

const OptionSelector = ({ 
  options, 
  inputType,
  onSelect,
}: { 
  options: ChatOption[]; 
  inputType?: string;
  onSelect: (option: ChatOption) => void;
}) => {
  if (inputType === 'card') {
    return (
      <div className="grid gap-3 sm:grid-cols-2">
        {options.map((option) => (
          <button
            key={option.value}
            onClick={() => onSelect(option)}
            className="glass-card rounded-xl p-4 text-left hover:border-primary/50 hover:bg-primary/5 transition-all group"
          >
            <div className="flex items-center justify-between">
              <div>
                <p className="font-medium text-foreground group-hover:text-primary transition-colors">
                  {option.label}
                </p>
                {option.description && (
                  <p className="text-sm text-muted-foreground mt-1">{option.description}</p>
                )}
              </div>
              <ChevronRight className="w-5 h-5 text-muted-foreground group-hover:text-primary transition-colors flex-shrink-0 ml-2" />
            </div>
          </button>
        ))}
      </div>
    );
  }

  if (inputType === 'chip') {
    return (
      <div className="flex flex-wrap gap-2">
        {options.map((option) => (
          <Button
            key={option.value}
            variant={option.value === 'custom' ? 'cyanOutline' : 'chip'}
            size="chip"
            onClick={() => onSelect(option)}
            className="text-sm"
          >
            {option.label}
          </Button>
        ))}
      </div>
    );
  }

  // Default: buttons
  return (
    <div className="flex flex-wrap gap-2">
      {options.map((option) => (
        <Button
          key={option.value}
          variant="secondary"
          onClick={() => onSelect(option)}
          className="text-sm"
        >
          {option.label}
        </Button>
      ))}
    </div>
  );
};

const TypingIndicator = () => (
  <div className="flex justify-start animate-fade-in">
    <div className="chat-bubble-ai flex items-center gap-1.5 py-4">
      <span className="w-2 h-2 rounded-full bg-muted-foreground typing-dot" />
      <span className="w-2 h-2 rounded-full bg-muted-foreground typing-dot" />
      <span className="w-2 h-2 rounded-full bg-muted-foreground typing-dot" />
    </div>
  </div>
);

export default ChatbotScreen;
