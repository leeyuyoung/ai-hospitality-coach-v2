import { Button } from '@/components/ui/button';
import { ReportData, Scenario } from '@/types/diagnosis';
import { 
  Download, 
  RefreshCw, 
  CheckCircle2, 
  TrendingUp, 
  AlertTriangle, 
  Building2, 
  FileText,
  Banknote,
  ClipboardCheck,
  Megaphone,
  Users
} from 'lucide-react';

/**
 * 금액을 적절한 단위로 포맷팅
 * 1억원 미만: 천만원 단위, 1억원 이상: 억 단위
 */
const formatCost = (min: number, max: number): string => {
  const minInHundredMillion = min / 100000000;
  const maxInHundredMillion = max / 100000000;
  
  // 1억원 미만인 경우 천만원 단위로 표시
  if (maxInHundredMillion < 1) {
    const minInTenMillion = Math.round(min / 10000000);
    const maxInTenMillion = Math.round(max / 10000000);
    return `${minInTenMillion}~${maxInTenMillion}천만원`;
  }
  
  // 1억원 이상인 경우 억 단위로 표시
  const minRounded = Math.round(minInHundredMillion);
  const maxRounded = Math.round(maxInHundredMillion);
  return `${minRounded}~${maxRounded}억원`;
};

interface UnlockedReportProps {
  reportData: ReportData;
  contactInfo: { name: string; phone: string; email: string };
  onReset: () => void;
}

