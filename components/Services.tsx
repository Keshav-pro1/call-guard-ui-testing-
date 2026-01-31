
import React from 'react';
import ScrollReveal from './ScrollReveal';

const services = [
  {
    title: "Scoring Framework",
    desc: "Comprehensive rubric and weighting system to objectively evaluate call quality across multiple dimensions.",
    icon: (
      <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="1.5" d="M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z" />
      </svg>
    )
  },
  {
    title: "Coaching Insights",
    desc: "Actionable insights formatted for agents (improvement themes) and city-level analysis (root causes).",
    icon: (
      <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="1.5" d="M12 6.253v13m0-13C10.832 5.477 9.246 5 7.5 5S4.168 5.477 3 6.253v13C4.168 18.477 5.754 18 7.5 18s3.332.477 4.5 1.253m0-13C13.168 5.477 14.754 5 16.5 5c1.747 0 3.332.477 4.5 1.253v13C19.832 18.477 18.247 18 16.5 18c-1.746 0-3.332.477-4.5 1.253" />
      </svg>
    )
  },
  {
    title: "Supervisor Alert Policy",
    desc: "Defined criteria for what gets flagged to supervisors and the reasoning behind it.",
    icon: (
      <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="1.5" d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" />
      </svg>
    )
  }
];

const Services: React.FC = () => {
  return (
    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
      {services.map((service, index) => (
        <ScrollReveal key={index} delay={index * 100}>
          <div
            className="group relative p-10 bg-white/[0.01] border border-white/[0.05] rounded-[2.5rem] hover:border-white/[0.2] transition-all duration-700 overflow-hidden h-full backdrop-blur-sm hover:backdrop-blur-md hover:bg-white/[0.03] shadow-2xl"
          >
            <div className="relative z-10">
              <div className="w-14 h-14 flex items-center justify-center rounded-2xl bg-white/[0.03] text-white mb-10 group-hover:bg-white group-hover:text-black transition-all duration-500 border border-white/[0.05] group-hover:scale-110 shadow-xl">
                {service.icon}
              </div>
              <h3 className="text-xl font-semibold text-white mb-4 tracking-tight">{service.title}</h3>
              <p className="text-gray-400 leading-relaxed font-light group-hover:text-gray-300 transition-colors">
                {service.desc}
              </p>
              <div className="mt-10 pt-8 border-t border-white/[0.05] flex items-center gap-3 text-[9px] font-extrabold uppercase tracking-[0.3em] text-white/30 group-hover:text-white transition-all">
                Explore Solution
                <svg className="w-4 h-4 translate-x-0 group-hover:translate-x-2 transition-transform duration-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="1.5" d="M17 8l4 4m0 0l-4 4m4-4H3" />
                </svg>
              </div>
            </div>

            {/* Dynamic Glass Highlight */}
            <div className="absolute top-0 right-0 -mr-20 -mt-20 w-40 h-40 bg-white/[0.05] rounded-full blur-3xl opacity-0 group-hover:opacity-100 transition-opacity duration-1000"></div>
            <div className="absolute -inset-px bg-gradient-to-br from-white/[0.1] to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-700 pointer-events-none rounded-[2.5rem]"></div>
          </div>
        </ScrollReveal>
      ))}
    </div>
  );
};

export default Services;
