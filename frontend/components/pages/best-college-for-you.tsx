'use client';

import { useState, useRef, useEffect } from 'react';
import {
  ChevronDown,
  ChevronUp,
  GraduationCap,
  Users,
  Smile,
  Trophy,
  Loader2,
  MapPin,
  DollarSign,
  TrendingUp,
  Star,
  CheckCircle,
  XCircle,
  Sparkles,
} from 'lucide-react';

// ─── Types ────────────────────────────────────────────────────────────────────

interface College {
  college_name: string;
  location: string;
  fees: string;
  placement: string;
  cutoff: string;
  campus_life: string;
  pros: string[];
  cons: string[];
  fit_score: number | string;
  reason_for_admission: string;
  branch: string;
  ranking: string;
  hostel: string;
  mess: string;
}

interface AgentMessage {
  agent: 'teacher' | 'parent' | 'friend' | 'final';
  content: string;
}

interface FinalDecision {
  college: string;
  reason: string;
  confidence: 'Low' | 'Medium' | 'High';
}

// ─── Constants ─────────────────────────────────────────────────────────────────

const EXAMS = ['JEE Main', 'JEE Advanced', 'MHT CET', 'NEET', 'GATE', 'GRE'];
const RESERVATIONS = ['General', 'OBC', 'OBC-NCL', 'SC', 'ST', 'EWS', 'PWD'];
const STATES = [
  'Maharashtra', 'Delhi', 'Karnataka', 'Tamil Nadu', 'Telangana', 'Gujarat',
  'Rajasthan', 'Uttar Pradesh', 'West Bengal', 'Andhra Pradesh', 'Kerala',
  'Madhya Pradesh', 'Punjab', 'Haryana', 'Any',
];

const AGENT_CONFIG = {
  teacher: {
    label: 'Teacher',
    emoji: '🎓',
    color: 'bg-blue-50 border-blue-200 dark:bg-blue-950/40 dark:border-blue-800',
    bubble: 'bg-blue-100 text-blue-900 dark:bg-blue-900/60 dark:text-blue-100',
    badge: 'bg-blue-500 text-white',
    dot: 'bg-blue-500',
  },
  parent: {
    label: 'Parent',
    emoji: '👨‍👩‍👧',
    color: 'bg-emerald-50 border-emerald-200 dark:bg-emerald-950/40 dark:border-emerald-800',
    bubble: 'bg-emerald-100 text-emerald-900 dark:bg-emerald-900/60 dark:text-emerald-100',
    badge: 'bg-emerald-500 text-white',
    dot: 'bg-emerald-500',
  },
  friend: {
    label: 'Friend',
    emoji: '🧑‍🤝‍🧑',
    color: 'bg-purple-50 border-purple-200 dark:bg-purple-950/40 dark:border-purple-800',
    bubble: 'bg-purple-100 text-purple-900 dark:bg-purple-900/60 dark:text-purple-100',
    badge: 'bg-purple-500 text-white',
    dot: 'bg-purple-500',
  },
  final: {
    label: 'Final Decision',
    emoji: '🏆',
    color: 'bg-amber-50 border-amber-200 dark:bg-amber-950/40 dark:border-amber-800',
    bubble: 'bg-amber-100 text-amber-900 dark:bg-amber-900/60 dark:text-amber-100',
    badge: 'bg-amber-500 text-white',
    dot: 'bg-amber-500',
  },
};

// ─── Sub-components ────────────────────────────────────────────────────────────

