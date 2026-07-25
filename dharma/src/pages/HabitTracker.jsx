import { Link } from 'react-router-dom';
import { ArrowLeft } from 'lucide-react';
import MonthlyTracker from '../components/MonthlyTracker';

export default function HabitTracker() {
  return (
    <div className="min-h-screen bg-[#070a14] p-4 md:p-8 space-y-6 text-white">
      <div className="max-w-7xl mx-auto space-y-6">
        <div className="flex items-center justify-between bg-[#0f1428]/80 p-4 rounded-2xl border border-white/10 shadow-lg">
          <Link
            to="/home"
            className="flex items-center gap-2 px-3.5 py-1.5 rounded-xl bg-white/5 border border-white/10 text-xs font-bold text-stone-300 hover:text-[#E8843C] hover:bg-white/10 transition-all active:scale-95"
          >
            <ArrowLeft size={16} /> Back to Today
          </Link>
          <div className="text-right">
            <h1 className="text-lg font-extrabold text-white">Habit & Health Matrix</h1>
            <p className="text-xs text-stone-400">Unified monthly focus & health dashboard</p>
          </div>
        </div>

        <MonthlyTracker />
      </div>
    </div>
  );
}
