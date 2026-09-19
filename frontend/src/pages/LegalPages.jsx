import React from 'react';
import { Link, useLocation } from 'react-router-dom';
import {
  Shield,
  Lock,
  ShieldCheck,
  AlertTriangle,
  Users,
  FileText,
  EyeOff,
  Key,
  CheckCircle2,
  AlertOctagon,
  Scale,
  Database,
  Smartphone,
  HelpCircle,
  HeartHandshake,
  ArrowLeft,
  Sparkles,
  Server,
  UserX,
  MessageSquare,
  Zap,
  Globe,
  Trash2,
  PhoneCall,
  Check,
  ExternalLink
} from 'lucide-react';

const LegalHeader = ({ title, subtitle, icon: Icon, badgeText }) => (
  <div className="relative overflow-hidden rounded-3xl bg-gradient-to-r from-slate-900 via-[#131927] to-slate-900 border border-slate-800 p-6 md:p-10 mb-8 shadow-2xl">
    <div className="absolute top-0 right-0 -mt-10 -mr-10 w-60 h-60 bg-rose-500/10 rounded-full blur-3xl pointer-events-none" />
    <div className="flex flex-col md:flex-row md:items-center justify-between gap-6 relative z-10">
      <div className="space-y-3">
        <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-rose-500/10 border border-rose-500/20 text-rose-400 text-xs font-semibold uppercase tracking-wider">
          <Sparkles className="w-3.5 h-3.5" />
          <span>{badgeText || "Aura Official Legal Document"}</span>
        </div>
        <h1 className="text-3xl md:text-4xl font-black text-white tracking-tight flex items-center gap-3">
          <Icon className="w-8 h-8 md:w-10 md:h-10 text-rose-500 flex-shrink-0" />
          <span>{title}</span>
        </h1>
        <p className="text-slate-400 text-sm md:text-base max-w-2xl leading-relaxed">{subtitle}</p>
      </div>
      <div className="flex flex-col items-start md:items-end gap-1 text-xs text-slate-400 border-t md:border-t-0 md:border-l border-slate-800/80 pt-4 md:pt-0 md:pl-8 flex-shrink-0">
        <span className="font-semibold text-slate-300">Effective Date:</span>
        <span className="text-rose-400 font-bold">September 19, 2026</span>
        <span className="text-slate-500 mt-1">Version 2.4 (E2EE Privacy Standard)</span>
      </div>
    </div>
  </div>
);

const LegalNav = () => {
  const location = useLocation();
  const tabs = [
    { path: '/terms', label: 'Terms & Conditions', icon: Shield },
    { path: '/privacy', label: 'Privacy Policy', icon: Lock },
    { path: '/safety', label: 'Safety Advice', icon: ShieldCheck },
    { path: '/community-guidelines', label: 'Community Rules', icon: Users },
  ];

  return (
    <div className="mb-8 space-y-4">
      <Link 
        to="/" 
        className="inline-flex items-center gap-2 text-xs font-bold text-slate-400 hover:text-rose-400 transition-colors group"
      >
        <ArrowLeft className="w-4 h-4 group-hover:-translate-x-1 transition-transform" />
        <span>Return to Platform</span>
      </Link>

      <div className="flex flex-wrap items-center justify-center gap-2 p-2 rounded-2xl bg-slate-950/80 border border-slate-800/80 backdrop-blur-md">
        {tabs.map((tab) => {
          const Icon = tab.icon;
          const isActive = location.pathname === tab.path;
          return (
            <Link
              key={tab.path}
              to={tab.path}
              className={`flex items-center gap-2 px-4 py-2.5 rounded-xl text-xs md:text-sm font-bold transition-all duration-200 ${
                isActive
                  ? 'bg-rose-600 text-white shadow-lg shadow-rose-600/30 scale-[1.02]'
                  : 'text-slate-400 hover:text-slate-200 hover:bg-slate-900/60'
              }`}
            >
              <Icon className="w-4 h-4" />
              <span>{tab.label}</span>
            </Link>
          );
        })}
      </div>
    </div>
  );
};