function CollegeCard({ college }: { college: College }) {
  const [expanded, setExpanded] = useState(false);

  const fitScore = typeof college.fit_score === 'number'
    ? college.fit_score
    : parseFloat(String(college.fit_score)) || 0;

  const scoreColor =
    fitScore >= 80 ? 'text-emerald-600 dark:text-emerald-400' :
    fitScore >= 60 ? 'text-amber-600 dark:text-amber-400' : 'text-red-600 dark:text-red-400';

  const scoreBarColor =
    fitScore >= 80 ? 'bg-emerald-500' :
    fitScore >= 60 ? 'bg-amber-500' : 'bg-red-500';

  return (
    <div className="bg-card border border-border rounded-2xl shadow-sm hover:shadow-md transition-all duration-300 overflow-hidden group">
      {/* Header */}
      <div className="p-5 border-b border-border/50">
        <div className="flex items-start justify-between gap-3">
          <div className="flex-1 min-w-0">
            <h3 className="font-bold text-foreground text-lg leading-snug truncate group-hover:text-primary transition-colors">
              {college.college_name}
            </h3>
            <div className="flex items-center gap-1.5 mt-1 text-muted-foreground text-sm">
              <MapPin size={13} />
              <span>{college.location}</span>
            </div>
            {college.branch && (
              <span className="inline-block mt-2 text-xs px-2.5 py-0.5 rounded-full bg-primary/10 text-primary font-medium">
                {college.branch}
              </span>
            )}
          </div>
          <div className="flex flex-col items-end gap-1 shrink-0">
            <span className={`text-2xl font-extrabold ${scoreColor}`}>{fitScore}%</span>
            <span className="text-xs text-muted-foreground">Fit Score</span>
            <div className="w-16 h-1.5 bg-muted rounded-full overflow-hidden">
              <div className={`h-full rounded-full ${scoreBarColor}`} style={{ width: `${fitScore}%` }} />
            </div>
          </div>
        </div>
      </div>

      {/* Stats Grid */}
      <div className="grid grid-cols-2 gap-px bg-border/30">
        {[
          { icon: <DollarSign size={14} />, label: 'Fees', value: college.fees },
          { icon: <TrendingUp size={14} />, label: 'Placement', value: college.placement },
          { icon: <Star size={14} />, label: 'Cutoff', value: college.cutoff },
          { icon: <MapPin size={14} />, label: 'Ranking', value: college.ranking },
        ].map(({ icon, label, value }) => (
          <div key={label} className="bg-card px-4 py-3">
            <div className="flex items-center gap-1.5 text-muted-foreground text-xs mb-0.5">
              {icon}
              <span>{label}</span>
            </div>
            <p className="text-foreground text-sm font-semibold truncate">{value || '—'}</p>
          </div>
        ))}
      </div>

      {/* Campus Life */}
      {college.campus_life && (
        <div className="px-5 py-3 border-t border-border/50">
          <p className="text-xs text-muted-foreground leading-relaxed">{college.campus_life}</p>
        </div>
      )}

      {/* Reason */}
      {college.reason_for_admission && (
        <div className="px-5 py-3 bg-primary/5 border-t border-border/50">
          <p className="text-xs font-medium text-primary">{college.reason_for_admission}</p>
        </div>
      )}

      {/* Pros / Cons Toggle */}
      {(college.pros?.length > 0 || college.cons?.length > 0) && (
        <div className="border-t border-border/50">
          <button
            onClick={() => setExpanded(!expanded)}
            className="w-full flex items-center justify-between px-5 py-3 text-sm font-medium text-muted-foreground hover:text-foreground hover:bg-muted/30 transition-colors"
          >
            <span>Pros &amp; Cons</span>
            {expanded ? <ChevronUp size={16} /> : <ChevronDown size={16} />}
          </button>

          {expanded && (
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 px-5 pb-5 pt-2">
              {college.pros?.length > 0 && (
                <div>
                  <p className="text-xs font-semibold text-emerald-600 dark:text-emerald-400 mb-2 uppercase tracking-wide">Pros</p>
                  <ul className="space-y-1.5">
                    {college.pros.map((p, i) => (
                      <li key={i} className="flex items-start gap-2 text-sm text-foreground">
                        <CheckCircle size={14} className="text-emerald-500 mt-0.5 shrink-0" />
                        <span>{p}</span>
                      </li>
                    ))}
                  </ul>
                </div>
              )}
              {college.cons?.length > 0 && (
                <div>
                  <p className="text-xs font-semibold text-red-600 dark:text-red-400 mb-2 uppercase tracking-wide">Cons</p>
                  <ul className="space-y-1.5">
                    {college.cons.map((c, i) => (
                      <li key={i} className="flex items-start gap-2 text-sm text-foreground">
                        <XCircle size={14} className="text-red-500 mt-0.5 shrink-0" />
                        <span>{c}</span>
                      </li>
                    ))}
                  </ul>
                </div>
              )}
            </div>
          )}
        </div>
      )}
    </div>
  );
}

