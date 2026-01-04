import { DiagnosisData, ReportData, Scenario } from '@/types/diagnosis';

// API 키 가져오기
const OPENAI_API_KEY = import.meta.env.VITE_OPENAI_API_KEY;

// API 엔드포인트
const OPENAI_API_URL = 'https://api.openai.com/v1/chat/completions';
const OPENAI_IMAGE_API_URL = 'https://api.openai.com/v1/images/generations';

// 에러 타입
export class APIError extends Error {
  constructor(
    message: string,
    public statusCode?: number,
    public response?: unknown
  ) {
    super(message);
    this.name = 'APIError';
  }
}

/**
 * OpenAI API를 사용하여 진단 리포트 생성
 * @param diagnosisData 사용자가 입력한 진단 데이터
 * @returns 생성된 리포트 데이터
 */
export async function generateDiagnosisReport(
  diagnosisData: DiagnosisData
): Promise<ReportData> {
  if (!OPENAI_API_KEY) {
    throw new APIError('OpenAI API 키가 설정되지 않았습니다.');
  }

  // 진단 데이터를 프롬프트로 변환
  const prompt = buildDiagnosisPrompt(diagnosisData);

  try {
    const response = await fetch(OPENAI_API_URL, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${OPENAI_API_KEY}`,
      },
      body: JSON.stringify({
        model: 'gpt-4o-mini', // 더 저렴하고 안정적인 모델 사용
        messages: [
          {
            role: 'system',
            content: `당신은 한국 숙박업 창업 진단 전문가입니다. 사용자가 제공한 정보를 바탕으로 
            정확하고 실용적인 사전진단 리포트를 생성해야 합니다. 
            
            응답은 반드시 다음 JSON 형식을 따라야 합니다:
            {
              "marketAnalysis": "시장 분석 내용",
              "swotAnalysis": {
                "strengths": ["강점1", "강점2"],
                "weaknesses": ["약점1", "약점2"],
                "opportunities": ["기회1", "기회2"],
                "threats": ["위협1", "위협2"]
              },
              "scenarios": [
                {
                  "id": "conservative",
                  "name": "안정형",
                  "description": "시나리오 설명",
                  "pros": ["장점1", "장점2"],
                  "cons": ["단점1", "단점2"],
                  "estimatedCost": { "min": 180000000, "max": 250000000 },
                  "monthlyRevenue": { "min": 12000000, "max": 18000000 },
                  "suggestedRooms": 12,
                  "adr": { "peak": 120000, "offPeak": 85000 },
                  "occupancy": { "peak": 85, "offPeak": 55 },
                  "riskLevel": "low",
                  "operationDifficulty": "easy",
                  "keyRisk": "핵심 리스크 설명",
                  "moodDescription": "인테리어 무드 설명",
                  "monthlyProfit": { "min": 4500000, "max": 7500000 },
                  "riskScore": 25
                }
              ],
              "recommendation": "AI 추천 내용",
              "actionPlan": [
                "액션 플랜 항목1",
                "액션 플랜 항목2"
              ]
            }
            
            중요 규칙:
            1. 시나리오는 반드시 정확히 3개를 생성해야 합니다. 각 시나리오는 예산, 규모, 리스크 수준이 다르게 설정되어야 합니다.
            2. 모든 숫자는 한국 원화 기준이며, 현실적이고 보수적으로 계산해야 합니다.
            3. estimatedCost는 사용자가 입력한 예산 범위 내에서 제시해야 합니다. 사용자 예산을 반드시 확인하고 그 범위 내에서 현실적인 공사비를 계산하세요.
               - 예를 들어 사용자 예산이 5억~15억원이면:
                 * 안정형 시나리오: 5억~8억원 정도
                 * 균형형 시나리오: 8억~12억원 정도
                 * 성장형 시나리오: 12억~15억원 정도
               - 각 시나리오의 estimatedCost.min과 estimatedCost.max는 모두 사용자 예산 범위 내에 있어야 합니다.
            4. 금액 표기 규칙:
               - estimatedCost는 원 단위 정수로만 입력 (예: 500000000 = 5억원, 1500000000 = 15억원)
               - 억 단위 표기 시 소수점 사용 금지 (예: 5억원 O, 5.0억원 X)
               - 만 단위는 천 단위 구분 기호 사용 가능 (예: 1,200만원)
            5. 응답은 반드시 유효한 JSON 형식이어야 하며, JSON 이외의 텍스트는 포함하지 마세요.`,
          },
          {
            role: 'user',
            content: prompt,
          },
        ],
        temperature: 0.7,
        response_format: { type: 'json_object' },
      }),
    });

    if (!response.ok) {
      const errorData = await response.json().catch(() => ({}));
      const errorMessage = (errorData as any)?.error?.message || response.statusText;
      console.error('OpenAI API 오류 상세:', {
        status: response.status,
        statusText: response.statusText,
        errorData,
      });
      throw new APIError(
        `OpenAI API 오류: ${errorMessage}`,
        response.status,
        errorData
      );
    }

    const data = await response.json();
    const content = data.choices[0]?.message?.content;

    if (!content) {
      console.error('OpenAI API 응답 데이터:', data);
      throw new APIError('OpenAI API 응답에 내용이 없습니다.');
    }

    // JSON 파싱
    let parsedData;
    try {
      parsedData = JSON.parse(content);
    } catch (parseError) {
      console.error('JSON 파싱 오류:', {
        content,
        error: parseError,
      });
      throw new APIError('OpenAI API 응답을 JSON으로 파싱할 수 없습니다.');
    }

    // 예산 범위 확인을 위한 매핑
    const budgetMap: Record<string, { min: number; max: number }> = {
      'under-50m': { min: 10000000, max: 50000000 }, // 1천만원~5천만원 (5천만원 미만)
      '50m-5b': { min: 50000000, max: 500000000 },
      '5b-15b': { min: 500000000, max: 1500000000 },
      'over-15b': { min: 1500000000, max: 50000000000 },
      'unknown': { min: 0, max: 0 },
    };
    const budgetRange = budgetMap[diagnosisData.budget] || { min: 0, max: 0 };

    // ReportData 형식으로 변환 및 검증
    const scenarios: Scenario[] = parsedData.scenarios.map((scenario: any, index: number) => {
      let estimatedCost = scenario.estimatedCost || { min: 0, max: 0 };
      
      // 예산 범위 검증 및 조정 (max > 0인 경우에만 검증)
      if (budgetRange.max > 0) {
        // min이 예산 범위보다 작으면 조정 (min이 0인 경우도 처리)
        if (estimatedCost.min < budgetRange.min || estimatedCost.min === 0) {
          console.warn(`시나리오 ${index + 1}의 estimatedCost.min(${estimatedCost.min})이 예산 범위(${budgetRange.min})보다 작습니다. 조정합니다.`);
          estimatedCost.min = budgetRange.min;
        }
        // max가 예산 범위보다 크면 조정
        if (estimatedCost.max > budgetRange.max) {
          console.warn(`시나리오 ${index + 1}의 estimatedCost.max(${estimatedCost.max})이 예산 범위(${budgetRange.max})보다 큽니다. 조정합니다.`);
          estimatedCost.max = budgetRange.max;
        }
        // min이 max보다 크면 조정
        if (estimatedCost.min > estimatedCost.max) {
          console.warn(`시나리오 ${index + 1}의 estimatedCost.min이 max보다 큽니다. 조정합니다.`);
          estimatedCost.min = Math.min(estimatedCost.min, budgetRange.max);
          estimatedCost.max = Math.max(estimatedCost.min, budgetRange.max);
        }
        // min과 max가 모두 0이거나 유효하지 않으면 예산 범위 내에서 기본값 설정
        if ((estimatedCost.min === 0 && estimatedCost.max === 0) || estimatedCost.min >= estimatedCost.max) {
          const range = budgetRange.max - budgetRange.min;
          estimatedCost.min = budgetRange.min + Math.floor(range * 0.2); // 하위 20% 지점
          estimatedCost.max = budgetRange.min + Math.floor(range * 0.6); // 하위 60% 지점
          console.warn(`시나리오 ${index + 1}의 estimatedCost가 유효하지 않아 예산 범위 내에서 기본값으로 설정했습니다.`);
        }
      }

      return {
        id: scenario.id || `scenario-${index + 1}`,
        name: scenario.name || `시나리오 ${index + 1}`,
        estimatedCost,
        monthlyRevenue: scenario.monthlyRevenue || { min: 0, max: 0 },
        suggestedRooms: scenario.suggestedRooms || 10,
        adr: scenario.adr || { peak: 100000, offPeak: 70000 },
        occupancy: scenario.occupancy || { peak: 70, offPeak: 50 },
        riskLevel: scenario.riskLevel || 'medium',
        operationDifficulty: scenario.operationDifficulty || 'medium',
        keyRisk: scenario.keyRisk || '리스크 분석 필요',
        moodDescription: scenario.moodDescription || '인테리어 컨셉 미정',
        monthlyProfit: scenario.monthlyProfit || { min: 0, max: 0 },
        riskScore: scenario.riskScore || 50,
      };
    });

    // 시나리오가 3개 미만이면 기본 시나리오 추가 (fallback)
    if (scenarios.length < 3) {
      console.warn(`시나리오가 ${scenarios.length}개만 생성되었습니다. 기본 시나리오를 추가합니다.`);
      const range = budgetRange.max - budgetRange.min;
      const defaultScenarios = [
        {
          id: 'conservative',
          name: '안정형',
          estimatedCost: { 
            min: budgetRange.min + Math.floor(range * 0.1), 
            max: budgetRange.min + Math.floor(range * 0.3) 
          },
          monthlyRevenue: { min: 5000000, max: 8000000 },
          monthlyProfit: { min: 2000000, max: 4000000 },
          suggestedRooms: 8,
          adr: { peak: 80000, offPeak: 60000 },
          occupancy: { peak: 70, offPeak: 50 },
          riskLevel: 'low' as const,
          operationDifficulty: 'easy' as const,
          keyRisk: '초기 투자비 회수 기간이 길 수 있음',
          moodDescription: '편안하고 안정적인 분위기',
          riskScore: 30,
        },
        {
          id: 'balanced',
          name: '균형형',
          estimatedCost: { 
            min: budgetRange.min + Math.floor(range * 0.35), 
            max: budgetRange.min + Math.floor(range * 0.65) 
          },
          monthlyRevenue: { min: 8000000, max: 12000000 },
          monthlyProfit: { min: 3500000, max: 6000000 },
          suggestedRooms: 10,
          adr: { peak: 100000, offPeak: 70000 },
          occupancy: { peak: 75, offPeak: 55 },
          riskLevel: 'medium' as const,
          operationDifficulty: 'medium' as const,
          keyRisk: '경쟁 치열 지역의 경우 점유율 확보 어려움',
          moodDescription: '모던하고 트렌디한 분위기',
          riskScore: 50,
        },
        {
          id: 'aggressive',
          name: '성장형',
          estimatedCost: { 
            min: budgetRange.min + Math.floor(range * 0.7), 
            max: budgetRange.max - Math.floor(range * 0.1) 
          },
          monthlyRevenue: { min: 12000000, max: 18000000 },
          monthlyProfit: { min: 5000000, max: 9000000 },
          suggestedRooms: 12,
          adr: { peak: 120000, offPeak: 80000 },
          occupancy: { peak: 80, offPeak: 60 },
          riskLevel: 'high' as const,
          operationDifficulty: 'hard' as const,
          keyRisk: '높은 초기 투자와 운영 비용 부담',
          moodDescription: '럭셔리하고 프리미엄한 분위기',
          riskScore: 70,
        },
      ];
      
      // 기존 시나리오와 기본 시나리오를 병합 (중복 제거)
      const existingIds = new Set(scenarios.map(s => s.id));
      const additionalScenarios = defaultScenarios.filter(s => !existingIds.has(s.id));
      scenarios.push(...additionalScenarios);
      
      // 3개로 제한
      scenarios.splice(3);
    }

    return {
      scenarios: scenarios.slice(0, 3), // 최대 3개까지만 반환
      recommendation: parsedData.recommendation || '추가 분석이 필요합니다.',
      createdAt: new Date(),
    };
  } catch (error) {
    if (error instanceof APIError) {
      throw error;
    }
    throw new APIError(
      `진단 리포트 생성 중 오류가 발생했습니다: ${error instanceof Error ? error.message : '알 수 없는 오류'}`
    );
  }
}

/**
 * 진단 데이터를 프롬프트로 변환
 */
function buildDiagnosisPrompt(data: DiagnosisData): string {
  const locationMap: Record<string, string> = {
    seoul: '서울',
    gyeonggi: '경기/인천',
    gangwon: '강원',
    chungcheong: '충청',
    jeolla: '전라',
    gyeongsang: '경상',
    jeju: '제주',
    undecided: '미정',
  };

  const locationTypeMap: Record<string, string> = {
    tourist: '관광지',
    urban: '도심',
    university: '대학가',
    station: '역세권',
    other: '기타',
  };

  const accommodationTypeMap: Record<string, string> = {
    motel: '모텔',
    pension: '펜션·풀빌라',
    guesthouse: '게스트하우스',
    airbnb: '공유숙박',
    boutique: '소형호텔',
    other: '기타',
  };

  const projectStatusMap: Record<string, string> = {
    searching: '매물 탐색 중',
    planning: '기획 단계',
    design: '설계 단계',
    construction: '시공 단계',
  };

  let prompt = `다음 정보를 바탕으로 숙박업 창업 사전진단 리포트를 생성해주세요:\n\n`;

  prompt += `[프로젝트 현황]\n`;
  prompt += `- 프로젝트 단계: ${projectStatusMap[data.projectStatus] || data.projectStatus}\n`;
  prompt += `- 지역: ${locationMap[data.location.region] || data.location.region}\n`;
  prompt += `- 입지 유형: ${locationTypeMap[data.location.locationType] || data.location.locationType}\n`;
  prompt += `- 숙박 형태: ${accommodationTypeMap[data.accommodationType] || data.accommodationType}\n\n`;

  // 예산 정보를 더 명확하게 변환 (원 단위로도 명시)
  const budgetMap: Record<string, { text: string; min: number; max: number }> = {
    'under-50m': { text: '5천만원 미만', min: 10000000, max: 50000000 }, // 1천만원~5천만원
    '50m-5b': { text: '5천만원~5억원', min: 50000000, max: 500000000 },
    '5b-15b': { text: '5억~15억원', min: 500000000, max: 1500000000 },
    'over-15b': { text: '15억 이상', min: 1500000000, max: 50000000000 },
    'unknown': { text: '미정', min: 0, max: 0 },
  };
  const budgetInfo = budgetMap[data.budget] || { text: data.budget, min: 0, max: 0 };
  
  prompt += `[규모 및 예산]\n`;
  prompt += `- 예상 객실 수: ${data.scale.rooms}\n`;
  prompt += `- 건물 연면적: ${data.scale.area}\n`;
  prompt += `- 건물 층수: ${data.scale.floors}\n`;
  prompt += `- 주차장: ${data.scale.parking}\n`;
  prompt += `- 사용자 예산: ${budgetInfo.text}`;
  if (budgetInfo.max > 0) {
    if (data.budget === 'under-50m') {
      prompt += ` (원 단위: 1천만원 ~ 5천만원 미만, 즉 ${budgetInfo.min.toLocaleString()}원 ~ ${budgetInfo.max.toLocaleString()}원 미만)`;
    } else {
      prompt += ` (원 단위: ${budgetInfo.min.toLocaleString()}원 ~ ${budgetInfo.max.toLocaleString()}원)`;
    }
  }
  prompt += `\n`;
  prompt += `- 건물 매입 포함: ${data.includeBuildingPurchase ? '예' : '아니오'}\n\n`;
  
  if (budgetInfo.max > 0) {
    prompt += `⚠️ 매우 중요: 시나리오의 estimatedCost는 반드시 위의 "사용자 예산" 범위 내에서 제시해야 합니다.\n`;
    if (data.budget === 'under-50m') {
      prompt += `- 사용자 예산이 "5천만원 미만"이므로, estimatedCost.max는 반드시 5천만원(${budgetInfo.max.toLocaleString()}원) 미만이어야 합니다.\n`;
      prompt += `- estimatedCost.min은 ${budgetInfo.min.toLocaleString()}원 이상, estimatedCost.max는 ${budgetInfo.max.toLocaleString()}원 미만이어야 합니다.\n`;
      prompt += `- 예를 들어 안정형 시나리오는 1천만~2천만원, 균형형은 2천만~3천5백만원, 성장형은 3천5백만~4천5백만원 정도로 설정하세요.\n`;
    } else if (data.budget === '5b-15b') {
      prompt += `- estimatedCost.min은 ${budgetInfo.min.toLocaleString()}원 이상이어야 합니다.\n`;
      prompt += `- estimatedCost.max는 ${budgetInfo.max.toLocaleString()}원 이하여야 합니다.\n`;
      prompt += `- 예를 들어 안정형 시나리오는 5억~8억원, 균형형은 8억~12억원, 성장형은 12억~15억원 정도로 설정하세요.\n`;
    } else {
      prompt += `- estimatedCost.min은 ${budgetInfo.min.toLocaleString()}원 이상이어야 합니다.\n`;
      prompt += `- estimatedCost.max는 ${budgetInfo.max.toLocaleString()}원 이하여야 합니다.\n`;
      prompt += `- 각 시나리오는 이 범위 내에서 현실적인 공사비를 계산하세요.\n`;
    }
    prompt += `\n`;
  }

  if (data.targetCustomer) {
    prompt += `[추가 정보]\n`;
    prompt += `- 타겟 고객: ${data.targetCustomer}\n`;
  }
  if (data.concept) {
    prompt += `- 컨셉: ${data.concept}\n`;
  }
  if (data.referenceText) {
    prompt += `- 레퍼런스: ${data.referenceText}\n`;
  }
  if (data.interiorScope) {
    prompt += `- 인테리어 범위: ${data.interiorScope}\n`;
  }
  if (data.buildingCondition) {
    prompt += `- 건물 상태: ${data.buildingCondition}\n`;
  }
  if (data.conditionText) {
    prompt += `- 건물 상태 상세: ${data.conditionText}\n`;
  }

  prompt += `\n위 정보를 바탕으로 현실적이고 실용적인 진단 리포트를 생성해주세요.`;

  return prompt;
}

/**
 * OpenAI DALL-E 3를 사용하여 인테리어 이미지 생성
 * @param prompt 이미지 생성 프롬프트 (영문 권장)
 * @returns 생성된 이미지 URL
 */
export async function generateInteriorImage(prompt: string): Promise<string> {
  const apiKey = OPENAI_API_KEY;
  
  if (!apiKey) {
    throw new APIError('OpenAI API 키가 설정되지 않았습니다.');
  }

  console.log('=== OpenAI DALL-E 3 이미지 생성 시작 ===');
  console.log('프롬프트:', prompt);

  try {
    const response = await fetch(OPENAI_IMAGE_API_URL, {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${apiKey}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        model: 'dall-e-3',
        prompt: prompt,
        n: 1,
        size: '1792x1024', // 16:9 비율, 인테리어에 적합
        quality: 'standard', // 'standard' 또는 'hd' (더 고품질이지만 비용 2배)
        style: 'natural', // 'natural' 또는 'vivid'
      }),
    });

    console.log('응답 상태:', response.status, response.statusText);

    if (!response.ok) {
      const errorData = await response.json().catch(() => ({}));
      console.error('OpenAI 이미지 생성 오류:', errorData);
      
      if (response.status === 401) {
        throw new APIError('OpenAI API 키가 유효하지 않습니다. API 키를 확인하세요.', 401, errorData);
      } else if (response.status === 429) {
        throw new APIError('OpenAI API 사용량을 초과했습니다. 잠시 후 다시 시도해주세요.', 429, errorData);
      } else if (response.status === 400) {
        const errorMessage = (errorData as any)?.error?.message || '프롬프트나 파라미터를 확인하세요.';
        throw new APIError(`이미지 생성 실패: ${errorMessage}`, 400, errorData);
      }
      
      throw new APIError(
        `이미지 생성 실패: ${(errorData as any)?.error?.message || response.statusText}`,
        response.status,
        errorData
      );
    }

    const data = await response.json();
    console.log('OpenAI 응답:', data);

    const imageUrl = data.data?.[0]?.url;
    
    if (!imageUrl) {
      console.error('응답 구조:', JSON.stringify(data, null, 2));
      throw new APIError('생성된 이미지 URL을 찾을 수 없습니다.', 500, data);
    }

    console.log('✅ 이미지 생성 성공:', imageUrl);
    console.log('=== OpenAI DALL-E 3 이미지 생성 완료 ===');
    return imageUrl;

  } catch (error) {
    console.error('=== OpenAI 이미지 생성 실패 ===');
    console.error('에러:', error);
    
    if (error instanceof APIError) {
      throw error;
    }
    
    throw new APIError(
      `인테리어 이미지 생성 중 오류가 발생했습니다: ${error instanceof Error ? error.message : '알 수 없는 오류'}`,
      500,
      error
    );
  }
}

/**
 * OpenAI DALL-E 3 연결 테스트 함수
 * 브라우저 콘솔에서 실행: import { testDALLE3API } from './src/lib/api'; testDALLE3API();
 */
export async function testDALLE3API(): Promise<string> {
  console.log('=== OpenAI DALL-E 3 테스트 시작 ===');
  const apiKey = OPENAI_API_KEY;
  
  console.log('API Key 존재:', !!apiKey);
  console.log('API Key 앞 20자:', apiKey ? apiKey.substring(0, 20) + '...' : '없음');
  
  if (!apiKey) {
    throw new APIError('OpenAI API 키가 설정되지 않았습니다.');
  }

  try {
    // 간단한 테스트 프롬프트로 이미지 생성 시도
    const testPrompt = 'A professional architectural photography of modern hotel lobby interior, minimalist design, natural lighting, wide angle view, photorealistic, high-end interior design magazine quality';
    console.log('테스트 프롬프트:', testPrompt);
    
    const result = await generateInteriorImage(testPrompt);
    console.log('✅ 테스트 성공! 이미지 URL:', result);
    console.log('=== OpenAI DALL-E 3 테스트 완료 ===');
    return result;
  } catch (error) {
    console.error('❌ 테스트 실패:', error);
    throw error;
  }
}

/**
 * 파일을 base64 문자열로 변환
 * @param file 업로드할 파일
 * @returns base64 문자열
 */
export async function uploadImage(file: File): Promise<string> {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();

    reader.onload = () => {
      const result = reader.result;
      if (typeof result === 'string') {
        resolve(result);
      } else {
        reject(new Error('파일 읽기 실패'));
      }
    };

    reader.onerror = () => {
      reject(new Error('파일 읽기 중 오류가 발생했습니다.'));
    };

    reader.readAsDataURL(file);
  });
}

/**
 * 숙박 형태를 영어로 변환
 */
function accommodationTypeToEnglish(type: string): string {
  const map: Record<string, string> = {
    motel: 'modern motel',
    pension: 'pension villa',
    guesthouse: 'guesthouse',
    airbnb: 'shared accommodation',
    boutique: 'boutique hotel',
    other: 'accommodation facility',
  };
  return map[type] || 'accommodation facility';
}

/**
 * 입지 유형을 영어로 변환
 */
function locationTypeToEnglish(type: string): string {
  const map: Record<string, string> = {
    tourist: 'resort area',
    urban: 'city center',
    university: 'university district',
    station: 'transportation hub',
    other: 'commercial area',
  };
  return map[type] || 'commercial area';
}

/**
 * 컨셉을 키워드로 변환 (DALL-E 3 최적화)
 */
function conceptToKeywords(concept: string): string {
  if (concept === 'custom' || concept === 'unknown') {
    return ''; // custom이나 unknown인 경우 빈 문자열 반환
  }
  
  const map: Record<string, string> = {
    minimal: 'minimalist aesthetic, clean lines, neutral palette, uncluttered spaces',
    nature: 'natural materials, wood and stone elements, biophilic design, earth tones',
    luxury: 'luxurious and elegant, refined details, sophisticated palette',
    instagram: 'photogenic and trendy, aesthetic design, statement pieces',
    kitsch: 'playful and eclectic, bold colors, vintage accents, unique character',
  };
  return map[concept] || '';
}

/**
 * 타겟 고객을 분위기로 변환 (DALL-E 3 최적화)
 */
function targetCustomerToMood(targetCustomer?: string): string {
  if (!targetCustomer) return 'comfortable and inviting atmosphere';
  
  const map: Record<string, string> = {
    couple: 'romantic and intimate atmosphere, cozy private spaces',
    family: 'warm and welcoming, spacious family-friendly layout',
    longstay: 'comfortable and practical, residential feel',
    group: 'social and communal, open gathering spaces',
    unknown: 'comfortable and inviting atmosphere',
  };
  return map[targetCustomer] || 'comfortable and inviting atmosphere';
}

/**
 * 예산 수준에 따른 스타일 키워드
 */
function budgetToStyleLevel(budget: string): string {
  const map: Record<string, string> = {
    'under-50m': 'economy, practical',
    '50m-5b': 'mid-range, balanced',
    '5b-15b': 'premium, high-quality',
    'over-15b': 'luxury, exclusive',
    'unknown': 'balanced',
  };
  return map[budget] || 'balanced';
}

/**
 * 객실 규모에 따른 공간 키워드
 */
function roomsToSpaceKeywords(rooms: string): string {
  if (rooms === '10' || rooms === '10-20') {
    return 'compact, efficient space';
  } else if (rooms === '20-30') {
    return 'spacious, well-planned layout';
  }
  return 'well-designed interior';
}

/**
 * 한글 텍스트를 영문 키워드로 변환
 */
function translateToEnglish(text: string): string {
  // 한글 키워드 매핑
  const translations: Record<string, string> = {
    '화이트': 'white',
    '톤': 'tone',
    '미니멀': 'minimal',
    '미니멀한': 'minimal',
    '대형': 'large',
    '창문': 'windows',
    '자연': 'natural',
    '채광': 'lighting',
    '나무': 'wood',
    '돌': 'stone',
    '친화': 'friendly',
    '친화적': 'eco-friendly',
    '디자인': 'design',
    '스타일': 'style',
    '깔끔': 'clean',
    '깔끔한': 'clean',
    '모던': 'modern',
    '모던한': 'modern',
    '럭셔리': 'luxury',
    '럭셔리한': 'luxury',
    '프리미엄': 'premium',
    '고급': 'high-end',
    '고급스러운': 'sophisticated',
    '우아한': 'elegant',
    '세련된': 'refined',
    '트렌디': 'trendy',
    '트렌디한': 'trendy',
    '인스타': 'Instagram',
    '감성': 'aesthetic',
    '감성적인': 'aesthetic',
    '아늑한': 'cozy',
    '편안한': 'comfortable',
    '따뜻한': 'warm',
    '밝은': 'bright',
    '어두운': 'dark',
    '따뜻함': 'warmth',
    '밝음': 'brightness',
  };
  
  let result = text;
  // 한글 키워드를 영문으로 변환
  Object.entries(translations).forEach(([ko, en]) => {
    const regex = new RegExp(ko, 'g');
    result = result.replace(regex, en);
  });
  
  return result;
}

/**
 * 한글 레퍼런스에서 주요 키워드 추출 및 영문 변환
 */
function extractEnglishKeywords(koreanText: string): string {
  // 한글이 포함되어 있으면 주요 키워드를 영문으로 변환
  if (!/[ㄱ-ㅎ|ㅏ-ㅣ|가-힣]/.test(koreanText)) {
    return ''; // 이미 영문이면 빈 문자열 반환
  }
  
  // 간단한 키워드 추출 및 변환
  const translated = translateToEnglish(koreanText);
  
  // 일반적인 인테리어 키워드 추가
  const commonKeywords: string[] = [];
  
  if (koreanText.includes('화이트') || koreanText.includes('흰색')) {
    commonKeywords.push('white tone', 'light color palette');
  }
  if (koreanText.includes('미니멀')) {
    commonKeywords.push('minimalist aesthetic', 'clean lines', 'uncluttered');
  }
  if (koreanText.includes('자연') || koreanText.includes('나무') || koreanText.includes('돌')) {
    commonKeywords.push('natural materials', 'organic elements', 'biophilic design');
  }
  if (koreanText.includes('대형') || koreanText.includes('창문')) {
    commonKeywords.push('large windows', 'natural daylight', 'open feel');
  }
  if (koreanText.includes('럭셔리') || koreanText.includes('고급')) {
    commonKeywords.push('luxurious', 'premium finishes', 'sophisticated');
  }
  
  return commonKeywords.length > 0 ? commonKeywords.join(', ') : translated;
}

/**
 * 기본 컨셉 자동 생성 (컨셉/레퍼런스가 없을 때)
 */
function generateDefaultConcept(
  accommodationType: string,
  locationType: string,
  targetCustomer?: string
): string {
  // 숙박 유형별 기본 컨셉
  const accomConceptMap: Record<string, string> = {
    motel: 'clean and efficient modern design, practical layout',
    pension: 'cozy and warm natural design, comfortable atmosphere',
    guesthouse: 'friendly and welcoming design, communal spaces',
    airbnb: 'stylish and Instagram-worthy design, unique character',
    boutique: 'sophisticated and distinctive design, curated aesthetics',
    other: 'modern and comfortable design',
  };
  
  // 입지별 추가 키워드
  const locationKeywordMap: Record<string, string> = {
    tourist: 'resort-style, vacation vibes',
    urban: 'contemporary urban, city chic',
    university: 'young and fresh, modern minimal',
    station: 'sleek and convenient, business casual',
    other: '',
  };
  
  const baseConcept = accomConceptMap[accommodationType] || 'modern and comfortable design';
  const locationKeyword = locationKeywordMap[locationType] || '';
  
  return `${baseConcept}${locationKeyword ? ', ' + locationKeyword : ''}`;
}

/**
 * DALL-E 3용 인테리어 이미지 생성 프롬프트 생성
 * @param diagnosisData 사용자 입력 데이터
 * @param scenarioType 시나리오 타입
 * @param scenarioName 시나리오 이름 (안정형, 균형형, 성장형 등)
 * @param moodDescription 시나리오의 무드 설명
 */
function generateInteriorPrompt(
  diagnosisData: DiagnosisData,
  scenarioType: 'conservative' | 'balanced' | 'aggressive',
  scenarioName: string,
  moodDescription: string
): string {
  // 기본 정보
  const accomType = accommodationTypeToEnglish(diagnosisData.accommodationType);
  const locationType = locationTypeToEnglish(diagnosisData.location.locationType);
  const roomsKeyword = roomsToSpaceKeywords(diagnosisData.scale.rooms);
  const budgetStyle = budgetToStyleLevel(diagnosisData.budget);
  
  // 기본 컨셉 결정 - 우선순위별 조합
  let baseConceptDescription = '';
  
  const hasReference = diagnosisData.referenceText && 
    diagnosisData.referenceText.trim() !== '' && 
    !diagnosisData.referenceText.includes('[이미지 첨부]');
  const hasConcept = diagnosisData.concept && 
    diagnosisData.concept !== 'unknown' && 
    diagnosisData.concept !== 'custom';
  
  if (hasReference && hasConcept) {
    // 둘 다 있으면 조합
    const refText = diagnosisData.referenceText.replace(/\[이미지 첨부\]/g, '').trim();
    const conceptKeywords = conceptToKeywords(diagnosisData.concept);
    
    // 한글 레퍼런스가 있으면 영문 키워드 추가
    const englishKeywords = extractEnglishKeywords(refText);
    
    if (conceptKeywords) {
      if (englishKeywords) {
        baseConceptDescription = `${englishKeywords}, incorporating ${conceptKeywords}`;
      } else {
        baseConceptDescription = `${refText}, incorporating ${conceptKeywords}`;
      }
    } else {
      baseConceptDescription = englishKeywords || refText;
    }
  } else if (hasReference) {
    // 레퍼런스만 있음
    const refText = diagnosisData.referenceText.replace(/\[이미지 첨부\]/g, '').trim();
    const englishKeywords = extractEnglishKeywords(refText);
    baseConceptDescription = englishKeywords || refText;
  } else if (hasConcept) {
    // 컨셉만 있음
    const conceptKw = conceptToKeywords(diagnosisData.concept);
    baseConceptDescription = conceptKw || 'modern and clean design';
  } else {
    // 둘 다 없음 - 자동 생성
    baseConceptDescription = generateDefaultConcept(
      diagnosisData.accommodationType,
      diagnosisData.location.locationType,
      diagnosisData.targetCustomer
    );
  }
  
  // 타겟에 따른 분위기
  const targetMood = diagnosisData.targetCustomer 
    ? targetCustomerToMood(diagnosisData.targetCustomer)
    : 'comfortable and inviting atmosphere';
  
  // 시나리오별 스타일 차별화
  let styleDescription = '';
  let designApproach = '';
  
  switch (scenarioType) {
    case 'conservative':
      styleDescription = 'stable and proven design';
      designApproach = 'classic and timeless interior';
      break;
    case 'balanced':
      styleDescription = 'modern and sophisticated design';
      designApproach = 'trendy yet practical interior';
      break;
    case 'aggressive':
      styleDescription = 'original and bold design';
      designApproach = 'innovative and distinctive interior';
      break;
  }
  
  // 사용자 예산 수준에 따른 기본 재료/마감재 수준 결정
  const userBudgetLevel = diagnosisData.budget;
  
  // 시나리오별 예산 범위 내에서 저/중/고 차별화
  // 예: 사용자 예산 5억~15억 → 안정형(5~7억/저), 균형형(7~10억/중), 공격형(10~15억/고)
  let budgetTier = ''; // 저/중/고 예산 티어
  let floorMaterial = '';
  let wallFinish = '';
  let fixtureLevel = '';
  let furnitureStyle = '';
  let lightingDesign = '';
  
  // 사용자 예산 범위 내에서 시나리오별 차별화
  switch (scenarioType) {
    case 'conservative': // 안정형 - 사용자 예산 범위 내 저예산
      budgetTier = 'budget tier (lower range within user budget)';
      
      switch (userBudgetLevel) {
        case 'under-50m':
          floorMaterial = 'budget vinyl flooring in light oak or gray finish';
          wallFinish = 'simple white painted walls, minimal texture, basic drywall';
          fixtureLevel = 'standard chrome faucets and handles, basic white tiles';
          furnitureStyle = 'affordable minimalist furniture, IKEA-style, flat pack assembly, simple clean lines';
          lightingDesign = 'basic recessed LED lighting, simple pendant lights, standard track lighting';
          break;
        case '50m-5b':
          floorMaterial = 'quality vinyl plank flooring in light oak or beige finish';
          wallFinish = 'clean white painted walls with minimal texture, simple accent wall';
          fixtureLevel = 'standard modern chrome faucets and handles, ceramic white tiles';
          furnitureStyle = 'affordable contemporary furniture, simple clean lines, budget-friendly pieces';
          lightingDesign = 'basic recessed LED lighting, simple pendant lights, wall sconces';
          break;
        case '5b-15b':
          floorMaterial = 'quality vinyl plank flooring in light oak finish';
          wallFinish = 'clean white painted walls with minimal texture';
          fixtureLevel = 'standard modern chrome faucets and handles';
          furnitureStyle = 'affordable minimalist furniture, simple clean lines';
          lightingDesign = 'basic recessed LED lighting, simple pendant lights';
          break;
        case 'over-15b':
          floorMaterial = 'engineered hardwood flooring in light oak finish';
          wallFinish = 'clean white painted walls, subtle texture';
          fixtureLevel = 'standard brushed nickel fixtures';
          furnitureStyle = 'mid-range minimalist furniture, clean lines';
          lightingDesign = 'recessed LED lighting, simple designer pendant lights';
          break;
        default:
          floorMaterial = 'quality vinyl flooring';
          wallFinish = 'clean painted walls';
          fixtureLevel = 'standard modern fixtures';
          furnitureStyle = 'affordable contemporary furniture';
          lightingDesign = 'basic LED lighting';
          break;
      }
      break;
      
    case 'balanced': // 균형형 - 사용자 예산 범위 내 중예산
      budgetTier = 'mid-range tier (middle range within user budget)';
      
      switch (userBudgetLevel) {
        case 'under-50m':
          floorMaterial = 'quality vinyl plank flooring in oak or gray finish';
          wallFinish = 'painted walls with accent wallpaper, subtle texture';
          fixtureLevel = 'brushed nickel fixtures, ceramic designer tiles';
          furnitureStyle = 'mid-range contemporary furniture, some custom joinery, tasteful details';
          lightingDesign = 'recessed LED lighting, designer pendant lights, accent lighting';
          break;
        case '50m-5b':
          floorMaterial = 'engineered hardwood flooring in oak or walnut finish';
          wallFinish = 'painted walls with accent wallpaper, textured finishes';
          fixtureLevel = 'brushed nickel or matte black fixtures, quartz countertops, ceramic designer tiles';
          furnitureStyle = 'mid-range contemporary furniture, some custom joinery, tasteful details';
          lightingDesign = 'recessed LED lighting, designer pendant lights, wall sconces, accent lighting';
          break;
        case '5b-15b':
          floorMaterial = 'engineered hardwood flooring in oak or walnut finish';
          wallFinish = 'painted walls with accent wallpaper, textured finishes';
          fixtureLevel = 'brushed nickel or matte black fixtures, quartz countertops, ceramic designer tiles';
          furnitureStyle = 'mid-range contemporary furniture, some custom joinery, tasteful details';
          lightingDesign = 'recessed LED lighting, designer pendant lights, wall sconces, accent lighting';
          break;
        case 'over-15b':
          floorMaterial = 'solid oak or engineered hardwood flooring in rich finish';
          wallFinish = 'painted walls with designer wallpaper, textured finishes';
          fixtureLevel = 'brass or matte black designer fixtures, quartz countertops, luxury tiles';
          furnitureStyle = 'high-end contemporary furniture, custom joinery, designer pieces';
          lightingDesign = 'sophisticated LED lighting system, designer pendant lights, wall sconces, accent lighting';
          break;
        default:
          floorMaterial = 'engineered hardwood flooring';
          wallFinish = 'painted walls with accent details';
          fixtureLevel = 'modern designer fixtures';
          furnitureStyle = 'mid-range contemporary furniture';
          lightingDesign = 'well-designed LED lighting';
          break;
      }
      break;
      
    case 'aggressive': // 공격형 - 사용자 예산 범위 내 고예산
      budgetTier = 'premium tier (upper range within user budget)';
      
      switch (userBudgetLevel) {
        case 'under-50m':
          floorMaterial = 'engineered hardwood flooring in premium finish';
          wallFinish = 'painted walls with designer wallpaper, textured finishes';
          fixtureLevel = 'brushed nickel designer fixtures, quartz countertops';
          furnitureStyle = 'mid-range designer furniture, custom elements, enhanced details';
          lightingDesign = 'sophisticated LED lighting, designer pendant lights, accent lighting';
          break;
        case '50m-5b':
          floorMaterial = 'engineered hardwood or luxury vinyl in premium finish';
          wallFinish = 'painted walls with designer wallpaper, textured finishes, accent features';
          fixtureLevel = 'brass or matte black designer fixtures, quartz countertops, luxury tiles';
          furnitureStyle = 'high-end contemporary furniture, custom joinery, designer elements';
          lightingDesign = 'sophisticated LED lighting system, designer pendant lights, wall sconces, accent lighting';
          break;
        case '5b-15b':
          floorMaterial = 'solid oak or walnut hardwood flooring in rich finish';
          wallFinish = 'venetian plaster walls or designer wallpaper, textured finishes, accent features';
          fixtureLevel = 'brass or matte black designer fixtures, natural marble or quartz, porcelain luxury tiles';
          furnitureStyle = 'bespoke custom furniture, built-in cabinetry, designer pieces, premium finishes';
          lightingDesign = 'sophisticated LED lighting system, designer pendant lights, wall sconces, accent lighting, dimmable';
          break;
        case 'over-15b':
          floorMaterial = 'solid oak or walnut hardwood flooring, natural marble accents';
          wallFinish = 'venetian plaster walls, designer wallpaper, textured finishes, accent features';
          fixtureLevel = 'brass or matte black designer fixtures, natural marble or granite, porcelain luxury tiles';
          furnitureStyle = 'bespoke custom furniture, built-in cabinetry, designer pieces, luxury touches';
          lightingDesign = 'sophisticated LED lighting system, designer pendant lights, wall sconces, accent lighting, dimmable, smart controls';
          break;
        default:
          floorMaterial = 'premium hardwood flooring';
          wallFinish = 'designer wall finishes';
          fixtureLevel = 'designer fixtures';
          furnitureStyle = 'high-end custom furniture';
          lightingDesign = 'sophisticated lighting design';
          break;
      }
      break;
  }
  
  // DALL-E 3 최적화 프롬프트 (영문)
  // 구조화된 프롬프트로 더 명확한 이미지 생성
  const finalPrompt = `Professional architectural interior photography.

SPACE: ${accomType}, ${locationType} location
CONCEPT: ${baseConceptDescription}
ATMOSPHERE: ${targetMood}
SCALE: ${roomsKeyword}

BUDGET TIER: ${budgetTier}
FLOOR: ${floorMaterial}
WALLS: ${wallFinish}
FIXTURES: ${fixtureLevel}
FURNITURE: ${furnitureStyle}
LIGHTING: ${lightingDesign}

Korean modern hospitality design aesthetic, natural daylight, wide angle architectural view, photorealistic rendering, professional interior photography, magazine quality, 8K resolution.`;

  // 상세 로깅
  console.log(`=== ${scenarioType.toUpperCase()} 시나리오 프롬프트 (${scenarioName}) ===`);
  console.log('입력 데이터:');
  console.log('  - 사용자 예산:', diagnosisData.budget || '없음');
  console.log('  - referenceText:', diagnosisData.referenceText || '없음');
  console.log('  - concept:', diagnosisData.concept || '없음');
  console.log('  - 최종 컨셉:', baseConceptDescription);
  console.log('예산 반영:');
  console.log('  - 예산 수준:', userBudgetLevel);
  console.log('  - 예산 티어:', budgetTier);
  console.log('  - 바닥재:', floorMaterial);
  console.log('  - 벽면:', wallFinish);
  console.log('  - 설비:', fixtureLevel);
  console.log('  - 가구:', furnitureStyle);
  console.log('  - 조명:', lightingDesign);
  console.log('생성된 프롬프트:', finalPrompt);
  console.log('='.repeat(80));

  return finalPrompt.trim().replace(/\s+/g, ' '); // 공백 정리
}

/**
 * 시나리오별 인테리어 이미지 생성
 * @param diagnosisData 사용자 입력 데이터
 * @param scenario 시나리오 데이터
 * @param scenarioIndex 시나리오 인덱스 (0: 안정형, 1: 균형형, 2: 성장형)
 * @returns 생성된 이미지 URL
 */
export async function generateScenarioImage(
  diagnosisData: DiagnosisData,
  scenario: Scenario,
  scenarioIndex: number
): Promise<string> {
  // 시나리오 타입 결정
  const scenarioType = scenarioIndex === 0 ? 'conservative' 
                     : scenarioIndex === 1 ? 'balanced' 
                     : 'aggressive';
  
  // DALL-E 3 프롬프트 생성
  const prompt = generateInteriorPrompt(
    diagnosisData,
    scenarioType,
    scenario.name,
    scenario.moodDescription
  );
  
  console.log(`[DALL-E 3 프롬프트] ${scenario.name}:`, prompt);
  
  return generateInteriorImage(prompt);
}