const UnlockedReport = ({ reportData, contactInfo, onReset }: UnlockedReportProps) => {
  const { scenarios, recommendation } = reportData;

  const handleDownload = () => {
    // In a real app, this would generate and download a PDF
    alert('PDF 다운로드 기능은 실제 서비스에서 구현됩니다.');
  };

  return (
    <div className="min-h-screen pb-12">
      {/* Header */}
      <header className="py-6 px-6 border-b border-border/50">
        <div className="max-w-5xl mx-auto">
          <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4">
            <div>
              <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-green-500/10 border border-green-500/30 text-green-500 text-xs mb-4">
                <CheckCircle2 className="w-3 h-3" />
                상담 예약 완료
              </div>
              <h1 className="text-2xl md:text-3xl font-bold text-foreground">
                전체 리포트 (Unlocked)
              </h1>
              <p className="text-muted-foreground mt-2">
                {contactInfo.name}님, 전문가가 곧 연락드릴 예정입니다
              </p>
            </div>
            <div className="flex gap-3">
              <Button variant="outline" onClick={onReset}>
                <RefreshCw className="w-4 h-4" />
                다시 진단하기
              </Button>
              <Button variant="cyan" onClick={handleDownload}>
                <Download className="w-4 h-4" />
                브리프 다운로드
              </Button>
            </div>
          </div>
        </div>
      </header>

      {/* Recommendation */}
      <section className="py-6 px-6">
        <div className="max-w-5xl mx-auto">
          <div className="glass-card rounded-xl p-6 border-primary/30">
            <div className="flex items-start gap-4">
              <div className="w-10 h-10 rounded-lg bg-primary/10 flex items-center justify-center flex-shrink-0">
                <TrendingUp className="w-5 h-5 text-primary" />
              </div>
              <div>
                <h2 className="font-semibold text-foreground mb-1">AI 추천</h2>
                <p className="text-muted-foreground">{recommendation}</p>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Scenario Cards - Full Version */}
      <section className="py-6 px-6">
        <div className="max-w-5xl mx-auto">
          <h2 className="text-xl font-bold text-foreground mb-6">시나리오별 상세 분석</h2>
          <div className="grid md:grid-cols-3 gap-4">
            {scenarios.map((scenario, index) => (
              <FullScenarioCard 
                key={scenario.id} 
                scenario={scenario} 
                isRecommended={index === 0}
              />
            ))}
          </div>
        </div>
      </section>

      {/* Detailed Sections */}
      <section className="py-6 px-6">
        <div className="max-w-5xl mx-auto space-y-6">
          {/* Budget Breakdown */}
          <DetailSection
            icon={<Banknote className="w-5 h-5" />}
            title="예산 설계 근거 및 산식"
          >
            <div className="space-y-4">
              <div className="grid md:grid-cols-2 gap-4">
                <div className="p-4 bg-secondary/50 rounded-lg">
                  <p className="text-sm text-muted-foreground mb-2">기본 산출 공식</p>
                  <p className="text-foreground font-mono text-sm">
                    공사비 = 연면적(평) × 평당 단가 × 난이도 계수
                  </p>
                </div>
                <div className="p-4 bg-secondary/50 rounded-lg">
                  <p className="text-sm text-muted-foreground mb-2">적용된 평당 단가</p>
                  <p className="text-foreground">
                    숙박시설 기준 <span className="text-primary font-semibold">350~550만원/평</span>
                  </p>
                </div>
              </div>
              <div className="p-4 bg-destructive/10 border border-destructive/30 rounded-lg">
                <div className="flex items-start gap-2">
                  <AlertTriangle className="w-4 h-4 text-destructive flex-shrink-0 mt-0.5" />
                  <div>
                    <p className="text-sm font-medium text-foreground">누락·추가비 경고</p>
                    <p className="text-sm text-muted-foreground mt-1">
                      철거비(노후 건물 시 +15~20%), 인허가 비용(건축허가 시 +5~10%), 
                      예비비(총 공사비의 10~15%) 별도 발생 가능
                    </p>
                  </div>
                </div>
              </div>
            </div>
          </DetailSection>

          {/* Cost Breakdown */}
          <DetailSection
            icon={<Building2 className="w-5 h-5" />}
            title="공사비 세부 내역"
          >
            <div className="overflow-x-auto">
              <table className="w-full text-sm">
                <thead>
                  <tr className="border-b border-border">
                    <th className="text-left py-3 text-muted-foreground font-medium">공종</th>
                    <th className="text-right py-3 text-muted-foreground font-medium">비중</th>
                    <th className="text-right py-3 text-muted-foreground font-medium">예상 비용</th>
                  </tr>
                </thead>
                <tbody>
                  <CostRow label="철거 및 구조보강" percentage={8} cost="1,440만~2,000만" />
                  <CostRow label="설비공사 (전기/기계)" percentage={25} cost="4,500만~6,250만" />
                  <CostRow label="마감공사 (바닥/벽/천장)" percentage={30} cost="5,400만~7,500만" />
                  <CostRow label="가구 및 FF&E" percentage={20} cost="3,600만~5,000만" />
                  <CostRow label="외관 및 사인물" percentage={10} cost="1,800만~2,500만" />
                  <CostRow label="기타 (예비비 포함)" percentage={7} cost="1,260만~1,750만" />
                </tbody>
              </table>
            </div>
          </DetailSection>

          {/* Checklist */}
          <DetailSection
            icon={<ClipboardCheck className="w-5 h-5" />}
            title="인허가·시설 체크리스트"
          >
            <div className="grid md:grid-cols-2 gap-4">
              <ChecklistCategory 
                title="건축 인허가"
                items={[
                  '건축물 용도변경 허가',
                  '소방시설 완공검사',
                  '숙박업 영업신고',
                  '위생관리등급 인증',
                ]}
              />
              <ChecklistCategory 
                title="시설 기준"
                items={[
                  '객실 최소면적 (7㎡ 이상)',
                  '비상조명 및 피난유도',
                  '화재경보기 및 소화기',
                  '환기설비 기준 충족',
                ]}
              />
              <ChecklistCategory 
                title="안전 기준"
                items={[
                  '구조안전 진단서',
                  '내진설계 검토',
                  '피난계단 설치',
                  '장애인 편의시설',
                ]}
              />
              <ChecklistCategory 
                title="운영 준비"
                items={[
                  '숙박업 등록증',
                  '영업배상책임보험',
                  '개인정보처리방침',
                  '소방안전관리자 선임',
                ]}
              />
            </div>
          </DetailSection>

          {/* Marketing Strategy */}
          <DetailSection
            icon={<Megaphone className="w-5 h-5" />}
            title="마케팅 전략 및 비용"
          >
            <div className="grid md:grid-cols-3 gap-4">
              <MarketingCard 
                channel="OTA 플랫폼"
                description="야놀자, 여기어때 입점"
                monthlyBudget="수수료 15~20%"
                expectedEffect="예약의 60~70%"
              />
              <MarketingCard 
                channel="SNS 마케팅"
                description="인스타그램, 네이버 블로그"
                monthlyBudget="월 50~100만원"
                expectedEffect="브랜딩 + 직접예약 증가"
              />
              <MarketingCard 
                channel="네이버 플레이스"
                description="지도 노출 최적화"
                monthlyBudget="월 30~50만원"
                expectedEffect="지역 검색 유입"
              />
            </div>
          </DetailSection>

          {/* Operations Guide */}
          <DetailSection
            icon={<Users className="w-5 h-5" />}
            title="운영 인력 및 비용"
          >
            <div className="grid md:grid-cols-2 gap-6">
              <div>
                <h4 className="font-medium text-foreground mb-3">인력 구성 (권장)</h4>
                <div className="space-y-2">
                  <StaffRow role="운영 매니저" count={1} cost="월 300~350만원" />
                  <StaffRow role="하우스키핑" count={2} cost="월 400~500만원" />
                  <StaffRow role="야간 프론트" count={1} cost="월 250~300만원" />
                </div>
              </div>
              <div>
                <h4 className="font-medium text-foreground mb-3">월 고정비용</h4>
                <div className="space-y-2">
                  <FixedCostRow item="인건비" cost="950~1,150만원" />
                  <FixedCostRow item="공과금 (전기/수도/가스)" cost="150~250만원" />
                  <FixedCostRow item="어메니티/소모품" cost="80~120만원" />
                  <FixedCostRow item="플랫폼 수수료" cost="매출의 15~20%" />
                </div>
              </div>
            </div>
          </DetailSection>
        </div>
      </section>

      {/* Download Section */}
      <section className="py-8 px-6">
        <div className="max-w-5xl mx-auto">
          <div className="glass-card rounded-xl p-8 border-primary/30 text-center">
            <FileText className="w-12 h-12 text-primary mx-auto mb-4" />
            <h3 className="text-xl font-bold text-foreground mb-2">상담용 브리프 PDF</h3>
            <p className="text-muted-foreground mb-6 max-w-md mx-auto">
              이 리포트의 모든 내용을 정리한 PDF를 다운로드하고, 상담 시 활용하세요
            </p>
            <Button variant="cta" size="lg" onClick={handleDownload}>
              <Download className="w-5 h-5" />
              브리프 다운로드 (PDF)
            </Button>
          </div>
        </div>
      </section>
    </div>
  );
};

