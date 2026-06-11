import React, { useEffect, useState } from 'react';
import type { AnalysisData } from "../types/resume.types";
import { Target, CheckCircle2, XCircle, Lightbulb, RefreshCw } from 'lucide-react';

interface AnalysisResultsProps {
  data: AnalysisData;
  onReset: () => void;
}

export function AnalysisResults({ data, onReset }: AnalysisResultsProps) {
  const [scoreDeg, setScoreDeg] = useState(0);

  useEffect(() => {
    // Animate score
    const targetDeg = (data.score / 100) * 360;
    setTimeout(() => {
      setScoreDeg(targetDeg);
    }, 100);
  }, [data.score]);

  return (
    <div className="animate-fade-in" style={{ marginTop: '2rem' }}>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '2rem' }}>
        <div>
          <h2 style={{ fontSize: '2rem', marginBottom: '0.5rem' }}>Analysis Complete</h2>
          <p className="text-secondary">Report for: <strong>{data.fileName}</strong></p>
        </div>
        <button className="btn-secondary" onClick={onReset} style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
          <RefreshCw size={16} /> Analyze Another
        </button>
      </div>

      <div className="dashboard-grid">
        {/* Score Card */}
        <div className="glass-card hoverable" style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center' }}>
          <h3 style={{ marginBottom: '1.5rem' }}>AI Match Score</h3>
          <div 
            className="score-circle" 
            style={{ '--score-deg': `${scoreDeg}deg`, transition: '--score-deg 1.5s ease-out' } as React.CSSProperties}
          >
            <span className="score-value">{data.score}</span>
          </div>
          <p className="text-secondary" style={{ marginTop: '1.5rem', textAlign: 'center' }}>
            {data.score >= 80 ? 'Excellent profile!' : 'Needs some improvement.'}
          </p>
        </div>

        {/* Insights */}
        <div style={{ display: 'flex', flexDirection: 'column', gap: '1.5rem' }}>
          <div className="glass-card hoverable">
            <h3 style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', marginBottom: '1rem' }}>
              <Target className="logo-icon" size={24} /> Key Strengths
            </h3>
            <ul style={{ paddingLeft: '1.5rem', display: 'flex', flexDirection: 'column', gap: '0.5rem' }}>
              {data.strengths.length > 0 ? data.strengths.map((str, i) => (
                <li key={i} style={{ color: 'var(--text-primary)' }}>{str}</li>
              )) : <span className="text-secondary">No key strengths detected.</span>}
            </ul>
          </div>

          <div className="glass-card hoverable">
            <h3 style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', marginBottom: '1rem' }}>
              <XCircle style={{ color: '#ff6384' }} size={24} /> Missing/Weak Areas
            </h3>
            <ul style={{ paddingLeft: '1.5rem', display: 'flex', flexDirection: 'column', gap: '0.5rem' }}>
              {data.weaknesses.length > 0 ? data.weaknesses.map((weak, i) => (
                <li key={i} style={{ color: '#ff6384' }}>{weak}</li>
              )) : <span className="text-secondary">No significant weaknesses found.</span>}
            </ul>
          </div>
          
          {/* Skills Breakdown */}
          <div className="glass-card hoverable">
            <h3 style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', marginBottom: '1rem' }}>
               Skills Overview
            </h3>
            
            <h4 style={{ fontSize: '0.9rem', color: 'var(--text-secondary)', marginBottom: '0.8rem' }}>Matched Skills</h4>
            <div style={{ display: 'flex', flexWrap: 'wrap', gap: '0.5rem', marginBottom: '1.5rem' }}>
              {data.matched_skills && data.matched_skills.length > 0 ? data.matched_skills.map((skill, i) => (
                <span key={i} className="skill-badge matched">
                  <CheckCircle2 size={14} /> {skill}
                </span>
              )) : <span className="text-secondary">No hard skills detected.</span>}
            </div>

            <h4 style={{ fontSize: '0.9rem', color: 'var(--text-secondary)', marginBottom: '0.8rem' }}>Missing Expected Skills</h4>
            <div style={{ display: 'flex', flexWrap: 'wrap', gap: '0.5rem' }}>
              {data.missing_skills && data.missing_skills.length > 0 ? data.missing_skills.map((skill, i) => (
                <span key={i} className="skill-badge missing">
                  {skill}
                </span>
              )) : <span className="text-secondary">No missing skills detected.</span>}
            </div>
          </div>

          <div className="glass-card hoverable" style={{ background: 'linear-gradient(145deg, rgba(31, 33, 40, 0.8), rgba(0, 242, 254, 0.05))' }}>
            <h3 style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', marginBottom: '1rem' }}>
              <Lightbulb style={{ color: '#f59e0b' }} size={24} /> Actionable AI Suggestions
            </h3>
            <ul style={{ paddingLeft: '1.5rem', display: 'flex', flexDirection: 'column', gap: '0.8rem' }}>
              {data.suggestions.length > 0 ? data.suggestions.map((tip, i) => (
                <li key={i} style={{ color: 'var(--text-primary)' }}>{tip}</li>
              )) : <span className="text-secondary">No suggestions right now.</span>}
            </ul>
          </div>
        </div>
      </div>
    </div>
  );
}
