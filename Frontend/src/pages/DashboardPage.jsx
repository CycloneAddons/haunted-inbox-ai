import { useState, useEffect, useCallback, useRef } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { api } from '../services/api';
import { formatRelativeTime, formatBytes, safeJsonStringify } from '../utils/formatters';

function MethodBadge({ method = 'POST' }) {
  const m = (method || 'POST').toUpperCase();
  const classes = {
    GET: 'bg-sky-500/15 text-sky-400 border-sky-500/35',
    POST: 'bg-emerald-500/15 text-emerald-400 border-emerald-500/35',
    PUT: 'bg-amber-500/15 text-amber-400 border-amber-500/35',
    DELETE: 'bg-red-500/15 text-red-400 border-red-500/35',
  };
  const colorClass = classes[m] || 'bg-zinc-500/15 text-zinc-400 border-zinc-500/35';

  return (
    <span className={`px-2 py-0.5 text-[11px] font-bold rounded-full border tracking-wider uppercase ${colorClass}`}>
      {m}
    </span>
  );
}

export default function DashboardPage() {
  const { id: routeId } = useParams();
  const navigate = useNavigate();

  const [portals, setPortals] = useState([]);
  const [activePortal, setActivePortal] = useState(null);
  const [newPortalName, setNewPortalName] = useState('');
  const [creatingPortal, setCreatingPortal] = useState(false);
  const [requests, setRequests] = useState([]);
  const [selectedRequest, setSelectedRequest] = useState(null);
  const [loadingRequests, setLoadingRequests] = useState(false);
  const [livePolling, setLivePolling] = useState(true);

  const [activeTab, setActiveTab] = useState('payload');
  const [codeTask, setCodeTask] = useState('express-handler');
  const [generatingCode, setGeneratingCode] = useState(false);
  const [generatedCode, setGeneratedCode] = useState(null);
  const [runningAutopsy, setRunningAutopsy] = useState(false);
  const [autopsyData, setAutopsyData] = useState(null);
  const [copiedUrl, setCopiedUrl] = useState(false);
  const [copiedCode, setCopiedCode] = useState(false);
  const [copiedBody, setCopiedBody] = useState(false);

  const loadPortals = useCallback(async () => {
    try {
      const res = await api.listPortals();
      const list = res?.portals || [];
      setPortals(list);

      if (list.length > 0) {
        setActivePortal((prev) => {
          if (routeId) {
            const found = list.find((p) => String(p.id || p._id) === String(routeId));
            if (found) return found;
          }
          if (prev) {
            const match = list.find((p) => String(p.id || p._id) === String(prev.id || prev._id));
            if (match) return match;
          }
          return list[0];
        });
      } else {
        setActivePortal(null);
      }
    } catch (err) {
      console.warn('Failed to load portals:', err.message);
    }
  }, [routeId]);

  useEffect(() => {
    loadPortals();
  }, [loadPortals]);

  const portalId = activePortal?.id || activePortal?._id;
  const loadRequests = useCallback(async (isSilent = false) => {
    if (!portalId) return;
    if (!isSilent) setLoadingRequests(true);
    try {
      const res = await api.listPortalRequests(portalId, { page: 1, limit: 30 });
      const items = res?.items || [];
      setRequests(items);

      setSelectedRequest((prev) => {
        if (!prev && items.length > 0) return items[0];
        if (prev) {
          const match = items.find((r) => String(r.id || r._id) === String(prev.id || prev._id));
          return match || items[0] || null;
        }
        return items[0] || null;
      });
    } catch (err) {
      console.warn('Failed to load requests:', err.message);
    } finally {
      if (!isSilent) setLoadingRequests(false);
    }
  }, [portalId]);

  useEffect(() => {
    loadRequests();
  }, [loadRequests]);

  useEffect(() => {
    if (!livePolling || !portalId) return;
    const interval = setInterval(() => {
      loadRequests(true);
    }, 4000);
    return () => clearInterval(interval);
  }, [livePolling, portalId, loadRequests]);

  const handleCreatePortal = async (e) => {
    e.preventDefault();
    setCreatingPortal(true);
    try {
      const created = await api.createPortal(newPortalName.trim() || 'Halloween Portal');
      setNewPortalName('');
      await loadPortals();
      if (created) setActivePortal(created);
    } catch (err) {
      alert(`Could not summon portal: ${err.message}`);
    } finally {
      setCreatingPortal(false);
    }
  };

  const handleDeletePortal = async () => {
    if (!portalId || !window.confirm(`Bury and delete endpoint "${activePortal?.name || 'this endpoint'}"?`)) return;
    try {
      await api.deletePortal(portalId);
      setActivePortal(null);
      setRequests([]);
      setSelectedRequest(null);
      await loadPortals();
    } catch (err) {
      alert(`Delete failed: ${err.message}`);
    }
  };

  const runAutopsy = async () => {
    if (!selectedRequest) return;
    const reqId = selectedRequest.id || selectedRequest._id;
    setRunningAutopsy(true);
    try {
      const data = await (api.autopsyRequest ? api.autopsyRequest(reqId) : api.runAutopsy(reqId));
      setAutopsyData(data);
    } catch (err) {
      alert(`Autopsy failed: ${err.message}`);
    } finally {
      setRunningAutopsy(false);
    }
  };

  const runCodeGen = async (task = codeTask) => {
    if (!selectedRequest) return;
    const reqId = selectedRequest.id || selectedRequest._id;
    setGeneratingCode(true);
    try {
      const res = await api.generateCode(reqId, task);
      setGeneratedCode(res?.code || '// No code generated');
    } catch (err) {
      alert(`Code generation failed: ${err.message}`);
    } finally {
      setGeneratingCode(false);
    }
  };

  const prevReqIdRef = useRef(null);
  const currentReqId = selectedRequest ? String(selectedRequest.id || selectedRequest._id) : null;
  useEffect(() => {
    if (currentReqId && currentReqId !== prevReqIdRef.current) {
      prevReqIdRef.current = currentReqId;
      setGeneratedCode(null);
      setAutopsyData(null);
    }
  }, [currentReqId]);

  const webhookUrl = activePortal?.webhookUrl || (activePortal?.token ? `${typeof window !== 'undefined' ? window.location.origin : 'https://haunted-inbox-ai.vercel.app'}/h/${activePortal.token}` : '');
   return (
    <div className="relative overflow-hidden flex flex-col gap-5 pt-1 pb-10">
      <div className="shape-glow-small -top-10 -left-10" />
      <div className="shape-glow-big top-96 -right-20" />

      <div className="relative z-10 flex items-center justify-between flex-wrap gap-3 pb-2 border-b border-white/10">
        <div className="flex items-center gap-3">
         
          <div>
            <h1 className="text-xl sm:text-2xl font-bold text-white flex items-center gap-2">
            <img
            src="/long-logo.png"
            alt="Haunted Inbox AI"
            className="h-20 sm:h-24 object-contain drop-shadow-[0_0_24px_rgba(232,89,12,0.4)]"
          />
            </h1>
            <p className="text-xs text-zinc-400 mt-0.5">
              Listen for incoming webhooks, inspect raw headers, and perform AI autopsies in real time.
            </p>
          </div>
        </div>

      </div>

      <div className="relative z-10 rounded-2xl bg-[#120e0d]/95 border border-white/10 p-3 sm:px-4 shadow-xl backdrop-blur-md">
        <div className="flex items-center justify-between flex-wrap gap-3">
          <div className="flex items-center gap-2.5 flex-wrap">
            <span className="text-lg">🕯️</span>
            <select
              value={portalId || ''}
              onChange={(e) => {
                const found = portals.find((p) => String(p.id || p._id) === e.target.value);
                if (found) {
                  setActivePortal(found);
                  navigate(`/portals/${found.id || found._id}`, { replace: true });
                }
              }}
              className="w-auto min-w-[170px] h-[36px] px-3 py-1 text-xs sm:text-[13px] font-bold rounded-full bg-[#060505] border border-white/15 text-zinc-100 outline-none focus:border-orange-500 cursor-pointer"
            >
              {portals.length === 0 && <option value="">No portals summoned</option>}
              {portals.map((p) => (
                <option key={p.id || p._id} value={p.id || p._id}>
                  {p.name || 'Untitled Portal'}
                </option>
              ))}
            </select>

            <form onSubmit={handleCreatePortal} className="flex items-center gap-1.5">
              <input
                type="text"
                placeholder="New portal name..."
                value={newPortalName}
                onChange={(e) => setNewPortalName(e.target.value)}
                className="w-[150px] sm:w-[170px] h-[36px] px-3 py-1 text-xs sm:text-[13px] rounded-full bg-[#060505] border border-white/15 text-zinc-100 outline-none focus:border-orange-500 placeholder:text-zinc-500"
              />
              <button
                type="submit"
                disabled={creatingPortal}
                className="h-[36px] inline-flex items-center gap-1.5 px-4 text-xs font-bold rounded-full bg-white text-orange-600 hover:bg-orange-500 hover:text-white transition-all cursor-pointer shadow-md shadow-orange-500/20 disabled:opacity-50"
              >
                <span>➕</span>
                <span>Summon</span>
              </button>
            </form>

            {portalId && (
              <button
                type="button"
                onClick={handleDeletePortal}
                title="Bury this portal"
                className="h-[36px] w-[36px] inline-flex items-center justify-center text-xs rounded-full border border-white/10 hover:border-red-500/50 hover:bg-red-500/10 text-zinc-400 hover:text-red-400 transition-all cursor-pointer"
              >
                <span>⚰️</span>
              </button>
            )}
          </div>

          {webhookUrl && (
            <div className="flex items-center gap-2 flex-wrap">
              <div className="flex items-center gap-2 bg-[#060505] border border-orange-500/30 px-3 py-1.5 rounded-full text-xs text-orange-300 font-mono">
                <span className="max-w-[240px] sm:max-w-[320px] truncate">
                  {webhookUrl}
                </span>
                <button
                  type="button"
                  onClick={() => {
                    navigator.clipboard.writeText(webhookUrl);
                    setCopiedUrl(true);
                    setTimeout(() => setCopiedUrl(false), 2000);
                  }}
                  className="p-0.5 text-xs text-zinc-400 hover:text-orange-400 transition-colors cursor-pointer"
                  title="Copy Webhook URL"
                >
                  {copiedUrl ? '✅' : '📋'}
                </button>
              </div>
            </div>
          )}
        </div>
      </div>

      <div className="relative z-10 grid grid-cols-1 lg:grid-cols-[340px_1fr] gap-5 items-start">
        <div className="rounded-2xl bg-[#120e0d]/95 border border-white/10 overflow-hidden shadow-xl backdrop-blur-md">
          <div className="px-4 py-3 border-b border-white/10 flex items-center justify-between bg-white/[0.01]">
            <span className="text-xs font-bold text-orange-400 uppercase tracking-wider flex items-center gap-1.5">
              <span>🦇</span>
              <span>Dispatches ({requests.length})</span>
            </span>
            <button
              type="button"
              onClick={() => loadRequests()}
              className="p-1 text-xs text-zinc-400 hover:text-orange-400 rounded-full transition-colors cursor-pointer"
              title="Refresh stream"
            >
              <span>🔄</span>
            </button>
          </div>

          <div className="max-h-[calc(100vh-260px)] min-h-[380px] overflow-y-auto divide-y divide-white/5">
            {requests.length === 0 ? (
              <div className="py-14 px-4 text-center text-zinc-500">
                <div className="text-4xl mb-2.5 select-none">👻</div>
                <div className="text-sm font-bold text-zinc-300">The crypt is silent</div>
                <div className="text-xs mt-1 text-zinc-500 max-w-[220px] mx-auto">
                  Send a POST request to your summoned webhook URL above to see it appear.
                </div>
              </div>
            ) : (
              requests.map((r) => {
                const isSelected = selectedRequest && String(selectedRequest.id || selectedRequest._id) === String(r.id || r._id);
                return (
                  <div
                    key={r.id || r._id}
                    onClick={() => setSelectedRequest(r)}
                    className={`p-3 cursor-pointer transition-all border-l-4 ${
                      isSelected
                        ? 'bg-[#1c1514] border-l-orange-500 shadow-inner'
                        : 'border-l-transparent hover:bg-white/[0.02]'
                    }`}
                  >
                    <div className="flex items-center justify-between mb-1.5">
                      <MethodBadge method={r.method} />
                      <span className="text-[11px] text-zinc-500">
                        {formatRelativeTime(r.receivedAt)}
                      </span>
                    </div>
                    <div className="flex items-center justify-between text-xs">
                      <span className="text-zinc-200 font-mono overflow-hidden text-ellipsis whitespace-nowrap max-w-[200px]">
                        {r.path || '/'}
                      </span>
                      <span className="text-[11px] text-zinc-500 font-mono">
                        {formatBytes(r.size)}
                      </span>
                    </div>
                  </div>
                );
              })
            )}
          </div>
        </div>

        <div className="rounded-2xl bg-[#120e0d]/95 border border-white/10 p-5 min-h-[460px] shadow-xl backdrop-blur-md">
          {selectedRequest ? (
            <div>
              <div className="flex items-center justify-between border-b border-white/10 pb-3.5 mb-4 flex-wrap gap-2">
                <div className="flex items-center gap-2.5">
                  <MethodBadge method={selectedRequest.method} />
                  <span className="text-[14px] font-bold text-zinc-100 font-mono">
                    {selectedRequest.path || '/'}
                  </span>
                  <span className="text-xs text-zinc-500">
                    • {formatRelativeTime(selectedRequest.receivedAt)}
                  </span>
                </div>
                <div className="text-xs text-orange-400 font-mono bg-orange-500/10 px-2.5 py-0.5 rounded-full border border-orange-500/20">
                  IP: {selectedRequest.ip || '127.0.0.1'}
                </div>
              </div>

              <div className="flex gap-2 border-b border-white/10 mb-5 overflow-x-auto">
                <button
                  type="button"
                  onClick={() => setActiveTab('payload')}
                  className={`px-4 py-2 text-xs sm:text-[13px] font-bold border-b-2 transition-all whitespace-nowrap inline-flex items-center gap-2 cursor-pointer ${
                    activeTab === 'payload'
                      ? 'text-orange-400 border-b-orange-500'
                      : 'text-zinc-400 border-b-transparent hover:text-zinc-200'
                  }`}
                >
                  <span>📦</span>
                  <span>Payload & Headers</span>
                </button>
                <button
                  type="button"
                  onClick={() => {
                    setActiveTab('autopsy');
                    if (!autopsyData) runAutopsy();
                  }}
                  className={`px-4 py-2 text-xs sm:text-[13px] font-bold border-b-2 transition-all whitespace-nowrap inline-flex items-center gap-2 cursor-pointer ${
                    activeTab === 'autopsy'
                      ? 'text-orange-400 border-b-orange-500'
                      : 'text-zinc-400 border-b-transparent hover:text-zinc-200'
                  }`}
                >
                  <span>🔮</span>
                  <span>AI Autopsy</span>
                </button>
                <button
                  type="button"
                  onClick={() => {
                    setActiveTab('code');
                    if (!generatedCode) runCodeGen('express-handler');
                  }}
                  className={`px-4 py-2 text-xs sm:text-[13px] font-bold border-b-2 transition-all whitespace-nowrap inline-flex items-center gap-2 cursor-pointer ${
                    activeTab === 'code'
                      ? 'text-orange-400 border-b-orange-500'
                      : 'text-zinc-400 border-b-transparent hover:text-zinc-200'
                  }`}
                >
                  <span>⚡</span>
                  <span>Synthesize Spells</span>
                </button>
              </div>

              {activeTab === 'payload' && (
                <div className="flex flex-col gap-4">
                  <div>
                    <div className="flex items-center justify-between mb-2">
                      <span className="text-xs font-bold text-zinc-400 uppercase tracking-wider">
                        Body Payload
                      </span>
                      <button
                        type="button"
                        onClick={() => {
                          navigator.clipboard.writeText(safeJsonStringify(selectedRequest.body));
                          setCopiedBody(true);
                          setTimeout(() => setCopiedBody(false), 2000);
                        }}
                        className="inline-flex items-center gap-1.5 px-2.5 py-1 text-xs rounded-full text-orange-400 border border-orange-500/30 hover:bg-orange-500/10 transition-all cursor-pointer"
                      >
                        <span>{copiedBody ? '✅' : '📋'}</span>
                        <span>{copiedBody ? 'Copied' : 'Copy Body'}</span>
                      </button>
                    </div>
                    <pre className="m-0 p-4 rounded-xl bg-[#060505] border border-white/10 text-xs sm:text-[13px] text-zinc-300 font-mono leading-relaxed overflow-x-auto max-h-[290px] whitespace-pre-wrap break-all shadow-inner">
                      {selectedRequest.body && Object.keys(selectedRequest.body).length > 0
                        ? safeJsonStringify(selectedRequest.body)
                        : '// Empty body'}
                    </pre>
                  </div>

                  <div>
                    <span className="text-xs font-bold text-zinc-400 uppercase tracking-wider block mb-2">
                      HTTP Headers
                    </span>
                    <div className="bg-[#060505] border border-white/10 rounded-xl p-3 max-h-[200px] overflow-y-auto divide-y divide-white/5 font-mono text-xs">
                      {selectedRequest.headers && Object.keys(selectedRequest.headers).length > 0 ? (
                        Object.entries(selectedRequest.headers).map(([k, v]) => (
                          <div key={k} className="grid grid-cols-[180px_1fr] gap-3 py-1.5">
                            <span className="text-orange-400 font-bold">{k}:</span>
                            <span className="text-zinc-300 break-all">{String(v)}</span>
                          </div>
                        ))
                      ) : (
                        <div className="text-zinc-500 text-xs py-2">No headers recorded</div>
                      )}
                    </div>
                  </div>
                </div>
              )}

              {activeTab === 'autopsy' && (
                <div>
                  <div className="flex items-center justify-between mb-4">
                    <div className="text-xs sm:text-[13px] text-zinc-400">
                      Dissects payload anatomy, inferring types, field names, and hidden anomalies.
                    </div>
                    <button
                      type="button"
                      onClick={runAutopsy}
                      disabled={runningAutopsy}
                      className="inline-flex items-center gap-1.5 px-3.5 py-1.5 text-xs font-bold rounded-full bg-white text-orange-600 hover:bg-orange-500 hover:text-white transition-all cursor-pointer disabled:opacity-50 shadow-md shadow-orange-500/20"
                    >
                      <span>🔮</span>
                      <span>{runningAutopsy ? 'Examining...' : 'Re-examine'}</span>
                    </button>
                  </div>

                  {runningAutopsy ? (
                    <div className="py-20 text-center text-zinc-400">
                      <div className="text-4xl mb-3 select-none">🔮</div>
                      <div className="text-sm font-bold text-orange-400">Performing Forensic Autopsy...</div>
                      <div className="text-xs text-zinc-500 mt-1">Dissecting byte cadavers under flickering candlelight...</div>
                    </div>
                  ) : autopsyData ? (
                    <div className="flex flex-col gap-4">
                      {autopsyData.spookyWhisper && (
                        <div className="p-3.5 rounded-xl bg-orange-500/15 border border-orange-500/40 text-orange-300 text-xs sm:text-[13px] flex items-center gap-2.5 shadow-sm">
                          <span className="text-xl">🎃</span>
                          <span className="italic font-medium">"{autopsyData.spookyWhisper}"</span>
                        </div>
                      )}

                      <div className="p-3.5 rounded-xl bg-[#060505] border border-white/10">
                        <div className="text-[11px] text-orange-400 uppercase mb-1 font-bold tracking-wider">
                          Forensic Summary
                        </div>
                        <div className="text-xs sm:text-[13.5px] text-zinc-200 leading-relaxed">
                          {autopsyData.summary}
                        </div>
                      </div>

                      {Array.isArray(autopsyData.fields) && autopsyData.fields.length > 0 && (
                        <div>
                          <div className="text-xs font-bold text-zinc-400 uppercase tracking-wider mb-2">
                            Observed Fields ({autopsyData.fields.length})
                          </div>
                          <div className="border border-white/10 rounded-xl overflow-hidden bg-[#060505]">
                            <table className="w-full text-left border-collapse text-xs sm:text-[13px]">
                              <thead>
                                <tr className="bg-[#1c1514] border-b border-white/10">
                                  <th className="py-2.5 px-3 text-zinc-400 font-bold">Field</th>
                                  <th className="py-2.5 px-3 text-zinc-400 font-bold">Type</th>
                                  <th className="py-2.5 px-3 text-zinc-400 font-bold">Description</th>
                                </tr>
                              </thead>
                              <tbody className="divide-y divide-white/5 font-mono">
                                {autopsyData.fields.map((f, i) => (
                                  <tr key={i} className="hover:bg-white/[0.02]">
                                    <td className="py-2.5 px-3 text-orange-400 font-bold">{f.name}</td>
                                    <td className="py-2.5 px-3 text-sky-400">{f.type || 'unknown'}</td>
                                    <td className="py-2.5 px-3 text-zinc-300 font-sans">{f.description || '—'}</td>
                                  </tr>
                                ))}
                              </tbody>
                            </table>
                          </div>
                        </div>
                      )}

                      {Array.isArray(autopsyData.warnings) && autopsyData.warnings.length > 0 && (
                        <div className="p-3.5 rounded-xl bg-red-500/15 border border-red-500/35 text-red-300 text-xs sm:text-[13px]">
                          <div className="flex items-center gap-1.5 font-bold mb-1.5 text-red-400">
                            <span>🩸</span>
                            <span>Supernatural Anomalies & Security Warnings</span>
                          </div>
                          <ul className="m-0 pl-4 list-disc space-y-1">
                            {autopsyData.warnings.map((w, idx) => (
                              <li key={idx}>{w}</li>
                            ))}
                          </ul>
                        </div>
                      )}
                    </div>
                  ) : (
                    <div className="py-14 text-center text-zinc-500 text-xs sm:text-sm">
                      Click "Re-examine" to unleash the AI autopsy oracle on this request.
                    </div>
                  )}
                </div>
              )}

              {activeTab === 'code' && (
                <div>
                  <div className="flex items-center justify-between mb-3.5 flex-wrap gap-2">
                    <div className="flex gap-2">
                      <button
                        type="button"
                        onClick={() => {
                          setCodeTask('express-handler');
                          runCodeGen('express-handler');
                        }}
                        className={`h-9 inline-flex items-center gap-1.5 px-4 text-xs font-bold rounded-full transition-all cursor-pointer ${
                          codeTask === 'express-handler'
                            ? 'bg-orange-500 hover:bg-orange-400 text-white font-bold shadow-[0_0_14px_rgba(232,89,12,0.5)]'
                            : 'bg-[#1c1514] hover:bg-[#281e1d] text-zinc-300 border border-white/10'
                        }`}
                      >
                        <span>⚡ Express.js Spell</span>
                      </button>
                      <button
                        type="button"
                        onClick={() => {
                          setCodeTask('typescript-interface');
                          runCodeGen('typescript-interface');
                        }}
                        className={`h-9 inline-flex items-center gap-1.5 px-4 text-xs font-bold rounded-full transition-all cursor-pointer ${
                          codeTask === 'typescript-interface'
                            ? 'bg-orange-500 hover:bg-orange-400 text-white font-bold shadow-[0_0_14px_rgba(232,89,12,0.5)]'
                            : 'bg-[#1c1514] hover:bg-[#281e1d] text-zinc-300 border border-white/10'
                        }`}
                      >
                        <span>📜 TypeScript Ward</span>
                      </button>
                    </div>

                    {generatedCode && (
                      <button
                        type="button"
                        onClick={() => {
                          navigator.clipboard.writeText(generatedCode);
                          setCopiedCode(true);
                          setTimeout(() => setCopiedCode(false), 2000);
                        }}
                        className="h-9 inline-flex items-center gap-1.5 px-4 text-xs font-bold rounded-full bg-white text-orange-600 hover:bg-orange-500 hover:text-white transition-all cursor-pointer shadow-md shadow-orange-500/20"
                      >
                        <span>{copiedCode ? '✅' : '📋'}</span>
                        <span>{copiedCode ? 'Inscribed to Clipboard' : 'Copy Inscribed Code'}</span>
                      </button>
                    )}
                  </div>

                  {generatingCode ? (
                    <div className="py-20 text-center text-zinc-400">
                      <div className="text-4xl mb-3 animate-spin-fast select-none">⚡</div>
                      <div className="text-sm font-bold text-orange-400">Synthesizing Arcane Code...</div>
                      <div className="text-xs text-zinc-500 mt-1">Forging typed {codeTask === 'express-handler' ? 'Express handler' : 'TypeScript interfaces'}...</div>
                    </div>
                  ) : generatedCode ? (
                    <pre className="m-0 p-4 rounded-xl bg-[#060505] border border-white/10 text-xs sm:text-[13px] text-zinc-200 font-mono leading-relaxed overflow-x-auto max-h-[440px] whitespace-pre-wrap break-all shadow-inner">
                      {generatedCode}
                    </pre>
                  ) : (
                    <div className="py-14 text-center text-zinc-500 text-xs sm:text-sm">
                      Select a generator above to synthesize handler code from captured telemetry.
                    </div>
                  )}
                </div>
              )}
            </div>
          ) : (
            <div className="py-24 px-6 text-center text-zinc-500">
              <div className="text-5xl mb-3 select-none">👁️</div>
              <div className="text-base font-bold text-zinc-200">Select a dispatch to inspect</div>
              <div className="text-xs mt-1 text-zinc-500 max-w-[280px] mx-auto">
                Inspect raw headers, analyze JSON body telemetry, and forge typed handlers.
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
