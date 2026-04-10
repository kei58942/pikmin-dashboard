import React, { useState, useEffect, useMemo } from 'react';
import { initializeApp } from 'firebase/app';
import { 
  getFirestore, doc, setDoc, onSnapshot, collection, 
  updateDoc, deleteDoc, getDoc, writeBatch, addDoc
} from 'firebase/firestore';
import { 
  getAuth, signInWithCustomToken, signInAnonymously, onAuthStateChanged 
} from 'firebase/auth';
import { 
  Trophy, Target, 
  Flame, Droplets, Zap, 
  ChevronDown, ChevronUp, Award, 
  Plus, Minus, BookOpen,
  Settings, X, Trash2, Edit2,
  Calendar, RefreshCw, Sprout, Flower2, Flower, UserPlus,
  Clock, Sparkles, Palette, UserCircle, Sun, Moon, Sunrise, Sunset, BarChart3
} from 'lucide-react';

// --- Firebase 設定 ---
// ※外部で公開する場合、Firebaseコンソールから取得した自分の設定値に書き換えてください。
const firebaseConfig = typeof __firebase_config !== 'undefined' ? JSON.parse(__firebase_config) : { 
  apiKey: "YOUR_API_KEY",
  authDomain: "YOUR_PROJECT.firebaseapp.com",
  projectId: "YOUR_PROJECT",
  storageBucket: "YOUR_PROJECT.appspot.com",
  messagingSenderId: "YOUR_SENDER_ID",
  appId: "YOUR_APP_ID"
};

const app = initializeApp(firebaseConfig);
const auth = getAuth(app);
const db = getFirestore(app);

