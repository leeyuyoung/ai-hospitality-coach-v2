import { Button } from '@/components/ui/button';
import { ArrowRight, Building2, TrendingUp, Shield, CheckCircle2, AlertTriangle } from 'lucide-react';
import { Scenario } from '@/types/diagnosis';

interface LandingScreenProps {
  onStart: () => void;
}

/**
 * 금액을 적절한 단위로 포맷팅
 */
const formatCost = (min: number, max: number): string => {
  const minInHundredMillion = min / 100000000;
  const maxInHundredMillion = max / 100000000;
  
  if (maxInHundredMillion < 1) {
    const minInTenMillion = Math.round(min / 10000000);
    const maxInTenMillion = Math.round(max / 10000000);
    return `${minInTenMillion}~${maxInTenMillion}천만원`;
  }
  
  const minRounded = Math.round(minInHundredMillion);
  const maxRounded = Math.round(maxInHundredMillion);
  return `${minRounded}~${maxRounded}억원`;
};

// 더미 시나리오 데이터
const dummyScenarios: Scenario[] = [
  {
    id: 'scenario-1',
    name: '안정형',
    estimatedCost: { min: 500000000, max: 700000000 },
    monthlyRevenue: { min: 8000000, max: 12000000 },
    monthlyProfit: { min: 3000000, max: 6000000 },
    suggestedRooms: 12,
    adr: { peak: 120000, offPeak: 80000 },
    occupancy: { peak: 75, offPeak: 50 },
    riskLevel: 'low',
    operationDifficulty: 'easy',
    keyRisk: '초기 투자비 회수 기간이 길 수 있음',
    moodDescription: '편안하고 안정적인 분위기',
    riskScore: 35,
    imageUrl: 'https://images.unsplash.com/photo-1631049307264-da0ec9d70304?w=800',
  },
  {
    id: 'scenario-2',
    name: '균형형',
    estimatedCost: { min: 700000000, max: 1000000000 },
    monthlyRevenue: { min: 12000000, max: 18000000 },
    monthlyProfit: { min: 5000000, max: 9000000 },
    suggestedRooms: 15,
    adr: { peak: 150000, offPeak: 100000 },
    occupancy: { peak: 80, offPeak: 60 },
    riskLevel: 'medium',
    operationDifficulty: 'medium',
    keyRisk: '경쟁 치열 지역의 경우 점유율 확보 어려움',
    moodDescription: '모던하고 트렌디한 분위기',
    riskScore: 50,
    imageUrl: 'https://images.unsplash.com/photo-1618221195710-dd6b41faaea6?w=800',
  },
  {
    id: 'scenario-3',
    name: '공격형',
    estimatedCost: { min: 1000000000, max: 1500000000 },
    monthlyRevenue: { min: 18000000, max: 25000000 },
    monthlyProfit: { min: 8000000, max: 13000000 },
    suggestedRooms: 20,
    adr: { peak: 200000, offPeak: 130000 },
    occupancy: { peak: 85, offPeak: 65 },
    riskLevel: 'high',
    operationDifficulty: 'hard',
    keyRisk: '높은 초기 투자와 운영 비용 부담',
    moodDescription: '럭셔리하고 프리미엄한 분위기',
    riskScore: 70,
    imageUrl: 'https://images.unsplash.com/photo-1582719478250-c89cae4dc85b?w=800',
  },
];

