import { useState, useCallback, useRef } from "react";
import { useNavigate } from "react-router-dom";
import { 
    FileText, 
    ArrowLeft, 
    UploadCloud, 
    Sparkles, 
    ChevronRight, 
    RotateCcw,
    X,
    LayoutGrid,
    CheckCircle2,
    BookOpen,
    HelpCircle
} from "lucide-react";
import { motion, AnimatePresence } from "framer-motion";

const API_BASE = "http://127.0.0.1:8000";

type Flashcard = {
    question: string;
    answer: string;
};

export default function FlashcardGenerator() {
    const navigate = useNavigate();
    const [file, setFileState] = useState<File | null>(null);
    const [step, setStep] = useState<1 | 2 | 3>(1);
    const [flashcards, setFlashcards] = useState<Flashcard[]>([]);
    const [current, setCurrent] = useState(0);
    const [flipped, setFlipped] = useState(false);
    const [error, setError] = useState("");
    const [dragging, setDragging] = useState(false);
    const fileInputRef = useRef<HTMLInputElement>(null);

    const handleFile = (f: File | null | undefined) => {
        if (!f) return;
        const ext = f.name.split('.').pop()?.toLowerCase();
        if (!['pdf', 'docx', 'txt'].includes(ext || '')) {
            setError("Only PDF, DOCX, and TXT are supported.");
            return;
        }
        setError("");
        setFileState(f);
    };

    const handleDrop = useCallback((e: React.DragEvent) => {
        e.preventDefault();
        setDragging(false);
        handleFile(e.dataTransfer.files[0]);
    }, []);

    const generate = async () => {
        if (!file) return;
        setStep(2);
        setError("");
        try {
            const form = new FormData();
            form.append("file", file);
            const res = await fetch(`${API_BASE}/api/flashcards/generate`, { method: "POST", body: form });
            if (!res.ok) {
                const txt = await res.text();
                throw new Error(txt || `Server error ${res.status}`);
            }
            const data = await res.json();
            const cards: Flashcard[] = data.flashcards || [];
            if (!cards.length) throw new Error("No flashcards returned.");
            setFlashcards(cards);
            setCurrent(0);
            setFlipped(false);
            setStep(3);
        } catch (e: any) {
            setError(e?.message || "Something went wrong.");
            setStep(1);
        }
    };

    const go = (dir: 1 | -1) => {
        setFlipped(false);
        setTimeout(() => setCurrent((c) => (c + dir + flashcards.length) % flashcards.length), 150);
    };

    const reset = () => { setFileState(null); setStep(1); setFlashcards([]); setError(""); };

    return (
        <div style={{ background: '#F8FAFF', minHeight: '100vh', display: 'flex', flexDirection: 'column', fontFamily: "'Inter', sans-serif", overflow: 'hidden' }}>
            <style>{`
                @keyframes float { 0%, 100% { transform: translateY(0); } 50% { transform: translateY(-10px); } }
                @keyframes spin { to { transform: rotate(360deg); } }
                ::-webkit-scrollbar { width: 6px; }
                ::-webkit-scrollbar-thumb { background: #E2E8F0; border-radius: 10px; }
            `}</style>

            {/* Soothing Background Aesthetics */}
            <div style={{ position: 'fixed', inset: 0, pointerEvents: 'none', zIndex: 0, overflow: 'hidden' }}>
                 <div style={{ position: 'absolute', inset: 0, background: 'radial-gradient(at 0% 0%, #f0f4ff 0%, transparent 50%), radial-gradient(at 100% 0%, #f5f3ff 0%, transparent 50%), radial-gradient(at 100% 100%, #eff6ff 0%, transparent 50%), radial-gradient(at 0% 100%, #fdf4ff 0%, transparent 50%)' }} />
                 <div style={{ position: 'absolute', inset: 0, backgroundImage: 'linear-gradient(rgba(79,70,229,0.03) 1px,transparent 1px),linear-gradient(90deg,rgba(79,70,229,0.03) 1px,transparent 1px)', backgroundSize: '40px 40px' }} />
                 
                 <motion.div animate={{ x: [0, 60, 0], y: [0, 40, 0] }} transition={{ duration: 25, repeat: Infinity, ease: "linear" }} style={{ position: 'absolute', width: 700, height: 700, background: 'radial-gradient(circle, rgba(99,102,241,0.08), transparent 70%)', filter: 'blur(100px)', top: '-15%', right: '-5%', borderRadius: '50%' }} />
                 <motion.div animate={{ x: [0, -50, 0], y: [0, -60, 0] }} transition={{ duration: 30, repeat: Infinity, ease: "linear" }} style={{ position: 'absolute', width: 600, height: 600, background: 'radial-gradient(circle, rgba(168,85,247,0.07), transparent 70%)', filter: 'blur(100px)', bottom: '5%', left: '-10%', borderRadius: '50%' }} />
            </div>

            {/* Nav */}
            <nav style={{ 
                display: 'flex', alignItems: 'center', justifyContent: 'space-between', 
                padding: '16px 40px', background: 'rgba(255,255,255,0.7)', 
                borderBottom: '1px solid #E5E7EB', backdropFilter: 'blur(20px)', position: 'relative', zIndex: 100 
            }}>
                <div onClick={() => navigate("/dashboard")} style={{ fontSize: '1.2rem', fontWeight: 800, color: '#4F46E5', display: 'flex', alignItems: 'center', gap: 10, cursor: 'pointer' }}>
                   <div style={{ width: 8, height: 8, background: '#4F46E5', borderRadius: '50%', boxShadow: '0 0 12px #4F46E5' }} />
                    CortexCraft
                </div>
                <div style={{ display: 'flex', alignItems: 'center', gap: 12, background: '#EEF2FF', padding: '6px 16px', borderRadius: 100, border: '1px solid #C7D2FE' }}>
                    <LayoutGrid size={16} color="#4F46E5" />
                    <span style={{ fontSize: '0.85rem', fontWeight: 700, color: '#4F46E5', letterSpacing: '0.02em' }}>FLASHCARDS</span>
                </div>
                <button 
                   onClick={() => navigate("/dashboard")} 
                   style={{ display: 'flex', alignItems: 'center', gap: 6, padding: '8px 20px', background: '#FFF', border: '1px solid #E5E7EB', borderRadius: 100, color: '#4B5563', fontSize: '0.9rem', fontWeight: 600, cursor: 'pointer', transition: '0.2s' }}
                   onMouseOver={e => { e.currentTarget.style.background = '#F9FAFB'; e.currentTarget.style.borderColor = '#4F46E5'; e.currentTarget.style.color = '#4F46E5'; }}
                   onMouseOut={e => { e.currentTarget.style.background = '#FFF'; e.currentTarget.style.borderColor = '#E5E7EB'; e.currentTarget.style.color = '#4B5563'; }}
                >
                    <ArrowLeft size={18} /> Exit
                </button>
            </nav>

            <main style={{ flex: 1, display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', padding: '40px 20px', position: 'relative', zIndex: 10 }}>
                
                <div style={{ maxWidth: '600px', width: '100%' }}>
                    
                    {/* Header */}
                    <header style={{ textAlign: 'center', marginBottom: 40 }}>
                        <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} style={{ display: 'inline-flex', alignItems: 'center', gap: 8, background: '#e0e7ff', color: '#4338ca', padding: '6px 16px', borderRadius: '100px', fontWeight: 700, fontSize: '0.8rem', marginBottom: 16 }}>
                            <Sparkles size={14} /> Spaced Repetition
                        </motion.div>
                        <h1 style={{ fontSize: '2.5rem', fontWeight: 800, color: '#1E293B', marginBottom: 12 }}>Smart Flashcards</h1>
                        <p style={{ color: '#64748B', fontSize: '1.1rem' }}>Turn any document into study cards for faster learning.</p>
                    </header>

                    {/* Step 1: Upload */}
                    {step === 1 && (
                        <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }}>
                            <div 
                                onDragOver={(e) => { e.preventDefault(); setDragging(true); }}
                                onDragLeave={() => setDragging(false)}
                                onDrop={handleDrop}
                                onClick={() => fileInputRef.current?.click()}
                                style={{ 
                                    background: '#FFF', border: `2px dashed ${dragging ? '#4F46E5' : '#E2E8F0'}`, 
                                    borderRadius: 32, padding: '60px 40px', textAlign: 'center', cursor: 'pointer',
                                    boxShadow: '0 20px 50px -15px rgba(0,0,0,0.05)', transition: '0.3s'
                                }}
                            >
                                <input ref={fileInputRef} type="file" style={{ display: 'none' }} onChange={(e) => handleFile(e.target.files?.[0])} />
                                <div style={{ width: 80, height: 80, background: '#EEF2FF', borderRadius: 24, display: 'flex', alignItems: 'center', justifyContent: 'center', margin: '0 auto 24px' }}>
                                    <UploadCloud size={40} color="#4F46E5" />
                                </div>
                                <h3 style={{ fontSize: '1.25rem', fontWeight: 700, color: '#1E293B', marginBottom: 8 }}>{file ? file.name : "Choose a document"}</h3>
                                <p style={{ color: '#64748B', marginBottom: 24 }}>PDF, DOCX, or TXT (Max 10MB)</p>
                                
                                {file && (
                                    <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 10, marginBottom: 24 }}>
                                        <div style={{ padding: '6px 12px', background: '#F1F5F9', borderRadius: 10, fontSize: '0.85rem', fontWeight: 600, color: '#475569' }}>
                                            {(file.size / 1024).toFixed(1)} KB
                                        </div>
                                        <button onClick={(e) => { e.stopPropagation(); setFileState(null); }} style={{ background: '#FEF2F2', border: 'none', padding: '6px', borderRadius: 8, color: '#EF4444', cursor: 'pointer' }}>
                                            <X size={16} />
                                        </button>
                                    </div>
                                )}

                                <button 
                                    onClick={(e) => { e.stopPropagation(); generate(); }}
                                    disabled={!file}
                                    style={{ 
                                        width: '100%', padding: '16px', background: file ? '#4F46E5' : '#F1F5F9', color: '#FFF',
                                        border: 'none', borderRadius: 16, fontSize: '1rem', fontWeight: 700, cursor: file ? 'pointer' : 'default',
                                        boxShadow: file ? '0 10px 20px rgba(79, 70, 229, 0.2)' : 'none', transition: '0.3s'
                                    }}
                                >
                                    Generate Flashcards
                                </button>
                                {error && <p style={{ color: '#EF4444', fontSize: '0.85rem', marginTop: 16, fontWeight: 600 }}>{error}</p>}
                            </div>
                        </motion.div>
                    )}

                    {/* Step 2: Loading */}
                    {step === 2 && (
                        <div style={{ textAlign: 'center', padding: 60 }}>
                             <div style={{ width: 64, height: 64, border: '4px solid #EEF2FF', borderTopColor: '#4F46E5', borderRadius: '50%', animation: 'spin 1s linear infinite', margin: '0 auto 24px' }} />
                             <h3 style={{ fontSize: '1.25rem', fontWeight: 700, color: '#1E293B', marginBottom: 8 }}>Creating your cards...</h3>
                             <p style={{ color: '#64748B' }}>Our AI is extracting the most important concepts.</p>
                        </div>
                    )}

                    {/* Step 3: Flashcards */}
                    {step === 3 && flashcards.length > 0 && (
                        <motion.div initial={{ opacity: 0, scale: 0.95 }} animate={{ opacity: 1, scale: 1 }}>
                            
                            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 20 }}>
                                <div style={{ fontSize: '0.9rem', fontWeight: 700, color: '#64748B' }}>
                                    Card <span style={{ color: '#4F46E5' }}>{current + 1}</span> of {flashcards.length}
                                </div>
                                <div style={{ background: '#EEF2FF', border: '1px solid #C7D2FE', padding: '4px 12px', borderRadius: 100, fontSize: '0.8rem', fontWeight: 700, color: '#4F46E5' }}>
                                    {Math.round(((current + 1) / flashcards.length) * 100)}% Complete
                                </div>
                            </div>

                            <div 
                                onClick={() => setFlipped(!flipped)}
                                style={{ 
                                    perspective: '1000px', cursor: 'pointer', height: '320px', marginBottom: 32 
                                }}
                            >
                                <motion.div 
                                    animate={{ rotateY: flipped ? 180 : 0 }}
                                    transition={{ duration: 0.6, type: 'spring', stiffness: 260, damping: 20 }}
                                    style={{ 
                                        position: 'relative', width: '100%', height: '100%', 
                                        transformStyle: 'preserve-3d' 
                                    }}
                                >
                                    {/* Front */}
                                    <div style={{ 
                                        position: 'absolute', inset: 0, background: '#FFF', borderRadius: 32, 
                                        padding: '40px', display: 'flex', flexDirection: 'column', 
                                        alignItems: 'center', justifyContent: 'center', backfaceVisibility: 'hidden',
                                        boxShadow: '0 25px 60px -12px rgba(0,0,0,0.08)', border: '1px solid #E5E7EB',
                                        textAlign: 'center'
                                    }}>
                                        <div style={{ position: 'absolute', top: 24, left: 24, display: 'flex', alignItems: 'center', gap: 6, opacity: 0.5 }}>
                                            <HelpCircle size={14} /> <span style={{ fontSize: '0.8rem', fontWeight: 700 }}>QUESTION</span>
                                        </div>
                                        <p style={{ fontSize: '1.4rem', fontWeight: 700, color: '#1E293B', lineHeight: 1.5 }}>
                                            {flashcards[current]?.question}
                                        </p>
                                        <p style={{ position: 'absolute', bottom: 24, fontSize: '0.8rem', fontWeight: 600, color: '#94A3B8' }}>
                                            Click to flip
                                        </p>
                                    </div>

                                    {/* Back */}
                                    <div style={{ 
                                        position: 'absolute', inset: 0, background: '#4F46E5', borderRadius: 32, 
                                        padding: '40px', display: 'flex', flexDirection: 'column', 
                                        alignItems: 'center', justifyContent: 'center', backfaceVisibility: 'hidden',
                                        transform: 'rotateY(180deg)', boxShadow: '0 25px 60px -12px rgba(79, 70, 229, 0.2)',
                                        textAlign: 'center', color: '#FFF'
                                    }}>
                                        <div style={{ position: 'absolute', top: 24, left: 24, display: 'flex', alignItems: 'center', gap: 6, opacity: 0.8 }}>
                                            <CheckCircle2 size={14} /> <span style={{ fontSize: '0.8rem', fontWeight: 700 }}>ANSWER</span>
                                        </div>
                                        <p style={{ fontSize: '1.25rem', fontWeight: 600, lineHeight: 1.6 }}>
                                            {flashcards[current]?.answer}
                                        </p>
                                        <p style={{ position: 'absolute', bottom: 24, fontSize: '0.8rem', fontWeight: 600, opacity: 0.8 }}>
                                            Click to see question
                                        </p>
                                    </div>
                                </motion.div>
                            </div>

                            <div style={{ display: 'flex', gap: 16 }}>
                                <button 
                                    onClick={() => go(-1)}
                                    style={{ flex: 1, padding: '16px', background: '#FFF', border: '1px solid #E5E7EB', borderRadius: 16, fontSize: '1rem', fontWeight: 700, color: '#475569', cursor: 'pointer', transition: '0.2s' }}
                                    onMouseOver={e => e.currentTarget.style.background = '#F9FAFB'}
                                    onMouseOut={e => e.currentTarget.style.background = '#FFF'}
                                >
                                    Previous
                                </button>
                                <button 
                                    onClick={() => go(1)}
                                    style={{ flex: 1, padding: '16px', background: '#4F46E5', border: 'none', borderRadius: 16, fontSize: '1rem', fontWeight: 700, color: '#FFF', cursor: 'pointer', boxShadow: '0 8px 16px rgba(79, 70, 229, 0.15)', transition: '0.2s' }}
                                    onMouseOver={e => e.currentTarget.style.transform = 'translateY(-2px)'}
                                    onMouseOut={e => e.currentTarget.style.transform = 'translateY(0)'}
                                >
                                    Next Card
                                </button>
                            </div>

                            <button 
                                onClick={reset}
                                style={{ width: '100%', marginTop: 24, background: 'none', border: 'none', color: '#94A3B8', fontWeight: 700, fontSize: '0.9rem', cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 8 }}
                            >
                                <RotateCcw size={16} /> Start New Session
                            </button>
                        </motion.div>
                    )}

                </div>

            </main>
        </div>
    );
}