export const TermsPage = () => (
  <div className="max-w-5xl mx-auto px-4 py-10">
    <LegalNav />
    
    <LegalHeader 
      title="Terms & Conditions"
      subtitle="Comprehensive legal rules, user obligations, zero-tolerance policies, and service terms governing the use of the Aura platform."
      icon={Shield}
      badgeText="User Agreement & Service Contract"
    />

    {/* Highlights Banner */}
    <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-8">
      <div className="glass-panel p-5 rounded-2xl border border-rose-500/20 bg-rose-500/5 flex items-start gap-4">
        <AlertOctagon className="w-6 h-6 text-rose-500 flex-shrink-0 mt-1" />
        <div>
          <h4 className="font-bold text-white text-sm">Strict 18+ Adult Policy</h4>
          <p className="text-slate-400 text-xs mt-1">Underage access is strictly forbidden. Age declaration is legally binding.</p>
        </div>
      </div>
      <div className="glass-panel p-5 rounded-2xl border border-amber-500/20 bg-amber-500/5 flex items-start gap-4">
        <UserX className="w-6 h-6 text-amber-400 flex-shrink-0 mt-1" />
        <div>
          <h4 className="font-bold text-white text-sm">Zero Tolerance Conduct</h4>
          <p className="text-slate-400 text-xs mt-1">Harassment, hate speech, scams, and non-consensual content cause immediate bans.</p>
        </div>
      </div>
      <div className="glass-panel p-5 rounded-2xl border border-emerald-500/20 bg-emerald-500/5 flex items-start gap-4">
        <Zap className="w-6 h-6 text-emerald-400 flex-shrink-0 mt-1" />
        <div>
          <h4 className="font-bold text-white text-sm">100% Free Service Guarantee</h4>
          <p className="text-slate-400 text-xs mt-1">Zero subscriptions, paywalls, virtual coins, or hidden microtransactions.</p>
        </div>
      </div>
    </div>

    {/* Main Terms Content */}
    <div className="space-y-6">
      
      {/* Section 1 */}
      <section className="glass-panel p-6 md:p-8 rounded-3xl border border-slate-800 space-y-4">
        <div className="flex items-center gap-3 text-rose-500 pb-3 border-b border-slate-800/80">
          <Scale className="w-6 h-6" />
          <h2 className="text-xl font-extrabold text-white">1. Acceptance of Terms & Eligibility</h2>
        </div>
        <div className="space-y-3 text-sm text-slate-300 leading-relaxed">
          <p>
            By registering, logging in, or browsing the <strong>Aura</strong> platform ("Service"), you confirm that you have read, understood, and legally agree to be bound by these Terms & Conditions and our Privacy Policy. If you do not agree to these terms, you must immediately cease accessing the platform.
          </p>
          <div className="p-4 rounded-2xl bg-slate-900/80 border border-slate-800 space-y-2">
            <h4 className="text-white font-bold text-sm flex items-center gap-2">
              <CheckCircle2 className="w-4 h-4 text-rose-400" />
              Strict Age Requirement (18+)
            </h4>
            <p className="text-xs text-slate-400">
              This platform is exclusively designed for consenting adults aged <strong>18 years or older</strong> (or the legal age of majority in your jurisdiction). Anyone under 18 years of age is strictly prohibited from creating an account or accessing any feature. Falsifying your age is a direct breach of contract and will result in permanent termination of your profile.
            </p>
          </div>
        </div>
      </section>

      {/* Section 2 */}
      <section className="glass-panel p-6 md:p-8 rounded-3xl border border-slate-800 space-y-4">
        <div className="flex items-center gap-3 text-rose-500 pb-3 border-b border-slate-800/80">
          <Key className="w-6 h-6" />
          <h2 className="text-xl font-extrabold text-white">2. Anonymous Accounts & Security Responsibilities</h2>
        </div>
        <div className="space-y-3 text-sm text-slate-300 leading-relaxed">
          <p>
            Aura promotes user privacy and anonymity. You are not required to provide real legal names or government identification documents during standard registration.
          </p>
          <ul className="list-disc list-inside space-y-2 text-slate-300 pl-2">
            <li><strong>Credential Confidentiality:</strong> You are solely responsible for keeping your password, login tokens, and local encryption keypairs secure.</li>
            <li><strong>Account Non-Transferability:</strong> You may not sell, lease, transfer, or share your account with any third party.</li>
            <li><strong>Unauthorized Access:</strong> You agree to notify platform support immediately if you suspect unauthorized access or compromise of your credentials.</li>
          </ul>
        </div>
      </section>

      {/* Section 3 */}
      <section className="glass-panel p-6 md:p-8 rounded-3xl border border-slate-800 space-y-4">
        <div className="flex items-center gap-3 text-rose-500 pb-3 border-b border-slate-800/80">
          <AlertOctagon className="w-6 h-6" />
          <h2 className="text-xl font-extrabold text-white">3. User Conduct & Zero-Tolerance Safety Rules</h2>
        </div>
        <div className="space-y-3 text-sm text-slate-300 leading-relaxed">
          <p>
            To maintain a safe, welcoming, and adult environment, users must treat all members with respect. Aura enforces a strict <strong>Zero Tolerance Policy</strong> against bad actors.
          </p>
          
          <div className="grid grid-cols-1 md:grid-cols-2 gap-3 pt-2">
            <div className="p-4 rounded-2xl bg-slate-900/60 border border-slate-800">
              <h4 className="text-rose-400 font-bold text-xs uppercase tracking-wider mb-1">Strictly Prohibited Behavior</h4>
              <ul className="space-y-1.5 text-xs text-slate-300">
                <li className="flex items-center gap-2"><span className="w-1.5 h-1.5 rounded-full bg-rose-500" /> Harassment, intimidation, hate speech, or stalking</li>
                <li className="flex items-center gap-2"><span className="w-1.5 h-1.5 rounded-full bg-rose-500" /> Non-consensual explicit images or extortion</li>
                <li className="flex items-center gap-2"><span className="w-1.5 h-1.5 rounded-full bg-rose-500" /> Financial solicitations, money scams, crypto traps</li>
                <li className="flex items-center gap-2"><span className="w-1.5 h-1.5 rounded-full bg-rose-500" /> Impersonation of other persons or public figures</li>
              </ul>
            </div>

            <div className="p-4 rounded-2xl bg-slate-900/60 border border-slate-800">
              <h4 className="text-amber-400 font-bold text-xs uppercase tracking-wider mb-1">Technical Abuse Restrictions</h4>
              <ul className="space-y-1.5 text-xs text-slate-300">
                <li className="flex items-center gap-2"><span className="w-1.5 h-1.5 rounded-full bg-amber-400" /> Automated bots, scrapers, or spamming scripts</li>
                <li className="flex items-center gap-2"><span className="w-1.5 h-1.5 rounded-full bg-amber-400" /> Reverse-engineering API or WebRTC protocols</li>
                <li className="flex items-center gap-2"><span className="w-1.5 h-1.5 rounded-full bg-amber-400" /> Overwhelming servers via Denial-of-Service attacks</li>
                <li className="flex items-center gap-2"><span className="w-1.5 h-1.5 rounded-full bg-amber-400" /> Exploiting software vulnerabilities for gain</li>
              </ul>
            </div>
          </div>
        </div>
      </section>

      {/* Section 4 */}
      <section className="glass-panel p-6 md:p-8 rounded-3xl border border-slate-800 space-y-4">
        <div className="flex items-center gap-3 text-rose-500 pb-3 border-b border-slate-800/80">
          <Zap className="w-6 h-6" />
          <h2 className="text-xl font-extrabold text-white">4. 100% Free Core Features Guarantee</h2>
        </div>
        <div className="space-y-3 text-sm text-slate-300 leading-relaxed">
          <p>
            Aura is committed to transparent, accessible communication. All primary platform features—including profile creation, place-based matching, end-to-end encrypted messaging, voice calls, and video calls—are <strong>100% free</strong>.
          </p>
          <p className="text-xs text-slate-400">
            We do not sell paid messaging passes, hidden subscriptions, gift coins, or paywalled match queues. You will never be asked to input credit card details to talk to matches on Aura.
          </p>
        </div>
      </section>

      {/* Section 5 */}
      <section className="glass-panel p-6 md:p-8 rounded-3xl border border-slate-800 space-y-4">
        <div className="flex items-center gap-3 text-rose-500 pb-3 border-b border-slate-800/80">
          <FileText className="w-6 h-6" />
          <h2 className="text-xl font-extrabold text-white">5. Content Ownership & License</h2>
        </div>
        <div className="space-y-3 text-sm text-slate-300 leading-relaxed">
          <p>
            You retain all ownership rights to the profile pictures, bio text, and user content you upload to Aura.
          </p>
          <p>
            By uploading content, you grant Aura a non-exclusive, worldwide, royalty-free license solely to host, transmit, compress, and display your public profile content for the purpose of operating the matching service. You warrant that all uploaded content is original or that you hold appropriate permissions to share it.
          </p>
        </div>
      </section>

      {/* Section 6 */}
      <section className="glass-panel p-6 md:p-8 rounded-3xl border border-slate-800 space-y-4">
        <div className="flex items-center gap-3 text-rose-500 pb-3 border-b border-slate-800/80">
          <ShieldCheck className="w-6 h-6" />
          <h2 className="text-xl font-extrabold text-white">6. Moderation, Bans & Liability Disclaimer</h2>
        </div>
        <div className="space-y-3 text-sm text-slate-300 leading-relaxed">
          <p>
            Aura administrators reserve the right to investigate community reports, block violating accounts, or permanently delete profiles that compromise platform integrity.
          </p>
          <div className="p-4 rounded-2xl bg-amber-500/10 border border-amber-500/20 text-amber-300 text-xs space-y-2">
            <h4 className="font-bold text-amber-200 text-sm flex items-center gap-2">
              <AlertTriangle className="w-4 h-4 text-amber-400" />
              Disclaimer of Off-Platform Interactions
            </h4>
            <p>
              Aura does not perform criminal background checks on registered users. You are solely responsible for your interactions with other members, both online and in real-world meetings. Aura disclaims all liability for any loss, damage, or harm resulting from off-platform communication or physical dates.
            </p>
          </div>
        </div>
      </section>

    </div>
  </div>
);

