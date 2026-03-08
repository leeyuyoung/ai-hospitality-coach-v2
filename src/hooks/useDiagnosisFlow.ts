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

// OpenAI 토큰 소진/키 오류 시 사용하는 더미 리포트 생성 함수
const createFallbackReport = (diagnosisData: DiagnosisData): ReportData => {
  // 예산 범위 매핑 (api.ts의 로직과 동일하게 맞춤)
  const budgetMap: Record<string, { min: number; max: number }> = {
    'under-50m': { min: 10000000, max: 50000000 }, // 1천만원~5천만원 (5천만원 미만)
    '50m-5b': { min: 50000000, max: 500000000 },
    '5b-15b': { min: 500000000, max: 1500000000 },
    'over-15b': { min: 1500000000, max: 50000000000 },
    'unknown': { min: 100000000, max: 500000000 },
  };

  const budgetRange = budgetMap[diagnosisData.budget] || budgetMap['unknown'];
  const range = budgetRange.max - budgetRange.min;

  const scenarios: Scenario[] = [
    {
      id: 'conservative',
      name: '안정형',
      estimatedCost: {
        min: budgetRange.min + Math.floor(range * 0.1),
        max: budgetRange.min + Math.floor(range * 0.3),
      },
      monthlyRevenue: { min: 5000000, max: 8000000 },
      monthlyProfit: { min: 2000000, max: 4000000 },
      suggestedRooms: 8,
      adr: { peak: 80000, offPeak: 60000 },
      occupancy: { peak: 70, offPeak: 50 },
      riskLevel: 'low',
      operationDifficulty: 'easy',
      keyRisk: '초기 투자비 회수 기간이 길 수 있음',
      moodDescription: '편안하고 안정적인 분위기',
      riskScore: 30,
    },
    {
      id: 'balanced',
      name: '균형형',
      estimatedCost: {
        min: budgetRange.min + Math.floor(range * 0.35),
        max: budgetRange.min + Math.floor(range * 0.65),
      },
      monthlyRevenue: { min: 8000000, max: 12000000 },
      monthlyProfit: { min: 3500000, max: 6000000 },
      suggestedRooms: 10,
      adr: { peak: 100000, offPeak: 70000 },
      occupancy: { peak: 75, offPeak: 55 },
      riskLevel: 'medium',
      operationDifficulty: 'medium',
      keyRisk: '경쟁 치열 지역의 경우 점유율 확보 어려움',
      moodDescription: '모던하고 트렌디한 분위기',
      riskScore: 50,
    },
    {
      id: 'aggressive',
      name: '성장형',
      estimatedCost: {
        min: budgetRange.min + Math.floor(range * 0.7),
        max: budgetRange.max - Math.floor(range * 0.1),
      },
      monthlyRevenue: { min: 12000000, max: 18000000 },
      monthlyProfit: { min: 5000000, max: 9000000 },
      suggestedRooms: 12,
      adr: { peak: 120000, offPeak: 80000 },
      occupancy: { peak: 80, offPeak: 60 },
      riskLevel: 'high',
      operationDifficulty: 'hard',
      keyRisk: '높은 초기 투자와 운영 비용 부담',
      moodDescription: '럭셔리하고 프리미엄한 분위기',
      riskScore: 70,
    },
  ];

  return {
    scenarios,
    recommendation:
      '현재 AI 토큰 사용량 한도 또는 API 키 문제로 실시간 분석이 어려워, 예시 데이터를 기반으로 한 더미 리포트를 보여드리고 있습니다.\n\n실제 상담 시에는 현장 조건과 세부 정보를 반영해 보다 정밀한 분석이 진행됩니다.',
    createdAt: new Date(),
  };
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

      // 에러 타입에 따라 다른 메시지 표시 및 더미 리포트 사용 여부 결정
      let errorMessage = '리포트 생성 중 오류가 발생했습니다';
      let errorTitle = '오류 발생';
      let shouldUseFallbackReport = false;

      if (error instanceof APIError) {
        // 상세한 에러 정보 로깅
        console.error('APIError 상세:', {
          message: error.message,
          statusCode: error.statusCode,
          response: error.response,
        });

        const msg = error.message || '';

        // 토큰/쿼터 초과(429) → 더미 리포트로 대체
        if (
          error.statusCode === 429 ||
          msg.includes('할당량') ||
          msg.toLowerCase().includes('quota') ||
          msg.toLowerCase().includes('rate limit')
        ) {
          errorTitle = 'AI 사용량 한도 도달';
          errorMessage =
            'AI 토큰 사용량 한도에 도달하여, 예시 데이터를 기반으로 한 더미 리포트를 대신 보여드립니다.';
          shouldUseFallbackReport = true;

          // API 키 오류(미설정/잘못된 키)도 더미 리포트로 대체
        } else if (
          error.statusCode === 401 ||
          msg.includes('API 키') ||
          msg.toLowerCase().includes('invalid api key')
        ) {
          errorTitle = 'API 키 오류';
          errorMessage =
            'API 키 문제로 실시간 분석이 어려워, 예시 데이터를 기반으로 한 더미 리포트를 대신 보여드립니다.';
          shouldUseFallbackReport = true;
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

      // 토큰/쿼터 또는 API 키 문제일 경우: 더미 리포트로 대체하여 리포트 화면으로 이동
      if (shouldUseFallbackReport) {
        const fallbackReport = createFallbackReport(diagnosisData);
        console.warn('더미 리포트를 사용합니다 (토큰/키 문제로 인한 fallback).', {
          diagnosisData,
          fallbackReport,
        });

        setReportData(fallbackReport);
        setIsGeneratingImages(false);
        setImageGenerationProgress(100);
        setCurrentStep('preview');

        toast({
          variant: 'default',
          title: errorTitle,
          description: errorMessage,
        });

        return;
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
