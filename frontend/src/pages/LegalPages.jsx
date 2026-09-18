import React from 'react';
import { Shield, Lock, ShieldCheck, AlertTriangle, Users } from 'lucide-react';

export const TermsPage = () => (
  <div className="max-w-4xl mx-auto px-4 py-10">
    <div className="glass-panel p-8 rounded-3xl border border-slate-800 space-y-6">
      <div className="flex items-center gap-3 text-rose-500 pb-4 border-b border-slate-800">
        <Shield className="w-7 h-7" />
        <h1 className="text-2xl font-extrabold text-white">Terms & Conditions</h1>
      </div>
      <div className="space-y-4 text-sm text-slate-300 leading-relaxed">
        <p className="font-bold text-white text-base">Strict 18+ Age Requirement Policy</p>
        <p>This platform is exclusively intended for adults aged 18 years or older. Anyone under the age of 18 is strictly prohibited from registering or accessing any part of the service.</p>

        <p className="font-bold text-white text-base">User Conduct & Zero Tolerance Policy</p>
        <p>Users agree to communicate respectfully. Harassment, hate speech, financial fraud, impersonation, or distributing non-consensual imagery will result in an immediate and permanent account ban.</p>

        <p className="font-bold text-white text-base">Free Service Guarantee</p>
        <p>All core features—including messaging, voice calling, video calling, and place-based matching—are 100% free. The platform contains zero paid subscriptions, coins, virtual gifts, or wallets.</p>
      </div>
    </div>
  </div>
);

export const PrivacyPolicyPage = () => (
  <div className="max-w-4xl mx-auto px-4 py-10">
    <div className="glass-panel p-8 rounded-3xl border border-slate-800 space-y-6">
      <div className="flex items-center gap-3 text-rose-500 pb-4 border-b border-slate-800">
        <Lock className="w-7 h-7" />
        <h1 className="text-2xl font-extrabold text-white">Privacy Policy & Data Minimization</h1>
      </div>
      <div className="space-y-4 text-sm text-slate-300 leading-relaxed">
        <p className="font-bold text-white text-base">Minimal Personal Data Collection</p>
        <p>We do not request or store your email address, phone number, real full name, exact home address, social media profiles, or exact GPS location coordinates.</p>

        <p className="font-bold text-white text-base">End-to-End Encryption (E2EE)</p>
        <p>All 1-on-1 private chat messages are encrypted locally using the browser's native Web Crypto API. The server only relays ciphertexts and never possesses your private encryption keys.</p>

        <p className="font-bold text-white text-base">No Call or Audio/Video Recording</p>
        <p>WebRTC voice and video media streams flow directly peer-to-peer. We do not store, record, or monitor call media content under any circumstances.</p>
      </div>
    </div>
  </div>
);

export const SafetyPage = () => (
  <div className="max-w-4xl mx-auto px-4 py-10">
    <div className="glass-panel p-8 rounded-3xl border border-slate-800 space-y-6">
      <div className="flex items-center gap-3 text-emerald-400 pb-4 border-b border-slate-800">
        <ShieldCheck className="w-7 h-7" />
        <h1 className="text-2xl font-extrabold text-white">Community Safety Advice</h1>
      </div>
      <div className="space-y-4 text-sm text-slate-300 leading-relaxed">
        <div className="p-4 rounded-2xl bg-amber-500/10 border border-amber-500/20 text-amber-300 text-xs flex items-center gap-3">
          <AlertTriangle className="w-6 h-6 flex-shrink-0" />
          <span>Never share passwords, OTPs, banking information, exact home addresses, or financial transfers with strangers.</span>
        </div>
        <ul className="list-disc list-inside space-y-2 pt-2">
          <li>Keep your personal contact details confidential until trust is established.</li>
          <li>Use the built-in Block and Report features immediately if you encounter abusive behavior or suspect an underage user.</li>
          <li>Report suspicious financial requests or scams to platform moderators.</li>
        </ul>
      </div>
    </div>
  </div>
);

export const CommunityGuidelinesPage = () => (
  <div className="max-w-4xl mx-auto px-4 py-10">
    <div className="glass-panel p-8 rounded-3xl border border-slate-800 space-y-6">
      <div className="flex items-center gap-3 text-amber-400 pb-4 border-b border-slate-800">
        <Users className="w-7 h-7" />
        <h1 className="text-2xl font-extrabold text-white">Community Guidelines</h1>
      </div>
      <div className="space-y-4 text-sm text-slate-300 leading-relaxed">
        <p>Our goal is to provide a safe, respectful, and private environment for consenting 18+ adults to connect.</p>
        <ul className="list-disc list-inside space-y-2">
          <li>Respect boundaries and privacy choices of other members.</li>
          <li>No harassment, intimidation, or hate speech allowed.</li>
          <li>Commercial advertising, spam, and financial scams are strictly forbidden.</li>
        </ul>
      </div>
    </div>
  </div>
);
