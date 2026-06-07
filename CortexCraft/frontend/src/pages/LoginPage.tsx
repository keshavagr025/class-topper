import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { motion, AnimatePresence } from 'framer-motion';
import { 
  GraduationCap, 
  Mail, 
  ArrowRight, 
  ShieldCheck, 
  Sparkles, 
  BrainCircuit, 
  Zap, 
  CheckCircle2,
  Lock,
  Globe,
  Stars,
  User,
  AlertCircle
} from 'lucide-react';
import { API_URL } from '../apiConfig';

const GOOGLE_CLIENT_ID = import.meta.env.VITE_GOOGLE_CLIENT_ID || "your-google-client-id.apps.googleusercontent.com";

export default function LoginPage() {
  const navigate = useNavigate();
  const [isSignUp, setIsSignUp] = useState(false);
  const [loading, setLoading] = useState(false);
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [name, setName] = useState('');
  const [error, setError] = useState('');

  // OTP Auth States
  const [isOtpMode, setIsOtpMode] = useState(false);
  const [otpSent, setOtpSent] = useState(false);
  const [otp, setOtp] = useState('');

  // Handle Google Sign-In Response
  const handleGoogleCredentialResponse = async (response: any) => {
    setLoading(true);
    setError('');
    try {
      const res = await fetch(`${API_URL}/auth/google`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ id_token: response.credential }),
      });

      if (!res.ok) {
        const errData = await res.json();
        throw new Error(errData.detail || "Google authentication failed");
      }

      const data = await res.json();
      localStorage.setItem("token", data.token);
      localStorage.setItem("user", JSON.stringify(data.user));
      
      // Dispatch storage event manually to notify App.tsx if needed
      window.dispatchEvent(new Event('storage'));
      
      window.location.href = '/home';
    } catch (err: any) {
      console.error(err);
      setError(err.message || "An error occurred during Google Sign-In");
      setLoading(false);
    }
  };

  // Initialize Google Identity Services
  useEffect(() => {
    const initializeGoogle = () => {
      const google = (window as any).google;
      if (google && google.accounts && google.accounts.id) {
        try {
          google.accounts.id.initialize({
            client_id: GOOGLE_CLIENT_ID,
            callback: handleGoogleCredentialResponse
          });
          
          google.accounts.id.renderButton(
            document.getElementById("google-signin-btn"),
            { 
              theme: "filled_blue", 
              size: "large", 
              width: 320,
              text: isSignUp ? "signup_with" : "signin_with",
              shape: "pill"
            }
          );
        } catch (err) {
          console.error("Error rendering Google button", err);
        }
      }
    };

    // Give it a tiny delay to ensure script has loaded
    const timer = setTimeout(initializeGoogle, 600);
    return () => clearTimeout(timer);
  }, [isSignUp]);

  const handleSendOTP = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!email) {
      setError("Please enter a valid email address.");
      return;
    }
    setLoading(true);
    setError('');
    try {
      const res = await fetch(`${API_URL}/auth/otp/send`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email }),
      });
      if (!res.ok) {
        const errData = await res.json();
        throw new Error(errData.detail || "Failed to send OTP. Please try again.");
      }
      setOtpSent(true);
    } catch (err: any) {
      console.error(err);
      setError(err.message || "An error occurred while sending OTP.");
    } finally {
      setLoading(false);
    }
  };

  const handleVerifyOTP = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!otp) {
      setError("Please enter the OTP sent to your email.");
      return;
    }
    setLoading(true);
    setError('');
    try {
      const res = await fetch(`${API_URL}/auth/otp/verify`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email, otp, name: isSignUp ? name : undefined }),
      });
      if (!res.ok) {
        const errData = await res.json();
        throw new Error(errData.detail || "OTP verification failed. Please try again.");
      }
      const data = await res.json();
      localStorage.setItem("token", data.token);
      localStorage.setItem("user", JSON.stringify(data.user));
      
      // Dispatch storage event manually to notify App.tsx
      window.dispatchEvent(new Event('storage'));
      window.location.href = '/home';
    } catch (err: any) {
      console.error(err);
      setError(err.message || "An error occurred during OTP verification.");
    } finally {
      setLoading(false);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!email || !password || (isSignUp && !name)) {
      setError("Please fill in all required fields.");
      return;
    }

    setLoading(true);
    setError('');

    try {
      const endpoint = isSignUp ? '/auth/signup' : '/auth/login';
      const payload = isSignUp 
        ? { email, password, name } 
        : { email, password };

      const res = await fetch(`${API_URL}${endpoint}`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload)
      });

      if (!res.ok) {
        const errData = await res.json();
        throw new Error(errData.detail || "Authentication failed");
      }

      const data = await res.json();
      localStorage.setItem("token", data.token);
      localStorage.setItem("user", JSON.stringify(data.user));
      
      // Dispatch storage event manually
      window.dispatchEvent(new Event('storage'));
      
      window.location.href = '/home';
    } catch (err: any) {
      setError(err.message || "An error occurred during authentication.");
      setLoading(false);
    }
  };

  return (
    <div style={{ 
      minHeight: '100vh', 
      background: '#020617', 
      display: 'flex', 
      fontFamily: "'Inter', sans-serif",
      color: '#fff',
      overflow: 'hidden'
    }}>
      
      {/* Left Side: Visual Experience */}
      <div style={{ 
        flex: 1.2, 
        position: 'relative', 
        display: 'flex', 
        alignItems: 'center', 
        justifyContent: 'center',
        padding: '60px',
        overflow: 'hidden',
        background: 'radial-gradient(circle at 20% 30%, rgba(79, 70, 229, 0.15) 0%, transparent 50%), radial-gradient(circle at 80% 70%, rgba(139, 92, 246, 0.1) 0%, transparent 50%)'
      }}>
        <div style={{ position: 'absolute', inset: 0, opacity: 0.2, backgroundImage: 'radial-gradient(#334155 1px, transparent 1px)', backgroundSize: '40px 40px' }}></div>
        
        <div style={{ position: 'relative', zIndex: 10, maxWidth: '600px' }}>
          <motion.div 
            initial={{ opacity: 0, y: 30 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.8 }}
          >
            <div style={{ display: 'inline-flex', alignItems: 'center', gap: 10, background: 'rgba(79, 70, 229, 0.1)', border: '1px solid rgba(79, 70, 229, 0.2)', padding: '8px 16px', borderRadius: '100px', marginBottom: '24px', color: '#818cf8', fontWeight: 600, fontSize: '0.85rem' }}>
              <Stars size={16} /> Elite Learning Ecosystem
            </div>
            <h1 style={{ fontSize: '4.5rem', fontWeight: 800, lineHeight: 1.1, letterSpacing: '-0.04em', marginBottom: '24px' }}>
              Master any subject with <span style={{ background: 'linear-gradient(to right, #818cf8, #c084fc)', WebkitBackgroundClip: 'text', WebkitTextFillColor: 'transparent' }}>CortexCraft.</span>
            </h1>
            <p style={{ fontSize: '1.25rem', color: '#94a3b8', lineHeight: 1.6, marginBottom: '48px', maxWidth: '500px' }}>
              Step into the future of education. Your personal AI-powered notebook that thinks, plans, and guides you to mastery.
            </p>
          </motion.div>

          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '20px' }}>
            {[
              { icon: <BrainCircuit size={20} />, title: "Socratic Guidance", color: "#6366f1" },
              { icon: <Zap size={20} />, title: "Instant Mastery", color: "#f59e0b" },
              { icon: <Globe size={20} />, title: "Global Network", color: "#10b981" },
              { icon: <CheckCircle2 size={20} />, title: "Verified Logic", color: "#ec4899" }
            ].map((item, i) => (
              <motion.div 
                key={i}
                initial={{ opacity: 0, x: -20 }}
                animate={{ opacity: 1, x: 0 }}
                transition={{ delay: 0.5 + (i * 0.1) }}
                style={{ background: 'rgba(255,255,255,0.03)', border: '1px solid rgba(255,255,255,0.05)', padding: '20px', borderRadius: '20px', display: 'flex', alignItems: 'center', gap: '16px', backdropFilter: 'blur(10px)' }}
              >
                <div style={{ color: item.color }}>{item.icon}</div>
                <span style={{ fontWeight: 600, fontSize: '0.95rem' }}>{item.title}</span>
              </motion.div>
            ))}
          </div>
        </div>

        {/* Decorative Floating Card */}
        <motion.div 
          animate={{ y: [0, -20, 0], rotate: [2, -2, 2] }}
          transition={{ duration: 6, repeat: Infinity, ease: 'easeInOut' }}
          style={{ position: 'absolute', top: '15%', right: '5%', background: 'rgba(255,255,255,0.05)', backdropFilter: 'blur(20px)', border: '1px solid rgba(255,255,255,0.1)', padding: '24px', borderRadius: '24px', boxShadow: '0 25px 50px -12px rgba(0,0,0,0.5)', width: '220px' }}
        >
          <div style={{ display: 'flex', gap: 10, marginBottom: 12 }}>
            <div style={{ width: 10, height: 10, borderRadius: '50%', background: '#ef4444' }}></div>
            <div style={{ width: 10, height: 10, borderRadius: '50%', background: '#fbbf24' }}></div>
            <div style={{ width: 10, height: 10, borderRadius: '50%', background: '#22c55e' }}></div>
          </div>
          <div style={{ fontSize: '0.8rem', color: '#94a3b8', marginBottom: 8 }}>AI Strategy Active...</div>
          <div style={{ height: 4, background: '#334155', borderRadius: 2, marginBottom: 8 }}>
            <motion.div animate={{ width: ['0%', '70%', '40%', '90%'] }} transition={{ duration: 4, repeat: Infinity }} style={{ height: '100%', background: '#6366f1', borderRadius: 2 }}></motion.div>
          </div>
          <div style={{ fontSize: '0.75rem', fontWeight: 700 }}>Optimizing roadmap...</div>
        </motion.div>
      </div>

      {/* Right Side: Auth Form */}
      <div style={{ 
        flex: 0.8, 
        background: '#0a0f1e', 
        display: 'flex', 
        alignItems: 'center', 
        justifyContent: 'center',
        padding: '40px',
        borderLeft: '1px solid rgba(255,255,255,0.05)',
        position: 'relative'
      }}>
        <motion.div 
          initial={{ opacity: 0, x: 20 }}
          animate={{ opacity: 1, x: 0 }}
          style={{ width: '100%', maxWidth: '400px' }}
        >
          <div style={{ marginBottom: '32px', textAlign: 'center' }}>
            <div style={{ display: 'inline-flex', background: '#4F46E5', color: '#fff', width: 56, height: 56, borderRadius: '16px', alignItems: 'center', justifyContent: 'center', marginBottom: 20, boxShadow: '0 10px 25px rgba(79, 70, 229, 0.3)' }}>
              <GraduationCap size={28} />
            </div>
            <h2 style={{ fontSize: '2rem', fontWeight: 800, marginBottom: 8 }}>
              {isSignUp ? "Create Account" : "Welcome Back"}
            </h2>
            <p style={{ color: '#64748b' }}>
              {isSignUp ? "Sign up to start your learning journey" : "Enter your credentials to access your workspace"}
            </p>
          </div>

          {/* Tab Selector */}
          <div style={{
            display: 'flex',
            background: 'rgba(255, 255, 255, 0.03)',
            border: '1px solid rgba(255, 255, 255, 0.05)',
            padding: '4px',
            borderRadius: '10px',
            marginBottom: '20px',
          }}>
            <button 
              type="button"
              onClick={() => { setIsOtpMode(false); setError(''); }}
              style={{
                flex: 1,
                padding: '10px',
                background: !isOtpMode ? 'rgba(255, 255, 255, 0.08)' : 'transparent',
                border: 'none',
                borderRadius: '8px',
                color: '#fff',
                fontSize: '0.9rem',
                fontWeight: 600,
                cursor: 'pointer',
                transition: 'all 0.3s'
              }}
            >
              Password
            </button>
            <button 
              type="button"
              onClick={() => { setIsOtpMode(true); setError(''); }}
              style={{
                flex: 1,
                padding: '10px',
                background: isOtpMode ? 'rgba(255, 255, 255, 0.08)' : 'transparent',
                border: 'none',
                borderRadius: '8px',
                color: '#fff',
                fontSize: '0.9rem',
                fontWeight: 600,
                cursor: 'pointer',
                transition: 'all 0.3s'
              }}
            >
              Email OTP
            </button>
          </div>

          {!isOtpMode ? (
            <form onSubmit={handleSubmit} style={{ display: 'grid', gap: '16px' }}>
              {/* Error Notification */}
              <AnimatePresence>
                {error && (
                  <motion.div 
                    initial={{ opacity: 0, y: -10 }}
                    animate={{ opacity: 1, y: 0 }}
                    exit={{ opacity: 0, y: -10 }}
                    style={{ 
                      background: 'rgba(239, 68, 68, 0.1)', 
                      border: '1px solid rgba(239, 68, 68, 0.2)', 
                      color: '#f87171', 
                      padding: '12px', 
                      borderRadius: '10px', 
                      fontSize: '0.85rem', 
                      display: 'flex', 
                      alignItems: 'center', 
                      gap: 10 
                    }}
                  >
                    <AlertCircle size={16} />
                    <span>{error}</span>
                  </motion.div>
                )}
              </AnimatePresence>

              {isSignUp && (
                <div style={{ position: 'relative' }}>
                  <label style={{ display: 'block', fontSize: '0.85rem', fontWeight: 600, color: '#94a3b8', marginBottom: '8px', marginLeft: '4px' }}>Full Name</label>
                  <div style={{ position: 'relative' }}>
                    <User style={{ position: 'absolute', left: '16px', top: '50%', transform: 'translateY(-50%)', color: '#475569' }} size={18} />
                    <input 
                      type="text" 
                      placeholder="John Doe"
                      value={name}
                      onChange={(e) => setName(e.target.value)}
                      style={{ width: '100%', background: 'rgba(255,255,255,0.02)', border: '1px solid rgba(255,255,255,0.1)', padding: '14px 14px 14px 48px', borderRadius: '12px', color: '#fff', fontSize: '0.95rem', outline: 'none', transition: '0.3s' }}
                    />
                  </div>
                </div>
              )}

              <div style={{ position: 'relative' }}>
                <label style={{ display: 'block', fontSize: '0.85rem', fontWeight: 600, color: '#94a3b8', marginBottom: '8px', marginLeft: '4px' }}>Email Address</label>
                <div style={{ position: 'relative' }}>
                  <Mail style={{ position: 'absolute', left: '16px', top: '50%', transform: 'translateY(-50%)', color: '#475569' }} size={18} />
                  <input 
                    type="email" 
                    placeholder="name@example.com"
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    style={{ width: '100%', background: 'rgba(255,255,255,0.02)', border: '1px solid rgba(255,255,255,0.1)', padding: '14px 14px 14px 48px', borderRadius: '12px', color: '#fff', fontSize: '0.95rem', outline: 'none', transition: '0.3s' }}
                  />
                </div>
              </div>

              <div style={{ position: 'relative' }}>
                <label style={{ display: 'block', fontSize: '0.85rem', fontWeight: 600, color: '#94a3b8', marginBottom: '8px', marginLeft: '4px' }}>Password</label>
                <div style={{ position: 'relative' }}>
                  <Lock style={{ position: 'absolute', left: '16px', top: '50%', transform: 'translateY(-50%)', color: '#475569' }} size={18} />
                  <input 
                    type="password" 
                    placeholder="••••••••"
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    style={{ width: '100%', background: 'rgba(255,255,255,0.02)', border: '1px solid rgba(255,255,255,0.1)', padding: '14px 14px 14px 48px', borderRadius: '12px', color: '#fff', fontSize: '0.95rem', outline: 'none', transition: '0.3s' }}
                  />
                </div>
              </div>

              <button 
                type="submit"
                disabled={loading}
                style={{ 
                  background: '#fff', 
                  color: '#020617', 
                  border: 'none', 
                  padding: '16px', 
                  borderRadius: '12px', 
                  fontSize: '1rem', 
                  fontWeight: 700, 
                  cursor: loading ? 'not-allowed' : 'pointer', 
                  display: 'flex', 
                  alignItems: 'center', 
                  justifyContent: 'center', 
                  gap: 12,
                  marginTop: '12px',
                  transition: '0.3s'
                }}
                onMouseOver={e => !loading && (e.currentTarget.style.background = '#e2e8f0')}
                onMouseOut={e => !loading && (e.currentTarget.style.background = '#fff')}
              >
                {loading ? (
                  <div style={{ width: 20, height: 20, border: '3px solid #020617', borderTopColor: 'transparent', borderRadius: '50%', animation: 'spin 0.8s linear infinite' }} />
                ) : (
                  <>
                    <span>{isSignUp ? "Create Account" : "Sign in to Account"}</span> 
                    <ArrowRight size={20} />
                  </>
                )}
              </button>
            </form>
          ) : !otpSent ? (
            <form onSubmit={handleSendOTP} style={{ display: 'grid', gap: '16px' }}>
              {/* Error Notification */}
              <AnimatePresence>
                {error && (
                  <motion.div 
                    initial={{ opacity: 0, y: -10 }}
                    animate={{ opacity: 1, y: 0 }}
                    exit={{ opacity: 0, y: -10 }}
                    style={{ 
                      background: 'rgba(239, 68, 68, 0.1)', 
                      border: '1px solid rgba(239, 68, 68, 0.2)', 
                      color: '#f87171', 
                      padding: '12px', 
                      borderRadius: '10px', 
                      fontSize: '0.85rem', 
                      display: 'flex', 
                      alignItems: 'center', 
                      gap: 10 
                    }}
                  >
                    <AlertCircle size={16} />
                    <span>{error}</span>
                  </motion.div>
                )}
              </AnimatePresence>

              <div style={{ position: 'relative' }}>
                <label style={{ display: 'block', fontSize: '0.85rem', fontWeight: 600, color: '#94a3b8', marginBottom: '8px', marginLeft: '4px' }}>Email Address</label>
                <div style={{ position: 'relative' }}>
                  <Mail style={{ position: 'absolute', left: '16px', top: '50%', transform: 'translateY(-50%)', color: '#475569' }} size={18} />
                  <input 
                    type="email" 
                    placeholder="name@example.com"
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    style={{ width: '100%', background: 'rgba(255,255,255,0.02)', border: '1px solid rgba(255,255,255,0.1)', padding: '14px 14px 14px 48px', borderRadius: '12px', color: '#fff', fontSize: '0.95rem', outline: 'none', transition: '0.3s' }}
                  />
                </div>
              </div>

              <button 
                type="submit"
                disabled={loading}
                style={{ 
                  background: '#fff', 
                  color: '#020617', 
                  border: 'none', 
                  padding: '16px', 
                  borderRadius: '12px', 
                  fontSize: '1rem', 
                  fontWeight: 700, 
                  cursor: loading ? 'not-allowed' : 'pointer', 
                  display: 'flex', 
                  alignItems: 'center', 
                  justifyContent: 'center', 
                  gap: 12,
                  marginTop: '12px',
                  transition: '0.3s'
                }}
                onMouseOver={e => !loading && (e.currentTarget.style.background = '#e2e8f0')}
                onMouseOut={e => !loading && (e.currentTarget.style.background = '#fff')}
              >
                {loading ? (
                  <div style={{ width: 20, height: 20, border: '3px solid #020617', borderTopColor: 'transparent', borderRadius: '50%', animation: 'spin 0.8s linear infinite' }} />
                ) : (
                  <>
                    <span>Send Verification Code</span> 
                    <ArrowRight size={20} />
                  </>
                )}
              </button>
            </form>
          ) : (
            <form onSubmit={handleVerifyOTP} style={{ display: 'grid', gap: '16px' }}>
              {/* Error Notification */}
              <AnimatePresence>
                {error && (
                  <motion.div 
                    initial={{ opacity: 0, y: -10 }}
                    animate={{ opacity: 1, y: 0 }}
                    exit={{ opacity: 0, y: -10 }}
                    style={{ 
                      background: 'rgba(239, 68, 68, 0.1)', 
                      border: '1px solid rgba(239, 68, 68, 0.2)', 
                      color: '#f87171', 
                      padding: '12px', 
                      borderRadius: '10px', 
                      fontSize: '0.85rem', 
                      display: 'flex', 
                      alignItems: 'center', 
                      gap: 10 
                    }}
                  >
                    <AlertCircle size={16} />
                    <span>{error}</span>
                  </motion.div>
                )}
              </AnimatePresence>

              <div style={{ 
                background: 'rgba(79, 70, 229, 0.05)', 
                border: '1px solid rgba(79, 70, 229, 0.15)', 
                padding: '12px', 
                borderRadius: '10px', 
                fontSize: '0.85rem',
                color: '#94a3b8',
                display: 'flex',
                justifyContent: 'space-between',
                alignItems: 'center'
              }}>
                <span>Code sent to <strong>{email}</strong></span>
                <span 
                  onClick={() => { setOtpSent(false); setOtp(''); }} 
                  style={{ color: '#818cf8', fontWeight: 600, cursor: 'pointer', fontSize: '0.8rem' }}
                >
                  Change
                </span>
              </div>

              {isSignUp && (
                <div style={{ position: 'relative' }}>
                  <label style={{ display: 'block', fontSize: '0.85rem', fontWeight: 600, color: '#94a3b8', marginBottom: '8px', marginLeft: '4px' }}>Full Name</label>
                  <div style={{ position: 'relative' }}>
                    <User style={{ position: 'absolute', left: '16px', top: '50%', transform: 'translateY(-50%)', color: '#475569' }} size={18} />
                    <input 
                      type="text" 
                      placeholder="John Doe"
                      value={name}
                      onChange={(e) => setName(e.target.value)}
                      style={{ width: '100%', background: 'rgba(255,255,255,0.02)', border: '1px solid rgba(255,255,255,0.1)', padding: '14px 14px 14px 48px', borderRadius: '12px', color: '#fff', fontSize: '0.95rem', outline: 'none', transition: '0.3s' }}
                    />
                  </div>
                </div>
              )}

              <div style={{ position: 'relative' }}>
                <label style={{ display: 'block', fontSize: '0.85rem', fontWeight: 600, color: '#94a3b8', marginBottom: '8px', marginLeft: '4px' }}>Verification Code (OTP)</label>
                <div style={{ position: 'relative' }}>
                  <ShieldCheck style={{ position: 'absolute', left: '16px', top: '50%', transform: 'translateY(-50%)', color: '#475569' }} size={18} />
                  <input 
                    type="text" 
                    placeholder="123456"
                    maxLength={6}
                    value={otp}
                    onChange={(e) => setOtp(e.target.value)}
                    style={{ width: '100%', background: 'rgba(255,255,255,0.02)', border: '1px solid rgba(255,255,255,0.1)', padding: '14px 14px 14px 48px', borderRadius: '12px', color: '#fff', fontSize: '0.95rem', outline: 'none', transition: '0.3s', letterSpacing: '4px', fontWeight: 'bold' }}
                  />
                </div>
              </div>

              <button 
                type="submit"
                disabled={loading}
                style={{ 
                  background: '#fff', 
                  color: '#020617', 
                  border: 'none', 
                  padding: '16px', 
                  borderRadius: '12px', 
                  fontSize: '1rem', 
                  fontWeight: 700, 
                  cursor: loading ? 'not-allowed' : 'pointer', 
                  display: 'flex', 
                  alignItems: 'center', 
                  justifyContent: 'center', 
                  gap: 12,
                  marginTop: '12px',
                  transition: '0.3s'
                }}
                onMouseOver={e => !loading && (e.currentTarget.style.background = '#e2e8f0')}
                onMouseOut={e => !loading && (e.currentTarget.style.background = '#fff')}
              >
                {loading ? (
                  <div style={{ width: 20, height: 20, border: '3px solid #020617', borderTopColor: 'transparent', borderRadius: '50%', animation: 'spin 0.8s linear infinite' }} />
                ) : (
                  <>
                    <span>{isSignUp ? "Verify & Register" : "Verify & Sign In"}</span> 
                    <ArrowRight size={20} />
                  </>
                )}
              </button>
            </form>
          )}

          <div style={{ display: 'flex', alignItems: 'center', gap: '16px', margin: '24px 0' }}>
            <div style={{ flex: 1, height: '1px', background: 'rgba(255,255,255,0.05)' }}></div>
            <span style={{ fontSize: '0.8rem', color: '#475569', fontWeight: 600 }}>OR CONTINUE WITH</span>
            <div style={{ flex: 1, height: '1px', background: 'rgba(255,255,255,0.05)' }}></div>
          </div>

          {/* Google Sign-In SDK button container */}
          <div style={{ display: 'flex', justifyContent: 'center', minHeight: '44px' }}>
            <div id="google-signin-btn"></div>
          </div>

          <p style={{ textAlign: 'center', marginTop: '36px', fontSize: '0.9rem', color: '#64748b' }}>
            {isSignUp ? "Already have an account?" : "Don't have an account?"}{' '}
            <span 
              onClick={() => {
                setIsSignUp(!isSignUp);
                setError('');
              }}
              style={{ color: '#818cf8', fontWeight: 600, cursor: 'pointer' }}
            >
              {isSignUp ? "Sign in instead" : "Sign up for free"}
            </span>
          </p>
        </motion.div>

        {/* Bottom Badge */}
        <div style={{ position: 'absolute', bottom: '30px', left: '0', right: '0', display: 'flex', justifyContent: 'center', gap: '24px' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: 8, color: '#334155', fontSize: '0.75rem', fontWeight: 600 }}>
            <ShieldCheck size={14} /> AES-256 Encryption
          </div>
          <div style={{ display: 'flex', alignItems: 'center', gap: 8, color: '#334155', fontSize: '0.75rem', fontWeight: 600 }}>
            <Sparkles size={14} /> AI Trust Verified
          </div>
        </div>
      </div>

      <style>{`
        @keyframes spin { to { transform: rotate(360deg); } }
        input:focus { border-color: #4f46e5 !important; background: rgba(255,255,255,0.05) !important; box-shadow: 0 0 0 4px rgba(79, 70, 229, 0.1); }
      `}</style>
    </div>
  );
}