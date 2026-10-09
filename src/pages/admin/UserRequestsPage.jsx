import React, { useState, useEffect, useCallback } from "react";
import { 
  Link, 
  Copy, 
  Check, 
  UserPlus, 
  Clock, 
  Trash, 
  ShieldCheck, 
  CheckCircle, 
  XCircle, 
  ArrowClockwise, 
  Spinner, 
  User, 
  EnvelopeSimple,
  Phone,
  ShieldPlus
} from "@phosphor-icons/react";
import { toast } from "react-hot-toast";
import { userService } from "../../services/userService";
import { socket } from "../../services/socket";

export default function UserRequestsPage() {
  // Form State
  const [selectedRole, setSelectedRole] = useState("staff");
  const [expiryHours, setExpiryHours] = useState("24");
  const [generatedLink, setGeneratedLink] = useState("");
  const [copied, setCopied] = useState(false);

  // Data State
  const [pendingRequests, setPendingRequests] = useState([]);
  const [activeInvites, setActiveInvites] = useState([]);

  // Async Loading States
  const [loadingPending, setLoadingPending] = useState(true);
  const [loadingInvites, setLoadingInvites] = useState(true);
  const [generating, setGenerating] = useState(false);
  const [actionLoadingId, setActionLoadingId] = useState(null);

  // 1. Fetch Pending Requests (Inactive Users awaiting admin approval)
  const fetchPendingRequests = useCallback(async () => {
    setLoadingPending(true);
    try {
      const response = await userService.getUsers({ status: "inactive" });
      const data = response?.users || response?.data || response || [];
      // Filter out inactive/unapproved accounts
      const filtered = Array.isArray(data) ? data.filter((u) => u.status === "inactive" || !u.isActive) : [];
      setPendingRequests(filtered);
    } catch (error) {
      toast.error("Failed to load pending access requests");
      console.error("Error fetching pending requests:", error);
    } finally {
      setLoadingPending(false);
    }
  }, []);

  // 2. Fetch Active Invite Tokens
  const fetchActiveInvites = useCallback(async () => {
    setLoadingInvites(true);
    try {
      const response = await userService.getInvites();
      const data = Array.isArray(response) ? response : response?.data || [];
      setActiveInvites(data);
    } catch (error) {
      console.error("Error fetching active invites:", error);
    } finally {
      setLoadingInvites(false);
    }
  }, []);

  // Initial Load & Socket Listener for Real-time Onboarding Updates
  useEffect(() => {
    fetchPendingRequests();
    fetchActiveInvites();

    if (socket) {
      const handleUserOnboarded = (data) => {
        toast.success(`New request: ${data?.name || "A new user"} completed onboarding!`, {
          icon: "🚀",
        });
        fetchPendingRequests();
        fetchActiveInvites();
      };

      socket.on("user:onboarded", handleUserOnboarded);

      return () => {
        socket.off("user:onboarded", handleUserOnboarded);
      };
    }
  }, [fetchPendingRequests, fetchActiveInvites]);

  // Handle Invite Link Generation
  const handleGenerateLink = async (e) => {
    e.preventDefault();
    setGenerating(true);

    try {
      const payload = { role: selectedRole, expiresInHours: Number(expiryHours) };
      const res = await userService.inviteUser(payload);

      const inviteUrl = res?.inviteUrl || res?.data?.inviteUrl;
      const inviteObj = res?.invite || res?.data?.invite;

      if (!inviteUrl) {
        throw new Error("Invalid response format from server");
      }

      setGeneratedLink(inviteUrl);
      setCopied(false);

      if (inviteObj) {
        setActiveInvites((prev) => [inviteObj, ...prev]);
      } else {
        fetchActiveInvites();
      }

      toast.success("Registration invite link generated!");
    } catch (error) {
      const errMessage = error?.response?.data?.message || error?.response?.data?.error || error?.message || "Failed to generate invite link";
      toast.error(errMessage);
    } finally {
      setGenerating(false);
    }
  };

  // Copy Generated Link to Clipboard
  const handleCopy = () => {
    if (!generatedLink) return;
    navigator.clipboard.writeText(generatedLink);
    setCopied(true);
    toast.success("Invite link copied to clipboard!");
    setTimeout(() => setCopied(false), 2000);
  };

  // Approve User Access Request
  const handleApprove = async (userId, name) => {
    setActionLoadingId(userId);
    try {
      await userService.toggleUserStatus(userId);
      setPendingRequests((prev) => prev.filter((r) => (r._id || r.id) !== userId));
      toast.success(`Approved account for ${name}`);
    } catch (error) {
      const errMessage = error?.response?.data?.message || error?.response?.data?.error || `Failed to approve ${name}`;
      toast.error(errMessage);
    } finally {
      setActionLoadingId(null);
    }
  };

  // Reject / Delete User Request
  const handleReject = async (userId, name) => {
    if (!window.confirm(`Are you sure you want to reject and remove access request for ${name}?`)) return;
    
    setActionLoadingId(userId);
    try {
      await userService.deleteUser(userId);
      setPendingRequests((prev) => prev.filter((r) => (r._id || r.id) !== userId));
      toast.error(`Rejected access request from ${name}`);
    } catch (error) {
      const errMessage = error?.response?.data?.message || error?.response?.data?.error || `Failed to reject request`;
      toast.error(errMessage);
    } finally {
      setActionLoadingId(null);
    }
  };

  // Revoke Invite Token
  const handleRevokeInvite = async (inviteId) => {
    setActionLoadingId(inviteId);
    try {
      await userService.revokeInvite(inviteId);
      setActiveInvites((prev) => prev.filter((inv) => (inv._id || inv.id) !== inviteId));
      toast.error("Invite token revoked");
    } catch (error) {
      toast.error("Failed to revoke invite token");
    } finally {
      setActionLoadingId(null);
    }
  };

  return (
    <div className="space-y-6">
      {/* Page Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 border-b border-border-divider pb-4">
        <div>
          <h1 className="text-2xl font-bold font-heading uppercase tracking-wide text-main flex items-center gap-2.5">
            <ShieldPlus size={28} className="text-primary-cyan" />
            User Access & Invite Management
          </h1>
          <p className="text-xs sm:text-sm text-sub">
            Generate secure single-use onboarding registration links and manage pending approvals.
          </p>
        </div>

        {/* Refresh Action Button */}
        <button
          type="button"
          onClick={() => {
            fetchPendingRequests();
            fetchActiveInvites();
          }}
          className="self-start sm:self-auto inline-flex items-center gap-2 px-3.5 py-2 rounded-xl bg-card-panel border border-border-divider text-main text-xs font-bold hover:bg-app-bg transition-colors cursor-pointer"
        >
          <ArrowClockwise size={16} className={loadingPending || loadingInvites ? "animate-spin text-primary-cyan" : ""} />
          <span>Sync Data</span>
        </button>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Left Column: Invite Link Generator */}
        <div className="lg:col-span-1 rounded-2xl border border-border-divider bg-card-panel p-5 space-y-4 self-start sticky top-6">
          <div className="flex items-center gap-2.5 text-primary-cyan border-b border-border-divider pb-3">
            <UserPlus size={22} weight="duotone" />
            <h2 className="font-heading font-bold text-base uppercase text-main">Generate Registration Link</h2>
          </div>

          <form onSubmit={handleGenerateLink} className="space-y-4">
            <div>
              <label className="block text-xs font-mono uppercase text-sub mb-1.5">Target Account Role</label>
              <select
                value={selectedRole}
                onChange={(e) => setSelectedRole(e.target.value)}
                className="w-full bg-app-bg border border-border-divider rounded-xl px-3 py-2.5 text-xs text-main focus:outline-none focus:border-primary-cyan"
              >
                <option value="staff">Staff Member</option>
                <option value="operator">Gaming Lounge Operator</option>
                <option value="admin">Administrator / Manager</option>
              </select>
            </div>

            <div>
              <label className="block text-xs font-mono uppercase text-sub mb-1.5">Link Expiration Window</label>
              <select
                value={expiryHours}
                onChange={(e) => setExpiryHours(e.target.value)}
                className="w-full bg-app-bg border border-border-divider rounded-xl px-3 py-2.5 text-xs text-main focus:outline-none focus:border-primary-cyan"
              >
                <option value="12">12 Hours</option>
                <option value="24">24 Hours (1 Day)</option>
                <option value="72">72 Hours (3 Days)</option>
              </select>
            </div>

            <button
              type="submit"
              disabled={generating}
              className="w-full py-2.5 px-4 rounded-xl bg-primary-cyan text-app-bg font-bold text-xs uppercase tracking-wider hover:opacity-90 disabled:opacity-50 flex items-center justify-center gap-2 transition-all cursor-pointer"
            >
              {generating ? (
                <>
                  <Spinner size={16} className="animate-spin" />
                  <span>Generating Token...</span>
                </>
              ) : (
                <>
                  <Link size={16} weight="bold" />
                  <span>Create Registration Link</span>
                </>
              )}
            </button>
          </form>

          {/* Generated Link Output Container */}
          {generatedLink && (
            <div className="mt-4 p-3.5 rounded-xl bg-app-bg border border-primary-cyan/40 space-y-2 animate-fadeIn">
              <div className="flex items-center justify-between">
                <span className="text-[10px] font-mono uppercase font-bold text-primary-cyan">Active Invite URL</span>
                <span className="text-[10px] font-mono text-sub">Expires in {expiryHours}h</span>
              </div>

              <div className="flex items-center gap-2">
                <input
                  type="text"
                  readOnly
                  value={generatedLink}
                  className="w-full bg-card-panel border border-border-divider rounded-lg px-2.5 py-2 text-xs text-main font-mono truncate focus:outline-none"
                />
                <button
                  type="button"
                  onClick={handleCopy}
                  className={`p-2 rounded-lg border transition-all shrink-0 cursor-pointer ${
                    copied
                      ? "bg-available/20 border-available text-available"
                      : "bg-card-panel border-border-divider text-primary-cyan hover:bg-card-panel/80"
                  }`}
                  title="Copy Link"
                >
                  {copied ? <Check size={18} weight="bold" /> : <Copy size={18} />}
                </button>
              </div>
            </div>
          )}
        </div>

        {/* Right Column: Pending Requests & Active Generated Tokens */}
        <div className="lg:col-span-2 space-y-6">
          {/* Section 1: Pending Access Approval Requests */}
          <div className="rounded-2xl border border-border-divider bg-card-panel p-5 space-y-4">
            <div className="flex items-center justify-between border-b border-border-divider pb-3">
              <div className="flex items-center gap-2 text-warning">
                <Clock size={20} weight="duotone" />
                <h2 className="font-heading font-bold text-base uppercase text-main">Pending Access Requests</h2>
              </div>
              <span className="font-mono text-xs font-bold text-sub bg-app-bg px-2.5 py-1 rounded-full border border-border-divider">
                {pendingRequests.length} Pending
              </span>
            </div>

            {loadingPending ? (
              <div className="py-8 flex flex-col items-center justify-center text-sub space-y-2">
                <Spinner size={24} className="animate-spin text-primary-cyan" />
                <p className="text-xs font-mono">Fetching pending approvals...</p>
              </div>
            ) : pendingRequests.length === 0 ? (
              <div className="py-8 text-center space-y-2">
                <CheckCircle size={32} className="mx-auto text-available/50" weight="duotone" />
                <p className="text-xs text-sub italic">No pending operator requests at this time.</p>
              </div>
            ) : (
              <div className="space-y-3">
                {pendingRequests.map((req) => {
                  const reqId = req._id || req.id;
                  const isProcessing = actionLoadingId === reqId;

                  return (
                    <div
                      key={reqId}
                      className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 p-4 rounded-xl bg-app-bg border border-border-divider hover:border-border-divider/80 transition-all"
                    >
                      <div className="flex items-start gap-3">
                        <div className="w-10 h-10 rounded-xl bg-card-panel border border-border-divider flex items-center justify-center text-primary-cyan shrink-0 font-bold font-mono overflow-hidden">
                          {req.photoUrl || req.avatar ? (
                            <img src={req.photoUrl || req.avatar} alt={req.name} className="w-full h-full object-cover rounded-xl" />
                          ) : (
                            req.name?.charAt(0).toUpperCase() || <User size={20} />
                          )}
                        </div>

                        <div className="space-y-1">
                          <p className="text-xs font-bold text-main flex items-center gap-2">
                            <span>{req.name || "Unnamed User"}</span>
                            <span className="font-mono text-[9px] uppercase font-bold text-primary-cyan bg-primary-cyan/10 px-2 py-0.5 rounded border border-primary-cyan/20">
                              {req.role || "staff"}
                            </span>
                          </p>
                          
                          <div className="flex flex-wrap items-center gap-x-3 gap-y-1 text-[11px] text-sub font-mono">
                            {req.email && (
                              <p className="flex items-center gap-1">
                                <EnvelopeSimple size={14} className="text-primary-cyan" />
                                <span>{req.email}</span>
                              </p>
                            )}
                            {req.phone && (
                              <p className="flex items-center gap-1">
                                <Phone size={14} className="text-primary-cyan" />
                                <span>{req.phone}</span>
                              </p>
                            )}
                          </div>

                          <p className="text-[10px] text-sub font-mono">
                            Registered: {req.createdAt ? new Date(req.createdAt).toLocaleString() : "Recently"}
                          </p>
                        </div>
                      </div>

                      <div className="flex items-center gap-2 shrink-0 self-end sm:self-center">
                        <button
                          type="button"
                          disabled={isProcessing}
                          onClick={() => handleApprove(reqId, req.name)}
                          className="flex items-center gap-1.5 px-3.5 py-1.5 rounded-xl bg-available/10 border border-available/30 text-available text-xs font-bold hover:bg-available/20 transition-colors disabled:opacity-50 cursor-pointer"
                        >
                          {isProcessing ? <Spinner size={16} className="animate-spin" /> : <CheckCircle size={16} />}
                          <span>Approve</span>
                        </button>

                        <button
                          type="button"
                          disabled={isProcessing}
                          onClick={() => handleReject(reqId, req.name)}
                          className="flex items-center gap-1.5 px-3.5 py-1.5 rounded-xl bg-occupied/10 border border-occupied/30 text-occupied text-xs font-bold hover:bg-occupied/20 transition-colors disabled:opacity-50 cursor-pointer"
                        >
                          {isProcessing ? <Spinner size={16} className="animate-spin" /> : <XCircle size={16} />}
                          <span>Reject</span>
                        </button>
                      </div>
                    </div>
                  );
                })}
              </div>
            )}
          </div>

          {/* Section 2: Active Generated Tokens */}
          <div className="rounded-2xl border border-border-divider bg-card-panel p-5 space-y-4">
            <div className="flex items-center justify-between border-b border-border-divider pb-3">
              <div className="flex items-center gap-2 text-primary-cyan">
                <ShieldCheck size={20} weight="duotone" />
                <h2 className="font-heading font-bold text-base uppercase text-main">Active Generated Tokens</h2>
              </div>
              <span className="font-mono text-xs font-bold text-sub bg-app-bg px-2.5 py-1 rounded-full border border-border-divider">
                {activeInvites.length} Active
              </span>
            </div>

            {loadingInvites ? (
              <div className="py-6 flex items-center justify-center text-sub space-y-2">
                <Spinner size={20} className="animate-spin text-primary-cyan" />
              </div>
            ) : activeInvites.length === 0 ? (
              <p className="text-xs text-sub italic py-4 text-center">No active registration tokens generated yet.</p>
            ) : (
              <div className="space-y-2.5">
                {activeInvites.map((inv) => {
                  const invId = inv._id || inv.id;
                  const isRevoking = actionLoadingId === invId;

                  return (
                    <div
                      key={invId}
                      className="flex items-center justify-between gap-3 p-3.5 rounded-xl bg-app-bg border border-border-divider hover:border-border-divider/80 transition-all"
                    >
                      <div className="min-w-0 space-y-1">
                        <p className="font-mono text-xs font-bold text-main truncate tracking-wide">
                          {inv.token}
                        </p>
                        <div className="flex items-center gap-2 text-[10px] font-mono text-sub">
                          <span className="uppercase font-bold text-primary-cyan">Role: {inv.role}</span>
                          <span>•</span>
                          <span className="text-warning">
                            Expires: {inv.expiresAt ? new Date(inv.expiresAt).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }) : "24h"}
                          </span>
                        </div>
                      </div>

                      <button
                        type="button"
                        disabled={isRevoking}
                        onClick={() => handleRevokeInvite(invId)}
                        className="p-2 rounded-xl bg-occupied/10 text-occupied border border-occupied/20 hover:bg-occupied/20 disabled:opacity-50 transition-colors shrink-0 cursor-pointer"
                        title="Revoke Invite Token"
                      >
                        {isRevoking ? <Spinner size={16} className="animate-spin" /> : <Trash size={16} />}
                      </button>
                    </div>
                  );
                })}
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}