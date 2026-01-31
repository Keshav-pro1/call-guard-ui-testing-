
import React from 'react';
import ContactForm from './ContactForm';

interface FooterProps {
    onChatOpen: () => void;
}

const Footer: React.FC<FooterProps> = ({ onChatOpen }) => {
    return (
        <footer className="bg-black pt-24 pb-12 border-t border-white/5 relative z-10">
            <div className="max-w-7xl mx-auto px-6">
                <div className="grid grid-cols-1 lg:grid-cols-2 gap-20 mb-24">
                    <div>
                        <span className="text-xs uppercase tracking-[0.3em] text-gray-500 mb-6 block font-bold">Get In Touch</span>
                        <h2 className="text-4xl md:text-5xl font-light text-white mb-8 leading-tight">
                            Let's Architect Your <br />
                            <span className="font-semibold italic">Digital Future</span>.
                        </h2>
                        <p className="text-gray-400 text-lg mb-12 max-w-md font-light">
                            Ready to elevate your business with AI and elite digital solutions?
                            Drop us a line and our team will get back to you within 24 hours.
                        </p>

                        <div className="space-y-6">
                            <div className="flex items-center gap-4">
                                <div className="w-10 h-10 rounded-full border border-white/10 flex items-center justify-center text-white">
                                    <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="1.5" d="M3 8l7.89 5.26a2 2 0 002.22 0L21 8M5 19h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z" /></svg>
                                </div>
                                <div>
                                    <p className="text-[10px] uppercase tracking-widest text-gray-500 font-bold">Email Us</p>
                                    <p className="text-white font-medium">hello@callguard.ai</p>
                                </div>
                            </div>
                            <div className="flex items-center gap-4">
                                <div className="w-10 h-10 rounded-full border border-white/10 flex items-center justify-center text-white">
                                    <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="1.5" d="M17.657 16.657L13.414 20.9a1.998 1.998 0 01-2.827 0l-4.244-4.243a8 8 0 1111.314 0z" /><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="1.5" d="M15 11a3 3 0 11-6 0 3 3 0 016 0z" /></svg>
                                </div>
                                <div>
                                    <p className="text-[10px] uppercase tracking-widest text-gray-500 font-bold">Office</p>
                                    <p className="text-white font-medium">Dubai Design District, UAE</p>
                                </div>
                            </div>
                        </div>
                    </div>

                    <div>
                        <ContactForm />
                    </div>
                </div>

                <div className="flex flex-col md:flex-row justify-between items-center pt-12 border-t border-white/5 gap-10">
                    <div className="flex flex-col items-center md:items-start">
                        <span className="text-xl font-medium tracking-widest text-white">CallGuard</span>
                        <p className="text-gray-600 mt-2 text-[10px] uppercase tracking-widest font-bold">© 2024 CallGuard Solutions. All Rights Reserved.</p>
                    </div>

                    <div className="flex gap-8 text-[10px] font-bold text-gray-500 uppercase tracking-[0.2em]">
                        <a href="#" className="hover:text-white transition-colors">Privacy Policy</a>
                        <a href="#" className="hover:text-white transition-colors">Terms of Service</a>
                        <button onClick={onChatOpen} className="hover:text-white transition-colors">AI Concierge</button>
                    </div>
                </div>
            </div>
        </footer>
    );
};

export default Footer;
