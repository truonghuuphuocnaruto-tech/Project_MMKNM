import React from 'react';
import '../styles/story-tokens.css';
import { StoryHeader } from '../components/story/StoryHeader';
import { HeroScene } from '../components/story/HeroScene';
import { PressureScenario } from '../components/story/PressureScenario';
import { VerifySequence } from '../components/story/VerifySequence';
import { ProductFlow } from '../components/story/ProductFlow';
import { DemoLimitations } from '../components/story/DemoLimitations';
import { SafetyChecklist } from '../components/story/SafetyChecklist';
import { PrivacySection } from '../components/story/PrivacySection';
import { StoryFooter } from '../components/story/StoryFooter';

interface ProductStoryPageProps {
  onNavigate: (to: string) => void;
}

export const ProductStoryPage: React.FC<ProductStoryPageProps> = ({ onNavigate }) => {
  return (
    <div className="story-theme min-h-screen flex flex-col font-sans selection:bg-[#0f766e] selection:text-white">
      {/* Accessibility skip link */}
      <a
        href="#story-main"
        className="sr-only focus:not-sr-only focus:absolute focus:top-2 focus:left-2 focus:z-50 focus:px-4 focus:py-2 focus:bg-[#0f766e] focus:text-white focus:rounded-md"
      >
        Chuyển đến nội dung chính
      </a>

      {/* Fixed Sticky Header */}
      <StoryHeader onNavigate={onNavigate} />

      {/* Main Story Content */}
      <main id="story-main" className="flex-1 w-full">
        {/* Hero Section */}
        <HeroScene onNavigate={onNavigate} />

        {/* Fictional Scenario */}
        <PressureScenario />

        {/* Verification Narrative Motion Sequence */}
        <VerifySequence />

        {/* Product Flow (What the local tool does) */}
        <ProductFlow onNavigate={onNavigate} />

        {/* Honest Limitations & Boundaries */}
        <DemoLimitations />

        {/* Safety Checklist Takeaway */}
        <SafetyChecklist />

        {/* Privacy & Safe Local Architecture */}
        <PrivacySection />
      </main>

      {/* Story Footer with CTA, Official Citations, and Independence Disclaimers */}
      <StoryFooter onNavigate={onNavigate} />
    </div>
  );
};
