import { useRef, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { useInterview } from "../hooks/useInterview";
import ChatMessage from "../components/chat/ChatMessage";
import TypingIndicator from "../components/chat/TypingIndicator";
import ChatInput from "../components/chat/ChatInput";
import {
  ArrowLeft,
  Mic,
  Sparkles,
  RotateCcw,
  CheckCircle2,
  Play,
  Zap,
  Star
} from "lucide-react";
import { motion, AnimatePresence } from "framer-motion";

function ProgressBar({ count }: { count: number }) {
  const progress = Math.min((count / 5) * 100, 100);
  return (
    <div style={{ display: "flex", alignItems: "center", gap: 12 }}>
      <div style={{ fontSize: 13, fontWeight: 700, color: "#4f46e5" }}>Q {count}/5</div>
      <div style={{ width: 100, height: 6, background: "rgba(99, 102, 241, 0.1)", borderRadius: 10 }}>
        <div style={{ width: `${progress}%`, height: "100%", borderRadius: 10, background: "linear-gradient(90deg, #4f46e5, #818cf8)", transition: "width 0.4s ease" }} />
      </div>
    </div>
  );
}

export default function MockInterview() {
  const navigate = useNavigate();
  const { messages, state, startInterview, sendMessage, reset } = useInterview();
  const bottomRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages, state.isLoading]);

  return (
    <div style={{ background: '#f0f4ff', minHeight: '100vh', fontFamily: "'Inter', sans-serif", color: '#1e293b', position: 'relative', overflowX: 'hidden' }}>

      {/* Background Blobs */}
      <div style={{ position: 'absolute', top: 0, left: 0, right: 0, bottom: 0, zIndex: 0, overflow: 'hidden', pointerEvents: 'none' }}>
        <motion.div animate={{ x: [0, 100, 0], y: [0, 50, 0] }} transition={{ duration: 15, repeat: Infinity }} style={{ position: 'absolute', top: '-10%', left: '-5%', width: '50vw', height: '50vw', background: 'radial-gradient(circle, rgba(99, 102, 241, 0.12) 0%, transparent 70%)', filter: 'blur(80px)' }} />
        <motion.div animate={{ x: [0, -80, 0], y: [0, 100, 0] }} transition={{ duration: 18, repeat: Infinity }} style={{ position: 'absolute', top: '20%', right: '-10%', width: '60vw', height: '60vw', background: 'radial-gradient(circle, rgba(167, 139, 250, 0.08) 0%, transparent 70%)', filter: 'blur(100px)' }} />
      </div>

      <style>{`
        @import url('https://fonts.googleapis.com/css2?family=Inter:wght@400;500;600;700;800&family=Lora:ital,wght@0,400;0,500;1,400&display=swap');
        @keyframes fadeUp { from { opacity:0; transform:translateY(20px); } to { opacity:1; transform:translateY(0); } }
        .glass-box {
          background: rgba(255, 255, 255, 0.6);
          backdrop-filter: blur(20px);
          -webkit-backdrop-filter: blur(20px);
          border: 1px solid rgba(255, 255, 255, 0.4);
          box-shadow: 0 20px 50px rgba(0,0,0,0.05);
        }
        * { box-sizing: border-box; margin: 0; padding: 0; }
      `}</style>

      {/* Nav Header */}
      <nav style={{
        display: 'flex', justifyContent: 'space-between', alignItems: 'center',
        padding: '20px 48px', background: 'rgba(255, 255, 255, 0.5)',
        backdropFilter: 'blur(16px)', position: 'sticky', top: 0, zIndex: 100,
        borderBottom: '1px solid rgba(255, 255, 255, 0.3)'
      }}>
        <div style={{ fontWeight: 800, fontSize: '1.25rem', color: '#4F46E5', display: 'flex', alignItems: 'center', gap: 10, cursor: 'pointer' }} onClick={() => navigate("/")}>
          <div style={{ background: '#4F46E5', color: '#fff', width: 32, height: 32, borderRadius: 10, display: 'flex', alignItems: 'center', justifyContent: 'center' }}><Mic size={18} /></div>
          MockPrep AI
        </div>

        <div style={{ display: 'flex', alignItems: 'center', gap: 24 }}>
          {state.isStarted && <ProgressBar count={state.questionCount} />}
          <button
            onClick={() => navigate("/dashboard")}
            style={{ background: 'rgba(255,255,255,0.8)', border: '1px solid rgba(99,102,241,0.2)', padding: '10px 22px', borderRadius: '12px', fontSize: '14px', fontWeight: 700, color: '#4338ca', cursor: 'pointer', display: 'flex', alignItems: 'center', gap: 8 }}
          >
            <ArrowLeft size={16} /> Exit
          </button>
        </div>
      </nav>

      <main style={{ maxWidth: 900, margin: '0 auto', padding: '40px 24px 100px', position: 'relative', zIndex: 1, minHeight: 'calc(100vh - 72px)', display: 'flex', flexDirection: 'column' }}>

        {!state.isStarted ? (
          /* Welcome Screen */
          <motion.div initial={{ opacity: 0, y: 30 }} animate={{ opacity: 1, y: 0 }} style={{ flex: 1, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
            <div className="glass-box" style={{ borderRadius: 40, padding: 60, textAlign: 'center', maxWidth: 640 }}>
              <div style={{ width: 80, height: 80, background: '#fff', borderRadius: '24px', boxShadow: '0 15px 30px rgba(79, 70, 229, 0.1)', display: 'flex', alignItems: 'center', justifyContent: 'center', margin: '0 auto 32px' }}>
                <Mic size={36} color="#4f46e5" />
              </div>
              <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} style={{ display: 'inline-flex', alignItems: 'center', gap: 8, background: 'rgba(99,102,241,0.1)', color: '#4338ca', padding: '8px 20px', borderRadius: '100px', fontWeight: 700, fontSize: '0.85rem', marginBottom: 24 }}>
                <Sparkles size={16} /> Real-Time Interview Feedback
              </motion.div>
              <h1 style={{ fontSize: "clamp(2.5rem, 5vw, 3rem)", fontWeight: 800, color: "#0f172a", marginBottom: 20, letterSpacing: '-0.02em', lineHeight: 1.2 }}>
                Ace your next <br />
                <span style={{ background: 'linear-gradient(90deg, #4f46e5, #7c3aed)', WebkitBackgroundClip: 'text', WebkitTextFillColor: 'transparent' }}>Dream Interview.</span>
              </h1>
              <p style={{ color: "#475569", fontSize: '1.15rem', lineHeight: 1.6, fontFamily: 'Lora', marginBottom: 40 }}>
                Experience a realistic interview with our AI. Get detailed feedback on your answers and master technical topics.
              </p>

              <div style={{ display: 'flex', justifyContent: 'center', gap: 12, marginBottom: 40, flexWrap: 'wrap' }}>
                {["Llama 3.3", "Groq Powered", "Instant Analysis", "5 Questions"].map(tag => (
                  <span key={tag} style={{ padding: '6px 14px', borderRadius: '10px', background: 'rgba(255,255,255,0.6)', border: '1px solid rgba(0,0,0,0.05)', fontSize: '12px', fontWeight: 700, color: '#64748b' }}>{tag}</span>
                ))}
              </div>

              <button
                onClick={startInterview}
                style={{ background: 'linear-gradient(135deg, #4f46e5, #7c3aed)', color: '#fff', border: 'none', padding: '18px 48px', borderRadius: '16px', fontSize: '1.1rem', fontWeight: 800, cursor: 'pointer', boxShadow: '0 15px 30px rgba(79, 70, 229, 0.3)', transition: 'all 0.3s', display: 'flex', alignItems: 'center', gap: 12, margin: '0 auto' }}
                onMouseOver={e => e.currentTarget.style.transform = 'translateY(-4px)'}
                onMouseOut={e => e.currentTarget.style.transform = 'translateY(0)'}
              >
                Start Now <Play size={20} />
              </button>
            </div>
          </motion.div>
        ) : (
          /* Chat Interface */
          <div style={{ flex: 1, display: 'flex', flexDirection: 'column', gap: 24 }}>
            <div className="glass-box" style={{ flex: 1, borderRadius: 32, padding: 32, overflowY: 'auto', maxHeight: 'calc(100vh - 280px)' }}>
              {messages.map((msg, i) => (
                <ChatMessage key={i} message={msg} />
              ))}
              {state.isLoading && <TypingIndicator />}
              <div ref={bottomRef} />
            </div>

            <div style={{ position: 'sticky', bottom: 0 }}>
              {!state.isFinished ? (
                <div className="glass-box" style={{ borderRadius: 24, padding: 8 }}>
                  <ChatInput onSend={sendMessage} disabled={state.isLoading} />
                </div>
              ) : (
                <div className="glass-box" style={{ borderRadius: 24, padding: 32, textAlign: 'center' }}>
                  <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 12, marginBottom: 20 }}>
                    <CheckCircle2 size={32} color="#10b981" />
                    <h3 style={{ fontSize: '1.5rem', fontWeight: 800, color: '#0f172a' }}>Interview Completed!</h3>
                  </div>
                  <p style={{ color: '#64748b', marginBottom: 24 }}>You've finished all 5 questions. Great job practicing!</p>
                  <button
                    onClick={reset}
                    style={{ background: '#0f172a', color: '#fff', border: 'none', padding: '14px 32px', borderRadius: '14px', fontWeight: 700, cursor: 'pointer', display: 'flex', alignItems: 'center', gap: 8, margin: '0 auto' }}
                  >
                    <RotateCcw size={18} /> Restart Session
                  </button>
                </div>
              )}
            </div>
          </div>
        )}

      </main>

      {/* Toast */}
      {state.error && (
        <div style={{ position: 'fixed', bottom: 32, right: 32, background: '#fff', border: '1px solid #ef4444', color: '#ef4444', borderRadius: 16, padding: '16px 24px', fontWeight: 700, boxShadow: '0 20px 40px rgba(0,0,0,0.1)', display: 'flex', alignItems: 'center', gap: 12, zIndex: 1000 }}>
          <Zap size={20} /> {state.error}
        </div>
      )}
    </div>
  );
}