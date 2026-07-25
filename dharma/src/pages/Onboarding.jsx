import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import {
  Sparkles, ArrowRight, Play, Heart, BookOpen, Users,
  Flame, Sun, CheckCircle, ChevronRight, MessageCircle, ShieldCheck
} from 'lucide-react';

export default function Onboarding({ onComplete }) {
  const navigate = useNavigate();

  function handleStart() {
    onComplete();
    navigate('/home');
  }

  return (
    <div className="min-h-screen bg-[#FAF6F0] text-[#18191E] dark:bg-[#12141F] dark:text-[#F5F3EF] selection:bg-[#EF5A34] selection:text-white overflow-x-hidden">

      {/* ── Top Header Navigation ──────────────────────────────────── */}
      <header className="max-w-7xl mx-auto px-6 py-6 flex items-center justify-between">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-2xl bg-gradient-to-tr from-[#EF5A34] to-[#E6A04E] flex items-center justify-center text-white font-bold text-xl shadow-lg">
            ॐ
          </div>
          <span className="font-extrabold text-xl tracking-tight text-[#18191E] dark:text-white">
            Dharma <span className="text-[#EF5A34] font-normal text-sm">Practice</span>
          </span>
        </div>

        <nav className="hidden md:flex items-center gap-8 text-sm font-semibold text-[#18191E]/70 dark:text-white/70">
          <a href="#hero" className="hover:text-[#EF5A34] transition-colors">Overview</a>
          <a href="#movement" className="hover:text-[#EF5A34] transition-colors">Movement</a>
          <a href="#initiatives" className="hover:text-[#EF5A34] transition-colors">Initiatives</a>
          <a href="#events" className="hover:text-[#EF5A34] transition-colors">Events</a>
        </nav>

        <div className="flex items-center gap-3">
          <button
            onClick={handleStart}
            className="btn-coral text-xs sm:text-sm shadow-xl flex items-center gap-2"
          >
            Join us for free <ArrowRight size={15} />
          </button>
        </div>
      </header>

      {/* ── Hero Section (Matching Reference Image 1) ───────────────── */}
      <section id="hero" className="max-w-7xl mx-auto px-6 pt-10 pb-16">
        <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-8 mb-12">
          <div className="max-w-2xl">
            <h1 className="text-4xl sm:text-6xl font-black text-[#18191E] dark:text-white tracking-tight leading-[1.1] mb-4">
              Have you ever <br />
              <span className="text-[#EF5A34]">felt overwhelmed</span>
            </h1>
            <p className="text-base sm:text-lg text-[#18191E]/70 dark:text-white/70 font-medium leading-relaxed max-w-xl">
              Let's join our daily program — through the wisdom of the Bhagavad Gita, we guide seekers toward inner peace, focus, and spiritual strength.
            </p>
          </div>

          <div className="flex flex-col items-start sm:items-end gap-3 shrink-0">
            <div className="flex items-center gap-3 bg-white dark:bg-white/5 p-2 pr-4 rounded-full border border-black/5 dark:border-white/10 shadow-sm">
              <div className="flex -space-x-2">
                <img className="w-8 h-8 rounded-full border-2 border-white object-cover" src="https://images.unsplash.com/photo-1534528741775-53994a69daeb?w=100" alt="Seeker" />
                <img className="w-8 h-8 rounded-full border-2 border-white object-cover" src="https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?w=100" alt="Seeker" />
                <img className="w-8 h-8 rounded-full border-2 border-white object-cover" src="https://images.unsplash.com/photo-1494790108377-be9c29b29330?w=100" alt="Seeker" />
              </div>
              <span className="text-xs font-bold text-[#18191E] dark:text-white">Over 5k+ People Changed Their Life</span>
            </div>

            <button
              onClick={handleStart}
              className="btn-coral text-sm shadow-xl flex items-center gap-2"
            >
              Join us for free <ArrowRight size={16} />
            </button>
          </div>
        </div>

        {/* Hero Media Grid (3 Cards matching Reference Image 1) */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          <div className="relative overflow-hidden rounded-3xl h-80 bg-stone-200 group shadow-lg">
            <img
              src="https://images.unsplash.com/photo-1544717305-2782549b5136?auto=format&fit=crop&w=800&q=80"
              alt="Wisdom teacher"
              className="w-full h-full object-cover transition-transform duration-700 group-hover:scale-105"
            />
            <div className="absolute inset-0 bg-gradient-to-t from-black/70 via-transparent to-transparent flex items-end p-6">
              <div className="text-white">
                <span className="text-xs font-bold text-[#E6A04E] uppercase tracking-wider">Guided Discourses</span>
                <h3 className="text-lg font-bold">Daily Gita Wisdom Sessions</h3>
              </div>
            </div>
          </div>

          <div className="relative overflow-hidden rounded-3xl h-80 bg-stone-200 group shadow-lg">
            <img
              src="https://images.unsplash.com/photo-1506126613408-eca07ce68773?auto=format&fit=crop&w=800&q=80"
              alt="Meditation practitioner"
              className="w-full h-full object-cover transition-transform duration-700 group-hover:scale-105"
            />
            <div className="absolute inset-0 bg-gradient-to-t from-black/70 via-transparent to-transparent flex items-end p-6">
              <div className="text-white">
                <span className="text-xs font-bold text-[#EF5A34] uppercase tracking-wider">Japa & Meditation</span>
                <h3 className="text-lg font-bold">Mindful Chanting & Sadhana</h3>
              </div>
            </div>
          </div>

          <div className="relative overflow-hidden rounded-3xl h-80 bg-stone-200 group shadow-lg">
            <img
              src="https://images.unsplash.com/photo-1532012197267-da84d127e765?auto=format&fit=crop&w=800&q=80"
              alt="Bhagavad Gita As It Is"
              className="w-full h-full object-cover transition-transform duration-700 group-hover:scale-105"
            />
            <div className="absolute inset-0 bg-gradient-to-t from-black/70 via-transparent to-transparent flex items-end p-6">
              <div className="text-white">
                <span className="text-xs font-bold text-[#C9A961] uppercase tracking-wider">Sacred Scripture</span>
                <h3 className="text-lg font-bold">Bhagavad Gita As It Is</h3>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* ── Animated Devanagari Running Watermark Marquee ───────────── */}
      <div className="py-6 overflow-hidden bg-[#FFEFEA] dark:bg-white/5 border-y border-[#EF5A34]/15">
        <div className="animate-marquee whitespace-nowrap text-xl sm:text-2xl font-dev font-bold text-[#EF5A34]/60 dark:text-[#EF5A34]/80 tracking-widest">
          <span>हरे कृष्ण हरे कृष्ण कृष्ण कृष्ण हरे हरे | हरे राम हरे राम राम राम हरे हरे &nbsp;&nbsp;&nbsp;•&nbsp;&nbsp;&nbsp; </span>
          <span>हरे कृष्ण हरे कृष्ण कृष्ण कृष्ण हरे हरे | हरे राम हरे राम राम राम हरे हरे &nbsp;&nbsp;&nbsp;•&nbsp;&nbsp;&nbsp; </span>
          <span>हरे कृष्ण हरे कृष्ण कृष्ण कृष्ण हरे हरे | हरे राम हरे राम राम राम हरे हरे &nbsp;&nbsp;&nbsp;•&nbsp;&nbsp;&nbsp; </span>
        </div>
      </div>

      {/* ── Dark Bento Contrast Section (Matching Reference Image 1) ── */}
      <section id="movement" className="max-w-7xl mx-auto px-6 py-16">
        <div className="rounded-3xl p-8 sm:p-12 bg-[#181925] text-white shadow-2xl space-y-8">
          <div className="flex flex-col md:flex-row md:items-center justify-between gap-6 border-b border-white/10 pb-8">
            <div>
              <div className="flex items-center gap-2 text-[#EF5A34] font-bold text-xs uppercase tracking-widest mb-2">
                <Sparkles size={14} /> The Hare Krishna Movement & Dharma
              </div>
              <h2 className="text-2xl sm:text-4xl font-extrabold tracking-tight">
                Spiritual Organization & Practice Hub
              </h2>
            </div>
            <p className="text-sm sm:text-base text-white/70 max-w-md leading-relaxed">
              Founded to provide human society an opportunity for a life of happiness, good health, and spiritual self-realization through authentic Gita wisdom.
            </p>
          </div>

          {/* Photo Collage inside Dark Card */}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-5">
            <div className="rounded-2xl overflow-hidden h-64 bg-white/5">
              <img src="https://images.unsplash.com/photo-1545232979-fbf34fe37b38?auto=format&fit=crop&w=800&q=80" alt="Spiritual leader" className="w-full h-full object-cover" />
            </div>
            <div className="rounded-2xl overflow-hidden h-64 bg-white/5">
              <img src="https://images.unsplash.com/photo-1609137144813-7d9921338f24?auto=format&fit=crop&w=800&q=80" alt="Deities" className="w-full h-full object-cover" />
            </div>
            <div className="rounded-2xl overflow-hidden h-64 bg-white/5">
              <img src="https://images.unsplash.com/photo-1511632765486-a01980e01a18?auto=format&fit=crop&w=800&q=80" alt="Kirtan gathering" className="w-full h-full object-cover" />
            </div>
          </div>
        </div>
      </section>

      {/* ── Spiritual Bento Cards (Matching Reference Image 2) ────────── */}
      <section id="initiatives" className="max-w-7xl mx-auto px-6 py-10 space-y-6">
        <div className="text-center max-w-xl mx-auto mb-10">
          <span className="text-xs font-bold text-[#EF5A34] uppercase tracking-widest">Our Core Initiatives</span>
          <h2 className="text-3xl font-extrabold text-[#18191E] dark:text-white mt-1">Serve & Practice Together</h2>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">

          {/* Card 1: Puja & Havankund (Matching Reference Image 2 Left) */}
          <div className="lg:col-span-5 rounded-3xl p-8 bg-[#FFF5F0] dark:bg-[#1f1b24] border border-[#EF5A34]/20 flex flex-col justify-between space-y-6 shadow-sm">
            <div className="space-y-3">
              <h3 className="text-2xl font-extrabold text-[#18191E] dark:text-white leading-tight">
                Celebrate your loved ones' Puja with us!
              </h3>
              <p className="text-xs text-[#18191E]/70 dark:text-white/70 leading-relaxed font-medium">
                With joining our aim of changing the world and fulfilling the desire of Srila Prabhupada, you will be proud of yourself and experience deep peace.
              </p>
              <div className="flex items-center gap-3 pt-2">
                <button onClick={handleStart} className="btn-coral text-xs">Book now</button>
                <button onClick={handleStart} className="btn-outline-dark text-xs flex items-center gap-1">Whatsapp ↗</button>
              </div>
            </div>

            {/* Havankund Fire Vector Art Graphic */}
            <div className="relative pt-4 flex justify-center">
              <div className="w-44 h-36 bg-gradient-to-t from-[#EF5A34]/20 to-transparent rounded-2xl flex items-center justify-center">
                <Flame size={70} className="text-[#EF5A34] animate-bounce" />
              </div>
            </div>
          </div>

          {/* Card 2 & Card 3 Right Stack (Matching Reference Image 2 Right) */}
          <div className="lg:col-span-7 space-y-6">

            {/* Card 2: Anna-daan Initiative */}
            <div className="rounded-3xl p-8 bg-[#F2F6FE] dark:bg-[#181c2b] border border-blue-200/30 flex flex-col sm:flex-row items-center justify-between gap-6 shadow-sm">
              <div className="space-y-3 max-w-md">
                <h3 className="text-xl font-extrabold text-[#18191E] dark:text-white">
                  Join Our Anna-daan initiative
                </h3>
                <p className="text-xs text-[#18191E]/70 dark:text-white/70 leading-relaxed font-medium">
                  Support sanctified prasadam distribution to thousands daily. Experience the bliss of feeding souls.
                </p>
                <div className="flex items-center gap-3 pt-1">
                  <button onClick={handleStart} className="btn-coral text-xs">Support us</button>
                  <button onClick={handleStart} className="btn-outline-dark text-xs">Tax Benefits ↗</button>
                </div>
              </div>

              {/* Prasadam Food Illustration */}
              <div className="w-32 h-32 rounded-full bg-orange-100 flex items-center justify-center shrink-0 shadow-inner">
                <Sun size={60} className="text-[#E6A04E]" />
              </div>
            </div>

            {/* Card 3: Online Spiritual Community */}
            <div className="rounded-3xl p-8 bg-[#FFFDF5] dark:bg-[#201d18] border border-amber-200/30 flex flex-col sm:flex-row items-center justify-between gap-6 shadow-sm">
              <div className="space-y-3 max-w-md">
                <h3 className="text-xl font-extrabold text-[#18191E] dark:text-white">
                  Join Our Online Spiritual Community
                </h3>
                <p className="text-xs text-[#18191E]/70 dark:text-white/70 leading-relaxed font-medium">
                  Connect with fellow seekers, track daily sadhana goals, and access authenticated Vedic wisdom anywhere.
                </p>
                <div className="flex items-center gap-3 pt-1">
                  <button onClick={handleStart} className="btn-coral text-xs">Register now</button>
                  <button onClick={handleStart} className="btn-outline-dark text-xs">Whatsapp ↗</button>
                </div>
              </div>

              {/* Flute Graphic */}
              <div className="w-32 h-32 rounded-3xl bg-amber-100/50 flex items-center justify-center shrink-0">
                <Sparkles size={50} className="text-[#C9A961]" />
              </div>
            </div>

          </div>

        </div>
      </section>

      {/* ── Upcoming Events Section ─────────────────────────────────── */}
      <section id="events" className="max-w-7xl mx-auto px-6 py-12">
        <div className="flex items-center justify-between mb-8">
          <div>
            <span className="text-xs font-bold text-[#EF5A34] uppercase tracking-widest">Calendar</span>
            <h2 className="text-2xl font-extrabold text-[#18191E] dark:text-white">Upcoming Festivals & Events</h2>
          </div>
          <button onClick={handleStart} className="text-xs font-bold text-[#EF5A34] hover:underline flex items-center gap-1">
            Explore all events <ChevronRight size={14} />
          </button>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
          {[
            { title: 'Sri Ram Navami', date: '6 April 2026', tag: 'Festival' },
            { title: 'Hanuman Jayanti', date: '12 April 2026', tag: 'Festival' },
            { title: 'Geeta Saar Live', date: '18 April 2026', tag: 'Discourse' },
            { title: 'Sri Krishna Janmashtami', date: '28 August 2026', tag: 'Grand Event' },
          ].map(e => (
            <div key={e.title} className="p-5 rounded-2xl bg-white dark:bg-white/5 border border-black/5 dark:border-white/10 shadow-sm flex flex-col justify-between space-y-4">
              <div>
                <span className="text-[10px] font-bold px-2 py-0.5 rounded-md bg-[#EF5A34]/10 text-[#EF5A34] uppercase">{e.tag}</span>
                <h4 className="text-base font-bold text-[#18191E] dark:text-white mt-2">{e.title}</h4>
              </div>
              <div className="flex items-center justify-between pt-2 border-t border-black/5 dark:border-white/5">
                <span className="text-xs text-stone-400 font-medium">{e.date}</span>
                <button onClick={handleStart} className="text-xs font-bold text-[#EF5A34]">View</button>
              </div>
            </div>
          ))}
        </div>
      </section>

      {/* ── Footer / CTA Section ───────────────────────────────────── */}
      <footer className="bg-[#181925] text-white pt-16 pb-12 mt-16 border-t border-white/10">
        <div className="max-w-7xl mx-auto px-6 grid grid-cols-1 lg:grid-cols-12 gap-8 mb-12">
          <div className="lg:col-span-5 space-y-4">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-2xl bg-gradient-to-tr from-[#EF5A34] to-[#E6A04E] flex items-center justify-center font-bold text-xl text-white">
                ॐ
              </div>
              <span className="text-xl font-extrabold">Dharma Practice</span>
            </div>
            <p className="text-xs text-white/60 leading-relaxed max-w-sm">
              Your personal spiritual companion for habit tracking, Bhagavad Gita wisdom, daily journaling, and mind discipline.
            </p>
          </div>

          <div className="lg:col-span-7 flex flex-col sm:flex-row items-center justify-between gap-4 p-6 rounded-3xl bg-white/5 border border-white/10">
            <div>
              <h4 className="text-base font-bold">Sign up for our newsletter</h4>
              <p className="text-xs text-white/50 mt-0.5">Stay updated with daily shlokas and event schedules.</p>
            </div>
            <div className="flex gap-2 w-full sm:w-auto">
              <input placeholder="Enter your email" className="px-3 py-2 text-xs bg-white/10 rounded-xl text-white outline-none border border-white/10" />
              <button onClick={handleStart} className="btn-coral text-xs shrink-0">Subscribe</button>
            </div>
          </div>
        </div>

        <div className="max-w-7xl mx-auto px-6 pt-6 border-t border-white/10 flex flex-col sm:flex-row items-center justify-between text-xs text-white/40">
          <p>© 2026 Dharma Practice. Built for spiritual seekers.</p>
          <div className="flex gap-4 mt-2 sm:mt-0">
            <button onClick={handleStart} className="hover:text-white">Privacy Policy</button>
            <button onClick={handleStart} className="hover:text-white">Terms of Service</button>
          </div>
        </div>
      </footer>

    </div>
  );
}
