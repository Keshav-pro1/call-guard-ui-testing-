
import React from 'react';
import Services from './Services';
import ScrollReveal from './ScrollReveal';

const ServicesPage: React.FC = () => {
    return (
        <div className="pt-32 pb-24 bg-black">
            <div className="max-w-7xl mx-auto px-6">
                <ScrollReveal>
                    <div className="mb-20">
                        <span className="text-xs uppercase tracking-[0.3em] text-gray-500 mb-4 block font-bold">Our Solutions</span>
                        <h1 className="text-5xl md:text-7xl font-light text-white mb-8 leading-tight">
                            Candidate <br />
                            <span className="font-semibold italic">Deliverables</span>.
                        </h1>
                        <div className="h-px w-24 bg-white/20 mb-8"></div>
                        <p className="text-gray-400 max-w-2xl text-lg leading-relaxed font-light">
                            A comprehensive suite of frameworks and logic designed to evaluate 100% of customer support calls.
                            CallGuard ensures script adherence, correct resolution, and actionable coaching insights.
                        </p>
                    </div>
                </ScrollReveal>

                <Services />

                <div className="mt-32 p-12 bg-[#050505] rounded-3xl border border-white/5 relative overflow-hidden">
                    <div className="relative z-10 max-w-2xl">
                        <h3 className="text-2xl font-semibold text-white mb-6">Ready to Implement?</h3>
                        <p className="text-gray-400 mb-8 font-light">
                            From speech-to-text integration to the final insights dashboard, we provide the full
                            implementation roadmap for a robust Auto-QA system.
                        </p>
                        <button className="px-10 py-4 bg-white text-black rounded-full font-bold uppercase tracking-widest text-[10px] hover:bg-gray-200 transition-all shadow-xl">
                            Start Integration
                        </button>
                    </div>
                    <div className="absolute top-0 right-0 w-80 h-full bg-gradient-to-l from-white/[0.02] to-transparent pointer-events-none"></div>
                </div>
            </div>
        </div>
    );
};

export default ServicesPage;
