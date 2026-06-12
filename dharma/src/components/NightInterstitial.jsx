import MandalaBg from './svgs/MandalaBg';

export default function NightInterstitial({ onClose }) {
  return (
    <div className="fixed inset-0 z-[100] flex items-center justify-center" style={{ background: '#080810' }}>
      <div className="absolute inset-0 flex items-center justify-center opacity-8 pointer-events-none">
        <MandalaBg size={500} color="#C9A961" opacity={1} />
      </div>

      <div className="relative z-10 text-center max-w-xs px-8">
        <div className="text-5xl mb-6">🌙</div>

        <div className="font-dev text-2xl text-[#C9A961] mb-1">रात्रि शयनम्</div>
        <p className="text-[11px] text-white/25 tracking-widest uppercase mb-6">Night rest</p>

        <p className="font-verse italic text-white/60 text-base leading-8 mb-8">
          "It is past your sleep target.<br />
          Close the app and rest.<br />
          Krishna will be here tomorrow."
        </p>

        <button
          onClick={onClose}
          className="px-10 py-3 rounded-2xl font-medium text-sm transition-all"
          style={{ border: '1px solid rgba(201,169,97,0.3)', color: '#C9A961' }}
        >
          Close
        </button>
      </div>
    </div>
  );
}
