import React, { useState, useEffect } from 'react';
import ScrollReveal from './ScrollReveal';
import { useAuth } from './AuthContext';
import { db } from '../services/firebase';
import { collection, query, where, getDocs } from 'firebase/firestore';

interface AnalysisResult {
    call_id: string;
    metadata: {
        language: string;
        language_probability: number;
        duration: number;
        original_duration?: number;
        trimmed_duration?: number;
        is_long_call?: boolean;
    };
    transcript: Array<{
        speaker: string;
        text: string;
        start: number;
        end: number;
    }>;
    evaluation: {
        sop_adherence: Record<string, {
            score: number;
            max_score: number;
            steps: Array<{
                step: string;
                status: string;
                confidence: number;
                reason?: string;
                suggestion?: string | null;
            }>;
        }>;
        resolution: {
            status: string;
            reason: string;
        };
        risks_detected: Array<{
            type: string;
            risk: string;
            text?: string;
        }>;
        scoring: {
            final_score: number;
            grade: string;
        };
    };
    coaching_insights: string[];
    supervisor_alerts: string[];
}

interface SOPDocument {
    id: string;
    name: string;
    rules: any;
}

const LongCallsAnalysisPage: React.FC = () => {
    const { currentUser } = useAuth();
    const [file, setFile] = useState<File | null>(null);
    const [loading, setLoading] = useState(false);
    const [result, setResult] = useState<AnalysisResult | null>(null);
    const [error, setError] = useState<string | null>(null);

    // SOP Selection State
    const [sops, setSops] = useState<SOPDocument[]>([]);
    const [selectedSopId, setSelectedSopId] = useState<string>("");

    useEffect(() => {
        if (currentUser) {
            fetchSOPs();
        }
    }, [currentUser]);

    const fetchSOPs = async () => {
        if (!currentUser) return;
        try {
            const q = query(
                collection(db, "sops"),
                where("userId", "==", currentUser.uid)
            );
            const querySnapshot = await getDocs(q);
            const fetchedSops: SOPDocument[] = [];
            querySnapshot.forEach((doc) => {
                fetchedSops.push({ id: doc.id, ...doc.data() } as any);
            });
            setSops(fetchedSops);
            if (fetchedSops.length > 0) {
                setSelectedSopId(fetchedSops[0].id);
            }
        } catch (error) {
            console.error("Error fetching SOPs:", error);
        }
    };

    const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
        if (e.target.files && e.target.files[0]) {
            setFile(e.target.files[0]);
            setError(null);
        }
    };

    const handleUpload = async () => {
        if (!file) {
            setError("Please select a file first.");
            return;
        }
        if (!selectedSopId && sops.length > 0) {
            setError("Please select an SOP to evaluate against.");
            return;
        }

        setLoading(true);
        setResult(null);
        setError(null);


        const formData = new FormData();
        formData.append('file', file);
        if (useAuth().selectedRegion) {
            formData.append('region', useAuth().selectedRegion!);
        }

        // Find selected SOP and attach rules
        if (selectedSopId) {
            formData.append('sop_id', selectedSopId);
            const selectedSOP = sops.find(s => s.id === selectedSopId);
            if (selectedSOP && selectedSOP.rules) {
                formData.append('sop_rules', JSON.stringify(selectedSOP.rules));
            }
        }

        try {
            // Updated endpoint for long calls
            const response = await fetch('http://127.0.0.1:8000/analyze-long-call/', {
                method: 'POST',
                body: formData,
            });

            if (!response.ok) {
                throw new Error(`Server responded with ${response.status}: ${response.statusText}`);
            }

            const data = await response.json();

            if (data.error) {
                setError(data.error);
                return;
            }

            setResult(data);
        } catch (err: any) {
            console.error(err);
            if (err.message && (err.message.includes("Failed to fetch") || err.message.includes("NetworkError"))) {
                setError("Cannot connect to the analysis server. Please ensure the backend is running on port 8000.");
            } else {
                setError(err.message || 'An error occurred during upload.');
            }
        } finally {
            setLoading(false);
        }
    };

    // Helper to calculate total SOP adherence score for display
    const getOverallAdherence = () => {
        if (!result) return 0;
        const scores = Object.values(result.evaluation.sop_adherence).map(s => s.score);
        const maxScores = Object.values(result.evaluation.sop_adherence).map(s => s.max_score);
        const totalScore = scores.reduce((a, b) => a + b, 0);
        const totalMax = maxScores.reduce((a, b) => a + b, 0);
        return totalMax > 0 ? Math.round((totalScore / totalMax) * 100) : 0;
    };

    return (
        <main className="min-h-screen bg-black text-white pt-24 pb-12">
            <div className="max-w-7xl mx-auto px-6">
                <ScrollReveal>
                    <div className="mb-12 text-center">
                        <h1 className="text-4xl md:text-6xl font-extrabold tracking-tight mb-4">
                            Long Calls <span className="text-blue-400 font-light italic">Analysis</span>
                        </h1>
                        <p className="text-gray-400 max-w-2xl mx-auto text-lg font-light">
                            Analyze extended recordings efficiently. Our system automatically trims silences longer than 3 seconds while preserving context.
                        </p>
                    </div>
                </ScrollReveal>

                {/* Upload Section */}
                <ScrollReveal delay={200}>
                    <div className="max-w-2xl mx-auto bg-white/5 border border-white/10 rounded-2xl p-8 backdrop-blur-sm mb-16">

                        {/* SOP Selection Dropdown */}
                        {sops.length > 0 ? (
                            <div className="mb-8">
                                <label className="text-xs uppercase tracking-widest text-gray-400 font-bold block mb-2">Evaluate Against SOP</label>
                                <select
                                    value={selectedSopId}
                                    onChange={(e) => setSelectedSopId(e.target.value)}
                                    className="w-full bg-white/10 border border-white/20 rounded-lg p-3 text-white focus:border-white/40 outline-none transition-colors appearance-none cursor-pointer"
                                >
                                    {sops.map(sop => (
                                        <option key={sop.id} value={sop.id} className="bg-gray-900 text-white">
                                            {sop.name}
                                        </option>
                                    ))}
                                </select>
                            </div>
                        ) : (
                            <div className="mb-8 p-4 bg-yellow-500/10 border border-yellow-500/20 text-yellow-200 rounded-lg text-sm text-center">
                                Warning: You haven't created any SOPs yet. Analysis will use default rules if available, or may fail.
                            </div>
                        )}

                        <div className="border-2 border-dashed border-white/20 rounded-xl p-12 text-center hover:border-white/40 transition-colors">
                            <input
                                type="file"
                                accept="audio/*"
                                onChange={handleFileChange}
                                className="hidden"
                                id="file-upload"
                            />
                            <label htmlFor="file-upload" className="cursor-pointer flex flex-col items-center gap-4">
                                <div className="w-16 h-16 bg-blue-500/10 rounded-full flex items-center justify-center">
                                    <svg xmlns="http://www.w3.org/2000/svg" className="h-8 w-8 text-blue-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M19 11a7 7 0 01-7 7m0 0a7 7 0 01-7-7m7 7v4m0 0H8m4 0h4m-4-8a3 3 0 01-3-3V5a3 3 0 116 0v6a3 3 0 01-3 3z" />
                                    </svg>
                                </div>
                                <span className="text-lg font-medium">
                                    {file ? file.name : "Drop long recording or click to browse"}
                                </span>
                                <span className="text-xs text-gray-500 uppercase tracking-widest text-[10px]">Optimal for 30m+ calls • AI Silence Trimming</span>
                            </label>
                        </div>

                        <div className="mt-6 flex justify-center">
                            <button
                                onClick={handleUpload}
                                disabled={loading || !file || (!selectedSopId && sops.length > 0)}
                                className={`px-8 py-3 bg-blue-600 text-white font-bold uppercase tracking-widest rounded-full hover:bg-blue-500 transition-all ${(loading || !file || (!selectedSopId && sops.length > 0)) ? 'opacity-50 cursor-not-allowed' : ''
                                    }`}
                            >
                                {loading ? "Optimizing & Analyzing..." : "Run Optimized Analysis"}
                            </button>
                        </div>

                        {error && (
                            <div className="mt-4 p-4 bg-red-500/10 border border-red-500/20 text-red-200 rounded-lg text-sm text-center">
                                {error}
                            </div>
                        )}
                    </div>
                </ScrollReveal>

                {/* Results Section */}
                {result && (
                    <div className="space-y-12 animate-fade-in-up">

                        {/* Top Stats */}
                        <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
                            {[
                                { label: "Final Score", value: result.evaluation.scoring.final_score + '%', sub: `Grade: ${result.evaluation.scoring.grade}` },
                                { label: "SOP Adherence", value: getOverallAdherence() + '%', sub: "Overall Score" },
                                { label: "Optimized Duration", value: `${(result.metadata.duration / 60).toFixed(1)}m`, sub: `Saved: ${(result.metadata.trimmed_duration || 0).toFixed(0)}s of silence` },
                                { label: "Original Duration", value: `${((result.metadata.original_duration || result.metadata.duration) / 60).toFixed(1)}m`, sub: "Total input time" }
                            ].map((stat, idx) => (
                                <div key={idx} className="bg-white/5 border border-white/10 p-6 rounded-xl">
                                    <p className="text-xs text-gray-400 uppercase tracking-widest font-bold mb-2">{stat.label}</p>
                                    <p className="text-3xl font-bold">{stat.value}</p>
                                    <p className="text-sm text-gray-500 mt-1 truncate" title={stat.sub}>{stat.sub}</p>
                                </div>
                            ))}
                        </div>

                        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">

                            {/* Transcript */}
                            <div className="lg:col-span-2 bg-white/5 border border-white/10 rounded-xl p-8 max-h-[600px] overflow-y-auto custom-scrollbar">
                                <h3 className="text-xl font-light mb-6 sticky top-0 bg-transparent backdrop-blur-md py-2 border-b border-white/10 flex justify-between items-center">
                                    <span>Transcript</span>
                                    <span className="text-xs uppercase bg-blue-500/20 text-blue-300 px-3 py-1 rounded-full border border-blue-500/30">Silences Trimmed</span>
                                </h3>
                                <div className="space-y-6">
                                    {result.transcript.map((seg, i) => {
                                        // Heuristic for speaker naming if backend returns Unknown or raw IDs
                                        let displayName = seg.speaker;
                                        const upperName = displayName.toUpperCase();
                                        if (upperName === 'UNKNOWN') {
                                            displayName = 'Speaker';
                                        } else if (upperName.includes('SPEAKER_00')) {
                                            displayName = 'Agent (Detected)';
                                        } else if (displayName.includes('SPEAKER_01')) {
                                            displayName = 'Customer (Detected)';
                                        }

                                        const isAgent = displayName.toLowerCase().includes('agent') || displayName === 'SPEAKER_00';

                                        return (
                                            <div key={i} className={`flex gap-4 ${isAgent ? 'justify-start' : 'justify-end'}`}>
                                                <div className={`max-w-[80%] p-4 rounded-xl ${isAgent ? 'bg-white/10 rounded-tl-none' : 'bg-blue-500/10 border border-blue-500/20 rounded-tr-none'
                                                    }`}>
                                                    <p className="text-xs text-gray-500 mb-1 uppercase tracking-wider font-bold h-4">
                                                        {displayName} <span className="text-gray-600 font-normal ml-2">{seg.start.toFixed(1)}s</span>
                                                    </p>
                                                    <p className="text-gray-200 leading-relaxed font-light">{seg.text}</p>
                                                </div>
                                            </div>
                                        )
                                    })}
                                </div>
                            </div>

                            {/* Sidebar: Checklist & Coaching */}
                            <div className="space-y-8">

                                {/* SOP Checklist */}
                                <div className="bg-white/5 border border-white/10 rounded-xl p-6">
                                    <h3 className="text-lg font-bold mb-4">SOP Checklist</h3>
                                    <div className="space-y-6">
                                        {Object.entries(result.evaluation.sop_adherence).map(([sectionName, sectionData]) => (
                                            <div key={sectionName}>
                                                <h4 className="text-xs uppercase tracking-widest text-gray-400 mb-2 font-bold flex justify-between">
                                                    {sectionName}
                                                    <span className={sectionData.score === sectionData.max_score ? "text-green-400" : "text-yellow-400"}>
                                                        {sectionData.score}/{sectionData.max_score}
                                                    </span>
                                                </h4>
                                                <div className="space-y-2">
                                                    {sectionData.steps.map((item, i) => (
                                                        <div key={i} className="flex items-start gap-3 text-sm">
                                                            <span className={`mt-1 w-2 h-2 rounded-full flex-shrink-0 ${item.status === 'PASS' ? 'bg-green-500' :
                                                                item.status === 'PARTIAL' ? 'bg-yellow-500' : 'bg-red-500'
                                                                }`} />
                                                            <div>
                                                                <p className="text-gray-300">{item.step}</p>
                                                                <p className="text-xs text-gray-500 mt-0.5 opacity-70">
                                                                    {item.status} ({Math.round(item.confidence * 100)}%)
                                                                </p>
                                                                {item.status !== 'PASS' && (
                                                                    <div className="mt-2 space-y-2">
                                                                        <p className="text-xs text-red-300/80 italic bg-red-500/5 p-2 rounded border border-red-500/10">
                                                                            <span className="font-bold uppercase tracking-tighter mr-1">Reason:</span> {item.reason}
                                                                        </p>
                                                                        {item.suggestion && (
                                                                            <p className="text-xs text-blue-300/80 bg-blue-500/5 p-2 rounded border border-blue-500/10">
                                                                                <span className="font-bold uppercase tracking-tighter mr-1">Suggestion:</span> "{item.suggestion}"
                                                                            </p>
                                                                        )}
                                                                    </div>
                                                                )}
                                                            </div>
                                                        </div>
                                                    ))}
                                                </div>
                                            </div>
                                        ))}
                                    </div>
                                </div>

                                {/* Coaching Insights */}
                                <div className="bg-white/5 border border-white/10 rounded-xl p-6">
                                    <h3 className="text-lg font-bold mb-4 text-blue-300">Coaching Insights</h3>
                                    <ul className="space-y-3">
                                        {result.coaching_insights.map((insight, i) => (
                                            <li key={i} className="flex gap-3 text-sm text-gray-300">
                                                <span className="text-blue-400">•</span>
                                                {insight}
                                            </li>
                                        ))}
                                    </ul>
                                </div>

                                {/* Alerts */}
                                {result.supervisor_alerts.length > 0 && (
                                    <div className="bg-red-500/10 border border-red-500/20 rounded-xl p-6">
                                        <h3 className="text-lg font-bold mb-4 text-red-300">Supervisor Alerts</h3>
                                        <ul className="space-y-2">
                                            {result.supervisor_alerts.map((alert, i) => (
                                                <li key={i} className="text-sm text-red-200 flex gap-2">
                                                    <span className="text-red-500">⚠</span> {alert}
                                                </li>
                                            ))}
                                        </ul>
                                    </div>
                                )}

                            </div>
                        </div>
                    </div>
                )}
            </div>
        </main>
    );
};

export default LongCallsAnalysisPage;