function AgentBubble({ msg, index }: { msg: AgentMessage; index: number }) {
  const cfg = AGENT_CONFIG[msg.agent];
  const [visible, setVisible] = useState(false);

  useEffect(() => {
    const t = setTimeout(() => setVisible(true), index * 120);
    return () => clearTimeout(t);
  }, [index]);

  if (!visible) return null;

  return (
    <div
      className={`flex gap-3 animate-in fade-in slide-in-from-bottom-3 duration-400 ${
        msg.agent === 'final' ? 'flex-col' : ''
      }`}
    >
      {msg.agent !== 'final' && (
        <div className={`flex-shrink-0 w-9 h-9 rounded-full flex items-center justify-center text-base shadow-sm border-2 ${cfg.color}`}>
          {cfg.emoji}
        </div>
      )}
      <div className={`flex-1 ${msg.agent === 'final' ? 'w-full' : ''}`}>
        <div className="flex items-center gap-2 mb-1.5">
          <span className={`text-xs font-bold px-2 py-0.5 rounded-full ${cfg.badge}`}>
            {cfg.emoji} {cfg.label}
          </span>
        </div>
        <div className={`rounded-2xl px-4 py-3 text-sm leading-relaxed shadow-sm border ${cfg.color}`}>
          {msg.content}
        </div>
      </div>
    </div>
  );
}

function FinalDecisionCard({ decision }: { decision: FinalDecision }) {
  const confidenceColor =
    decision.confidence === 'High' ? 'text-emerald-600 bg-emerald-100 dark:text-emerald-300 dark:bg-emerald-900/40' :
    decision.confidence === 'Medium' ? 'text-amber-600 bg-amber-100 dark:text-amber-300 dark:bg-amber-900/40' :
    'text-red-600 bg-red-100 dark:text-red-300 dark:bg-red-900/40';

  return (
    <div className="relative overflow-hidden rounded-2xl border-2 border-amber-400/60 bg-gradient-to-br from-amber-50 via-orange-50 to-yellow-50 dark:from-amber-950/40 dark:via-orange-950/30 dark:to-yellow-950/40 shadow-lg p-6">
      <div className="absolute top-0 right-0 w-32 h-32 bg-amber-400/10 rounded-full -translate-y-10 translate-x-10" />
      <div className="absolute bottom-0 left-0 w-20 h-20 bg-orange-400/10 rounded-full translate-y-8 -translate-x-8" />

      <div className="relative">
        <div className="flex items-center gap-3 mb-4">
          <div className="w-10 h-10 rounded-xl bg-amber-400/20 flex items-center justify-center text-xl">🏆</div>
          <div>
            <h3 className="font-bold text-foreground text-lg">Final Recommendation</h3>
            <p className="text-muted-foreground text-xs">Based on multi-agent discussion</p>
          </div>
        </div>

        <div className="mb-3">
          <p className="text-2xl font-extrabold text-foreground">{decision.college}</p>
        </div>

        <p className="text-sm text-foreground/80 leading-relaxed mb-4">{decision.reason}</p>

        <div className="flex items-center gap-3">
          <span className="text-xs text-muted-foreground font-medium">Confidence:</span>
          <span className={`text-xs font-bold px-3 py-1 rounded-full ${confidenceColor}`}>
            {decision.confidence}
          </span>
        </div>
      </div>
    </div>
  );
}

// ─── Main Page ─────────────────────────────────────────────────────────────────

