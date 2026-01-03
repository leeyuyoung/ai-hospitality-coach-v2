import { useDiagnosisFlow } from '@/hooks/useDiagnosisFlow';
import LandingScreen from '@/components/diagnosis/LandingScreen';
import ChatbotScreen from '@/components/diagnosis/ChatbotScreen';
import LoadingScreen from '@/components/diagnosis/LoadingScreen';
import ReportPreview from '@/components/diagnosis/ReportPreview';
import BookingScreen from '@/components/diagnosis/BookingScreen';
import UnlockedReport from '@/components/diagnosis/UnlockedReport';

const Index = () => {
  const {
    currentStep,
    setCurrentStep,
    diagnosisData,
    updateDiagnosisData,
    reportData,
    contactInfo,
    isGeneratingImages,
    imageGenerationProgress,
    startDiagnosis,
    generateReport,
    goToBooking,
    submitBooking,
    resetFlow,
  } = useDiagnosisFlow();

  const renderStep = () => {
    switch (currentStep) {
      case 'landing':
        return <LandingScreen onStart={startDiagnosis} />;
      
      case 'chatbot':
        return (
          <ChatbotScreen
            diagnosisData={diagnosisData}
            onUpdateData={updateDiagnosisData}
            onComplete={generateReport}
            onBack={() => setCurrentStep('landing')}
          />
        );
      
      case 'loading':
        return (
          <LoadingScreen 
            isGeneratingImages={isGeneratingImages}
            imageProgress={imageGenerationProgress}
          />
        );
      
      case 'preview':
        return reportData ? (
          <ReportPreview
            reportData={reportData}
            onBookConsultation={goToBooking}
          />
        ) : null;
      
      case 'booking':
        return (
          <BookingScreen
            onBack={() => setCurrentStep('preview')}
            onSubmit={submitBooking}
          />
        );
      
      case 'unlocked':
        return reportData ? (
          <UnlockedReport
            reportData={reportData}
            contactInfo={contactInfo}
            onReset={resetFlow}
          />
        ) : null;
      
      default:
        return <LandingScreen onStart={startDiagnosis} />;
    }
  };

  return (
    <div className="min-h-screen bg-background">
      {renderStep()}
    </div>
  );
};

export default Index;