export const PrivacyPolicyPage = () => (
  <div className="max-w-5xl mx-auto px-4 py-10">
    <LegalNav />
    
    <LegalHeader 
      title="Privacy Policy & Security"
      subtitle="Detailed overview of our data minimization architecture, client-side zero-knowledge end-to-end encryption (E2EE), WebRTC peer streams, and user data rights."
      icon={Lock}
      badgeText="Data Protection & Encryption Standard"
    />

    {/* Highlights Banner */}
    <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-8">
      <div className="glass-panel p-5 rounded-2xl border border-rose-500/20 bg-rose-500/5 flex items-start gap-4">
        <EyeOff className="w-6 h-6 text-rose-500 flex-shrink-0 mt-1" />
        <div>
          <h4 className="font-bold text-white text-sm">Data Minimization</h4>
          <p className="text-slate-400 text-xs mt-1">No real names, phone numbers, exact addresses, or government IDs required.</p>
        </div>
      </div>
      <div className="glass-panel p-5 rounded-2xl border border-emerald-500/20 bg-emerald-500/5 flex items-start gap-4">
        <Key className="w-6 h-6 text-emerald-400 flex-shrink-0 mt-1" />
        <div>
          <h4 className="font-bold text-white text-sm">Client E2EE Encryption</h4>
          <p className="text-slate-400 text-xs mt-1">Chat messages are encrypted locally using W3C WebCrypto (AES-256-GCM).</p>
        </div>
      </div>
      <div className="glass-panel p-5 rounded-2xl border border-sky-500/20 bg-sky-500/5 flex items-start gap-4">
        <PhoneCall className="w-6 h-6 text-sky-400 flex-shrink-0 mt-1" />
        <div>
          <h4 className="font-bold text-white text-sm">Peer-to-Peer WebRTC</h4>
          <p className="text-slate-400 text-xs mt-1">Voice & video media streams flow directly between peers with zero recording.</p>
        </div>
      </div>
    </div>

    {/* Main Privacy Policy Content */}
    <div className="space-y-6">

      {/* Section 1 */}
      <section className="glass-panel p-6 md:p-8 rounded-3xl border border-slate-800 space-y-4">
        <div className="flex items-center gap-3 text-rose-500 pb-3 border-b border-slate-800/80">
          <EyeOff className="w-6 h-6" />
          <h2 className="text-xl font-extrabold text-white">1. Core Privacy Philosophy: Data Minimization</h2>
        </div>
        <div className="space-y-3 text-sm text-slate-300 leading-relaxed">
          <p>
            At <strong>Aura</strong>, privacy is not a setting—it is the foundational architecture of our product. We collect only the minimum data required to facilitate anonymous adult dating and real-time social connection.
          </p>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4 pt-2">
            <div className="p-4 rounded-2xl bg-emerald-950/20 border border-emerald-500/20 space-y-2">
              <h4 className="text-emerald-400 font-bold text-xs uppercase tracking-wider flex items-center gap-2">
                <Check className="w-4 h-4" /> Information We Store
              </h4>
              <ul className="space-y-1.5 text-xs text-slate-300">
                <li>• Self-selected Username / Handle</li>
                <li>• Hashed Passwords (bcrypt salt rounds)</li>
                <li>• Age (18+) & Gender Preferences</li>
                <li>• Selected City / Area (for matching)</li>
                <li>• Optional Bio & Profile Photos</li>
              </ul>
            </div>

            <div className="p-4 rounded-2xl bg-rose-950/20 border border-rose-500/20 space-y-2">
              <h4 className="text-rose-400 font-bold text-xs uppercase tracking-wider flex items-center gap-2">
                <UserX className="w-4 h-4" /> What We NEVER Collect
              </h4>
              <ul className="space-y-1.5 text-xs text-slate-300">
                <li>• Government IDs or Passport scans</li>
                <li>• Mobile Phone Numbers or SIM IDs</li>
                <li>• Real Full Legal Names or Addresses</li>
                <li>• Exact GPS coordinate tracking log</li>
                <li>• Contact lists or social media links</li>
              </ul>
            </div>
          </div>
        </div>
      </section>

      {/* Section 2 */}
      <section className="glass-panel p-6 md:p-8 rounded-3xl border border-slate-800 space-y-4">
        <div className="flex items-center gap-3 text-rose-500 pb-3 border-b border-slate-800/80">
          <Key className="w-6 h-6" />
          <h2 className="text-xl font-extrabold text-white">2. Zero-Knowledge End-to-End Encryption (E2EE)</h2>
        </div>
        <div className="space-y-3 text-sm text-slate-300 leading-relaxed">
          <p>
            Private 1-on-1 messages sent over Aura are protected using client-side <strong>End-to-End Encryption</strong> powered by the browser's native <code>Web Crypto API</code> (AES-256-GCM and RSA-OAEP key exchange).
          </p>
          
          <div className="p-4 rounded-2xl bg-slate-900/80 border border-slate-800 space-y-2 text-xs">
            <h4 className="text-white font-bold text-sm flex items-center gap-2">
              <Server className="w-4 h-4 text-rose-400" />
              How Zero-Knowledge Relaying Works
            </h4>
            <ol className="list-decimal list-inside space-y-1.5 text-slate-400">
              <li><strong>Local Encryption:</strong> Your message text is converted into ciphertext directly inside your web browser using your recipient's public key.</li>
              <li><strong>Relay Only:</strong> The server receives only encrypted ciphertext payload blobs. Server memory and databases cannot decrypt this content.</li>
              <li><strong>Local Decryption:</strong> Only the recipient's private key (stored locally in their browser) can unlock and read the plaintext message.</li>
            </ol>
          </div>
        </div>
      </section>

      {/* Section 3 */}
      <section className="glass-panel p-6 md:p-8 rounded-3xl border border-slate-800 space-y-4">
        <div className="flex items-center gap-3 text-rose-500 pb-3 border-b border-slate-800/80">
          <PhoneCall className="w-6 h-6" />
          <h2 className="text-xl font-extrabold text-white">3. WebRTC Voice & Video Call Privacy</h2>
        </div>
        <div className="space-y-3 text-sm text-slate-300 leading-relaxed">
          <p>
            Voice calls and video calls on Aura utilize the open <strong>WebRTC (Web Real-Time Communication)</strong> protocol secured with DTLS-SRTP encryption.
          </p>
          <ul className="list-disc list-inside space-y-2 text-slate-300 pl-2">
            <li><strong>Peer-to-Peer Transport:</strong> Media streams flow directly between participants' devices whenever network topology permits.</li>
            <li><strong>Zero Call Recording:</strong> We do not record, monitor, store, or analyze call audio or video data under any circumstance.</li>
            <li><strong>NAT Traversal:</strong> STUN/TURN servers are used solely to establish connection routes when firewalls prevent direct peer connection. Media packets passing through TURN relays remain encrypted.</li>
          </ul>
        </div>
      </section>

      {/* Section 4 */}
      <section className="glass-panel p-6 md:p-8 rounded-3xl border border-slate-800 space-y-4">
        <div className="flex items-center gap-3 text-rose-500 pb-3 border-b border-slate-800/80">
          <Database className="w-6 h-6" />
          <h2 className="text-xl font-extrabold text-white">4. Storage, Cookies & Session Tokens</h2>
        </div>
        <div className="space-y-3 text-sm text-slate-300 leading-relaxed">
          <p>
            We use browser <code>localStorage</code> and secure JSON Web Tokens (JWT) strictly for session management and keypair persistence.
          </p>
          <p className="text-xs text-slate-400">
            Aura contains zero third-party advertising tracking scripts, no Meta Pixel, no Google Ads trackers, and no data brokerage SDKs. We do not sell or monetize your browsing history or preferences.
          </p>
        </div>
      </section>

      {/* Section 5 */}
      <section className="glass-panel p-6 md:p-8 rounded-3xl border border-slate-800 space-y-4">
        <div className="flex items-center gap-3 text-rose-500 pb-3 border-b border-slate-800/80">
          <Trash2 className="w-6 h-6" />
          <h2 className="text-xl font-extrabold text-white">5. Account Deletion & Right to be Forgotten</h2>
        </div>
        <div className="space-y-3 text-sm text-slate-300 leading-relaxed">
          <p>
            You hold total authority over your data. You may trigger an instant account deletion directly inside your Profile Settings.
          </p>
          <p className="text-xs text-slate-400">
            Upon triggering account deletion, your profile, photos, matches, preferences, and stored encrypted payloads are permanently purged from our active databases immediately.
          </p>
        </div>
      </section>

    </div>
  </div>
);

