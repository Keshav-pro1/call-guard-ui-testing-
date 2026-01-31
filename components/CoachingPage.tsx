import React, { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { AlertCircle, Calendar, Star, ArrowRight, ShieldAlert, CheckCircle } from 'lucide-react';

interface CoachingItem {
    call_id: string;
    date: string;
    problem_title: string;
    score: number | string;
    region: string;
    duration: number;
    tags: string[];
}

const CoachingPage: React.FC = () => {
    const [items, setItems] = useState<CoachingItem[]>([]);
    const [loading, setLoading] = useState(true);
    const navigate = useNavigate();

    useEffect(() => {
        fetch('http://localhost:8000/coaching-needs')
            .then(res => res.json())
            .then(data => {
                setItems(data);
                setLoading(false);
            })
            .catch(err => {
                console.error("Failed to load coaching data", err);
                setLoading(false);
            });
    }, []);

    return (
        <div className="min-h-screen bg-black text-white pt-24 pb-12 px-6">
            <div className="max-w-7xl mx-auto">
                <header className="mb-12">
                    <h1 className="text-4xl md:text-5xl font-light tracking-tight text-white mb-4">
                        Coaching <span className="font-semibold">Opportunities</span>
                    </h1>
                    <div className="h-px w-24 bg-white/20 mb-6"></div>
                    <p className="text-gray-400 max-w-2xl text-lg font-light">
                        Review calls where the AI detected specific problems. Targeted coaching improves agent performance and adherence.
                    </p>
                </header>

                {loading ? (
                    <div className="text-center text-gray-500 animate-pulse mt-20">Loading coaching data...</div>
                ) : items.length === 0 ? (
                    <div className="text-center p-12 border border-white/10 rounded-2xl bg-white/5">
                        <CheckCircle className="w-12 h-12 text-green-500 mx-auto mb-4" />
                        <h3 className="text-xl font-semibold mb-2">No Coaching Needed</h3>
                        <p className="text-gray-400">Great news! No recent calls have triggered critical risks or fell below the coaching threshold.</p>
                    </div>
                ) : (
                    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                        {items.map((item) => (
                            <div
                                key={item.call_id}
                                onClick={() => navigate(`/analysis?callId=${item.call_id}`)}
                                className="relative group bg-[#0A0A0A] border border-white/10 rounded-2xl p-6 hover:border-white/30 transition-all cursor-pointer overflow-hidden"
                            >
                                {/* Tag Badge */}
                                <div className="absolute top-4 right-4 bg-indigo-500/20 text-indigo-300 text-xs font-bold px-2 py-1 rounded uppercase tracking-wider backdrop-blur-sm border border-indigo-500/30">
                                    {item.tags[0]?.includes('Risk') ? 'Critical Risk' : 'SOP Failure'}
                                </div>

                                {/* Icon Area */}
                                <div className={`w-12 h-12 rounded-full flex items-center justify-center mb-6 
                  ${item.problem_title.includes('Risk') ? 'bg-red-500/20 text-red-500' : 'bg-orange-500/20 text-orange-400'}
                `}>
                                    {item.problem_title.includes('Risk') ? (
                                        <ShieldAlert className="w-6 h-6" />
                                    ) : (
                                        <AlertCircle className="w-6 h-6" />
                                    )}
                                </div>

                                {/* Content */}
                                <h3 className="text-xl font-bold text-white mb-2 line-clamp-2 min-h-[3.5rem]">
                                    {item.problem_title}
                                </h3>

                                <div className="space-y-2 mb-6">
                                    <div className="flex items-center text-gray-400 text-sm">
                                        <Calendar className="w-4 h-4 mr-2" />
                                        {new Date(item.date).toLocaleDateString()}
                                    </div>
                                    <div className="flex items-center text-gray-400 text-sm">
                                        <Star className="w-4 h-4 mr-2" />
                                        <span>Score: {typeof item.score === 'number' ? item.score.toFixed(0) : item.score}/100</span>
                                    </div>
                                </div>

                                {/* Footer/Action */}
                                <div className="pt-4 border-t border-white/5 flex items-center justify-between group-hover:border-white/20 transition-colors">
                                    <span className="text-sm text-gray-500 font-light group-hover:text-gray-300 transition-colors">
                                        Click to review call details
                                    </span>
                                    <ArrowRight className="w-4 h-4 text-white transform -translate-x-2 opacity-0 group-hover:translate-x-0 group-hover:opacity-100 transition-all" />
                                </div>
                            </div>
                        ))}
                    </div>
                )}
            </div>
        </div>
    );
};

export default CoachingPage;