// appIdをサニタイズ（重要：Firebaseの階層エラーを防ぐためにスラッシュを置換）
const getSanitizedAppId = () => {
  const rawId = typeof __app_id !== 'undefined' ? String(__app_id) : 'pikmin-fixed-dash';
  return rawId.replace(/\//g, '_');
};
const appId = getSanitizedAppId();

// --- 定数マスタ ---
const INITIAL_MEMBERS = [
  { id: 'member_1', name: '金児 胤栄', title: '無双のIS', avatarSeed: 'kaneji', avatarStyle: 'bottts-neutral', order: 0 },
  { id: 'member_2', name: '山崎 紀史', title: '探索の達人', avatarSeed: 'yamazaki', avatarStyle: 'bottts-neutral', order: 1 },
  { id: 'member_3', name: '茨 隆昭', title: '誠実の青', avatarSeed: 'iba', avatarStyle: 'bottts-neutral', order: 2 },
  { id: 'member_4', name: '吉増 海斗', title: '期待の新人', avatarSeed: 'yoshimasu_blue', avatarStyle: 'bottts-neutral', order: 3 },
  { id: 'member_5', name: '古田 大貴', title: '情熱の赤', avatarSeed: 'furuta', avatarStyle: 'bottts-neutral', order: 4 },
];

const PIKMIN_TYPES = [
  { id: 'passion', name: '情熱', title: '赤の情熱：農機具×通常リユースの二刀流', desc: 'どんな固い土壌も突き破る「赤」のように、全てのニーズを引っこ抜きます。', color: 'bg-red-500', lightColor: 'bg-red-50', borderColor: 'border-red-200', textColor: 'text-red-600', icon: 'Flame' },
  { id: 'sensitivity', name: '感度', title: '黄の感度：傾聴・深掘り・ニーズ把握', desc: '高く飛び、遠くを見渡す「黄」のように、顧客の言葉の裏にある微細なニーズを察知します。', color: 'bg-yellow-400', lightColor: 'bg-yellow-50', borderColor: 'border-yellow-200', textColor: 'text-yellow-700', icon: 'Zap' },
  { id: 'trust', name: '信頼', title: '青の信頼：納得感のあるプレゼン', desc: '水の中でも自由に動ける「青」のように、柔軟で誠実な提案を徹底します。', color: 'bg-blue-500', lightColor: 'bg-blue-50', borderColor: 'border-blue-200', textColor: 'text-blue-600', icon: 'Droplets' },
];

const PikminIcon = ({ name, size = 14, className = "" }) => {
  if (name === 'Flame') return <Flame size={size} className={className} />;
  if (name === 'Zap') return <Zap size={size} className={className} />;
  if (name === 'Droplets') return <Droplets size={size} className={className} />;
  if (name === 'Sprout') return <Sprout size={size} className={className} />;
  if (name === 'Flower2') return <Flower2 size={size} className={className} />;
  if (name === 'Flower') return <Flower size={size} className={className} />;
  return null;
};

const getGrowthInfo = (score) => {
  if (score >= 6) return { label: '花', icon: 'Flower', color: 'bg-pink-100 text-pink-600 border-pink-200' };
  if (score >= 3) return { label: '蕾', icon: 'Flower2', color: 'bg-orange-50 text-orange-500 border-orange-200' };
  return { label: '種', icon: 'Sprout', color: 'bg-green-50 text-green-600 border-green-200' };
};

const getAvatarUrl = (style, seed) => `https://api.dicebear.com/7.x/${style || 'bottts-neutral'}/svg?seed=${seed}`;

const BumpingNumber = ({ value, className = "" }) => {
  const [isBumping, setIsBumping] = useState(false);
  const [displayValue, setDisplayValue] = useState(value);
  useEffect(() => {
    if (value !== displayValue) {
      setIsBumping(true);
      const timer = setTimeout(() => { setIsBumping(false); setDisplayValue(value); }, 300);
      return () => clearTimeout(timer);
    }
  }, [value, displayValue]);
  return <span className={`${className} transition-all duration-300 inline-block font-black ${isBumping ? 'scale-150 text-green-500 -translate-y-1' : 'scale-100'}`}>{value}</span>;
};

const MiniScoreBars = ({ memberScores }) => (
  <div className="grid grid-cols-3 gap-4 pt-3 border-t border-slate-100/50 w-full">
    {PIKMIN_TYPES.map(type => {
      const val = memberScores?.[type.id] || 0;
      return (
        <div key={type.id} className="space-y-0.5">
          <div className="flex justify-between items-end px-0.5 text-slate-800">
            <span className="text-[7px] font-black uppercase flex items-center gap-0.5"><span className={`w-1.5 h-1.5 rounded-full ${type.color}`}></span> {type.name}</span>
            <span className={`text-[9px] font-black ${type.textColor}`}>{val}pt</span>
          </div>
          <div className="h-1 bg-slate-100 rounded-full overflow-hidden shadow-inner border border-white/5">
            <div className={`h-full ${type.color} transition-all duration-1000 ease-out`} style={{ width: `${Math.min((val / 10) * 100, 100)}%` }}></div>
          </div>
        </div>
      );
    })}
  </div>
);

export default function App() {
  const [user, setUser] = useState(null);
  const [members, setMembers] = useState([]);
  const [goodCases, setGoodCases] = useState([]); 
  const [config, setConfig] = useState({ dashboardName: "ピクミン ダッシュボード", subtitle: "今日の調査報告" });
  const [activeTab, setActiveTab] = useState('score');
  const [rankPeriod, setRankPeriod] = useState('daily');
  const [showExplanation, setShowExplanation] = useState(true);
  const [isSettingsOpen, setIsSettingsOpen] = useState(false);
  const [isGoodCaseModalOpen, setIsGoodCaseModalOpen] = useState(false);
  const [editingCaseId, setEditingCaseId] = useState(null);
  const [newMemberName, setNewMemberName] = useState('');
  const [currentDate, setCurrentDate] = useState('');
  const [timeTheme, setTimeTheme] = useState('day');
  const [caseForm, setCaseForm] = useState({ reqId: '', memberId: '', methodId: 'passion', note: '' });

  useEffect(() => {
    const initAuth = async () => {
      if (typeof __initial_auth_token !== 'undefined' && __initial_auth_token) { await signInWithCustomToken(auth, __initial_auth_token); } 
      else { await signInAnonymously(auth); }
    };
    initAuth();
    const unsubscribe = onAuthStateChanged(auth, setUser);
    return () => unsubscribe();
  }, []);

  useEffect(() => {
    const updateTimeContext = () => {
      const now = new Date();
      setCurrentDate(now.toLocaleDateString('ja-JP', { year: 'numeric', month: 'long', day: 'numeric', weekday: 'long' }));
      const hour = now.getHours();
      if (hour >= 5 && hour < 8) setTimeTheme('dawn');
      else if (hour >= 8 && hour < 17) setTimeTheme('day');
      else if (hour >= 17 && hour < 19) setTimeTheme('dusk');
      else setTimeTheme('night');
    };
    updateTimeContext();
    const timer = setInterval(updateTimeContext, 60000);
    return () => clearInterval(timer);
  }, []);

  useEffect(() => {
    if (!user) return;
    const membersRef = collection(db, 'artifacts', appId, 'public', 'data', 'members');
    const casesRef = collection(db, 'artifacts', appId, 'public', 'data', 'goodCases');
    const configRef = doc(db, 'artifacts', appId, 'public', 'data', 'config', 'general');
    
    const unsubMembers = onSnapshot(membersRef, (snapshot) => {
      if (snapshot.empty) {
        const batch = writeBatch(db);
        INITIAL_MEMBERS.forEach(m => batch.set(doc(membersRef, m.id), { name: m.name, title: m.title || '', avatarSeed: m.avatarSeed, avatarStyle: m.avatarStyle || 'bottts-neutral', scores: { passion: 0, sensitivity: 0, trust: 0 }, order: m.order }));
        batch.commit();
      }
      setMembers(snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() })).sort((a, b) => (a.order || 0) - (b.order || 0)));
    });
    const unsubCases = onSnapshot(casesRef, (snapshot) => setGoodCases(snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() })).sort((a, b) => b.timestamp - a.timestamp)));
    const unsubConfig = onSnapshot(configRef, (snapshot) => { if (snapshot.exists()) setConfig(snapshot.data()); });
    return () => { unsubMembers(); unsubCases(); unsubConfig(); };
  }, [user]);

  const actualGoodCases = useMemo(() => goodCases.filter(c => c.reqId !== "MANUAL-UPDATE"), [goodCases]);

  const updateScore = async (memberId, typeId, delta) => {
    if (!user) return;
    const member = members.find(m => m.id === memberId);
    if (!member) return;
    const newScore = Math.max(0, (member.scores?.[typeId] || 0) + delta);
    await updateDoc(doc(db, 'artifacts', appId, 'public', 'data', 'members', memberId), { [`scores.${typeId}`]: newScore });
    if (delta > 0) {
      await addDoc(collection(db, 'artifacts', appId, 'public', 'data', 'goodCases'), { reqId: "MANUAL-UPDATE", memberName: member.name, memberId: member.id, methodId: typeId, note: "手動更新", date: new Date().toISOString().split('T')[0], timestamp: Date.now() });
    }
  };

  const filteredRankings = useMemo(() => {
    const today = new Date().toISOString().split('T')[0];
    const thisMonth = today.substring(0, 7);
    const rankingMap = members.map(m => {
      const periodCases = goodCases.filter(c => {
        if (c.memberId !== m.id) return false;
        if (rankPeriod === 'daily') return c.date === today;
        if (rankPeriod === 'monthly') return c.date?.startsWith(thisMonth);
        return true;
      });
      const scores = { passion: periodCases.filter(c => c.methodId === 'passion').length, sensitivity: periodCases.filter(c => c.methodId === 'sensitivity').length, trust: periodCases.filter(c => c.methodId === 'trust').length };
      return { ...m, periodScores: scores, periodTotal: scores.passion + scores.sensitivity + scores.trust };
    });
    return rankingMap.sort((a, b) => b.periodTotal - a.periodTotal);
  }, [members, goodCases, rankPeriod]);

  if (!user) return <div className="min-h-screen bg-slate-900 flex items-center justify-center text-white">Loading Planet...</div>;

  return (
    <div className={`min-h-screen relative overflow-hidden font-sans p-4 md:p-6 pb-20 select-none theme-${timeTheme} planet-bg`}>
      <div className="absolute inset-0 star-pattern opacity-10 pointer-events-none"></div>
      <div className="max-w-7xl mx-auto relative z-10">
        
        {/* Header */}
        <div className="flex flex-col md:flex-row justify-between items-start md:items-center mb-8 gap-4 text-slate-800">
          <div>
            <h1 className="text-2xl font-black text-green-900 flex items-center gap-2 drop-shadow-sm"><span className="bg-green-700 text-white px-2 py-0.5 rounded-lg">P</span> {config.dashboardName}</h1>
            <div className="flex items-center gap-2 mt-1 bg-white/30 backdrop-blur-sm px-3 py-1 rounded-full text-[10px] font-black uppercase"><Clock size={12} /> {currentDate}</div>
          </div>
          <div className="flex items-center gap-2">
            <nav className="flex bg-white/40 backdrop-blur-md p-1.5 rounded-2xl border border-white/50">
              {['score', 'ranking', 'goodCase'].map((tab) => (<button key={tab} onClick={() => setActiveTab(tab)} className={`px-8 py-2.5 rounded-xl text-xs font-black transition-all ${activeTab === tab ? 'bg-white text-green-700 shadow-md scale-105' : 'text-slate-500 hover:bg-white/30'}`}>{tab === 'score' ? 'スコア' : tab === 'ranking' ? 'ランキング' : '好事例'}</button>))}
            </nav>
            <button onClick={() => setIsSettingsOpen(true)} className="p-3 bg-white/60 hover:bg-white rounded-2xl text-slate-500 shadow-sm active:scale-95 transition-all ml-2"><Settings size={20}/></button>
          </div>
        </div>

        {/* Vision Section */}
        <section className="bg-white/50 backdrop-blur-md border border-white/60 rounded-[2.5rem] p-8 mb-8 shadow-sm group">
          <div className="flex items-center gap-6">
            <div className="bg-white p-5 rounded-[2rem] shadow-md transition-transform border border-slate-50"><Trophy className="text-yellow-500" size={32}/></div>
            <div>
              <h2 className="text-green-800 font-black text-[10px] mb-1 opacity-70 tracking-widest uppercase flex items-center gap-2"><Target size={12}/> Our Vision</h2>
              <p className="text-green-900 font-black text-xl md:text-2xl leading-tight">LTVの最大化：一輪の花を咲かせ、一生の付き合いへ</p>
            </div>
          </div>
        </section>

        {/* Tab Content */}
        {activeTab === 'score' && (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8 animate-in fade-in duration-500">
            {members.map(member => (
              <div key={member.id} className="bg-[#fffcf0] backdrop-blur-sm rounded-[3.5rem] p-8 shadow-sm border border-white hover:shadow-2xl transition-all group relative overflow-hidden flex flex-col member-card">
                <div className="flex items-center gap-5 mb-8 relative z-10 text-slate-900">
                  <div className="w-16 h-16 bg-slate-50 rounded-full flex items-center justify-center border-4 border-white shadow-md overflow-hidden flex-shrink-0"><img src={getAvatarUrl(member.avatarStyle, member.avatarSeed || member.name)} className="w-full h-full object-cover" alt="avatar" /></div>
                  <div className="flex-1 overflow-hidden">
                    {member.title && (<p className="text-[10px] font-black text-green-700/70 uppercase tracking-widest truncate">{member.title}</p>)}
                    <h4 className="text-xl font-black truncate leading-tight">{member.name}</h4>
                    <div className="flex items-center gap-2 mt-1"><span className="text-[10px] font-black text-slate-400 uppercase tracking-widest">POWER:</span><span className="text-xl font-black text-green-600"><BumpingNumber value={Object.values(member.scores || {}).reduce((a, b) => a + b, 0)} /></span></div>
                  </div>
                </div>
                <div className="space-y-6 flex-1 relative z-10">
                  {PIKMIN_TYPES.map(type => (
                    <div key={type.id} className="flex items-center gap-4">
                      <div className={`p-3 rounded-2xl ${type.lightColor} ${type.textColor} border ${type.borderColor}`}><PikminIcon name={type.icon} /></div>
                      <div className="flex-1">
                        <div className="flex justify-between items-end mb-1 px-1 text-slate-800"><span className="text-[10px] font-black uppercase">{type.name}</span><BumpingNumber value={member.scores?.[type.id] || 0} className={`text-2xl font-black ${type.textColor}`} /></div>
                        <div className="h-2 bg-slate-100 rounded-full overflow-hidden shadow-inner"><div className={`h-full ${type.color} transition-all duration-1000`} style={{ width: `${Math.min(((member.scores?.[type.id] || 0) / 20) * 100, 100)}%` }}></div></div>
                      </div>
                      <div className="flex items-center gap-2 self-center">
                        <button onClick={() => updateScore(member.id, type.id, -1)} className="w-10 h-10 rounded-xl border border-slate-200 flex items-center justify-center text-slate-400 hover:text-slate-600 hover:bg-white active:scale-95 transition-all"><Minus size={18}/></button>
                        <button onClick={() => updateScore(member.id, type.id, 1)} className={`w-10 h-10 rounded-xl flex items-center justify-center text-white shadow-lg active:scale-95 transition-all ${type.color} hover:brightness-110`}><Plus size={18}/></button>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            ))}
          </div>
        )}

        {activeTab === 'ranking' && (
          <div className="max-w-4xl mx-auto animate-in fade-in duration-500">
            <div className="flex justify-end mb-6">
              <div className="flex bg-white/30 backdrop-blur-md p-1 rounded-2xl border border-white/40">
                <button onClick={() => setRankPeriod('daily')} className={`px-8 py-2 rounded-xl text-[10px] font-black transition-all ${rankPeriod === 'daily' ? 'bg-white text-green-700 shadow-md' : 'text-slate-500 hover:text-slate-700'}`}>Daily</button>
                <button onClick={() => setRankPeriod('monthly')} className={`px-8 py-2 rounded-xl text-[10px] font-black transition-all ${rankPeriod === 'monthly' ? 'bg-white text-green-700 shadow-md' : 'text-slate-500 hover:text-slate-700'}`}>Monthly</button>
              </div>
            </div>
            <div className="space-y-6">
              {filteredRankings.map((m, idx) => {
                if (m.periodTotal === 0) return null;
                const info = getGrowthInfo(m.periodTotal);
                return (
                  <div key={m.id} className="bg-white/95 backdrop-blur-sm rounded-[2.5rem] p-9 flex flex-col gap-6 shadow-sm border border-white hover:shadow-2xl transition-all relative text-slate-900 ranking-card">
                    <div className="flex items-center gap-7 relative z-10">
                      <div className={`w-14 h-14 flex items-center justify-center rounded-2xl font-black text-3xl shadow-md border-b-4 ${idx === 0 ? 'bg-yellow-400 text-white border-yellow-600' : 'bg-slate-100 text-slate-400'}`}>{idx + 1}</div>
                      <img src={getAvatarUrl(m.avatarStyle, m.avatarSeed || m.name)} className="w-14 h-14 rounded-full border-4 border-white shadow-md bg-white" alt="avatar" />
                      <div className="flex-1 min-w-0"><p className="text-[10px] font-black text-green-700/60 uppercase tracking-widest truncate">{m.title}</p><h4 className="text-2xl font-black tracking-tight truncate leading-tight text-slate-900">{m.name}</h4><div className="flex items-center gap-2 mt-0.5"><span className="text-3xl font-black text-green-600">{m.periodTotal}</span><span className="text-[10px] font-black text-slate-400 uppercase tracking-widest">{rankPeriod} PTS</span></div></div>
                      <div className={`${info.color} px-6 py-2.5 rounded-full text-[10px] font-black flex items-center gap-2 border border-current shadow-sm`}><PikminIcon name={info.icon} size={10} /> {info.label}</div>
                    </div>
                    <MiniScoreBars memberScores={m.periodScores} />
                  </div>
                );
              })}
            </div>
          </div>
        )}

        {activeTab === 'goodCase' && (
          <div className="space-y-10 animate-in fade-in duration-500">
             <div className="flex justify-between items-center px-4"><h4 className="font-black text-white text-xs uppercase tracking-[0.4em] flex items-center gap-3 drop-shadow-md"><Sparkles size={16} className="text-yellow-400" /> Case List</h4><button onClick={() => setIsGoodCaseModalOpen(true)} className="bg-[#00c853] text-white px-10 py-4 rounded-[2.5rem] font-black shadow-2xl transition-all hover:brightness-110 active:scale-95"><Plus size={24}/> 事例登録</button></div>
             <div className="grid grid-cols-1 gap-6">
              {actualGoodCases.map(c => {
                const type = PIKMIN_TYPES.find(t => t.id === c.methodId);
                const member = members.find(m => m.id === c.memberId);
                return (
                  <div key={c.id} className="bg-white/95 backdrop-blur-sm rounded-[3rem] p-9 shadow-sm border border-white flex flex-col md:flex-row items-center gap-9 relative overflow-hidden group hover:shadow-2xl transition-all text-slate-900 case-card">
                    <div className={`absolute left-0 top-0 bottom-0 w-3 ${type?.color}`}></div>
                    <div className="flex-1 space-y-5 w-full">
                      <div className="flex items-center gap-4 text-[11px] font-black"><span className={`${type?.textColor} px-4 py-1.5 rounded-full ${type?.lightColor} border ${type?.borderColor} shadow-sm flex items-center gap-1.5`}><PikminIcon name={type?.icon} /> {type?.name}</span><span className="text-slate-400 ml-auto flex items-center gap-1.5 font-bold"><Calendar size={14}/> {c.date}</span></div>
                      <div className="flex items-center gap-4"><img src={getAvatarUrl(member?.avatarStyle, member?.avatarSeed || c.memberName)} className="w-14 h-14 rounded-full border-2 border-white shadow-sm" alt="avatar" /><div><p className="text-[10px] font-black text-green-700/60 uppercase tracking-widest">{member?.title}</p><h5 className="text-2xl font-black text-slate-900">{c.memberName}</h5></div></div>
                      <p className="text-xs font-bold bg-white/60 p-6 rounded-[2rem] border border-slate-100 italic">{c.note || "（補足なし）"}</p>
                    </div>
                  </div>
                );
              })}
             </div>
          </div>
        )}
      </div>

      <style>{`.planet-bg { background: #fee9d1; transition: background 1.5s ease-in-out; } .theme-dawn { background: linear-gradient(135deg, #FF9E80 0%, #FFE0B2 40%, #FFCC80 100%); } .theme-day { background: linear-gradient(135deg, #fee9d1 0%, #ffe0b2 30%, #ffd180 70%, #ffcc80 100%); } .theme-dusk { background: linear-gradient(135deg, #BF360C 0%, #FF8A65 40%, #FFCC80 100%); } .theme-night { background: linear-gradient(135deg, #0d1b2a 0%, #1b263b 50%, #415a77 100%); } .theme-night .text-green-900, .theme-night .text-white { color: #f0f4f8 !important; } .theme-night .member-card *, .theme-night .ranking-card *, .theme-night .case-card *, .theme-night .bg-white *, .theme-night .bg-[#fffcf0] *, .theme-night .bg-green-100 * { color: #1e293b !important; } .theme-night .text-red-600 { color: #dc2626 !important; } .theme-night .text-yellow-700 { color: #b45309 !important; } .theme-night .text-blue-600 { color: #2563eb !important; } .theme-night .text-green-600 { color: #16a34a !important; } .theme-night .bg-white, .theme-night .bg-white\\/95 { background-color: rgba(255, 255, 255, 0.98) !important; border-color: rgba(255, 255, 255, 0.2) !important; } .star-pattern { background-image: radial-gradient(white 1.2px, transparent 0); background-size: 80px 80px; }`}</style>
    </div>
  );
}
