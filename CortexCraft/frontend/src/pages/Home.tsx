import { useNavigate } from "react-router-dom";
import React, { useEffect, useState } from "react";
import { 
  GraduationCap, 
  Users, 
  BrainCircuit, 
  CheckCircle2, 
  BookOpen, 
  ArrowRight, 
  Sparkles, 
  MessageSquare, 
  Layout,
  Zap,
  Code,
  Search,
  User,
  ArrowUpRight,
  LogOut
} from "lucide-react";
import { motion, AnimatePresence } from "framer-motion";

const Home = () => {
  const navigate = useNavigate();
  const [user, setUser] = useState<any>(null);

  useEffect(() => {
    const storedUser = localStorage.getItem('user');
    if (storedUser) setUser(JSON.parse(storedUser));
  }, []);

  const handleGetStarted = () => {
    if (user) navigate("/dashboard");
    else navigate("/login");
  };

  const handleLogout = () => {
    localStorage.removeItem('user');
    setUser(null);
    window.location.reload();
  };

  return (
    <div className="page" style={{
      background: '#f8faff', 
      fontFamily: "'Inter', sans-serif",
      color: '#1e293b',
      minHeight: '100vh',
      overflowX: 'hidden',
      position: 'relative'
    }}>
      
      {/* Background Aurora Effect */}
      <div style={{ position: 'absolute', top: 0, left: 0, right: 0, bottom: 0, overflow: 'hidden', pointerEvents: 'none', zIndex: 0 }}>
        <motion.div animate={{ x: [0, 50, 0], y: [0, 30, 0] }} transition={{ duration: 20, repeat: Infinity }} style={{ position: 'absolute', top: '-10%', left: '-5%', width: '50vw', height: '50vw', background: 'radial-gradient(circle, rgba(99, 102, 241, 0.1) 0%, transparent 70%)', filter: 'blur(100px)' }} />
        <motion.div animate={{ x: [0, -80, 0], y: [0, 100, 0] }} transition={{ duration: 18, repeat: Infinity }} style={{ position: 'absolute', top: '20%', right: '-10%', width: '60vw', height: '60vw', background: 'radial-gradient(circle, rgba(167, 139, 250, 0.08) 0%, transparent 70%)', filter: 'blur(100px)' }} />
      </div>

      <style>{`
        @import url('https://fonts.googleapis.com/css2?family=Inter:wght@400;500;600;700;800&family=Lora:ital,wght@0,400;0,500;1,400&display=swap');
        * { box-sizing: border-box; margin: 0; padding: 0; }
        
        .nav { 
          display: flex; justify-content: space-between; align-items: center; 
          padding: 16px 48px; background: rgba(255, 255, 255, 0.6);
          backdrop-filter: blur(20px); position: sticky; top: 0; z-index: 100;
          border-bottom: 1px solid rgba(0, 0, 0, 0.05);
        }
        
        .btn-primary { 
          background: #4F46E5; color: #fff; border: none; padding: 14px 28px; 
          border-radius: 12px; font-size: 0.95rem; font-weight: 700; cursor: pointer; 
          transition: 0.3s; box-shadow: 0 8px 20px rgba(79, 70, 229, 0.15);
          display: flex; align-items: center; gap: 10px;
        }
        .btn-primary:hover { transform: translateY(-2px); box-shadow: 0 12px 25px rgba(79, 70, 229, 0.25); }

        .floating-bubble {
          background: #fff; padding: 16px 24px; border-radius: 24px;
          border: 1px solid rgba(0,0,0,0.05); box-shadow: 0 10px 30px rgba(0,0,0,0.04);
          color: #374151; font-size: 1.05rem; font-weight: 500;
          display: flex; align-items: center; gap: 12px; position: absolute;
          z-index: 5;
        }

        .hero-title {
          font-size: clamp(3rem, 7vw, 5rem); font-weight: 800; line-height: 1.05;
          letter-spacing: -0.04em; color: #0f172a; margin-bottom: 24px;
        }

        .roadmap-img {
          width: 100%; height: 340px; border-radius: 32px; object-fit: cover;
          box-shadow: 0 20px 50px rgba(0,0,0,0.08); border: 4px solid #fff;
        }

        @media (max-width: 1100px) {
          .hero-bubbles { display: none !important; }
        }
      `}</style>

      {/* Navigation */}
      <nav className="nav">
        <div style={{ fontWeight: 800, fontSize: '1.25rem', color: '#4F46E5', display: 'flex', alignItems: 'center', gap: 10, cursor: 'pointer' }} onClick={() => navigate("/home")}>
          <div style={{ background: '#4F46E5', color: '#fff', width: 32, height: 32, borderRadius: 10, display: 'flex', alignItems: 'center', justifyContent: 'center' }}><GraduationCap size={18} /></div>
          CortexCraft
        </div>
        
        <div style={{ display: 'flex', gap: 32, alignItems: 'center' }}>
          <button style={{ background: 'none', border: 'none', color: '#64748b', fontSize: '0.95rem', fontWeight: 600, cursor: 'pointer' }} onClick={() => navigate("/community")}>Community</button>
          
          <AnimatePresence mode="wait">
            {user ? (
              <motion.div 
                key="user-pill"
                initial={{ opacity: 0, x: 20 }}
                animate={{ opacity: 1, x: 0 }}
                style={{ display: 'flex', alignItems: 'center', gap: 12, background: '#fff', padding: '6px 6px 6px 16px', borderRadius: '100px', border: '1px solid #e2e8f0', boxShadow: '0 4px 10px rgba(0,0,0,0.03)' }}
              >
                <div style={{ fontSize: '0.9rem', fontWeight: 700, color: '#1e293b' }}>{user?.name?.split(' ')[0] || 'User'}</div>
                <img src={user.avatar} style={{ width: 32, height: 32, borderRadius: '50%', background: '#f1f5f9' }} />
                <button 
                  onClick={handleLogout}
                  style={{ background: 'none', border: 'none', color: '#94a3b8', padding: '8px', cursor: 'pointer', display: 'flex', alignItems: 'center', transition: '0.2s' }}
                  onMouseOver={e => e.currentTarget.style.color = '#ef4444'}
                  onMouseOut={e => e.currentTarget.style.color = '#94a3b8'}
                >
                  <LogOut size={16} />
                </button>
              </motion.div>
            ) : (
              <button 
                key="login-btn"
                className="btn-primary" 
                onClick={() => navigate("/login")}
              >
                Join Now <ArrowRight size={18} />
              </button>
            )}
          </AnimatePresence>
        </div>
      </nav>

      <section style={{ position: 'relative', padding: '120px 40px 180px', textAlign: 'center' }}>
        <div style={{ position: 'absolute', inset: 0, backgroundImage: 'radial-gradient(#e2e8f0 1.5px, transparent 1.5px)', backgroundSize: '32px 32px', opacity: 0.4, zIndex: 0 }}></div>

        <div className="hero-bubbles" style={{ position: 'absolute', inset: 0, pointerEvents: 'none' }}>
           <motion.div animate={{ y: [0, -20, 0], rotate: [-4, -2, -4] }} transition={{ duration: 6, repeat: Infinity, ease: 'easeInOut' }} className="floating-bubble" style={{ top: '15%', left: '8%' }}>
              Explain Black Holes. <BrainCircuit size={18} color="#4f46e5" />
           </motion.div>
           
           <motion.div animate={{ y: [0, 20, 0], rotate: [4, 6, 4] }} transition={{ duration: 7, repeat: Infinity, ease: 'easeInOut', delay: 1 }} className="floating-bubble" style={{ bottom: '15%', left: '12%', background: '#4F46E5', color: '#fff', boxShadow: '0 25px 50px rgba(79, 70, 229, 0.25)' }}>
              Think step-by-step. <Zap size={18} />
           </motion.div>

           <motion.div animate={{ y: [0, -20, 0], rotate: [6, 8, 6] }} transition={{ duration: 8, repeat: Infinity, ease: 'easeInOut', delay: 2 }} className="floating-bubble" style={{ top: '20%', right: '8%' }}>
              React vs Vue? <Code size={18} color="#0891b2" />
           </motion.div>

           <motion.div animate={{ y: [0, 20, 0], rotate: [-5, -3, -5] }} transition={{ duration: 9, repeat: Infinity, ease: 'easeInOut', delay: 3 }} className="floating-bubble" style={{ bottom: '20%', right: '12%' }}>
              Verified Logic. <CheckCircle2 size={18} color="#10b981" />
           </motion.div>
        </div>

        <div style={{ maxWidth: 900, margin: '0 auto', position: 'relative', zIndex: 10 }}>
          <motion.div initial={{ opacity: 0, scale: 0.9 }} animate={{ opacity: 1, scale: 1 }} style={{ display: 'inline-flex', alignItems: 'center', gap: 8, background: '#EEF2FF', color: '#4F46E5', padding: '8px 24px', borderRadius: '100px', fontWeight: 800, fontSize: '0.85rem', marginBottom: 32, border: '1px solid rgba(79, 70, 229, 0.1)', boxShadow: '0 8px 20px rgba(79, 70, 229, 0.1)' }}>
            <Sparkles size={16} /> Active Mentor Ready
          </motion.div>
          <h1 className="hero-title">Stop pulling your hair out.<br />Your 'Aha!' moment is one tap away.</h1>
          <p style={{ fontSize: '1.3rem', color: '#64748b', marginBottom: 56, fontFamily: 'Lora', maxWidth: 600, margin: '0 auto 56px', lineHeight: 1.6 }}>Don't just stare at your notes like they're in a foreign language. Understand the 'why' without the 2 AM mental breakdown.</p>

          <motion.div 
            whileHover={{ scale: 1.02, boxShadow: '0 30px 60px rgba(0,0,0,0.06)' }}
            style={{ background: '#fff', border: '2px solid #e2e8f0', borderRadius: '100px', padding: '12px 12px 12px 36px', display: 'flex', alignItems: 'center', gap: 16, maxWidth: 680, margin: '0 auto', boxShadow: '0 20px 40px rgba(0,0,0,0.04)', transition: '0.4s' }}
          >
            <div style={{ fontSize: '1.15rem', color: '#94a3b8', flex: 1, textAlign: 'left', fontFamily: 'Lora' }}>What topic do you want to master today?</div>
            <button className="btn-primary" onClick={handleGetStarted}>
              Start Free Session <ArrowRight size={20} />
            </button>
          </motion.div>
        </div>
      </section>

      <section style={{ padding: '140px 60px', background: '#fff', position: 'relative', zIndex: 1 }}>
        <div style={{ textAlign: 'center', marginBottom: 120 }}>
          <h2 style={{ fontSize: '3rem', fontWeight: 800, color: '#0f172a', marginBottom: 20 }}>The Learning Flowchart.</h2>
          <p style={{ color: '#64748b', fontSize: '1.25rem', fontFamily: 'Lora', maxWidth: 600, margin: '0 auto' }}>A structured path designed to ensure maximum knowledge retention.</p>
        </div>

        <div style={{ maxWidth: 1050, margin: '0 auto', position: 'relative' }}>
          <div style={{ position: 'absolute', left: '50%', top: 0, bottom: 0, width: 2, borderLeft: '3px dashed #e2e8f0', transform: 'translateX(-50%)', zIndex: 0 }}></div>

          <motion.div initial={{ opacity: 0, y: 40 }} whileInView={{ opacity: 1, y: 0 }} viewport={{ once: true }} transition={{ duration: 0.8 }} style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 100, alignItems: 'center', marginBottom: 160, position: 'relative' }}>
            <div style={{ textAlign: 'right' }}>
               <div style={{ background: '#EEF2FF', width: 64, height: 64, borderRadius: 20, display: 'flex', alignItems: 'center', justifyContent: 'center', marginBottom: 24, marginLeft: 'auto', color: '#4F46E5', boxShadow: '0 10px 20px rgba(79, 70, 229, 0.1)' }}><BrainCircuit size={32} /></div>
               <h3 style={{ fontSize: '2rem', fontWeight: 800, marginBottom: 20, color: '#0f172a' }}>Personal AI Mentor</h3>
               <p style={{ color: '#64748b', lineHeight: 1.8, fontSize: '1.15rem' }}>Stop getting stuck. Our Socratic AI guides you through complex problems by asking the right questions, helping you build genuine expertise.</p>
            </div>
            <div style={{ position: 'relative' }}>
               <img src="https://images.unsplash.com/photo-1509062522246-3755977927d7?auto=format&fit=crop&q=80&w=1200" alt="Mentor" className="roadmap-img" />
               <div style={{ position: 'absolute', top: '50%', left: -56, width: 14, height: 14, borderRadius: '50%', background: '#4F46E5', border: '4px solid #fff', boxShadow: '0 0 0 6px #EEF2FF' }} />
            </div>
          </motion.div>

          <motion.div initial={{ opacity: 0, y: 40 }} whileInView={{ opacity: 1, y: 0 }} viewport={{ once: true }} transition={{ duration: 0.8 }} style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 100, alignItems: 'center', marginBottom: 160, position: 'relative' }}>
            <div style={{ position: 'relative' }}>
               <img src="https://images.unsplash.com/photo-1434030216411-0b793f4b4173?auto=format&fit=crop&q=80&w=1200" alt="Syllabus" className="roadmap-img" />
               <div style={{ position: 'absolute', top: '50%', right: -56, width: 14, height: 14, borderRadius: '50%', background: '#EF4444', border: '4px solid #fff', boxShadow: '0 0 0 6px #FEF2F2' }} />
            </div>
            <div style={{ textAlign: 'left' }}>
               <div style={{ background: '#FEF2F2', width: 64, height: 64, borderRadius: 20, display: 'flex', alignItems: 'center', justifyContent: 'center', marginBottom: 24, color: '#EF4444', boxShadow: '0 10px 20px rgba(239, 68, 68, 0.1)' }}><BookOpen size={32} /></div>
               <h3 style={{ fontSize: '2rem', fontWeight: 800, marginBottom: 20, color: '#0f172a' }}>Structured Roadmap</h3>
               <p style={{ color: '#64748b', lineHeight: 1.8, fontSize: '1.15rem' }}>Never lose your way. We organize your learning into a clear path of chapters, quizzes, and notes, optimized for your personal pace.</p>
            </div>
          </motion.div>

          <motion.div initial={{ opacity: 0, y: 40 }} whileInView={{ opacity: 1, y: 0 }} viewport={{ once: true }} transition={{ duration: 0.8 }} style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 100, alignItems: 'center', position: 'relative' }}>
            <div style={{ textAlign: 'right' }}>
               <div style={{ background: '#FEF3C7', width: 64, height: 64, borderRadius: 20, display: 'flex', alignItems: 'center', justifyContent: 'center', marginBottom: 24, marginLeft: 'auto', color: '#D97706', boxShadow: '0 10px 20px rgba(217, 119, 6, 0.1)' }}><Users size={32} /></div>
               <h3 style={{ fontSize: '2rem', fontWeight: 800, marginBottom: 20, color: '#0f172a' }}>Collaborative IDE</h3>
               <p style={{ color: '#64748b', lineHeight: 1.8, fontSize: '1.15rem' }}>Learn together in real-time. Join community channels, code with peers in our live IDE, and share insights in a safe, academic environment.</p>
            </div>
            <div style={{ position: 'relative' }}>
               <img src="https://images.unsplash.com/photo-1522202176988-66273c2fd55f?auto=format&fit=crop&q=80&w=1200" alt="Community" className="roadmap-img" />
               <div style={{ position: 'absolute', top: '50%', left: -56, width: 14, height: 14, borderRadius: '50%', background: '#D97706', border: '4px solid #fff', boxShadow: '0 0 0 6px #FEF3C7' }} />
            </div>
          </motion.div>
        </div>
      </section>

      {/* COMPACT FOOTER */}
      <footer style={{ background: '#0f172a', padding: '60px 0 30px', color: '#94a3b8' }}>
        <div style={{ maxWidth: 1200, margin: '0 auto', padding: '0 60px', display: 'flex', justifyContent: 'space-between', flexWrap: 'wrap', gap: 60 }}>
          <div>
            <div style={{ color: '#fff', fontWeight: 800, fontSize: '1.4rem', marginBottom: 16, display: 'flex', alignItems: 'center', gap: 10 }}>
               <div style={{ background: '#6366f1', color: '#fff', width: 32, height: 32, borderRadius: 8, display: 'flex', alignItems: 'center', justifyContent: 'center' }}><GraduationCap size={20} /></div>
               CortexCraft
            </div>
            <p style={{ maxWidth: 300, lineHeight: 1.6, fontSize: '0.95rem' }}>The future of education is agentic. We provide the tools to master any subject through Socratic AI guidance.</p>
          </div>
          <div style={{ display: 'flex', gap: 80 }}>
             <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
                <span style={{ color: '#fff', fontWeight: 700, fontSize: '1rem', marginBottom: 6 }}>Product</span>
                <a href="#" style={{ color: 'inherit', textDecoration: 'none', transition: '0.2s', fontSize: '0.9rem' }}>Dashboard</a>
                <a href="#" style={{ color: 'inherit', textDecoration: 'none', transition: '0.2s', fontSize: '0.9rem' }}>Roadmap</a>
                <a href="#" style={{ color: 'inherit', textDecoration: 'none', transition: '0.2s', fontSize: '0.9rem' }}>Mentors</a>
             </div>
             <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
                <span style={{ color: '#fff', fontWeight: 700, fontSize: '1rem', marginBottom: 6 }}>Connect</span>
                <a href="#" style={{ color: 'inherit', textDecoration: 'none', transition: '0.2s', fontSize: '0.9rem' }}>Community</a>
                <a href="#" style={{ color: 'inherit', textDecoration: 'none', transition: '0.2s', fontSize: '0.9rem' }}>Support</a>
                <a href="#" style={{ color: 'inherit', textDecoration: 'none', transition: '0.2s', fontSize: '0.9rem' }}>Privacy</a>
             </div>
          </div>
        </div>
        <div style={{ maxWidth: 1200, margin: '40px auto 0', padding: '30px 60px 0', borderTop: '1px solid rgba(255,255,255,0.05)', textAlign: 'center', fontSize: '13px' }}>
          © 2026 CortexCraft AI. Crafted for the curious mind.
        </div>
      </footer>
    </div>
  );
};

export default Home;