export const SafetyPage = () => (
  <div className="max-w-5xl mx-auto px-4 py-10">
    <LegalNav />
    
    <LegalHeader 
      title="Community Safety Advice"
      subtitle="Essential advice, dating safety tips, scam prevention guidelines, and tools to protect yourself online and in person."
      icon={ShieldCheck}
      badgeText="Safety Guidelines & Best Practices"
    />

    <div className="space-y-6">
      
      {/* Critical Alert Box */}
      <div className="p-6 rounded-3xl bg-amber-500/10 border border-amber-500/20 text-amber-200 space-y-3">
        <div className="flex items-center gap-3 text-amber-400 font-bold text-lg">
          <AlertTriangle className="w-6 h-6 flex-shrink-0" />
          <span>Golden Safety Rule: Protect Your Financial & Personal Security</span>
        </div>
        <p className="text-xs md:text-sm text-amber-200/90 leading-relaxed">
          Never send money, cryptocurrency, bank details, credit card numbers, or OTP verification codes to anyone you meet online. Scammers often construct elaborate emotional stories to request financial aid. Report suspicious requests instantly.
        </p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        
        <div className="glass-panel p-6 rounded-3xl border border-slate-800 space-y-3">
          <h3 className="text-white font-bold text-base flex items-center gap-2">
            <Lock className="w-5 h-5 text-rose-400" />
            1. Keep Personal Info Confidential
          </h3>
          <p className="text-slate-400 text-xs leading-relaxed">
            Do not share your exact home address, workplace name, daily schedule, or financial status early in conversations. Keep communications on the platform until trust is established.
          </p>
        </div>

        <div className="glass-panel p-6 rounded-3xl border border-slate-800 space-y-3">
          <h3 className="text-white font-bold text-base flex items-center gap-2">
            <PhoneCall className="w-5 h-5 text-rose-400" />
            2. Utilize Video Calls First
          </h3>
          <p className="text-slate-400 text-xs leading-relaxed">
            Before meeting in person, use our built-in E2EE voice or video call feature to verify that your match is authentic and matches their profile photos.
          </p>
        </div>

        <div className="glass-panel p-6 rounded-3xl border border-slate-800 space-y-3">
          <h3 className="text-white font-bold text-base flex items-center gap-2">
            <Globe className="w-5 h-5 text-rose-400" />
            3. In-Person Meeting Safety
          </h3>
          <p className="text-slate-400 text-xs leading-relaxed">
            Always meet in well-lit, public locations (such as cafes, restaurants, or parks). Tell a friend or family member where you are going and arrange your own transportation.
          </p>
        </div>

        <div className="glass-panel p-6 rounded-3xl border border-slate-800 space-y-3">
          <h3 className="text-white font-bold text-base flex items-center gap-2">
            <UserX className="w-5 h-5 text-rose-400" />
            4. Block & Report Instantly
          </h3>
          <p className="text-slate-400 text-xs leading-relaxed">
            If a user exhibits abusive behavior, uses aggressive language, or makes you feel uncomfortable, use the in-app Block and Report options immediately.
          </p>
        </div>

      </div>
    </div>
  </div>
);

