import React, { useState } from 'react';
import { BrowserRouter as Router, Routes, Route, Link } from 'react-router-dom';
import Header from './components/Header';
import Hero from './components/Hero';
import Services from './components/Services';
import AIChat from './components/AIChat';
import ScrollReveal from './components/ScrollReveal';
import Footer from './components/Footer';
import ServicesPage from './components/ServicesPage';
import ContactPage from './components/ContactPage';
import CallAnalysisPage from './components/CallAnalysisPage';
import LongCallsAnalysisPage from './components/LongCallsAnalysisPage';
import SOPManagerPage from './components/SOPManagerPage';
import CoachingPage from './components/CoachingPage';
import { AuthProvider } from './components/AuthContext';
import Auth from './components/Auth';

const Home: React.FC = () => (
  <main>
    <Hero />

    <section id="services-preview" className="py-24 relative overflow-hidden">
      {/* Mid Video Background */}
      <div className="absolute inset-0 z-0">
        <video
          autoPlay
          loop
          muted
          playsInline
          className="w-full h-full object-cover opacity-30"
        >
          <source src="/hero-loop.mp4" type="video/mp4" />
        </video>
        <div className="absolute inset-0 bg-gradient-to-b from-black via-black/50 to-black"></div>
      </div>

      <div className="max-w-7xl mx-auto px-6 relative z-10">
        <ScrollReveal>
          <div className="mb-20">
            <h2 className="text-4xl md:text-5xl font-light tracking-tight text-white mb-4">
              What the <span className="font-semibold">System Must Evaluate</span>
            </h2>
            <div className="h-px w-24 bg-white/20"></div>
            <p className="mt-6 text-gray-400 max-w-xl text-lg leading-relaxed font-light">
              Script adherence, sentiment trajectory, resolution correctness vs Battery Smart SOPs, coaching insights, and supervisor flags for urgent review.
            </p>
          </div>
        </ScrollReveal>
        <Services />
        <div className="mt-16 flex justify-center">
          <Link to="/services" className="text-[10px] uppercase tracking-widest font-bold text-white border-b border-white pb-1 hover:text-gray-400 hover:border-gray-400 transition-all">
            View All Deliverables
          </Link>
        </div>
      </div>
    </section>

    <section id="philosophy" className="py-24 bg-[#050505]">
      <div className="max-w-7xl mx-auto px-6 grid md:grid-cols-2 gap-16 items-center">
        <ScrollReveal delay={200}>
          <div className="relative group">
            <video
              autoPlay
              loop
              muted
              playsInline
              className="rounded-2xl saturate-0 group-hover:saturate-100 transition-all duration-1000 object-cover w-full h-[600px] shadow-2xl opacity-90"
            >
              <source src="/human2.mp4" type="video/mp4" />
            </video>
            <div className="absolute inset-0 border border-white/5 rounded-2xl pointer-events-none"></div>
          </div>
        </ScrollReveal>

        <div className="space-y-8">
          <ScrollReveal delay={400}>
            <div>
              <span className="text-xs uppercase tracking-widest text-gray-500 mb-4 block font-bold">Evaluation Focus</span>
              <h2 className="text-4xl md:text-5xl font-extrabold text-white mb-8 leading-tight">
                Evaluation <span className="font-light italic">Focus</span>.
              </h2>
              <p className="text-gray-400 mb-8 text-lg leading-relaxed font-light">
                We prioritize practical scoring design, ensure explainability so agents trust the system, and generate actionable coaching insights rather than generic feedback.
              </p>
            </div>
          </ScrollReveal>

          <div className="space-y-4">
            {[
              { label: "Practical Scoring", desc: "Design that is useful and not overly theoretical." },
              { label: "Explainability & Trust", desc: "QA outputs that agents can understand and trust." },
              { label: "Actionable Insights", desc: "Specific coaching points and risk prioritization." }
            ].map((item, idx) => (
              <ScrollReveal key={idx} delay={500 + (idx * 150)}>
                <div className="flex gap-4 p-4 rounded-xl border border-white/5 bg-black hover:border-white/20 transition-colors shadow-sm">
                  <div className="w-1.5 h-1.5 bg-white rounded-full mt-2"></div>
                  <div>
                    <h4 className="font-semibold text-white">{item.label}</h4>
                    <p className="text-sm text-gray-400 font-light">{item.desc}</p>
                  </div>
                </div>
              </ScrollReveal>
            ))}
          </div>
        </div>
      </div>
    </section>
  </main>
);

const App: React.FC = () => {
  const [isChatOpen, setIsChatOpen] = useState(false);

  return (
    <Router>
      <AuthProvider>
        <div className="min-h-screen bg-black text-white selection:bg-gray-800 font-['Plus_Jakarta_Sans',sans-serif]">
          <Header />

          <Routes>
            <Route path="/" element={<Home />} />
            <Route path="/services" element={<ServicesPage />} />
            <Route path="/contact" element={<ContactPage />} />
            <Route path="/analysis" element={<CallAnalysisPage />} />
            <Route path="/long-calls" element={<LongCallsAnalysisPage />} />
            <Route path="/sop-manager" element={<SOPManagerPage />} />
            <Route path="/coaching" element={<CoachingPage />} />
            <Route path="/login" element={<Auth />} />
            <Route path="/auth" element={<Auth />} />
          </Routes>

          <Footer onChatOpen={() => setIsChatOpen(true)} />

          <AIChat isOpen={isChatOpen} onClose={() => setIsChatOpen(false)} />
        </div>
      </AuthProvider>
    </Router>
  );
};

export default App;
