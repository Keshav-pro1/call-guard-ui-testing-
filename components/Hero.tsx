
import React, { Suspense } from 'react';
import ThreeScene from './ThreeScene';

const Hero: React.FC = () => {
  return (
    <section className="relative h-screen w-full flex items-center overflow-hidden bg-black">
      {/* Three.js Background Component */}
      <div className="absolute inset-0 z-0 opacity-80">
        <Suspense fallback={<div className="w-full h-full bg-black animate-pulse" />}>
          <ThreeScene />
        </Suspense>
      </div>

      <div className="relative z-10 max-w-7xl mx-auto px-6 w-full pointer-events-none">
        <div className="max-w-3xl">
          <h1 className="text-6xl md:text-8xl font-light tracking-tighter text-white leading-[0.8] mb-12">
            CallGuard
          </h1>
          <p className="text-gray-400 text-base md:text-xl max-w-xl mb-12 leading-relaxed font-light">
            Design an Auto-QA system that evaluates 100% of customer support calls, scores them across quality dimensions, and generates agent-level + city-level coaching insights.
          </p>
          <div className="flex flex-wrap gap-6 pointer-events-auto">
            <button className="relative group overflow-hidden px-10 py-5 bg-white text-black rounded-full font-bold uppercase tracking-widest text-[10px] transition-all duration-500 hover:shadow-[0_0_40px_rgba(255,255,255,0.2)]">
              <span className="relative z-10 transition-colors duration-500">View Deliverables</span>
              <div className="absolute inset-0 bg-gray-200 translate-y-full group-hover:translate-y-0 transition-transform duration-500"></div>
            </button>
            <button className="px-10 py-5 bg-white/[0.03] border border-white/10 text-white rounded-full font-bold uppercase tracking-widest text-[10px] hover:bg-white/[0.08] transition-all backdrop-blur-sm hover:border-white/20">
              Evaluation Focus
            </button>
          </div>
        </div>
      </div>

      <div className="absolute bottom-10 left-1/2 -translate-x-1/2 flex flex-col items-center gap-2 text-gray-600 animate-bounce pointer-events-none">
        <span className="text-[10px] uppercase tracking-widest font-bold">Scroll</span>
        <div className="w-px h-12 bg-gradient-to-b from-gray-600 to-transparent"></div>
      </div>

      {/* Aesthetic Overlay */}
      <div className="absolute inset-0 bg-gradient-to-b from-black via-transparent to-black pointer-events-none opacity-80"></div>

      {/* Premium Light Leaks */}
      <div className="absolute top-[20%] right-[10%] w-[40vw] h-[40vw] bg-white/[0.03] rounded-full blur-[120px] pointer-events-none animate-pulse" style={{ animationDuration: '8s' }}></div>
      <div className="absolute bottom-[20%] left-[5%] w-[30vw] h-[30vw] bg-white/[0.02] rounded-full blur-[100px] pointer-events-none animate-pulse" style={{ animationDuration: '12s' }}></div>
    </section>
  );
};

export default Hero;
