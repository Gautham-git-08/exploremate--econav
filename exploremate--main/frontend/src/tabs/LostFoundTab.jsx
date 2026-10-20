/**
 * ExploreMate Lost & Found Tab (Phase 6)
 * Police-based safe recovery workflow:
 * - Finder submits report -> Receives LF-TEMP-XXXX -> Nearest Police Station directions
 * - Police Desk modal/tab -> Officer generates guaranteed unique ID (PF-YEAR-SEQUENCE)
 * - Claimant submits claim -> Advised of physical ID verification at station
 * - Live Status Timeline: Logged -> Handed to Police -> Official ID -> Claim submitted -> Under Investigation -> Released
 */

import React, { useState, useEffect } from 'react';
import { Shield, Search, Plus, MapPin, CheckCircle2, Clock, AlertTriangle, ExternalLink, Lock, FileText, ArrowRight, UserCheck, X } from 'lucide-react';
import { useModal } from '../context/ModalContext';

export default function LostFoundTab() {
  const [items, setItems] = useState([]);
  const [stations, setStations] = useState([]);
  const [filterType, setFilterType] = useState('all');
  const [showReportModal, setShowReportModal] = useState(false);
  const [showClaimModal, setShowClaimModal] = useState(false);
  const [showPoliceDeskModal, setShowPoliceDeskModal] = useState(false);
  const [selectedItemForClaim, setSelectedItemForClaim] = useState(null);
  const [policeClaims, setPoliceClaims] = useState([]);
  const [policePassword, setPolicePassword] = useState('');
  const [isPoliceAuthorized, setIsPoliceAuthorized] = useState(false);

  // Form states
  const [reportForm, setReportForm] = useState({
    type: 'found',
    category: 'Valuables/Electronics',
    title: '',
    description: '',
    place_name: 'White Town',
    reporter_name: '',
    reporter_contact: '',
    website_url_hp: ''
  });

  const [claimForm, setClaimForm] = useState({
    official_id: '',
    claimant_name: '',
    claimant_contact: '',
    claim_description: '',
    proof_details: ''
  });

  const [tempHandoverRef, setTempHandoverRef] = useState('');

  const { showAlert } = useModal();

  const fetchItems = () => {
    fetch(`/api/lostfound?type=${filterType}`)
      .then(r => r.json())
      .then(d => setItems(d.items || []))
      .catch(e => console.error(e));
  };

  const fetchStations = () => {
    fetch('/api/lostfound/police_stations')
      .then(r => r.json())
      .then(d => setStations(d.stations || []))
      .catch(e => console.error(e));
  };

  useEffect(() => {
    fetchItems();
    fetchStations();
  }, [filterType]);

  const handleReportSubmit = (e) => {
    e.preventDefault();
    if (reportForm.description.length < 20) {
      showAlert({ title: "Validation Error", message: "Description must be at least 20 characters." });
      return;
    }

    fetch('/api/lostfound', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(reportForm)
    })
      .then(r => r.json())
      .then(d => {
        if (d.success) {
          const tempRef = `LF-TEMP-${d.item_id.slice(-6).toUpperCase()}`;
          showAlert({
            title: "Report Logged — Handover Required",
            message: `Temporary Reference: ${tempRef}. Please hand this item over to your nearest Pondicherry Police Station to receive the official tracking ID.`
          });
          setShowReportModal(false);
          fetchItems();
        } else {
          showAlert({ title: "Error", message: d.error || "Submission failed" });
        }
      });
  };

  const handleClaimSubmit = (e) => {
    e.preventDefault();
    fetch('/api/lostfound/claims', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(claimForm)
    })
      .then(r => r.json())
      .then(d => {
        if (d.success) {
          showAlert({
            title: "Claim Submitted to Police",
            message: d.message
          });
          setShowClaimModal(false);
          fetchItems();
        } else {
          showAlert({ title: "Claim Error", message: d.error || "Failed to submit claim" });
        }
      });
  };

  const loadPoliceDesk = () => {
    if (policePassword === 'pondy2026') {
      setIsPoliceAuthorized(true);
      fetch('/api/lostfound/police/claims')
        .then(r => r.json())
        .then(d => setPoliceClaims(d.claims || []));
    } else {
      showAlert({ title: "Unauthorized", message: "Enter demo passcode: pondy2026" });
    }
  };

  const handlePoliceReceive = (e) => {
    e.preventDefault();
    if (!tempHandoverRef) return;

    fetch('/api/lostfound/police/receive', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ temp_ref: tempHandoverRef })
    })
      .then(r => r.json())
      .then(d => {
        if (d.success) {
          showAlert({
            title: "Official ID Issued",
            message: d.message
          });
          setTempHandoverRef('');
          fetchItems();
        } else {
          showAlert({ title: "Error", message: d.error || "Item not found" });
        }
      });
  };

  const handlePoliceStatusUpdate = (claimId, newStatus) => {
    fetch('/api/lostfound/police/claim_status', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ claim_id: claimId, status: newStatus, notes: "Verified at Police Station Desk" })
    })
      .then(r => r.json())
      .then(d => {
        if (d.success) {
          showAlert({ title: "Status Updated", message: d.message });
          loadPoliceDesk();
          fetchItems();
        }
      });
  };

  return (
    <div className="space-y-6 animate-fade-in pb-12">
      {/* Header with Police Desk Button */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h2 className="font-serif text-3xl font-bold text-slate-900 dark:text-white">
            Lost & Found Police Workflow
          </h2>
          <p className="text-xs text-slate-500">
            Regulated community recovery. Found items are safely routed via Puducherry Police Stations.
          </p>
        </div>

        <div className="flex items-center space-x-2">
          <button
            onClick={() => setShowPoliceDeskModal(true)}
            className="px-3.5 py-2 rounded-xl border border-teal-600/40 text-teal-700 dark:text-teal-300 text-xs font-semibold hover:bg-teal-50 dark:hover:bg-teal-950/40 transition flex items-center space-x-1.5"
          >
            <Shield className="w-4 h-4 text-teal-600" />
            <span>Police Desk</span>
          </button>

          <button
            onClick={() => setShowReportModal(true)}
            className="flex items-center space-x-1.5 px-4 py-2 bg-mustard-600 hover:bg-mustard-700 text-white rounded-xl text-xs font-semibold shadow transition"
          >
            <Plus className="w-4 h-4" />
            <span>Report Item</span>
          </button>
        </div>
      </div>

      {/* Safety & Protocol Banner */}
      <div className="p-5 rounded-3xl bg-teal-50 dark:bg-teal-950/40 border border-teal-200 dark:border-teal-800 space-y-2 text-xs text-teal-900 dark:text-teal-200">
        <div className="flex items-center space-x-2 font-bold text-sm">
          <Shield className="w-4 h-4 text-teal-600" />
          <span>Official Police Handover Protocol</span>
        </div>
        <p className="leading-relaxed">
          Found items are <strong>never handed directly between private individuals</strong>. All found items receive a temporary reference and must be delivered to a designated Puducherry police station where an officer issues a verified tracking ID (format: <code>PF-2026-XXXXXX</code>). Claimants must present valid photo identification in person.
        </p>
      </div>

      {/* Nearest Police Stations Directory */}
      <div className="glass-panel p-5 rounded-3xl border border-slate-200 dark:border-slate-800 space-y-3">
        <h3 className="font-serif text-base font-bold text-slate-900 dark:text-white flex items-center gap-1.5">
          <MapPin className="w-4 h-4 text-mustard-600" />
          <span>Nearest Puducherry Police Stations for Handover</span>
        </h3>
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
          {stations.map(st => (
            <div key={st.id} className="p-3.5 rounded-2xl bg-white dark:bg-slate-900/60 border border-slate-200 dark:border-slate-800 space-y-1">
              <span className="font-bold text-xs text-slate-900 dark:text-white block">{st.name}</span>
              <span className="text-[11px] text-slate-500 block">{st.address}</span>
              <div className="pt-1 flex items-center justify-between text-[11px]">
                <span className="text-teal-700 dark:text-teal-400 font-medium">📞 {st.phone}</span>
                <a href={st.mapsUrl} target="_blank" rel="noopener noreferrer" className="text-mustard-600 dark:text-mustard-400 hover:underline flex items-center gap-0.5 font-semibold">
                  <span>Directions</span>
                  <ExternalLink className="w-3 h-3" />
                </a>
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* Filter Tabs */}
      <div className="flex space-x-2">
        {['all', 'lost', 'found'].map((f) => (
          <button
            key={f}
            onClick={() => setFilterType(f)}
            className={`px-4 py-1.5 rounded-xl text-xs font-semibold capitalize transition ${
              filterType === f
                ? 'bg-mustard-600 text-white shadow'
                : 'bg-white dark:bg-slate-800 text-slate-600 dark:text-slate-300 border border-slate-200 dark:border-slate-700'
            }`}
          >
            {f === 'all' ? 'All Items' : `${f} Items`}
          </button>
        ))}
      </div>

      {/* Items List */}
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
        {items.map((it) => (
          <div
            key={it.id}
            className="glass-panel p-5 rounded-3xl border border-slate-200 dark:border-slate-800 space-y-3 flex flex-col justify-between"
          >
            <div className="space-y-2">
              <div className="flex items-center justify-between">
                <span className={`px-2.5 py-0.5 rounded-full text-[10px] font-bold uppercase tracking-wider ${
                  it.type === 'lost' ? 'bg-red-100 text-red-700 dark:bg-red-950/60 dark:text-red-300' : 'bg-emerald-100 text-emerald-700 dark:bg-emerald-950/60 dark:text-emerald-300'
                }`}>
                  {it.type}
                </span>
                <span className="text-xs text-slate-400">{it.category}</span>
              </div>

              <div>
                <h4 className="font-serif text-lg font-bold text-slate-900 dark:text-white">
                  {it.title}
                </h4>
                {/* Limited description for privacy safety */}
                <p className="mt-1 text-xs text-slate-600 dark:text-slate-300 line-clamp-2 leading-relaxed">
                  {it.description}
                </p>
              </div>

              {/* Status Timeline Pill */}
              <div className="pt-2 flex flex-wrap items-center gap-1.5 text-[11px]">
                <span className="font-bold text-slate-500">Status:</span>
                <span className="px-2 py-0.5 rounded-md bg-slate-100 dark:bg-slate-800 text-slate-700 dark:text-slate-300 font-semibold uppercase text-[10px]">
                  {it.status.replace(/_/g, ' ')}
                </span>
                {it.official_id && (
                  <span className="px-2 py-0.5 rounded-md bg-teal-100 dark:bg-teal-950 text-teal-800 dark:text-teal-300 font-bold text-[10px]">
                    ID: {it.official_id}
                  </span>
                )}
              </div>
            </div>

            <div className="pt-3 border-t border-slate-100 dark:border-slate-800 flex items-center justify-between text-xs">
              <span className="flex items-center gap-1 text-slate-500">
                <MapPin className="w-3.5 h-3.5 text-mustard-600" />
                {it.place_name}
              </span>

              {it.type === 'found' && (
                <button
                  onClick={() => {
                    setSelectedItemForClaim(it);
                    setClaimForm(prev => ({ ...prev, official_id: it.official_id || it.id }));
                    setShowClaimModal(true);
                  }}
                  className="px-3 py-1.5 rounded-xl bg-teal-600 hover:bg-teal-700 text-white font-medium text-xs transition"
                >
                  Claim Item
                </button>
              )}
            </div>
          </div>
        ))}
      </div>

      {/* Report Modal */}
      {showReportModal && (
        <div className="fixed inset-0 z-[1000] bg-black/60 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="glass-panel w-full max-w-lg p-6 rounded-3xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 shadow-2xl space-y-4">
            <div className="flex items-center justify-between pb-3 border-b border-slate-200 dark:border-slate-800">
              <h3 className="font-serif text-xl font-bold text-slate-900 dark:text-white">
                Log a Lost or Found Item
              </h3>
              <button onClick={() => setShowReportModal(false)} className="text-slate-400 hover:text-slate-600">
                <X className="w-5 h-5" />
              </button>
            </div>

            <form onSubmit={handleReportSubmit} className="space-y-3 text-xs">
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="font-bold block mb-1">Type</label>
                  <select
                    value={reportForm.type}
                    onChange={(e) => setReportForm({ ...reportForm, type: e.target.value })}
                    className="w-full p-2 rounded-xl bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700"
                  >
                    <option value="found">Found Item (To Handover)</option>
                    <option value="lost">Lost Item</option>
                  </select>
                </div>
                <div>
                  <label className="font-bold block mb-1">Category</label>
                  <select
                    value={reportForm.category}
                    onChange={(e) => setReportForm({ ...reportForm, category: e.target.value })}
                    className="w-full p-2 rounded-xl bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700"
                  >
                    <option value="Valuables/Electronics">Electronics / Phone</option>
                    <option value="Wallet/Purse">Wallet / ID Cards</option>
                    <option value="Bags/Luggage">Bag / Backpack</option>
                    <option value="Jewelry/Watch">Jewelry / Watch</option>
                    <option value="Other">Other</option>
                  </select>
                </div>
              </div>

              <div>
                <label className="font-bold block mb-1">Item Title</label>
                <input
                  type="text"
                  required
                  placeholder="e.g. Black leather wallet with metro card"
                  value={reportForm.title}
                  onChange={(e) => setReportForm({ ...reportForm, title: e.target.value })}
                  className="w-full p-2 rounded-xl bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700"
                />
              </div>

              <div>
                <label className="font-bold block mb-1">Description (20-600 chars)</label>
                <textarea
                  rows="3"
                  required
                  placeholder="Describe general location and appearance without exposing sensitive private details."
                  value={reportForm.description}
                  onChange={(e) => setReportForm({ ...reportForm, description: e.target.value })}
                  className="w-full p-2 rounded-xl bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700"
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="font-bold block mb-1">Location Found/Lost</label>
                  <input
                    type="text"
                    required
                    placeholder="e.g. Promenade Beach near Gandhi Statue"
                    value={reportForm.place_name}
                    onChange={(e) => setReportForm({ ...reportForm, place_name: e.target.value })}
                    className="w-full p-2 rounded-xl bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700"
                  />
                </div>
                <div>
                  <label className="font-bold block mb-1">Your Phone or Email</label>
                  <input
                    type="text"
                    required
                    placeholder="Will never be shown publicly"
                    value={reportForm.reporter_contact}
                    onChange={(e) => setReportForm({ ...reportForm, reporter_contact: e.target.value })}
                    className="w-full p-2 rounded-xl bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700"
                  />
                </div>
              </div>

              <div className="pt-2 flex justify-end gap-2">
                <button
                  type="button"
                  onClick={() => setShowReportModal(false)}
                  className="px-4 py-2 rounded-xl border border-slate-200 dark:border-slate-700 font-semibold"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="px-5 py-2 rounded-xl bg-mustard-600 hover:bg-mustard-700 text-white font-bold shadow"
                >
                  Submit Report
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Claim Modal */}
      {showClaimModal && (
        <div className="fixed inset-0 z-[1000] bg-black/60 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="glass-panel w-full max-w-lg p-6 rounded-3xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 shadow-2xl space-y-4">
            <div className="flex items-center justify-between pb-3 border-b border-slate-200 dark:border-slate-800">
              <h3 className="font-serif text-xl font-bold text-slate-900 dark:text-white">
                Submit Ownership Claim
              </h3>
              <button onClick={() => setShowClaimModal(false)} className="text-slate-400 hover:text-slate-600">
                <X className="w-5 h-5" />
              </button>
            </div>

            <div className="p-3 bg-amber-50 dark:bg-amber-950/40 border border-amber-200 dark:border-amber-800 rounded-2xl text-xs text-amber-900 dark:text-amber-200">
              ⚠️ <strong>Police Verification Notice:</strong> The item will be released only after in-person verification with a valid government ID at the assigned Police Station.
            </div>

            <form onSubmit={handleClaimSubmit} className="space-y-3 text-xs">
              <div>
                <label className="font-bold block mb-1">Official Item ID</label>
                <input
                  type="text"
                  readOnly
                  value={claimForm.official_id}
                  className="w-full p-2 rounded-xl bg-slate-100 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 font-bold"
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="font-bold block mb-1">Full Legal Name</label>
                  <input
                    type="text"
                    required
                    placeholder="As shown on ID"
                    value={claimForm.claimant_name}
                    onChange={(e) => setClaimForm({ ...claimForm, claimant_name: e.target.value })}
                    className="w-full p-2 rounded-xl bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700"
                  />
                </div>
                <div>
                  <label className="font-bold block mb-1">Phone Number</label>
                  <input
                    type="text"
                    required
                    placeholder="+91..."
                    value={claimForm.claimant_contact}
                    onChange={(e) => setClaimForm({ ...claimForm, claimant_contact: e.target.value })}
                    className="w-full p-2 rounded-xl bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700"
                  />
                </div>
              </div>

              <div>
                <label className="font-bold block mb-1">Unique Distinguishing Features</label>
                <textarea
                  rows="3"
                  required
                  placeholder="Mention markings, lock screen wallpapers, card names, or internal contents only the true owner would know."
                  value={claimForm.claim_description}
                  onChange={(e) => setClaimForm({ ...claimForm, claim_description: e.target.value })}
                  className="w-full p-2 rounded-xl bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700"
                />
              </div>

              <div className="pt-2 flex justify-end gap-2">
                <button
                  type="button"
                  onClick={() => setShowClaimModal(false)}
                  className="px-4 py-2 rounded-xl border border-slate-200 dark:border-slate-700 font-semibold"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="px-5 py-2 rounded-xl bg-teal-600 hover:bg-teal-700 text-white font-bold shadow"
                >
                  Submit Formal Claim
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Police Desk Modal */}
      {showPoliceDeskModal && (
        <div className="fixed inset-0 z-[1000] bg-black/60 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="glass-panel w-full max-w-2xl p-6 rounded-3xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 shadow-2xl space-y-4 max-h-[85vh] overflow-y-auto">
            <div className="flex items-center justify-between pb-3 border-b border-slate-200 dark:border-slate-800">
              <div className="flex items-center space-x-2">
                <Shield className="w-5 h-5 text-teal-600" />
                <h3 className="font-serif text-xl font-bold text-slate-900 dark:text-white">
                  Puducherry Police Station Desk
                </h3>
              </div>
              <button onClick={() => setShowPoliceDeskModal(false)} className="text-slate-400 hover:text-slate-600">
                <X className="w-5 h-5" />
              </button>
            </div>

            {!isPoliceAuthorized ? (
              <div className="space-y-3 p-4 bg-slate-50 dark:bg-slate-800 rounded-2xl text-xs">
                <span className="font-bold block">Officer Authentication (Demo Passcode: pondy2026)</span>
                <input
                  type="password"
                  placeholder="Enter passcode"
                  value={policePassword}
                  onChange={(e) => setPolicePassword(e.target.value)}
                  className="w-full p-2 rounded-xl border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-900"
                />
                <button
                  onClick={loadPoliceDesk}
                  className="px-4 py-2 bg-teal-600 hover:bg-teal-700 text-white rounded-xl font-bold"
                >
                  Access Desk
                </button>
              </div>
            ) : (
              <div className="space-y-6 text-xs">
                {/* Issue Official ID */}
                <div className="p-4 bg-slate-50 dark:bg-slate-800 rounded-2xl space-y-2">
                  <span className="font-bold text-sm block">1. Confirm Physical Handover & Issue Official ID</span>
                  <form onSubmit={handlePoliceReceive} className="flex gap-2">
                    <input
                      type="text"
                      placeholder="Enter Temporary Ref (e.g. LF-TEMP-XXXX)"
                      value={tempHandoverRef}
                      onChange={(e) => setTempHandoverRef(e.target.value)}
                      className="flex-1 p-2 rounded-xl border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-900 font-bold"
                    />
                    <button
                      type="submit"
                      className="px-4 py-2 bg-mustard-600 hover:bg-mustard-700 text-white font-bold rounded-xl"
                    >
                      Issue Official ID
                    </button>
                  </form>
                </div>

                {/* Review Claims */}
                <div className="space-y-3">
                  <span className="font-bold text-sm block">2. In-Person Claims & Investigation</span>
                  {policeClaims.length === 0 ? (
                    <p className="text-slate-500">No pending claims logged yet.</p>
                  ) : (
                    policeClaims.map(cl => (
                      <div key={cl.id} className="p-4 border border-slate-200 dark:border-slate-800 rounded-2xl space-y-2 bg-white dark:bg-slate-900">
                        <div className="flex justify-between font-bold">
                          <span>{cl.item_title} (ID: {cl.official_id})</span>
                          <span className="uppercase text-mustard-600">{cl.status.replace(/_/g, ' ')}</span>
                        </div>
                        <p className="text-slate-600 dark:text-slate-300">
                          <strong>Claimant:</strong> {cl.claimant_name} ({cl.claimant_contact})
                        </p>
                        <p className="text-slate-600 dark:text-slate-300">
                          <strong>Proof statement:</strong> {cl.claim_description}
                        </p>
                        <div className="pt-2 flex gap-2">
                          <button
                            onClick={() => handlePoliceStatusUpdate(cl.id, 'under_investigation')}
                            className="px-3 py-1 rounded-lg bg-amber-500 text-white font-bold"
                          >
                            Mark Under Investigation
                          </button>
                          <button
                            onClick={() => handlePoliceStatusUpdate(cl.id, 'verified_and_released')}
                            className="px-3 py-1 rounded-lg bg-leaf-600 text-white font-bold"
                          >
                            Verify & Release to Owner
                          </button>
                          <button
                            onClick={() => handlePoliceStatusUpdate(cl.id, 'claim_rejected')}
                            className="px-3 py-1 rounded-lg bg-red-600 text-white font-bold"
                          >
                            Reject Claim
                          </button>
                        </div>
                      </div>
                    ))
                  )}
                </div>
              </div>
            )}
          </div>
        </div>
      )}
    </div>
  );
}