export const CommunityGuidelinesPage = () => (
  <div className="max-w-5xl mx-auto px-4 py-10">
    <LegalNav />
    
    <LegalHeader 
      title="Community Guidelines"
      subtitle="The core values, standards of respect, and community rules designed to ensure a positive experience for all members."
      icon={Users}
      badgeText="Community Standards & Integrity"
    />

    <div className="space-y-6">
      
      <div className="glass-panel p-6 md:p-8 rounded-3xl border border-slate-800 space-y-4">
        <div className="flex items-center gap-3 text-rose-500 pb-3 border-b border-slate-800/80">
          <HeartHandshake className="w-6 h-6" />
          <h2 className="text-xl font-extrabold text-white">Our Community Core Values</h2>
        </div>
        
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4 pt-2">
          <div className="p-4 rounded-2xl bg-slate-900/60 border border-slate-800 space-y-1">
            <h4 className="text-white font-bold text-sm">Mutual Consent & Boundaries</h4>
            <p className="text-xs text-slate-400">Respect other members' personal boundaries. Consent must be clear, ongoing, and mutual in all interactions.</p>
          </div>

          <div className="p-4 rounded-2xl bg-slate-900/60 border border-slate-800 space-y-1">
            <h4 className="text-white font-bold text-sm">Authenticity & Truthfulness</h4>
            <p className="text-xs text-slate-400">Be real. Use genuine profile photos and accurate age details. Catfishing or misrepresentation harms trust.</p>
          </div>

          <div className="p-4 rounded-2xl bg-slate-900/60 border border-slate-800 space-y-1">
            <h4 className="text-white font-bold text-sm">Zero Commercial Exploitation</h4>
            <p className="text-xs text-slate-400">Aura is for dating and meeting people. Commercial promotion, selling products, or advertising social channels is prohibited.</p>
          </div>

          <div className="p-4 rounded-2xl bg-slate-900/60 border border-slate-800 space-y-1">
            <h4 className="text-white font-bold text-sm">Kindness & Inclusivity</h4>
            <p className="text-xs text-slate-400">We welcome consenting adults of all backgrounds. Hate speech, racism, or discrimination will result in immediate bans.</p>
          </div>
        </div>
      </div>

    </div>
  </div>
);

export default TermsPage;
