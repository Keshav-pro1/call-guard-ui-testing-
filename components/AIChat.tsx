
import React, { useState, useRef, useEffect } from 'react';
import { getGeminiChat, sendMessageToGemini } from '../services/geminiService';
import { ChatMessage } from '../types';

interface AIChatProps {
  isOpen: boolean;
  onClose: () => void;
}

const AIChat: React.FC<AIChatProps> = ({ isOpen, onClose }) => {
  const [messages, setMessages] = useState<ChatMessage[]>([
    { role: 'model', text: 'Welcome to Meleregamy AI. I am your digital concierge. How may I assist you with our AI-driven solutions today?' }
  ]);
  const [input, setInput] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const chatRef = useRef<any>(null);
  const scrollRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (isOpen && !chatRef.current) {
      chatRef.current = getGeminiChat();
    }
  }, [isOpen]);

  useEffect(() => {
    if (scrollRef.current) {
      scrollRef.current.scrollTop = scrollRef.current.scrollHeight;
    }
  }, [messages, isLoading]);

  const handleSend = async () => {
    if (!input.trim() || isLoading) return;

    const userMessage = input;
    setInput('');
    setMessages(prev => [...prev, { role: 'user', text: userMessage }]);
    setIsLoading(true);

    try {
      const responseText = await sendMessageToGemini(chatRef.current, userMessage);
      setMessages(prev => [...prev, { role: 'model', text: responseText }]);
    } catch (error) {
      setMessages(prev => [...prev, { role: 'model', text: "I've encountered a minor disruption. Please try asking again." }]);
    } finally {
      setIsLoading(false);
    }
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-[100] flex items-center justify-center p-6 bg-black/40 backdrop-blur-2xl animate-fade-in">
      <div className="w-full max-w-2xl bg-white/[0.01] rounded-[2.5rem] shadow-[0_32px_128px_-16px_rgba(0,0,0,1)] border border-white/[0.05] flex flex-col overflow-hidden max-h-[85vh] backdrop-blur-3xl relative">
        <div className="absolute inset-0 bg-gradient-to-br from-white/[0.02] to-transparent pointer-events-none"></div>
        {/* Header */}
        <div className="relative z-10 p-8 border-b border-white/[0.05] flex justify-between items-center bg-black/20">
          <div className="flex items-center gap-4">
            <div className="w-2.5 h-2.5 bg-white rounded-full animate-pulse shadow-[0_0_10px_rgba(255,255,255,0.5)]"></div>
            <div>
              <h3 className="text-[10px] font-extrabold uppercase tracking-[0.3em] text-white">Meleregamy Concierge</h3>
              <p className="text-[9px] text-gray-500 font-bold mt-0.5">CORE INTELLIGENCE</p>
            </div>
          </div>
          <button onClick={onClose} className="p-3 hover:bg-white/5 rounded-full transition-all text-white/40 hover:text-white">
            <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="1.5" d="M6 18L18 6M6 6l12 12" /></svg>
          </button>
        </div>

        {/* Messages */}
        <div ref={scrollRef} className="relative z-10 flex-1 overflow-y-auto p-8 space-y-8 scroll-smooth bg-transparent">
          {messages.map((msg, i) => (
            <div key={i} className={`flex ${msg.role === 'user' ? 'justify-end' : 'justify-start'}`}>
              <div className={`max-w-[85%] px-6 py-4 rounded-[1.5rem] text-sm leading-relaxed transition-all duration-500 ${msg.role === 'user'
                  ? 'bg-white text-black shadow-2xl font-medium'
                  : 'bg-white/[0.03] text-gray-200 border border-white/[0.05] backdrop-blur-md'
                }`}>
                {msg.text}
              </div>
            </div>
          ))}
          {isLoading && (
            <div className="flex justify-start">
              <div className="bg-white/[0.03] px-6 py-4 rounded-2xl border border-white/[0.05] backdrop-blur-sm">
                <div className="flex gap-1.5">
                  <div className="w-1 h-1 bg-white/40 rounded-full animate-bounce"></div>
                  <div className="w-1 h-1 bg-white/40 rounded-full animate-bounce [animation-delay:0.2s]"></div>
                  <div className="w-1 h-1 bg-white/40 rounded-full animate-bounce [animation-delay:0.4s]"></div>
                </div>
              </div>
            </div>
          )}
        </div>

        {/* Input */}
        <div className="relative z-10 p-8 border-t border-white/[0.05] bg-black/20">
          <div className="relative flex items-center">
            <input
              type="text"
              value={input}
              onChange={(e) => setInput(e.target.value)}
              onKeyDown={(e) => e.key === 'Enter' && handleSend()}
              placeholder="Inquire about our digital architecture..."
              className="w-full bg-white/[0.03] border border-white/[0.1] rounded-full px-8 py-4 text-sm text-white focus:outline-none focus:border-white/30 transition-all placeholder:text-gray-700 font-light"
            />
            <button
              onClick={handleSend}
              className="absolute right-2 p-3 bg-white text-black rounded-full hover:bg-gray-200 transition-all shadow-xl"
            >
              <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M14 5l7 7m0 0l-7 7m7-7H3" /></svg>
            </button>
          </div>
          <p className="text-center mt-6 text-[8px] text-gray-600 uppercase tracking-[0.4em] font-extrabold">
            MELEREGAMY ARTIFICIAL INTELLIGENCE
          </p>
        </div>
      </div>
    </div>
  );
};

export default AIChat;
