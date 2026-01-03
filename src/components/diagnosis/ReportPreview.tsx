import { Button } from '@/components/ui/button';
import { ReportData, Scenario } from '@/types/diagnosis';
import { Lock, ArrowRight, TrendingUp, AlertTriangle, Building2, Users, CheckCircle2 } from 'lucide-react';
import scenarioLuxury from '@/assets/scenario-luxury.jpg';
import scenarioStandard from '@/assets/scenario-standard.jpg';
import scenarioNature from '@/assets/scenario-nature.jpg';

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

const scenarioImages: Record<string, string> = {
  'scenario-1': scenarioLuxury,
  'scenario-2': scenarioStandard,
  'scenario-3': scenarioNature,
};

interface ReportPreviewProps {
  reportData: ReportData;
  onBookConsultation: () => void;
}

const ReportPreview = ({ reportData, onBookConsultation }: ReportPreviewProps) => {
  const { scenarios, recommendation } = reportData;

  return (
    <div className="min-h-screen pb-32">
      {/* Header */}
      <header className="py-6 px-6 border-b border-border/50">
        <div className="max-w-5xl mx-auto">
          <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-primary/10 border border-primary/30 text-primary text-xs mb-4">
            <CheckCircle2 className="w-3 h-3" />
            AI 분석 완료
          </div>
          <h1 className="text-2xl md:text-3xl font-bold text-foreground">
            AI 사전진단 리포트
          </h1>
          <p className="text-muted-foreground mt-2">
            입력하신 정보를 바탕으로 3가지 시나리오를 분석했습니다
          </p>
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

      {/* Scenario Cards */}
      <section className="py-6 px-6">
        <div className="max-w-5xl mx-auto">
          <h2 className="text-xl font-bold text-foreground mb-6">시나리오별 분석</h2>
          <div className="grid md:grid-cols-3 gap-4">
            {scenarios.map((scenario, index) => (
              <ScenarioCard 
                key={scenario.id} 
                scenario={scenario} 
                isRecommended={index === 0}
              />
            ))}
          </div>
        </div>
      </section>

      {/* Comparison Table */}
      <section className="py-6 px-6">
        <div className="max-w-5xl mx-auto">
          <h2 className="text-xl font-bold text-foreground mb-6">시나리오 비교</h2>
          <div className="glass-card rounded-xl overflow-hidden">
            <div className="overflow-x-auto">
              <table className="w-full">
                <thead>
                  <tr className="border-b border-border">
                    <th className="text-left p-4 text-sm font-medium text-muted-foreground">항목</th>
                    {scenarios.map((s, index) => (
                      <th key={s.id} className={`text-center p-4 text-sm font-medium ${index === 0 ? 'bg-primary/5 text-foreground' : 'text-foreground'}`}>
                        {s.name}
                      </th>
                    ))}
                  </tr>
                </thead>
                <tbody>
                  <TableRow 
                    label="예상 공사비" 
                    values={scenarios.map(s => formatCost(s.estimatedCost.min, s.estimatedCost.max))} 
                    highlight
                  />
                  <TableRow 
                    label="월 매출" 
                    values={scenarios.map(s => `${(s.monthlyRevenue.min / 10000).toLocaleString()}~${(s.monthlyRevenue.max / 10000).toLocaleString()}만`)} 
                    highlight
                  />
                  <TableRow 
                    label="월 순이익" 
                    values={scenarios.map(s => `${(s.monthlyProfit.min / 10000).toLocaleString()}~${(s.monthlyProfit.max / 10000).toLocaleString()}만`)} 
                    highlight
                  />
                  <TableRow 
                    label="리스크 점수" 
                    values={scenarios.map(s => `${s.riskScore}/100`)} 
                  />
                  <TableRow 
                    label="운영 난이도" 
                    values={scenarios.map(s => ({
                      easy: '쉬움',
                      medium: '보통',
                      hard: '어려움',
                    }[s.operationDifficulty]))} 
                  />
                </tbody>
              </table>
            </div>
          </div>
        </div>
      </section>

      {/* Locked Content Preview */}
      <section className="py-6 px-6">
        <div className="max-w-5xl mx-auto">
          <h2 className="text-xl font-bold text-foreground mb-6">상세 분석 (잠금)</h2>
          <div className="grid md:grid-cols-2 gap-4">
            <LockedCard 
              icon={<Building2 className="w-5 h-5" />}
              title="공사비 세부 내역"
              description="공종별, 자재별 상세 견적 및 산출 근거"
            />
            <LockedCard 
              icon={<AlertTriangle className="w-5 h-5" />}
              title="리스크 체크리스트"
              description="인허가, 시설기준, 법규 체크리스트"
            />
            <LockedCard 
              icon={<TrendingUp className="w-5 h-5" />}
              title="마케팅 전략"
              description="채널별 예상 비용 및 효과 분석"
            />
            <LockedCard 
              icon={<Users className="w-5 h-5" />}
              title="운영 가이드"
              description="인력 구성, 운영 비용 상세 분석"
            />
          </div>
        </div>
      </section>

      {/* Trust Indicators */}
      <section className="py-6 px-6">
        <div className="max-w-5xl mx-auto">
          <div className="glass-card rounded-xl p-6">
            <h3 className="font-semibold text-foreground mb-4">분석 기준 안내</h3>
            <ul className="space-y-2 text-sm text-muted-foreground">
              <li className="flex items-start gap-2">
                <span className="text-primary">•</span>
                수익 계산은 <strong className="text-foreground">월 20일 가동</strong> 기준 보수적으로 산출됨
              </li>
              <li className="flex items-start gap-2">
                <span className="text-primary">•</span>
                공사비에는 <strong className="text-foreground">설계비, 감리비 미포함</strong>
              </li>
              <li className="flex items-start gap-2">
                <span className="text-primary">•</span>
                실제 비용은 현장 조건에 따라 <strong className="text-foreground">±20% 변동</strong> 가능
              </li>
              <li className="flex items-start gap-2">
                <span className="text-primary">•</span>
                인허가, 철거비 등 <strong className="text-foreground">추가비 발생 가능</strong> 구간 존재
              </li>
            </ul>
          </div>
        </div>
      </section>

      {/* Floating CTA */}
      <div className="fixed bottom-0 left-0 right-0 p-4 bg-gradient-to-t from-background via-background to-transparent">
        <div className="max-w-2xl mx-auto">
          <div className="glass-card rounded-2xl p-4 border-primary/30">
            <div className="flex flex-col md:flex-row items-center gap-4">
              <div className="flex-1 text-center md:text-left">
                <p className="font-semibold text-foreground">상담 예약 시 전체 리포트를 확인할 수 있습니다</p>
                <p className="text-sm text-muted-foreground">세부 내역, 체크리스트, 상담용 브리프까지</p>
              </div>
              <Button variant="cta" size="lg" onClick={onBookConsultation}>
                리포트 기반 상담 예약하기
                <ArrowRight className="w-5 h-5" />
              </Button>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

const ScenarioCard = ({ scenario, isRecommended }: { scenario: Scenario; isRecommended: boolean }) => {
  // Krea API로 생성된 이미지가 있으면 우선 사용, 없으면 기본 이미지 사용
  const scenarioImage = scenario.imageUrl || scenarioImages[scenario.id] || scenarioLuxury;
  const isGeneratedImage = !!scenario.imageUrl;
  
  return (
    <div className={`glass-card rounded-xl overflow-hidden ${isRecommended ? 'border-[6px] border-primary ring-[6px] ring-primary/50 bg-primary/10' : 'border border-border'}`}>
      {/* Scenario Image */}
      <div className={`relative overflow-hidden ${isRecommended ? 'h-40' : 'h-36'}`}>
        <img 
          src={scenarioImage} 
          alt={`${scenario.name} 컨셉 이미지`}
          className="w-full h-full object-cover"
        />
        <div className="absolute inset-0 bg-gradient-to-t from-background/90 via-background/30 to-transparent" />
        <div className="absolute bottom-3 left-4 right-4">
          {isRecommended && (
            <div className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-full bg-primary/90 text-primary-foreground text-sm font-semibold mb-1">
              <CheckCircle2 className="w-4 h-4" />
              추천
            </div>
          )}
          <h3 className={`text-lg ${isRecommended ? 'font-extrabold' : 'font-bold'} text-foreground`}>{scenario.name}</h3>
        </div>
        {!isGeneratedImage && (
          <div className="absolute top-2 right-2">
            <span className="px-2 py-1 rounded text-[10px] bg-background/80 text-muted-foreground">
              예시 이미지
            </span>
          </div>
        )}
      </div>

      <div className={`space-y-3 ${isRecommended ? 'p-6' : 'p-5'}`}>
        <div>
          <p className="text-xs text-muted-foreground">예상 공사비</p>
          <p className="text-foreground font-semibold">
            {formatCost(scenario.estimatedCost.min, scenario.estimatedCost.max)}
          </p>
        </div>
        <div>
          <p className="text-xs text-muted-foreground">월 수익 (보수적)</p>
          <p className="text-primary font-semibold">
            {(scenario.monthlyRevenue.min / 10000).toLocaleString()}~{(scenario.monthlyRevenue.max / 10000).toLocaleString()}만원
          </p>
        </div>
        <div>
          <p className="text-xs text-muted-foreground">적정 객실 수</p>
          <p className="text-foreground font-semibold">{scenario.suggestedRooms}실</p>
        </div>
        <div className="grid grid-cols-2 gap-2 text-sm">
          <div>
            <p className="text-xs text-muted-foreground">ADR (성수기)</p>
            <p className="text-foreground">{scenario.adr.peak.toLocaleString()}원</p>
          </div>
          <div>
            <p className="text-xs text-muted-foreground">점유율 (성수기)</p>
            <p className="text-foreground">{scenario.occupancy.peak}%</p>
          </div>
        </div>

        <div className="pt-3 border-t border-border">
          <div className="flex items-start gap-2">
            <AlertTriangle className={`w-4 h-4 flex-shrink-0 mt-0.5 ${
              scenario.riskLevel === 'low' ? 'text-green-500' :
              scenario.riskLevel === 'medium' ? 'text-yellow-500' : 'text-red-500'
            }`} />
            <div>
              <p className="text-xs text-muted-foreground">핵심 리스크</p>
              <p className="text-sm text-foreground">{scenario.keyRisk}</p>
              <p className="text-xs text-primary mt-1">→ 상담에서 해결 방안 제시</p>
            </div>
          </div>
        </div>

        <div className="p-3 bg-secondary/50 rounded-lg">
          <p className="text-xs text-muted-foreground mb-1">컨셉 무드</p>
          <p className="text-sm text-foreground">{scenario.moodDescription}</p>
        </div>
      </div>
    </div>
  );
};

const TableRow = ({ label, values, highlight }: { label: string; values: string[]; highlight?: boolean }) => (
  <tr className="border-b border-border/50">
    <td className="p-4 text-sm text-muted-foreground">{label}</td>
    {values.map((value, index) => (
      <td key={index} className={`p-4 text-center text-sm ${index === 0 ? 'bg-primary/5' : ''} ${highlight ? 'text-primary font-semibold' : 'text-foreground'}`}>
        {value}
      </td>
    ))}
  </tr>
);

const LockedCard = ({ icon, title, description }: { icon: React.ReactNode; title: string; description: string }) => (
  <div className="glass-card rounded-xl p-5 relative overflow-hidden">
    <div className="absolute inset-0 bg-gradient-to-t from-background/90 to-transparent pointer-events-none" />
    <div className="absolute top-3 right-3">
      <Lock className="w-4 h-4 text-muted-foreground" />
    </div>
    <div className="flex items-start gap-3 opacity-50">
      <div className="w-10 h-10 rounded-lg bg-secondary flex items-center justify-center flex-shrink-0">
        {icon}
      </div>
      <div>
        <h4 className="font-medium text-foreground">{title}</h4>
        <p className="text-sm text-muted-foreground mt-1">{description}</p>
      </div>
    </div>
  </div>
);

export default ReportPreview;