const FullScenarioCard = ({ scenario, isRecommended }: { scenario: Scenario; isRecommended: boolean }) => (
  <div className={`glass-card rounded-xl p-5 ${isRecommended ? 'border-[6px] border-primary ring-[6px] ring-primary/50 bg-primary/10' : ''}`}>
    {isRecommended && (
      <div className="inline-flex items-center gap-1 px-2 py-1 rounded-full bg-primary/10 text-primary text-xs mb-3">
        <CheckCircle2 className="w-3 h-3" />
        추천
      </div>
    )}
    <h3 className="text-lg font-bold text-foreground mb-4">{scenario.name}</h3>
    
    <div className="space-y-3">
      <div>
        <p className="text-xs text-muted-foreground">예상 공사비</p>
        <p className="text-foreground font-semibold">
          {formatCost(scenario.estimatedCost.min, scenario.estimatedCost.max)}
        </p>
      </div>
      <div>
        <p className="text-xs text-muted-foreground">월 매출</p>
        <p className="text-primary font-semibold">
          {(scenario.monthlyRevenue.min / 10000).toLocaleString()}~{(scenario.monthlyRevenue.max / 10000).toLocaleString()}만원
        </p>
      </div>
      <div>
        <p className="text-xs text-muted-foreground">월 순이익</p>
        <p className="text-green-500 font-semibold">
          {(scenario.monthlyProfit.min / 10000).toLocaleString()}~{(scenario.monthlyProfit.max / 10000).toLocaleString()}만원
        </p>
      </div>
      <div>
        <p className="text-xs text-muted-foreground">적정 객실 수</p>
        <p className="text-foreground">{scenario.suggestedRooms}실</p>
      </div>
      <div className="grid grid-cols-2 gap-2 text-sm">
        <div>
          <p className="text-xs text-muted-foreground">ADR</p>
          <p className="text-foreground">
            {scenario.adr.offPeak.toLocaleString()}~{scenario.adr.peak.toLocaleString()}원
          </p>
        </div>
        <div>
          <p className="text-xs text-muted-foreground">점유율</p>
          <p className="text-foreground">
            {scenario.occupancy.offPeak}~{scenario.occupancy.peak}%
          </p>
        </div>
      </div>
    </div>

    <div className="mt-4 pt-4 border-t border-border">
      <div className="flex items-center gap-2 mb-2">
        <span className={`w-2 h-2 rounded-full ${
          scenario.riskLevel === 'low' ? 'bg-green-500' :
          scenario.riskLevel === 'medium' ? 'bg-yellow-500' : 'bg-red-500'
        }`} />
        <span className="text-sm text-foreground">
          리스크: {scenario.riskLevel === 'low' ? '낮음' : scenario.riskLevel === 'medium' ? '보통' : '높음'}
        </span>
      </div>
      <p className="text-sm text-muted-foreground">{scenario.keyRisk}</p>
    </div>
  </div>
);