export default function BestCollegeForYouPage() {
  const [formData, setFormData] = useState({
    exam: 'MHT CET',
    percentile: '',
    rank: '',
    reservation: 'General',
    preferred_state: 'Maharashtra',
    budget: '',
    preferred_branch: '',
    extra: '',
  });

  const [colleges, setColleges] = useState<College[]>([]);
  const [messages, setMessages] = useState<AgentMessage[]>([]);
  const [finalDecision, setFinalDecision] = useState<FinalDecision | null>(null);

  const [loadingColleges, setLoadingColleges] = useState(false);
  const [loadingDiscussion, setLoadingDiscussion] = useState(false);
  const [step, setStep] = useState<'form' | 'colleges' | 'discussion' | 'done'>('form');

  const discussionRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (discussionRef.current) {
      discussionRef.current.scrollTop = discussionRef.current.scrollHeight;
    }
  }, [messages]);

  const handleInput = (
    e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement | HTMLTextAreaElement>
  ) => {
    setFormData((prev) => ({ ...prev, [e.target.name]: e.target.value }));
  };

  const handleFindColleges = async () => {
    setLoadingColleges(true);
    setColleges([]);
    setMessages([]);
    setFinalDecision(null);
    setStep('colleges');

    try {
      const params = new URLSearchParams({
        exam: formData.exam,
        percentile: formData.percentile,
        rank: formData.rank,
        reservation: formData.reservation,
        preferred_state: formData.preferred_state,
        budget: formData.budget,
        preferred_branch: formData.preferred_branch,
        extra: formData.extra,
      });

      const resp = await fetch(`http://localhost:8000/colleges-recommendations?${params.toString()}`, {
        method: 'POST',
      });

      if (!resp.ok) throw new Error('Backend error');

      const data = await resp.json();
      let parsed: College[] = [];

      if (typeof data.answer === 'string') {
        try {
          const cleaned = data.answer.replace(/```json|```/g, '').trim();
          parsed = JSON.parse(cleaned);
        } catch {
          parsed = [];
        }
      } else if (Array.isArray(data.answer)) {
        parsed = data.answer;
      } else if (data.answer && typeof data.answer === 'object') {
        parsed = [data.answer];
      }

      setColleges(parsed);
    } catch (err) {
      console.error(err);
    } finally {
      setLoadingColleges(false);
    }
  };

  const handleStartDiscussion = async () => {
    if (colleges.length === 0) return;
    setLoadingDiscussion(true);
    setMessages([]);
    setFinalDecision(null);
    setStep('discussion');

    const collegesSummary = colleges
      .map(
        (c, i) =>
          `${i + 1}. ${c.college_name} (${c.location}) — Branch: ${c.branch}, Fees: ${c.fees}, Placement: ${c.placement}, Cutoff: ${c.cutoff}, Fit Score: ${c.fit_score}%`
      )
      .join('\n');

    try {
      const params = new URLSearchParams({ colleges_list: collegesSummary });
      const resp = await fetch(`http://localhost:8000/discussion?${params.toString()}`, {
        method: 'POST',
      });

      if (!resp.ok || !resp.body) throw new Error('Backend error');

      // ── Real SSE stream reader ───────────────────────────────────────────
      const reader  = resp.body.getReader();
      const decoder = new TextDecoder();
      let   buffer  = '';

      while (true) {
        const { done, value } = await reader.read();
        if (done) break;

        buffer += decoder.decode(value, { stream: true });

        // SSE lines are separated by '\n\n'; process all complete events
        const parts = buffer.split('\n\n');
        buffer = parts.pop() ?? ''; // last (possibly incomplete) chunk stays in buffer

        for (const part of parts) {
          const line = part.trim();
          if (!line.startsWith('data:')) continue;

          const raw = line.slice(5).trim();
          if (raw === '[DONE]') {
            setLoadingDiscussion(false);
            setStep('done');
            break;
          }

          try {
            const evt = JSON.parse(raw);
            if (evt.agent === 'final' && evt.final) {
              setFinalDecision(evt.final);
            } else if (evt.agent && evt.content) {
              setMessages((prev) => [...prev, { agent: evt.agent, content: evt.content }]);
            }
          } catch {
            // malformed chunk — ignore
          }
        }
      }
    } catch (err) {
      console.error(err);
      setMessages([
        {
          agent: 'teacher',
          content: 'Unable to start discussion. Please ensure the backend is running.',
        },
      ]);
    } finally {
      setLoadingDiscussion(false);
    }
  };

  const fieldClass =
    'w-full rounded-xl border border-border bg-background px-4 py-2.5 text-sm text-foreground placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-primary/40 focus:border-primary transition-all duration-200';

  const labelClass = 'block text-xs font-semibold text-muted-foreground uppercase tracking-wide mb-1.5';

  return (
    <div className="flex flex-col h-full w-full overflow-y-auto bg-gradient-to-br from-background via-background to-primary/5">
      <div className="max-w-5xl mx-auto w-full px-4 lg:px-8 py-8 space-y-10">

        {/* ── Header ── */}
        <div className="animate-in fade-in slide-in-from-top-4 duration-500">
          <div className="flex items-center gap-3 mb-2">
            <div className="w-10 h-10 rounded-xl bg-primary/15 flex items-center justify-center">
              <Sparkles size={20} className="text-primary" />
            </div>
            <h1 className="text-3xl font-extrabold text-foreground">Best College For You</h1>
          </div>
          <p className="text-muted-foreground text-sm ml-13">
            AI-powered recommendations with a multi-agent discussion to find your perfect fit.
          </p>
        </div>

        {/* ── Input Form ── */}
        <div className="bg-card border border-border rounded-2xl shadow-sm p-6 animate-in fade-in slide-in-from-bottom-4 duration-500 delay-100">
          <h2 className="font-bold text-foreground text-lg mb-5">Your Profile</h2>

          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
            {/* Exam */}
            <div>
              <label className={labelClass}>Exam</label>
              <select name="exam" value={formData.exam} onChange={handleInput} className={fieldClass}>
                {EXAMS.map((e) => <option key={e}>{e}</option>)}
              </select>
            </div>

            {/* Percentile */}
            <div>
              <label className={labelClass}>Percentile</label>
              <input
                type="number" name="percentile" placeholder="e.g. 92.5"
                value={formData.percentile} onChange={handleInput} className={fieldClass}
              />
            </div>

            {/* Rank */}
            <div>
              <label className={labelClass}>Rank</label>
              <input
                type="number" name="rank" placeholder="e.g. 15000"
                value={formData.rank} onChange={handleInput} className={fieldClass}
              />
            </div>

            {/* Reservation */}
            <div>
              <label className={labelClass}>Reservation</label>
              <select name="reservation" value={formData.reservation} onChange={handleInput} className={fieldClass}>
                {RESERVATIONS.map((r) => <option key={r}>{r}</option>)}
              </select>
            </div>

            {/* Preferred State */}
            <div>
              <label className={labelClass}>Preferred State</label>
              <select name="preferred_state" value={formData.preferred_state} onChange={handleInput} className={fieldClass}>
                {STATES.map((s) => <option key={s}>{s}</option>)}
              </select>
            </div>

            {/* Budget */}
            <div>
              <label className={labelClass}>Budget</label>
              <input
                type="text" name="budget" placeholder="e.g. Under 5 LPA"
                value={formData.budget} onChange={handleInput} className={fieldClass}
              />
            </div>

            {/* Preferred Branch */}
            <div className="sm:col-span-2 lg:col-span-1">
              <label className={labelClass}>Preferred Branch</label>
              <input
                type="text" name="preferred_branch" placeholder="e.g. Computer Science"
                value={formData.preferred_branch} onChange={handleInput} className={fieldClass}
              />
            </div>

            {/* Extra Preferences */}
            <div className="sm:col-span-2">
              <label className={labelClass}>Extra Preferences</label>
              <textarea
                name="extra" rows={2}
                placeholder="e.g. Good hostel, near metro, strong alumni network..."
                value={formData.extra} onChange={handleInput}
                className={`${fieldClass} resize-none`}
              />
            </div>
          </div>

          <button
            onClick={handleFindColleges}
            disabled={loadingColleges || (!formData.percentile && !formData.rank)}
            className="mt-6 w-full flex items-center justify-center gap-2 bg-primary hover:bg-primary/90 disabled:opacity-50 text-primary-foreground font-semibold py-3 rounded-xl transition-all duration-200 shadow-md hover:shadow-lg text-sm"
          >
            {loadingColleges ? (
              <>
                <Loader2 size={18} className="animate-spin" />
                Finding colleges...
              </>
            ) : (
              <>
                <Sparkles size={18} />
                Find Best Colleges
              </>
            )}
          </button>
        </div>

        {/* ── College Results ── */}
        {(loadingColleges || colleges.length > 0) && (
          <div className="animate-in fade-in slide-in-from-bottom-4 duration-500">
            <div className="flex items-center justify-between mb-4">
              <h2 className="font-bold text-foreground text-lg">
                Recommended Colleges
                {colleges.length > 0 && (
                  <span className="ml-2 text-sm font-normal text-muted-foreground">
                    ({colleges.length} found)
                  </span>
                )}
              </h2>
            </div>

            {loadingColleges ? (
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                {[1, 2, 3, 4].map((i) => (
                  <div key={i} className="h-52 rounded-2xl bg-muted/40 animate-pulse" />
                ))}
              </div>
            ) : (
              <>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  {colleges.map((c, i) => (
                    <CollegeCard key={i} college={c} />
                  ))}
                </div>

                {/* Start Discussion Button */}
                <button
                  onClick={handleStartDiscussion}
                  disabled={loadingDiscussion}
                  className="mt-6 w-full flex items-center justify-center gap-2 bg-gradient-to-r from-purple-600 to-blue-600 hover:from-purple-700 hover:to-blue-700 disabled:opacity-50 text-white font-semibold py-3 rounded-xl transition-all duration-200 shadow-md hover:shadow-lg text-sm"
                >
                  {loadingDiscussion ? (
                    <>
                      <Loader2 size={18} className="animate-spin" />
                      Agents are discussing...
                    </>
                  ) : (
                    <>
                      <Users size={18} />
                      Start Agent Discussion
                    </>
                  )}
                </button>
              </>
            )}
          </div>
        )}

        {/* ── Multi-Agent Discussion ── */}
        {(messages.length > 0 || loadingDiscussion) && (
          <div className="animate-in fade-in slide-in-from-bottom-4 duration-500">
            <div className="flex items-center gap-3 mb-4">
              <h2 className="font-bold text-foreground text-lg">Agent Discussion</h2>
              {loadingDiscussion && (
                <div className="flex items-center gap-1.5 text-xs text-muted-foreground">
                  <div className="flex gap-0.5">
                    {[0, 1, 2].map((i) => (
                      <div
                        key={i}
                        className="w-1.5 h-1.5 rounded-full bg-primary animate-bounce"
                        style={{ animationDelay: `${i * 150}ms` }}
                      />
                    ))}
                  </div>
                  <span>Agents are thinking...</span>
                </div>
              )}
            </div>

            {/* Legend */}
            <div className="flex flex-wrap gap-3 mb-4">
              {(['teacher', 'parent', 'friend'] as const).map((a) => (
                <div key={a} className="flex items-center gap-1.5 text-xs text-muted-foreground">
                  <div className={`w-2 h-2 rounded-full ${AGENT_CONFIG[a].dot}`} />
                  <span>{AGENT_CONFIG[a].emoji} {AGENT_CONFIG[a].label}</span>
                </div>
              ))}
            </div>

            <div
              ref={discussionRef}
              className="bg-card border border-border rounded-2xl p-5 space-y-4 max-h-[480px] overflow-y-auto scroll-smooth"
            >
              {messages.map((msg, i) => (
                <AgentBubble key={i} msg={msg} index={i} />
              ))}

              {loadingDiscussion && messages.length === 0 && (
                <div className="flex items-center gap-3 text-muted-foreground text-sm">
                  <Loader2 size={16} className="animate-spin" />
                  Waiting for agents to start the discussion...
                </div>
              )}
            </div>
          </div>
        )}

        {/* ── Final Decision ── */}
        {finalDecision && (
          <div className="animate-in fade-in zoom-in-95 duration-600">
            <h2 className="font-bold text-foreground text-lg mb-4">Final Decision</h2>
            <FinalDecisionCard decision={finalDecision} />
          </div>
        )}

        {/* Bottom padding */}
        <div className="h-6" />
      </div>
    </div>
  );
}