const LandingScreen = ({ onStart }: LandingScreenProps) => {
  return (
    <div className="min-h-screen flex flex-col">
      {/* Header */}
      <header className="fixed top-0 left-0 right-0 z-50 bg-black">
        <div className="max-w-[1750px] mx-auto h-[80px] flex items-center justify-between px-6 md:px-8">
          {/* Logo */}
          <a href="/" className="flex items-center">
            <img 
              src="/logo_text.svg" 
              alt="SPACE PLANNING" 
              className="h-8"
            />
          </a>
          
          {/* Desktop Navigation */}
          <nav className="hidden md:flex items-center gap-8">
            <a 
              href="#" 
              onClick={(e) => e.preventDefault()}
              className="text-white text-[19px] hover:opacity-70 transition-opacity cursor-pointer"
            >
              Project
            </a>
            <a 
              href="#" 
              onClick={(e) => e.preventDefault()}
              className="text-white text-[19px] hover:opacity-70 transition-opacity cursor-pointer"
            >
              About
            </a>
            <a 
              href="#" 
              onClick={(e) => e.preventDefault()}
              className="text-white text-[19px] hover:opacity-70 transition-opacity cursor-pointer"
            >
              Service
            </a>
            <a 
              href="#" 
              onClick={(e) => e.preventDefault()}
              className="text-white text-[19px] hover:opacity-70 transition-opacity cursor-pointer"
            >
              Insight
            </a>
            <a 
              href="#" 
              onClick={(e) => e.preventDefault()}
              className="text-white text-[19px] hover:opacity-70 transition-opacity cursor-pointer"
            >
              Seminar
            </a>
            <a 
              href="#" 
              onClick={(e) => e.preventDefault()}
              className="text-white text-[19px] hover:opacity-70 transition-opacity cursor-pointer"
            >
              Career
            </a>
            <a 
              href="#" 
              onClick={(e) => e.preventDefault()}
              className="text-white text-[19px] hover:opacity-70 transition-opacity cursor-pointer"
            >
              Contact
            </a>
          </nav>
          
          {/* Mobile menu button */}
          <button className="md:hidden text-white">
            <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 6h16M4 12h16M4 18h16" />
            </svg>
          </button>
        </div>
      </header>
      
      {/* Spacer for fixed header */}
      <div className="h-[80px]" />

      {/* Hero */}
      <main className="flex-1 flex items-center justify-center px-6 pt-[100px] pb-12">
        <div className="max-w-4xl mx-auto text-center">
          <div className="inline-flex items-center gap-2 px-4 py-2 rounded-full bg-primary/10 border border-primary/30 text-primary text-sm mb-8 animate-fade-in">
            <span className="w-2 h-2 rounded-full bg-primary animate-pulse" />
            AI 기반 무료 사전진단
          </div>
          
          <h1 className="text-4xl md:text-6xl font-bold text-foreground mb-6 leading-tight animate-slide-up">
            숙박업 창업,<br />
            <span className="text-gradient">3분만에 수익성 진단 리포트</span>받으세요
          </h1>
          
          <p className="text-lg md:text-xl text-muted-foreground mb-10 max-w-2xl mx-auto animate-slide-up" style={{ animationDelay: '0.1s' }}>
            예상 비용, 월 수익, 리스크까지 <br className="md:hidden" />
            AI가 시나리오별로 분석해 드립니다
          </p>

          <Button 
            variant="cta" 
            size="xl" 
            onClick={onStart}
            className="animate-slide-up"
            style={{ animationDelay: '0.2s' }}
          >
            간이 진단 시작하기
            <ArrowRight className="w-5 h-5" />
          </Button>

          <p className="text-sm text-muted-foreground mt-4 animate-fade-in" style={{ animationDelay: '0.3s' }}>
            약 3~5분 소요 · 무료 · 회원가입 불필요
          </p>

          <a
            href="https://spaceplanning.co.kr/contact"
            target="_blank"
            rel="noopener noreferrer"
            className="mt-6 inline-block px-8 py-3 text-white/90 border border-white/30 rounded-full bg-white/5 backdrop-blur-sm hover:bg-white/10 transition-all duration-300 text-sm font-medium animate-fade-in"
            style={{ animationDelay: '0.4s' }}
          >
            진단 없이 전문가 문의
          </a>
        </div>
      </main>

      {/* Features */}
      <section className="pt-12 pb-32 px-6">
        <div className="max-w-5xl mx-auto grid md:grid-cols-3 gap-8">
          <FeatureCard
            icon={<TrendingUp className="w-6 h-6" />}
            title="수익 시뮬레이션"
            description="ADR, 점유율 기반 월별 수익을 시나리오별로 비교"
          />
          <FeatureCard
            icon={<Building2 className="w-6 h-6" />}
            title="공사비 예측"
            description="규모와 컨셉에 맞는 공사비 범위 산출"
          />
          <FeatureCard
            icon={<Shield className="w-6 h-6" />}
            title="리스크 분석"
            description="입지, 시장, 운영 리스크를 사전에 체크"
          />
        </div>
      </section>

      {/* Report Preview Section */}
      <section className="pt-24 pb-16 px-6 border-t border-border/50">
        <div className="max-w-5xl mx-auto">
          <div className="text-center mb-12">
            <h2 className="text-3xl md:text-4xl font-bold text-foreground mb-4">
              이런 리포트를 받으실 수 있어요
            </h2>
            <p className="text-lg text-muted-foreground">
              AI가 분석한 3가지 시나리오를 한눈에 비교해보세요
            </p>
          </div>

          {/* Recommendation */}
          <div className="mb-8">
            <div className="glass-card rounded-xl p-6 border-primary/30">
              <div className="flex items-start gap-4">
                <div className="w-10 h-10 rounded-lg bg-primary/10 flex items-center justify-center flex-shrink-0">
                  <TrendingUp className="w-5 h-5 text-primary" />
                </div>
                <div>
                  <h3 className="font-semibold text-foreground mb-1">AI 추천</h3>
                  <p className="text-muted-foreground">입지와 예산을 고려한 최적의 시나리오를 제안해드립니다</p>
                </div>
              </div>
            </div>
          </div>

          {/* Scenario Cards */}
          <div className="mb-8">
            <h3 className="text-xl font-bold text-foreground mb-6">시나리오별 분석</h3>
            <div className="grid md:grid-cols-3 gap-4">
              {dummyScenarios.map((scenario, index) => (
                <PreviewScenarioCard 
                  key={scenario.id} 
                  scenario={scenario} 
                  isRecommended={index === 0}
                />
              ))}
            </div>
          </div>

          {/* Comparison Table with Fade Effect */}
          <div className="relative">
            <div className="mb-6">
              <h3 className="text-xl font-bold text-foreground">시나리오 비교</h3>
            </div>
            <div className="glass-card rounded-xl overflow-hidden">
              <div className="overflow-x-auto">
                <table className="w-full">
                  <thead>
                    <tr className="border-b border-border">
                      <th className="text-left p-4 text-sm font-medium text-muted-foreground">항목</th>
                      {dummyScenarios.map((s, index) => (
                        <th key={s.id} className={`text-center p-4 text-sm font-medium ${index === 0 ? 'bg-primary/5 text-foreground' : 'text-foreground'}`}>
                          {s.name}
                        </th>
                      ))}
                    </tr>
                  </thead>
                  <tbody>
                    <PreviewTableRow 
                      label="예상 공사비" 
                      values={dummyScenarios.map(s => formatCost(s.estimatedCost.min, s.estimatedCost.max))} 
                      highlight
                    />
                    <PreviewTableRow 
                      label="월 매출" 
                      values={dummyScenarios.map(s => `${(s.monthlyRevenue.min / 10000).toLocaleString()}~${(s.monthlyRevenue.max / 10000).toLocaleString()}만`)} 
                      highlight
                    />
                    <PreviewTableRow 
                      label="월 순이익" 
                      values={dummyScenarios.map(s => `${(s.monthlyProfit.min / 10000).toLocaleString()}~${(s.monthlyProfit.max / 10000).toLocaleString()}만`)} 
                      highlight
                    />
                    <PreviewTableRow 
                      label="리스크 점수" 
                      values={dummyScenarios.map(s => `${s.riskScore}/100`)} 
                    />
                  </tbody>
                </table>
              </div>
            </div>
            {/* Fade overlay - 테이블 중간부터 아래로 갈수록 어두워지는 효과 */}
            <div className="absolute inset-x-0 bottom-0 h-64 bg-gradient-to-b from-transparent via-background/50 to-background pointer-events-none" />
          </div>

          {/* CTA Button */}
          <div className="text-center mt-12">
            <Button 
              variant="cta" 
              size="lg" 
              onClick={onStart}
            >
              내 숙박업 진단 받기
              <ArrowRight className="w-5 h-5" />
            </Button>
          </div>
        </div>
      </section>

      {/* Footer */}
      <footer className="py-6 px-8 border-t border-border/50 text-center text-sm text-muted-foreground">
        © 2024 스페이스플래닝. All rights reserved.
      </footer>
    </div>
  );
};

