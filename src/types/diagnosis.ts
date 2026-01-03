export interface DiagnosisData {
  // 필수 입력
  projectStatus: string;
  location: {
    region: string;
    locationType: string;
  };
  accommodationType: string;
  scale: {
    rooms: string;
    area: string;
    floors: string;
    parking: string;
  };
  budget: string;
  includeBuildingPurchase: boolean;
  
  // 선택 입력
  targetCustomer?: string;
  concept?: string;
  referenceText?: string;
  interiorScope?: string;
  buildingCondition?: string;
  conditionText?: string;
}

export interface Scenario {
  id: string;
  name: string;
  estimatedCost: { min: number; max: number };
  monthlyRevenue: { min: number; max: number };
  suggestedRooms: number;
  adr: { peak: number; offPeak: number };
  occupancy: { peak: number; offPeak: number };
  riskLevel: 'low' | 'medium' | 'high';
  operationDifficulty: 'easy' | 'medium' | 'hard';
  keyRisk: string;
  moodDescription: string;
  monthlyProfit: { min: number; max: number };
  riskScore: number;
  imageUrl?: string; // Krea API로 생성된 인테리어 이미지 URL
}

export interface ReportData {
  scenarios: Scenario[];
  recommendation: string;
  createdAt: Date;
}

export interface ChatMessage {
  id: string;
  type: 'ai' | 'user';
  content: string;
  options?: ChatOption[];
  inputType?: 'button' | 'card' | 'dropdown' | 'radio' | 'chip' | 'text' | 'toggle' | 'textWithImage';
  field?: keyof DiagnosisData | string;
  skippable?: boolean;
  allowTextInput?: boolean;
  allowImageUpload?: boolean;
}

export interface ChatOption {
  label: string;
  value: string;
  description?: string;
  icon?: string;
}

export type FlowStep = 
  | 'landing'
  | 'chatbot'
  | 'loading'
  | 'preview'
  | 'booking'
  | 'unlocked'
  | 'download'
  | 'error';
