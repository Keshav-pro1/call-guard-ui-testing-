import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import ScrollReveal from './ScrollReveal';
import Modal from './Modal';
import { db } from '../services/firebase';
import { useAuth } from './AuthContext';
import {
    collection,
    addDoc,
    query,
    where,
    getDocs,
    doc,
    updateDoc,
    deleteDoc,
    serverTimestamp
} from 'firebase/firestore';

interface SOPStep {
    text: string;
    suggestion: string;
    internal_intent?: string;
}

interface SOPSection {
    steps: SOPStep[];
    weight: number;
}

interface SOPRules {
    sop_rules: Record<string, SOPSection>;
    sentiments: {
        positive: string[];
        negative: string[];
        risk_keywords: string[];
    };
}

interface SOPDocument {
    id: string;
    name: string;
    rules: SOPRules;
    policyFilename?: string;
}

const DEFAULT_SOP_RULES: SOPRules = {
    sop_rules: {
        "Greeting": {
            steps: [{ text: "Greet the customer", suggestion: "Hello, thank you for calling." }],
            weight: 10
        }
    },
    sentiments: {
        positive: ["thank you", "great"],
        negative: ["bad", "terrible"],
        risk_keywords: ["cancel", "lawsuit"]
    }
};

const SOPManagerPage: React.FC = () => {
    const { currentUser, loading: authLoading } = useAuth();
    const [sops, setSops] = useState<SOPDocument[]>([]);
    const [currentSopId, setCurrentSopId] = useState<string | null>(null);
    const [rules, setRules] = useState<SOPRules | null>(null);

    const [loading, setLoading] = useState(true);
    const [saving, setSaving] = useState(false);
    const [message, setMessage] = useState<{ type: 'success' | 'error', text: string } | null>(null);

    // Modal State
    const [isCreateSopModalOpen, setIsCreateSopModalOpen] = useState(false);
    const [isAddSectionModalOpen, setIsAddSectionModalOpen] = useState(false);
    const [isDeleteSectionModalOpen, setIsDeleteSectionModalOpen] = useState(false);

    const [newSopName, setNewSopName] = useState("");
    const [newSectionName, setNewSectionName] = useState("");
    const [sectionToDelete, setSectionToDelete] = useState<string | null>(null);
    const [policyFile, setPolicyFile] = useState<File | null>(null);

    useEffect(() => {
        if (!authLoading) {
            if (currentUser) {
                fetchSOPs();
            } else {
                setLoading(false); // Stop loading if checked auth and no user
            }
        }
    }, [currentUser, authLoading]);

    useEffect(() => {
        if (currentSopId && sops.length > 0) {
            const sop = sops.find(s => s.id === currentSopId);
            if (sop) {
                setRules(sop.rules);
            }
        }
    }, [currentSopId, sops]);

    const fetchSOPs = async () => {
        if (!currentUser) return;
        setLoading(true);
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

            // Auto-select first if none selected
            if (fetchedSops.length > 0 && !currentSopId) {
                setCurrentSopId(fetchedSops[0].id);
            } else if (fetchedSops.length === 0) {
                setRules(null);
            }
        } catch (error: any) {
            console.error("Error fetching SOPs:", error);
            setMessage({ type: 'error', text: "Failed to load SOPs." });
        } finally {
            setLoading(false);
        }
    };

    const handleCreateSop = async () => {
        if (!newSopName.trim() || !currentUser) return;
        setSaving(true);
        try {
            const newSop = {
                userId: currentUser.uid,
                name: newSopName,
                rules: DEFAULT_SOP_RULES,
                createdAt: serverTimestamp()
            };
            const docRef = await addDoc(collection(db, "sops"), newSop);
            const newSopDoc = { id: docRef.id, ...newSop } as unknown as SOPDocument;

            setSops([...sops, newSopDoc]);
            setCurrentSopId(docRef.id);
            setNewSopName("");
            setIsCreateSopModalOpen(false);
            setMessage({ type: 'success', text: "New SOP created!" });
        } catch (error) {
            console.error("Error creating SOP:", error);
            setMessage({ type: 'error', text: "Failed to create SOP." });
        } finally {
            setSaving(false);
        }
    };

    const handleDeleteSop = async (id: string) => {
        if (!confirm("Are you sure you want to delete this entire SOP?")) return;
        try {
            await deleteDoc(doc(db, "sops", id));
            setSops(sops.filter(s => s.id !== id));
            if (currentSopId === id) {
                setCurrentSopId(null);
                setRules(null);
            }
            setMessage({ type: 'success', text: "SOP deleted." });
        } catch (error) {
            setMessage({ type: 'error', text: "Failed to delete SOP." });
        }
    };

    // --- Section & Step Management (Same logic, working on 'rules' state) ---

    const handleStepChange = (section: string, index: number, field: keyof SOPStep, value: string) => {
        if (!rules) return;
        const newRules = { ...rules };
        // Deep copy needed for React state to detect change in nested obj if we were using memo, 
        // but spread is okay as long as we modify the specific step
        const steps = [...newRules.sop_rules[section].steps];
        steps[index] = { ...steps[index], [field]: value };
        newRules.sop_rules[section] = { ...newRules.sop_rules[section], steps };
        setRules(newRules);
    };

    const handleWeightChange = (section: string, value: number) => {
        if (!rules) return;
        const newRules = { ...rules };
        newRules.sop_rules[section] = { ...newRules.sop_rules[section], weight: value };
        setRules(newRules);
    };

    const renameSection = (oldName: string, newName: string) => {
        if (!rules || !newName || oldName === newName) return;
        const newRules = { ...rules };
        const sectionData = newRules.sop_rules[oldName];
        delete newRules.sop_rules[oldName];
        newRules.sop_rules[newName] = sectionData;
        setRules(newRules);
    };

    const handleAddSection = () => {
        if (!rules || !newSectionName.trim()) return;
        const newRules = { ...rules };

        if (newRules.sop_rules[newSectionName]) {
            setMessage({ type: 'error', text: 'Section already exists.' });
            return;
        }

        newRules.sop_rules[newSectionName] = { steps: [], weight: 10 };
        setRules(newRules);
        setNewSectionName("");
        setIsAddSectionModalOpen(false);
    };

    const handleDeleteSection = () => {
        if (!rules || !sectionToDelete) return;
        const newRules = { ...rules };
        delete newRules.sop_rules[sectionToDelete];
        setRules(newRules);
        setSectionToDelete(null);
        setIsDeleteSectionModalOpen(false);
    };

    const confirmDeleteSection = (section: string) => {
        setSectionToDelete(section);
        setIsDeleteSectionModalOpen(true);
    };

    const addStep = (section: string) => {
        if (!rules) return;
        const newRules = { ...rules };
        const newSteps = [...newRules.sop_rules[section].steps, { text: '', suggestion: '' }];
        newRules.sop_rules[section] = { ...newRules.sop_rules[section], steps: newSteps };
        setRules(newRules);
    };

    const removeStep = (section: string, index: number) => {
        if (!rules) return;
        const newRules = { ...rules };
        const newSteps = [...newRules.sop_rules[section].steps];
        newSteps.splice(index, 1);
        newRules.sop_rules[section] = { ...newRules.sop_rules[section], steps: newSteps };
        setRules(newRules);
    };

    const saveRules = async () => {
        if (!rules || !currentSopId) return;
        setSaving(true);
        setMessage(null);
        try {
            // 1. Upload Policy PDF if present
            if (policyFile) {
                const formData = new FormData();
                formData.append('sop_id', currentSopId);
                formData.append('file', policyFile);

                const uploadRes = await fetch('http://127.0.0.1:8000/upload-policy', {
                    method: 'POST',
                    body: formData,
                });
                const uploadResult = await uploadRes.json();
                if (uploadResult.status !== 'success') {
                    throw new Error(uploadResult.message || 'Failed to upload policy');
                }

                // Update Firestore with policy reference
                await updateDoc(doc(db, "sops", currentSopId), {
                    policyFilename: policyFile.name
                });

                // Update local state
                setSops(sops.map(s => s.id === currentSopId ? { ...s, policyFilename: policyFile.name } : s));
                setPolicyFile(null);
            }

            // 2. Process intents with backend
            const response = await fetch('http://127.0.0.1:8000/process-sop-intents', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify(rules),
            });
            const result = await response.json();

            if (result.status === 'success') {
                const processedRules = result.processed_rules;

                // 3. Save to Firestore
                await updateDoc(doc(db, "sops", currentSopId), {
                    rules: processedRules,
                    updatedAt: serverTimestamp()
                });

                // Update local state to show generated intents
                setRules(processedRules);

                // Update sops list state as well
                setSops(sops.map(s => s.id === currentSopId ? { ...s, rules: processedRules } : s));

                setMessage({ type: 'success', text: 'SOP saved & processed library successfully!' });
                setTimeout(() => setMessage(null), 3000);
            } else {
                setMessage({ type: 'error', text: result.message || 'Error processing SOP.' });
            }
        } catch (error: any) {
            console.error(error);
            setMessage({ type: 'error', text: error.message || 'Connection error. Ensure backend is running.' });
        } finally {
            setSaving(false);
        }
    };

    if (loading) return (
        <div className="min-h-screen bg-black flex items-center justify-center">
            <div className="text-white text-xl animate-pulse">Loading SOPs...</div>
        </div>
    );

    return (
        <main className="min-h-screen bg-black text-white pt-24 pb-12">
            <div className="max-w-7xl mx-auto px-6 grid grid-cols-1 lg:grid-cols-4 gap-8">

                {/* Sidebar: SOP List */}
                <div className="lg:col-span-1 space-y-6">
                    <ScrollReveal>
                        <div className="bg-white/5 border border-white/10 rounded-2xl p-6 backdrop-blur-sm">
                            <div className="flex justify-between items-center mb-6">
                                <h2 className="text-xl font-bold">My SOPs</h2>
                                <button
                                    onClick={() => setIsCreateSopModalOpen(true)}
                                    className="p-2 bg-white text-black rounded-lg hover:bg-gray-200 transition-colors"
                                    title="Create New SOP"
                                >
                                    <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" viewBox="0 0 20 20" fill="currentColor">
                                        <path fillRule="evenodd" d="M10 3a1 1 0 011 1v5h5a1 1 0 110 2h-5v5a1 1 0 11-2 0v-5H4a1 1 0 110-2h5V4a1 1 0 011-1z" clipRule="evenodd" />
                                    </svg>
                                </button>
                            </div>

                            <div className="space-y-3">
                                {sops.map(sop => (
                                    <div
                                        key={sop.id}
                                        onClick={() => setCurrentSopId(sop.id)}
                                        className={`group flex items-center justify-between p-3 rounded-xl cursor-pointer transition-all ${currentSopId === sop.id
                                            ? 'bg-white/20 border-white/30'
                                            : 'bg-white/5 border-transparent hover:bg-white/10'
                                            } border`}
                                    >
                                        <span className="font-medium truncate">{sop.name}</span>
                                        <button
                                            onClick={(e) => { e.stopPropagation(); handleDeleteSop(sop.id); }}
                                            className="opacity-0 group-hover:opacity-100 text-gray-500 hover:text-red-400 p-1"
                                        >
                                            <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
                                            </svg>
                                        </button>
                                    </div>
                                ))}
                                {sops.length === 0 && (
                                    <p className="text-sm text-gray-500 text-center py-4">No SOPs created yet.</p>
                                )}
                            </div>
                        </div>
                    </ScrollReveal>
                </div>

                {/* Main Content: Editor */}
                <div className="lg:col-span-3">
                    <ScrollReveal delay={100}>
                        <div className="mb-8 flex flex-col md:flex-row justify-between items-center gap-4">
                            <div>
                                <h1 className="text-3xl md:text-4xl font-extrabold tracking-tight">
                                    {currentSopId ? sops.find(s => s.id === currentSopId)?.name : 'SOP Manager'}
                                </h1>
                                <p className="text-gray-400 font-light mt-2">
                                    {currentSopId ? 'Edit your evaluation criteria below.' : 'Select or create an SOP to get started.'}
                                </p>
                            </div>
                            {currentSopId && (
                                <div className="flex gap-4">
                                    <button
                                        onClick={() => setIsAddSectionModalOpen(true)}
                                        className="px-4 py-2 border border-white/20 rounded-full text-xs uppercase tracking-widest font-bold hover:bg-white/10 transition-all"
                                    >
                                        + Add Section
                                    </button>
                                    <button
                                        onClick={saveRules}
                                        disabled={saving}
                                        className={`px-6 py-2 bg-white text-black font-bold uppercase tracking-widest rounded-full shadow-lg hover:bg-gray-200 transition-all ${saving ? 'opacity-50 cursor-not-allowed' : ''}`}
                                    >
                                        {saving ? 'Saving...' : 'Save Changes'}
                                    </button>
                                </div>
                            )}
                        </div>
                    </ScrollReveal>

                    {message && (
                        <div className={`mb-8 p-4 rounded-xl border text-center animate-fade-in ${message.type === 'success' ? 'bg-green-500/10 border-green-500/20 text-green-200' : 'bg-red-500/10 border-red-500/20 text-red-200'
                            }`}>
                            {message.text}
                        </div>
                    )}

                    {!currentSopId && (
                        <div className="flex flex-col items-center justify-center p-12 border border-dashed border-white/10 rounded-3xl bg-white/5">
                            {!currentUser ? (
                                <>
                                    <p className="text-gray-400 mb-6 text-center">You must be logged in to create and manage SOPs.</p>
                                    <Link to="/login" className="px-8 py-3 bg-white text-black font-bold rounded-full hover:bg-gray-200 transition-colors">
                                        Log In to Access
                                    </Link>
                                </>
                            ) : (
                                <>
                                    <p className="text-gray-500 mb-4">Please select an SOP from the left sidebar or create a new one.</p>
                                    <button
                                        onClick={() => setIsCreateSopModalOpen(true)}
                                        className="px-8 py-3 bg-white text-black font-bold rounded-full hover:bg-gray-200 transition-colors"
                                    >
                                        Create First SOP
                                    </button>
                                </>
                            )}
                        </div>
                    )}

                    {currentSopId && (
                        <div className="mb-12 bg-white/5 border border-white/10 rounded-2xl p-8 backdrop-blur-sm">
                            <h3 className="text-xl font-bold mb-4 uppercase tracking-widest text-blue-400">Policy Guardrails (Optional)</h3>
                            <p className="text-sm text-gray-400 mb-6">
                                Upload a PDF policy document to act as authoritative constraints during evaluation.
                                The AI will treat this as a "hard guardrail" for resolution correctness.
                            </p>

                            <div className="flex flex-col md:flex-row items-center gap-6">
                                <div className="relative group">
                                    <input
                                        type="file"
                                        accept=".pdf"
                                        onChange={(e) => setPolicyFile(e.target.files?.[0] || null)}
                                        className="absolute inset-0 w-full h-full opacity-0 cursor-pointer z-10"
                                    />
                                    <button className="px-6 py-3 bg-white/10 border border-white/20 rounded-xl flex items-center gap-3 group-hover:bg-white/20 transition-all">
                                        <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 16v1a3 3 0 003 3h10a3 3 0 003-3v-1m-4-8l-4-4m0 0L8 8m4-4v12" />
                                        </svg>
                                        <span className="text-sm font-bold uppercase tracking-widest">
                                            {policyFile ? policyFile.name : 'Upload Policy PDF'}
                                        </span>
                                    </button>
                                </div>
                                {sops.find(s => s.id === currentSopId)?.policyFilename && (
                                    <div className="flex items-center gap-2 px-4 py-2 bg-green-500/10 border border-green-500/20 rounded-lg">
                                        <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4 text-green-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                                        </svg>
                                        <span className="text-xs text-green-300 font-medium">
                                            Active Policy: {sops.find(s => s.id === currentSopId)?.policyFilename}
                                        </span>
                                    </div>
                                )}
                            </div>
                        </div>
                    )}

                    {currentSopId && rules && rules.sop_rules && (
                        <div className="space-y-12">
                            {Object.entries(rules.sop_rules).map(([sectionName, section]) => (
                                <ScrollReveal key={sectionName}>
                                    <div className="bg-white/5 border border-white/10 rounded-2xl p-8 backdrop-blur-sm relative group">
                                        <button
                                            onClick={() => confirmDeleteSection(sectionName)}
                                            className="absolute top-8 right-8 text-gray-600 hover:text-red-400 opacity-0 group-hover:opacity-100 transition-all"
                                            title="Delete Section"
                                        >
                                            <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
                                            </svg>
                                        </button>

                                        <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4 mb-8 pb-4 border-b border-white/5">
                                            <input
                                                type="text"
                                                value={sectionName}
                                                onChange={(e) => renameSection(sectionName, e.target.value)}
                                                className="text-2xl font-bold uppercase tracking-widest bg-transparent border-b border-transparent focus:border-white/20 outline-none w-full md:w-auto"
                                            />
                                            <div className="flex items-center gap-4">
                                                <label className="text-xs text-gray-500 uppercase tracking-widest font-bold">Weight:</label>
                                                <input
                                                    type="number"
                                                    value={section.weight}
                                                    onChange={(e) => handleWeightChange(sectionName, parseInt(e.target.value))}
                                                    className="w-16 bg-white/5 border border-white/10 rounded p-1 text-center text-white"
                                                />
                                            </div>
                                        </div>


                                        <div className="space-y-6">
                                            {section.steps.map((step, idx) => (
                                                <div key={idx} className="relative group bg-white/[0.02] p-6 rounded-xl border border-white/5 hover:border-white/10 transition-all">
                                                    <button
                                                        onClick={() => removeStep(sectionName, idx)}
                                                        className="absolute top-4 right-4 text-gray-600 hover:text-red-400 transition-colors"
                                                    >
                                                        <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                                                        </svg>
                                                    </button>

                                                    <div className="grid md:grid-cols-2 gap-6">
                                                        <div className="space-y-2">
                                                            <div className="flex justify-between items-center">
                                                                <label className="text-[10px] uppercase tracking-widest text-gray-500 font-bold block">Objective</label>
                                                                {step.text.length > 5 && (
                                                                    <button
                                                                        onClick={async () => {
                                                                            // Quick inline optimize handler
                                                                            if (!step.text) return;
                                                                            const oldText = step.text;
                                                                            // Temporarily show loading state through text/suggestion placeholders if desired, 
                                                                            // OR simpler: just toast/loading somewhere. 
                                                                            // For UX, let's just do it optimistically or wait.
                                                                            // We'll update the 'internal_intent' and 'suggestion'

                                                                            try {
                                                                                const res = await fetch('http://127.0.0.1:8000/generate-sop-suggestion', {
                                                                                    method: 'POST',
                                                                                    headers: { 'Content-Type': 'application/json' },
                                                                                    body: JSON.stringify({ text: step.text })
                                                                                });
                                                                                const data = await res.json();
                                                                                if (data.intent && data.suggestion) {
                                                                                    // Update state
                                                                                    const newRules = { ...rules };
                                                                                    const steps = [...newRules.sop_rules![sectionName].steps];
                                                                                    steps[idx] = {
                                                                                        ...steps[idx],
                                                                                        internal_intent: data.intent,
                                                                                        suggestion: data.suggestion
                                                                                    };
                                                                                    newRules.sop_rules![sectionName].steps = steps;
                                                                                    setRules(newRules);
                                                                                }
                                                                            } catch (e) {
                                                                                console.error(e);
                                                                            }
                                                                        }}
                                                                        className="text-[10px] bg-blue-500/10 text-blue-400 px-2 py-1 rounded hover:bg-blue-500/20 transition-colors flex items-center gap-1"
                                                                        title="Generate AI Suggestion"
                                                                    >
                                                                        <svg xmlns="http://www.w3.org/2000/svg" className="h-3 w-3" viewBox="0 0 20 20" fill="currentColor">
                                                                            <path fillRule="evenodd" d="M11.3 1.046A1 1 0 0112 2v5h4a1 1 0 01.82 1.573l-7 10A1 1 0 018 18v-5H4a1 1 0 01-.82-1.573l7-10a1 1 0 011.12-.38z" clipRule="evenodd" />
                                                                        </svg>
                                                                        AI Optimize
                                                                    </button>
                                                                )}
                                                            </div>
                                                            <textarea
                                                                value={step.text}
                                                                onChange={(e) => handleStepChange(sectionName, idx, 'text', e.target.value)}
                                                                className="w-full bg-white/5 border border-white/10 rounded-lg p-3 text-sm focus:border-white/30 outline-none transition-colors min-h-[80px] text-white"
                                                                placeholder="e.g. Ask for customer name"
                                                            />
                                                        </div>
                                                        <div className="space-y-2">
                                                            <label className="text-[10px] uppercase tracking-widest text-gray-500 font-bold block">Suggestion (Model behavior)</label>
                                                            <textarea
                                                                value={step.suggestion}
                                                                onChange={(e) => handleStepChange(sectionName, idx, 'suggestion', e.target.value)}
                                                                className="w-full bg-white/5 border border-white/10 rounded-lg p-3 text-sm focus:border-white/30 outline-none transition-colors min-h-[80px] text-white"
                                                                placeholder="e.g. May I have your name, please?"
                                                            />
                                                        </div>
                                                    </div>
                                                    {step.internal_intent && (
                                                        <div className="mt-4 pt-4 border-t border-white/5 animate-fade-in">
                                                            <p className="text-[10px] uppercase tracking-widest text-blue-400 font-bold mb-1">AI Derived Intent:</p>
                                                            <p className="text-xs text-gray-400 italic">"{step.internal_intent}"</p>
                                                        </div>
                                                    )}
                                                </div>
                                            ))}
                                            <button
                                                onClick={() => addStep(sectionName)}
                                                className="w-full py-4 border border-dashed border-white/10 rounded-xl text-gray-500 hover:text-gray-300 hover:border-white/20 transition-all text-xs uppercase tracking-widest font-bold"
                                            >
                                                + Add Evaluation Step
                                            </button>
                                        </div>
                                    </div>
                                </ScrollReveal>
                            ))}
                        </div>
                    )}

                    {/* Modals */}

                    {/* Create SOP Modal */}
                    <Modal
                        isOpen={isCreateSopModalOpen}
                        onClose={() => setIsCreateSopModalOpen(false)}
                        title="Create New SOP"
                    >
                        <div className="space-y-4">
                            <div className="space-y-2">
                                <label className="text-xs text-gray-500 uppercase tracking-widest font-bold block">SOP Name</label>
                                <input
                                    type="text"
                                    autoFocus
                                    value={newSopName}
                                    onChange={(e) => setNewSopName(e.target.value)}
                                    className="w-full bg-white/5 border border-white/10 rounded-lg p-3 text-white focus:border-white/30 outline-none transition-colors"
                                    placeholder="e.g. Sales Call v1"
                                    onKeyDown={(e) => e.key === 'Enter' && handleCreateSop()}
                                />
                            </div>
                            <div className="flex gap-3 pt-4">
                                <button
                                    onClick={() => setIsCreateSopModalOpen(false)}
                                    className="flex-1 py-3 text-xs uppercase tracking-widest font-bold text-gray-400 hover:text-white transition-colors"
                                >
                                    Cancel
                                </button>
                                <button
                                    onClick={handleCreateSop}
                                    disabled={!newSopName.trim()}
                                    className={`flex-1 py-3 bg-white text-black text-xs uppercase tracking-widest font-bold rounded-lg hover:bg-gray-200 transition-colors ${!newSopName.trim() ? 'opacity-50 cursor-not-allowed' : ''}`}
                                >
                                    Create
                                </button>
                            </div>
                        </div>
                    </Modal>

                    {/* Add Section Modal */}
                    <Modal
                        isOpen={isAddSectionModalOpen}
                        onClose={() => setIsAddSectionModalOpen(false)}
                        title="New Section"
                    >
                        <div className="space-y-4">
                            <div className="space-y-2">
                                <label className="text-xs text-gray-500 uppercase tracking-widest font-bold block">Section Name</label>
                                <input
                                    type="text"
                                    autoFocus
                                    value={newSectionName}
                                    onChange={(e) => setNewSectionName(e.target.value)}
                                    className="w-full bg-white/5 border border-white/10 rounded-lg p-3 text-white focus:border-white/30 outline-none transition-colors"
                                    placeholder="e.g. Closing"
                                    onKeyDown={(e) => e.key === 'Enter' && handleAddSection()}
                                />
                            </div>
                            <div className="flex gap-3 pt-4">
                                <button
                                    onClick={() => setIsAddSectionModalOpen(false)}
                                    className="flex-1 py-3 text-xs uppercase tracking-widest font-bold text-gray-400 hover:text-white transition-colors"
                                >
                                    Cancel
                                </button>
                                <button
                                    onClick={handleAddSection}
                                    disabled={!newSectionName.trim()}
                                    className={`flex-1 py-3 bg-white text-black text-xs uppercase tracking-widest font-bold rounded-lg hover:bg-gray-200 transition-colors ${!newSectionName.trim() ? 'opacity-50 cursor-not-allowed' : ''}`}
                                >
                                    Add Section
                                </button>
                            </div>
                        </div>
                    </Modal>

                    {/* Delete Section Modal */}
                    <Modal
                        isOpen={isDeleteSectionModalOpen}
                        onClose={() => setIsDeleteSectionModalOpen(false)}
                        title="Delete Section"
                    >
                        <div className="space-y-6">
                            <p className="text-gray-400 font-light">
                                Delete <span className="text-white font-bold">"{sectionToDelete}"</span>? This cannot be undone.
                            </p>
                            <div className="flex gap-3">
                                <button
                                    onClick={() => setIsDeleteSectionModalOpen(false)}
                                    className="flex-1 py-3 text-xs uppercase tracking-widest font-bold text-gray-400 hover:text-white transition-colors"
                                >
                                    Cancel
                                </button>
                                <button
                                    onClick={handleDeleteSection}
                                    className="flex-1 py-3 bg-red-500 text-white text-xs uppercase tracking-widest font-bold rounded-lg hover:bg-red-600 transition-colors"
                                >
                                    Delete
                                </button>
                            </div>
                        </div>
                    </Modal>

                </div>
            </div>
        </main>
    );
};

export default SOPManagerPage;
