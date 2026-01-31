
import React from 'react';
import ContactForm from './ContactForm';
import ScrollReveal from './ScrollReveal';

const ContactPage: React.FC = () => {
    return (
        <div className="pt-32 pb-24 bg-black min-h-screen">
            <div className="max-w-7xl mx-auto px-6">
                <ScrollReveal>
                    <div className="grid grid-cols-1 lg:grid-cols-2 gap-20 items-center">
                        <div>
                            <span className="text-xs uppercase tracking-[0.3em] text-gray-500 mb-4 block font-bold">Connect With Us</span>
                            <h1 className="text-5xl md:text-7xl font-light text-white mb-8 leading-tight">
                                Let's Start a <br />
                                <span className="font-semibold italic">Conversation</span>.
                            </h1>
                            <p className="text-gray-400 text-lg mb-12 max-w-md font-light">
                                Whether you have a specific project in mind or just want to explore how AI
                                can transform your business, we're here to help.
                            </p>

                            <div className="grid grid-cols-1 md:grid-cols-2 gap-8 text-sm">
                                <div>
                                    <h4 className="text-[10px] uppercase tracking-widest font-bold text-gray-500 mb-2">New Business</h4>
                                    <p className="text-white hover:text-gray-400 transition-colors cursor-pointer">partners@callguard.ai</p>
                                </div>
                                <div>
                                    <h4 className="text-[10px] uppercase tracking-widest font-bold text-gray-500 mb-2">Technical Support</h4>
                                    <p className="text-white hover:text-gray-400 transition-colors cursor-pointer">support@callguard.ai</p>
                                </div>
                                <div>
                                    <h4 className="text-[10px] uppercase tracking-widest font-bold text-gray-500 mb-2">Dubai HQ</h4>
                                    <p className="text-white font-light">Design District, Block 4<br />Dubai, UAE</p>
                                </div>
                                <div>
                                    <h4 className="text-[10px] uppercase tracking-widest font-bold text-gray-500 mb-2">Social</h4>
                                    <div className="flex gap-4">
                                        {['LI', 'TW', 'IG'].map(s => (
                                            <span key={s} className="text-white hover:text-gray-400 transition-colors cursor-pointer">{s}</span>
                                        ))}
                                    </div>
                                </div>
                            </div>
                        </div>

                        <div className="relative">
                            <div className="absolute -inset-4 bg-white/5 blur-2xl rounded-full pointer-events-none"></div>
                            <ContactForm />
                        </div>
                    </div>
                </ScrollReveal>
            </div>
        </div>
    );
};

export default ContactPage;
