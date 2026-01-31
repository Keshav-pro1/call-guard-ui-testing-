
import React, { useState } from 'react';

const ContactForm: React.FC = () => {
    const [formData, setFormData] = useState({
        name: '',
        email: '',
        service: 'Website Development',
        message: ''
    });

    const handleSubmit = (e: React.FormEvent) => {
        e.preventDefault();
        alert('Message sent! Our AI concierge will reach out to you shortly.');
    };

    return (
        <div className="w-full bg-[#050505] border border-white/5 rounded-[2rem] p-1 md:p-1 shadow-[0_32px_128px_-16px_rgba(0,0,0,1)] relative overflow-hidden group">
            {/* Animated Background Gradients */}
            <div className="absolute top-0 right-0 -mr-20 -mt-20 w-64 h-64 bg-white/[0.03] rounded-full blur-[80px] pointer-events-none group-hover:bg-white/[0.05] transition-all duration-1000"></div>
            <div className="absolute bottom-0 left-0 -ml-20 -mb-20 w-64 h-64 bg-white/[0.02] rounded-full blur-[100px] pointer-events-none"></div>

            <div className="relative z-10 bg-black/40 backdrop-blur-3xl rounded-[1.9rem] p-8 md:p-12 border border-white/5">
                <form onSubmit={handleSubmit} className="space-y-8">
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
                        <div className="relative group/field">
                            <label className="text-[9px] uppercase tracking-[0.3em] font-extrabold text-gray-500 mb-2 block ml-1 transition-colors group-focus-within/field:text-white">
                                Client Name
                            </label>
                            <input
                                type="text"
                                required
                                className="w-full bg-transparent border-b border-white/10 py-3 text-sm text-white focus:outline-none focus:border-white transition-all font-light placeholder:text-gray-800"
                                placeholder="Full Name"
                                value={formData.name}
                                onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                            />
                        </div>
                        <div className="relative group/field">
                            <label className="text-[9px] uppercase tracking-[0.3em] font-extrabold text-gray-500 mb-2 block ml-1 transition-colors group-focus-within/field:text-white">
                                Email Address
                            </label>
                            <input
                                type="email"
                                required
                                className="w-full bg-transparent border-b border-white/10 py-3 text-sm text-white focus:outline-none focus:border-white transition-all font-light placeholder:text-gray-800"
                                placeholder="email@company.com"
                                value={formData.email}
                                onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                            />
                        </div>
                    </div>

                    <div className="relative group/field">
                        <label className="text-[9px] uppercase tracking-[0.3em] font-extrabold text-gray-500 mb-2 block ml-1 transition-colors group-focus-within/field:text-white">
                            Project Domain
                        </label>
                        <div className="relative">
                            <select
                                className="w-full bg-transparent border-b border-white/10 py-3 text-sm text-white focus:outline-none focus:border-white transition-all font-light appearance-none cursor-pointer"
                                value={formData.service}
                                onChange={(e) => setFormData({ ...formData, service: e.target.value })}
                            >
                                <option className="bg-black py-4">Website Development</option>
                                <option className="bg-black py-4">App Development</option>
                                <option className="bg-black py-4">AI Agent Services</option>
                                <option className="bg-black py-4">Automation Services</option>
                                <option className="bg-black py-4">Digital Marketing</option>
                                <option className="bg-black py-4">SEO Solutions</option>
                            </select>
                            <div className="absolute right-0 top-1/2 -translate-y-1/2 pointer-events-none opacity-40">
                                <svg className="w-3 h-3" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path d="M19 9l-7 7-7-7" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" /></svg>
                            </div>
                        </div>
                    </div>

                    <div className="relative group/field">
                        <label className="text-[9px] uppercase tracking-[0.3em] font-extrabold text-gray-500 mb-2 block ml-1 transition-colors group-focus-within/field:text-white">
                            Project Details
                        </label>
                        <textarea
                            required
                            rows={3}
                            className="w-full bg-transparent border-b border-white/10 py-3 text-sm text-white focus:outline-none focus:border-white transition-all resize-none font-light placeholder:text-gray-800"
                            placeholder="Briefly describe your vision..."
                            value={formData.message}
                            onChange={(e) => setFormData({ ...formData, message: e.target.value })}
                        ></textarea>
                    </div>

                    <div className="pt-4">
                        <button
                            type="submit"
                            className="group relative w-full overflow-hidden rounded-full py-5 bg-white text-black font-bold uppercase tracking-[0.3em] text-[10px] transition-all duration-500 hover:shadow-[0_0_40px_rgba(255,255,255,0.3)]"
                        >
                            <span className="relative z-10 transition-colors duration-500 group-hover:text-black">
                                Send Inquiry
                            </span>
                            <div className="absolute inset-0 bg-transparent translate-y-full hover:translate-y-0 transition-transform duration-500 bg-gradient-to-t from-gray-100 to-white"></div>
                        </button>
                    </div>
                </form>
            </div>
        </div>
    );
};

export default ContactForm;
