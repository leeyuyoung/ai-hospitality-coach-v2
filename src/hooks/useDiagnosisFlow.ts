import { useState, useCallback } from 'react';
import { DiagnosisData, FlowStep, ReportData } from '@/types/diagnosis';
import { generateDiagnosisReport, generateScenarioImage, APIError } from '@/lib/api';
import { toast } from '@/hooks/use-toast';

const initialDiagnosisData: DiagnosisData = {
  projectStatus: '',
  location: { region: '', locationType: '' },
  accommodationType: '',
  scale: { rooms: '', area: '', floors: '', parking: '' },
  budget: '',
  includeBuildingPurchase: false,
};

export const useDiagnosisFlow = () => {
  const [currentStep, setCurrentStep] = useState<FlowStep>('landing');
  const [diagnosisData, setDiagnosisData] = useState<DiagnosisData>(initialDiagnosisData);
  const [reportData, setReportData] = useState<ReportData | null>(null);
  const [isUnlocked, setIsUnlocked] = useState(false);
  const [contactInfo, setContactInfo] = useState({ name: '', phone: '', email: '' });
  const [isGeneratingImages, setIsGeneratingImages] = useState(false);
  const [imageGenerationProgress, setImageGenerationProgress] = useState(0);

  const updateDiagnosisData = useCallback((field: string, value: string | boolean) => {
    setDiagnosisData(prev => {
      const keys = field.split('.');
      if (keys.length === 1) {
        return { ...prev, [field]: value };
      } else if (keys.length === 2) {
        const [parent, child] = keys;
        return {
          ...prev,
          [parent]: {
            ...(prev[parent as keyof DiagnosisData] as Record<string, string>),
            [child]: value,
          },
        };
      }
      return prev;
    });
  }, []);

  const startDiagnosis = useCallback(() => {
    setCurrentStep('chatbot');
  }, []);

  const generateReport = useCallback(async () => {
    setCurrentStep('loading');
    setIsGeneratingImages(false);
    setImageGenerationProgress(0);

    try {
      // 1. OpenAI API로 진단 리포트 생성
      const report = await generateDiagnosisReport(diagnosisData);
      
      // 2. 각 시나리오에 대해 인테리어 이미지 생성
      setIsGeneratingImages(true);
      setImageGenerationProgress(0);

      const scenariosWithImages = await Promise.allSettled(
        report.scenarios.map(async (scenario, index) => {
          try {
            const imageUrl = await generateScenarioImage(diagnosisData, scenario, index);
            setImageGenerationProgress(((index + 1) / report.scenarios.length) * 100);
            return {
              ...scenario,
              imageUrl,
            };
          } catch (error) {
            // 이미지 생성 실패해도 시나리오는 표시
            console.warn(`시나리오 "${scenario.name}" 이미지 생성 실패:`, error);
            setImageGenerationProgress(((index + 1) / report.scenarios.length) * 100);
            return scenario; // 이미지 없이 시나리오 반환
          }
        })
      );

      // Promise.allSettled 결과를 시나리오 배열로 변환
      const finalScenarios = scenariosWithImages.map((result) => {
        if (result.status === 'fulfilled') {
          return result.value;
        }
        // 실패한 경우 원본 시나리오 반환 (이미지 없음)
        return report.scenarios[scenariosWithImages.indexOf(result)];
      });

      // 최종 리포트 데이터 설정
      const finalReport: ReportData = {
        ...report,
        scenarios: finalScenarios,
      };

      setReportData(finalReport);
      setIsGeneratingImages(false);
      setImageGenerationProgress(100);
      setCurrentStep('preview');
    } catch (error) {
      console.error('리포트 생성 오류:', error);
      
      // 에러 타입에 따라 다른 메시지 표시
      let errorMessage = '리포트 생성 중 오류가 발생했습니다';
      let errorTitle = '오류 발생';

      if (error instanceof APIError) {
        // 상세한 에러 정보 로깅
        console.error('APIError 상세:', {
          message: error.message,
          statusCode: error.statusCode,
          response: error.response,
        });

        if (error.statusCode === 401 || error.message.includes('API 키') || error.message.includes('Invalid API key')) {
          errorTitle = 'API 키 오류';
          errorMessage = 'API 키를 확인해주세요. .env.local 파일의 VITE_OPENAI_API_KEY를 확인하세요.';
        } else if (error.statusCode === 429 || error.message.includes('할당량') || error.message.includes('quota') || error.message.includes('rate limit')) {
          errorTitle = '서비스 사용량 초과';
          errorMessage = '일시적으로 서비스 사용량을 초과했습니다. 잠시 후 다시 시도해주세요.';
        } else if (error.statusCode === 400) {
          errorTitle = '요청 오류';
          errorMessage = error.message || '요청 형식이 올바르지 않습니다.';
        } else if (error.statusCode === 404) {
          errorTitle = '모델을 찾을 수 없음';
          errorMessage = '사용 중인 모델을 찾을 수 없습니다. 모델 이름을 확인해주세요.';
        } else if (error.message.includes('네트워크') || error.message.includes('fetch')) {
          errorTitle = '네트워크 오류';
          errorMessage = '인터넷 연결을 확인해주세요.';
        } else {
          errorMessage = error.message || errorMessage;
        }
      } else if (error instanceof Error) {
        console.error('일반 에러:', error);
        if (error.message.includes('Failed to fetch') || error.message.includes('NetworkError')) {
          errorTitle = '네트워크 오류';
          errorMessage = '인터넷 연결을 확인해주세요.';
        } else {
          errorMessage = error.message;
        }
      }

      // Toast로 에러 표시
      toast({
        variant: 'destructive',
        title: errorTitle,
        description: errorMessage,
      });

      // 에러 발생 시 챗봇 화면으로 돌아가기
      setIsGeneratingImages(false);
      setImageGenerationProgress(0);
      setCurrentStep('chatbot');
    }
  }, [diagnosisData]);

  const goToBooking = useCallback(() => {
    setCurrentStep('booking');
  }, []);

  const submitBooking = useCallback((info: { name: string; phone: string; email: string }) => {
    setContactInfo(info);
    setIsUnlocked(true);
    setCurrentStep('unlocked');
  }, []);

  const resetFlow = useCallback(() => {
    setCurrentStep('landing');
    setDiagnosisData(initialDiagnosisData);
    setReportData(null);
    setIsUnlocked(false);
    setContactInfo({ name: '', phone: '', email: '' });
  }, []);

  return {
    currentStep,
    setCurrentStep,
    diagnosisData,
    updateDiagnosisData,
    reportData,
    isUnlocked,
    contactInfo,
    isGeneratingImages,
    imageGenerationProgress,
    startDiagnosis,
    generateReport,
    goToBooking,
    submitBooking,
    resetFlow,
  };
};