const FeatureCard = ({ icon, title, description }: { icon: React.ReactNode; title: string; description: string }) => (
  <div className="glass-card rounded-xl p-6 hover:border-primary/30 transition-colors">
    <div className="w-12 h-12 rounded-lg bg-primary/10 flex items-center justify-center text-primary mb-4">
      {icon}
    </div>
    <h3 className="font-semibold text-foreground mb-2">{title}</h3>
    <p className="text-sm text-muted-foreground">{description}</p>
  </div>
);

const PreviewScenarioCard = ({ scenario, isRecommended }: { scenario: Scenario; isRecommended: boolean }) => {
  return (
    <div className={`glass-card rounded-xl overflow-hidden ${isRecommended ? 'border-[6px] border-primary ring-[6px] ring-primary/50 bg-primary/10' : 'border border-border'}`}>
      {/* Scenario Image */}
      <div className={`relative overflow-hidden ${isRecommended ? 'h-40' : 'h-36'}`}>
        <img 
          src={scenario.imageUrl} 
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
          <h4 className={`text-lg ${isRecommended ? 'font-extrabold' : 'font-bold'} text-foreground`}>{scenario.name}</h4>
        </div>
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

const PreviewTableRow = ({ label, values, highlight }: { label: string; values: string[]; highlight?: boolean }) => (
  <tr className="border-b border-border/50">
    <td className="p-4 text-sm text-muted-foreground">{label}</td>
    {values.map((value, index) => (
      <td key={index} className={`p-4 text-center text-sm ${index === 0 ? 'bg-primary/5' : ''} ${highlight ? 'text-primary font-semibold' : 'text-foreground'}`}>
        {value}
      </td>
    ))}
  </tr>
);

export default LandingScreen;
