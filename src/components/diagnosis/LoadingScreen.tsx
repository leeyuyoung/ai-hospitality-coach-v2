import { useEffect, useState } from 'react';
import { Building2, Brain, LineChart, Shield } from 'lucide-react';

interface LoadingScreenProps {
  onComplete?: () => void;
  isGeneratingImages?: boolean;
  imageProgress?: number;
}

const loadingSteps = [
  { icon: Brain, text: '입력 데이터 분석 중...' },
  { icon: Building2, text: '공사비 산출 중...' },
  { icon: LineChart, text: '수익 시뮬레이션 중...' },
  { icon: Shield, text: '리스크 평가 중...' },
];

const LoadingScreen = ({ onComplete, isGeneratingImages = false, imageProgress = 0 }: LoadingScreenProps) => {
  const [currentStep, setCurrentStep] = useState(0);
  const [progress, setProgress] = useState(0);

  useEffect(() => {
    const stepInterval = setInterval(() => {
      setCurrentStep(prev => {
        if (prev < loadingSteps.length - 1) {
          return prev + 1;
        }
        return prev;
      });
    }, 700);

    const progressInterval = setInterval(() => {
      setProgress(prev => {
        if (prev < 100) {
          return prev + 1;
        }
        clearInterval(progressInterval);
        return 100;
      });
    }, 28);

    return () => {
      clearInterval(stepInterval);
      clearInterval(progressInterval);
    };
  }, []);

  return (
    <div className="min-h-screen flex items-center justify-center px-6">
      <div className="max-w-md w-full text-center">
        {/* AI Icon */}
        <div className="relative w-24 h-24 mx-auto mb-8">
          <div className="absolute inset-0 rounded-full bg-primary/20 animate-ping" />
          <div className="relative w-24 h-24 rounded-full bg-primary/10 border-2 border-primary flex items-center justify-center">
            <Brain className="w-10 h-10 text-primary" />
          </div>
        </div>

        <h2 className="text-2xl font-bold text-foreground mb-2">
          AI 리포트 생성 중
        </h2>
        <p className="text-muted-foreground mb-8">
          입력하신 정보를 바탕으로 맞춤 분석 중입니다
        </p>

        {/* Progress Bar */}
        <div className="mb-8">
          <div className="h-2 bg-secondary rounded-full overflow-hidden">
            <div 
              className="h-full bg-primary transition-all duration-100 ease-linear"
              style={{ width: `${progress}%` }}
            />
          </div>
          <p className="text-sm text-muted-foreground mt-2">{progress}%</p>
        </div>

        {/* Image Generation Progress */}
        {isGeneratingImages && (
          <div className="mb-6 p-4 bg-secondary/50 rounded-lg">
            <div className="flex items-center justify-between mb-2">
              <p className="text-sm font-medium text-foreground">인테리어 이미지 생성 중</p>
              <p className="text-sm text-muted-foreground">{Math.round(imageProgress)}%</p>
            </div>
            <div className="h-2 bg-secondary rounded-full overflow-hidden">
              <div 
                className="h-full bg-primary transition-all duration-300"
                style={{ width: `${imageProgress}%` }}
              />
            </div>
          </div>
        )}

        {/* Steps */}
        <div className="space-y-3">
          {loadingSteps.map((step, index) => {
            const Icon = step.icon;
            const isActive = index === currentStep;
            const isComplete = index < currentStep;

            return (
              <div 
                key={index}
                className={`flex items-center gap-3 px-4 py-3 rounded-lg transition-all duration-300 ${
                  isActive 
                    ? 'bg-primary/10 border border-primary/30' 
                    : isComplete
                    ? 'opacity-50'
                    : 'opacity-30'
                }`}
              >
                <div className={`w-8 h-8 rounded-lg flex items-center justify-center ${
                  isActive ? 'bg-primary text-primary-foreground' : 'bg-secondary'
                }`}>
                  <Icon className="w-4 h-4" />
                </div>
                <span className={`text-sm ${isActive ? 'text-foreground font-medium' : 'text-muted-foreground'}`}>
                  {step.text}
                </span>
                {isActive && (
                  <div className="ml-auto">
                    <div className="w-4 h-4 border-2 border-primary border-t-transparent rounded-full animate-spin" />
                  </div>
                )}
              </div>
            );
          })}
        </div>
      </div>
    </div>
  );
};

export default LoadingScreen;
