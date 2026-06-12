import { useEffect, useState } from 'react';
import PeacockFeather from './svgs/PeacockFeather';
import MandalaBg from './svgs/MandalaBg';

const MILESTONE_VERSES = {
  30: { num: '३०', sanskrit: 'अभ्यासेन तु कौन्तेय', note: '30 days of standing on the battlefield.' },
  90: { num: '९०', sanskrit: 'युक्ताहारविहारस्य', note: '90 days. The body knows the rhythm now.' },
  180: { num: '१८०', sanskrit: 'उद्धरेदात्मनात्मानम्', note: '180 days. You have lifted yourself.' },
  365: { num: '३६५', sanskrit: 'यत्र योगेश्वरः कृष्णः', note: 'One full year as a yogi. यतो धर्मस्ततो जयः' },
};

export default function MilestoneScreen({ days, onClose }) {
  const [visible, setVisible] = useState(false);
  const milestone = MILESTONE_VERSES[days];

  useEffect(() => {
    setTimeout(() => setVisible(true), 50);
    const timer = setTimeout(() => {
      setVisible(false);
      setTimeout(onClose, 400);
    }, 6000);
    return () => clearTimeout(timer);
  }, []);

  if (!milestone) return null;

  return (
    <div
      className="fixed inset-0 z-[100] flex items-center justify-center"
      style={{
        backgroundColor: '#0F1429',
        opacity: visible ? 1 : 0,
        transition: 'opacity 0.4s ease-in-out',
      }}
    >
      <div className="absolute inset-0 flex items-center justify-center">
        <MandalaBg size={600} color="#C9A961" opacity={0.06} />
      </div>

      <div className="relative z-10 text-center px-8 max-w-sm">
        {/* Feathers */}
        <div className="flex justify-center gap-4 mb-6">
          <PeacockFeather size={80} animated />
          <PeacockFeather size={100} animated />
          <PeacockFeather size={80} animated />
        </div>

        {/* Day counter */}
        <div className="font-dev text-6xl text-gold mb-2">{milestone.num}</div>
        <div className="text-cream/40 text-sm tracking-widest uppercase mb-6">Days as a Yogi</div>

        {/* Verse */}
        <div className="font-dev text-xl text-gold/80 mb-4 leading-relaxed">
          {milestone.sanskrit}
        </div>

        {/* Note */}
        <p className="font-verse italic text-cream/60 text-base leading-relaxed">
          {milestone.note}
        </p>

        {/* Dismiss */}
        <button
          onClick={() => { setVisible(false); setTimeout(onClose, 400); }}
          className="mt-10 text-cream/30 text-xs hover:text-cream/60 transition-colors"
        >
          tap to continue
        </button>
      </div>
    </div>
  );
}