const DetailSection = ({ icon, title, children }: { icon: React.ReactNode; title: string; children: React.ReactNode }) => (
  <div className="glass-card rounded-xl p-6">
    <div className="flex items-center gap-3 mb-6">
      <div className="w-10 h-10 rounded-lg bg-primary/10 flex items-center justify-center text-primary">
        {icon}
      </div>
      <h3 className="text-lg font-bold text-foreground">{title}</h3>
    </div>
    {children}
  </div>
);

const CostRow = ({ label, percentage, cost }: { label: string; percentage: number; cost: string }) => (
  <tr className="border-b border-border/50">
    <td className="py-3 text-foreground">{label}</td>
    <td className="py-3 text-right text-muted-foreground">{percentage}%</td>
    <td className="py-3 text-right text-primary font-medium">{cost}</td>
  </tr>
);

const ChecklistCategory = ({ title, items }: { title: string; items: string[] }) => (
  <div className="p-4 bg-secondary/50 rounded-lg">
    <h4 className="font-medium text-foreground mb-3">{title}</h4>
    <ul className="space-y-2">
      {items.map((item, index) => (
        <li key={index} className="flex items-center gap-2 text-sm text-muted-foreground">
          <div className="w-4 h-4 rounded border border-border flex items-center justify-center">
            <div className="w-2 h-2 rounded-sm bg-primary/50" />
          </div>
          {item}
        </li>
      ))}
    </ul>
  </div>
);

const MarketingCard = ({ channel, description, monthlyBudget, expectedEffect }: {
  channel: string;
  description: string;
  monthlyBudget: string;
  expectedEffect: string;
}) => (
  <div className="p-4 bg-secondary/50 rounded-lg">
    <h4 className="font-medium text-foreground mb-1">{channel}</h4>
    <p className="text-sm text-muted-foreground mb-3">{description}</p>
    <div className="space-y-1 text-sm">
      <p><span className="text-muted-foreground">예산:</span> <span className="text-primary">{monthlyBudget}</span></p>
      <p><span className="text-muted-foreground">효과:</span> <span className="text-foreground">{expectedEffect}</span></p>
    </div>
  </div>
);

const StaffRow = ({ role, count, cost }: { role: string; count: number; cost: string }) => (
  <div className="flex items-center justify-between py-2 border-b border-border/30">
    <div className="flex items-center gap-2">
      <span className="text-foreground">{role}</span>
      <span className="text-xs text-muted-foreground">({count}명)</span>
    </div>
    <span className="text-primary">{cost}</span>
  </div>
);

const FixedCostRow = ({ item, cost }: { item: string; cost: string }) => (
  <div className="flex items-center justify-between py-2 border-b border-border/30">
    <span className="text-foreground">{item}</span>
    <span className="text-primary">{cost}</span>
  </div>
);

export default UnlockedReport;
