import { Sparkles, MapPin, Search, ArrowRight, UserPlus, Check, Tag, ArrowDownAZ, Activity, Users as UsersIcon } from 'lucide-react';
import { motion } from 'motion/react';
import { useMemo, useState } from 'react';
import { cn } from '@/lib/utils';
import { useApp } from '@/store/AppContext';
import { showToast } from './Toast';
import Dropdown from './Dropdown';

const FEATURED = {
  name: 'Elena Vance',
  bio: '"Finding beauty in the concrete jungle and rainy nights. Let\'s talk about lens flares."',
  tags: ['#StreetPhotography', '98% Match'],
  image:
    'https://lh3.googleusercontent.com/aida-public/AB6AXuACPqozM_yP7S9aWSRdvMG-TmMsdBUr5yBU8DSn1klkHRc0qNS2DZn2bbDR5ulFZkeBqeBaTZNmDizpyyy8RgW2ZOvRNY9d7yyMTfFcivaf1qLm3tOGGmRmfXfrGxRnMH_ITGX-8Eg8glDrA1Xg-5uPQs-ASzNJvYgjLXYyZstnONpKCgzTMyPOOfH3w3amuDbpfB1vI1oLxIWSQKHGE-nicSYaYa8LmEBEl5f997_GmyWBZk0IXDzlgq52CNTGB9xlknjNmubyxdUE',
  id: 'elena-v',
};

const PEOPLE = [
  {
    id: 'marcus',
    name: 'Marcus Chen',
    interests: 'Dark Academia, Vinyl',
    active: true,
    avatar:
      'https://lh3.googleusercontent.com/aida-public/AB6AXuC-PuVcwlvklLM3U_J7OIRxzVYSxSxpr2fLbxjjxGnLjD-e8AFW2OjwCUwqSGUnvytyCMuLKJHlGURWekjFdwtHU2RjjRH-Au65Kt5qgxP7O0j1p67VPh7X1EjKTuBFO6rCZinUTx0D8PD3JYlDJvKBqHXmmxCU_GCaOktaMIw3XmemzgLTqv28dMlx1Ne1opy1q-9JORfM3OjhpMbO0D78-cppBwLgJEDJXNoF_TlbAhZpQTFq06QVWUD9O3h_oDmde1USP51YJviv',
  },
  {
    id: 'sarah',
    name: 'Sarah Jenkins',
    interests: 'Mindfulness, Coding',
    avatar:
      'https://lh3.googleusercontent.com/aida-public/AB6AXuCPKNjGnrWWgulTNeZaZ3HF2BWaA5ZKS7nuSTW8YWlIBvdDSk0dFvxyUqmra_kWmmK4uPTAWlc_kr5yF8rA7hZJ7phiey35P6wPZwxkjv56AZI4G2ZjHLZvmR2A-1vJBfdQ2F3UoCCw2leEnR6w9oKi5Zgh9_ermlItPyDezQ_pJ9tq-__H3b9dJK_Oj9wptWYAS_sHpgMHDtPJXUe',
  },
];

const COMMUNITY = [
  {
    id: 'david',
    name: 'David K.',
    role: 'System Architect',
    location: 'Berlin',
    tags: ['Architecture', 'Minimalism', 'Jazz'],
    activity: 'High',
    mutuals: '4 Connections',
    mutualsCount: 4,
    avatar:
      'https://lh3.googleusercontent.com/aida-public/AB6AXuDM7NOFZeHS9FV4vUYnENrV0h12aA-Jix5OSfp8QdmoltyO1XzHPMe3fUAyKGOomkQB2TMOdwZHxWdC3u4Dl4nZPey7N0s4gAuLouKqSq3Ar_JHmRRTVikyNV4MhvN76kovN_Z9edlYGll-4IkuHBBZ_JZX_rHJ5mL6J97CfKHyLu4rU6oS_EUrOEHVdVOxLuDImeopejnv4wPnVdsAANAAMqIwAJCXctrB1Zj_qANBf6tl0kBpp4BDvp44WT-ZY4LFdAs0lpEjWnV1',
    cover:
      'https://lh3.googleusercontent.com/aida-public/AB6AXuA0dVBZ3HD_-cWBlniWBwKqLBzHLd8Xaa1od1BpTv1Y9-vYi3MfnyqRqKUr2lVjO8oE09AeOgJTtb54selG0hpciTWJKVKjeQYLXllGSbOe0gZvLaRr4GGfWIbdAPdPISYGkrlEZDQrv131bzGdk4vMPdx1kgA4xeskKMXIH4G0XoKTdfoTzLl7XSgM-S74lwxb0xYHPVE-DPJ_tB1iavM7jPIRn4szlNQd7uUXB3p7mSs6iP2N__opm5ieFY1_BFUsbkQBKie0gJ6e',
  },
  {
    id: 'sophie',
    name: 'Sophie Miller',
    role: 'UI/UX Designer',
    location: 'Tokyo',
    tags: ['Design Systems', 'Japan', 'Sourdough'],
    activity: 'Medium',
    mutuals: '8 Connections',
    mutualsCount: 8,
    avatar:
      'https://lh3.googleusercontent.com/aida-public/AB6AXuAAnoevwg5_PKxxg3oWaCOq7gFIMEn_HrR2aQWN5pQrkigyaDmE5zs6P2xJ_eIMCXNs8_9cYceZmERmnu0IMq7HbJXr8JgZS_XNG31CDuhw3TMbCNwv5CDFALuskjU0IgkCK2ii2oQDCTtTpSc1THlNj7XW9zPlWvM6vmjRwztn1cBv294LNTMO0tyx1D540XY8MgcGHyXOOtGRHkDIOBjlWX40lvJtQaX3AMQkarFLP3aBbtM7chqJ8dAGY09RQ7OxMlBpDBuspN6F',
    cover:
      'https://lh3.googleusercontent.com/aida-public/AB6AXuDyMqFYgUpk5OXjfbC9yJlXCecUOtVlOR7f5TMd5rS91MfqprkhSu25oetdGIW2AwuyPOSxDv46JUTrtuc4DeZ-jht5QabGdD2OFC0t8XhgnS98_oCbqfQ13PX7Gc6yB820SYr7qAzskG8XyOc2KwAE2Femz-sfcud_4RVkgKVu4HqcArPJUwZEEf57FE1U75tbVkG_umTxpa0Kg0gQhQ51XinRuUSdgnZiQtS8DAHksAZbrZK_V9TIgad1WftaLMxip7WItLnzl3pB',
  },
  {
    id: 'liam',
    name: 'Liam Thorne',
    role: 'Adventure Writer',
    location: 'London',
    tags: ['Hiking', 'Espresso', 'Vinyl'],
    activity: 'High',
    mutuals: '12 Connections',
    mutualsCount: 12,
    avatar:
      'https://lh3.googleusercontent.com/aida-public/AB6AXuBXfcaL3Pn9PaakQbKP7yjrUQ401x8bql9I-ATU_Mg3ZHqAEKGnXbXxA5jk7sg6doODM_8MG_UPzXa5n7WoAysQUeJ_XbxovnpC7I-xEKnysikitAb4YOPJdXNYZa2xGEFQ_IZvyO3GVuPW_OmSpgk9BcEfDejEgsAGzx_jMudFJnjgqiD_6PraH7qMbYMbyDwCnYaDXlUMZO2Ee2wT-bv7c51f7IvhvxiceFjpItWbAEBxym4DB1ruYQXJMcerLFl2vTKKt3buX5-R',
    cover:
      'https://lh3.googleusercontent.com/aida-public/AB6AXuAyzcI6LesqacYkAU4_Kzlrp-aGqiV6wKCTTED7mTHeNgOn7m1GH4oQ3nGgJdckfc53fe4F85uycVEUsoJ3alFVdaCXiek_E-Ejq8WDvCWX2UIRYpdkMzMi9Xx-O6gF0ym9pkLXjUwI3CqT_0aQ6xy1ToEnbTSp1u0eHAvjUf5g_b0dFqd3m30PcDGiY4Cc3mDx3DBNhYpKD7NA5GGacUhElQo7ZhUvExJBTVBOiDAURr6TMXRIcDYgGhuWW_S3bnmSgMnW9FcRLNJV',
  },
];

type Sort = 'activity' | 'mutuals' | 'name';

export default function Discover() {
  const { state, dispatch } = useApp();
  const [query, setQuery] = useState('');
  const [sort, setSort] = useState<Sort>('activity');
  const [filterTag, setFilterTag] = useState<string | null>(null);

  const allTags = useMemo(() => Array.from(new Set(COMMUNITY.flatMap((c) => c.tags))), []);

  const filteredCommunity = useMemo(() => {
    let list = COMMUNITY.slice();
    if (query.trim()) {
      const q = query.toLowerCase();
      list = list.filter(
        (p) =>
          p.name.toLowerCase().includes(q) ||
          p.role.toLowerCase().includes(q) ||
          p.location.toLowerCase().includes(q) ||
          p.tags.some((t) => t.toLowerCase().includes(q))
      );
    }
    if (filterTag) list = list.filter((p) => p.tags.includes(filterTag));
    list.sort((a, b) => {
      if (sort === 'activity')
        return (b.activity === 'High' ? 2 : b.activity === 'Medium' ? 1 : 0) - (a.activity === 'High' ? 2 : a.activity === 'Medium' ? 1 : 0);
      if (sort === 'mutuals') return b.mutualsCount - a.mutualsCount;
      return a.name.localeCompare(b.name);
    });
    return list;
  }, [query, sort, filterTag]);

  const isConnected = (id: string) => state.connections.includes(id);
  const toggle = (id: string, name: string) => {
    dispatch({ type: 'TOGGLE_CONNECT', userId: id });
    showToast(isConnected(id) ? `Removed ${name}` : `Connected with ${name}`);
  };

  return (
    <div className="space-y-10 pb-12">
      <div className="relative group max-w-2xl">
        <Search size={18} className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-500 group-focus-within:text-primary transition-colors" />
        <input
          value={query}
          onChange={(e) => setQuery(e.target.value)}
          type="text"
          placeholder="Search for common souls, interests, or places..."
          className="w-full bg-[#1d2023] border border-white/5 rounded-full py-3 pl-12 pr-6 text-sm focus:ring-1 focus:ring-primary outline-none transition-all"
        />
      </div>

      <header className="space-y-2">
        <h1 className="text-4xl font-bold text-white tracking-tight">Discover</h1>
        <p className="text-slate-400">Deep connections forged through shared experiences. Find your reflection in the noise.</p>
      </header>

      <section className="space-y-6">
        <div className="flex items-center justify-between">
          <h2 className="text-xl font-bold text-white flex items-center gap-2">
            <Sparkles size={20} className="text-primary fill-primary" />
            People Like You
          </h2>
          <button className="text-primary text-xs font-bold uppercase tracking-wider hover:underline">View All</button>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-4 grid-rows-2 gap-4 h-auto md:h-[500px]">
          <motion.div
            whileHover={{ scale: 1.01 }}
            className="md:col-span-2 md:row-span-2 glass-card rounded-2xl p-8 relative overflow-hidden flex flex-col justify-end group cursor-pointer"
          >
            <div className="absolute inset-0 z-0">
              <img
                src={FEATURED.image}
                className="w-full h-full object-cover opacity-60 group-hover:scale-105 transition-transform duration-700"
                alt="Featured profile"
              />
              <div className="absolute inset-0 bg-gradient-to-t from-[#0b0e11] via-[#0b0e11]/30 to-transparent" />
            </div>
            <div className="relative z-10 space-y-4">
              <div className="flex gap-2">
                {FEATURED.tags.map((tag) => (
                  <span
                    key={tag}
                    className="bg-primary/20 text-primary px-3 py-1 rounded-full text-[10px] font-bold backdrop-blur-md border border-primary/20"
                  >
                    {tag}
                  </span>
                ))}
              </div>
              <div>
                <h3 className="text-2xl font-bold text-white">{FEATURED.name}</h3>
                <p className="text-slate-300 text-sm italic">{FEATURED.bio}</p>
              </div>
              <button
                onClick={() => toggle(FEATURED.id, FEATURED.name)}
                className={cn(
                  'w-full font-bold py-3 rounded-xl transition-all active:scale-95',
                  isConnected(FEATURED.id)
                    ? 'bg-emerald-500/20 text-emerald-400 border border-emerald-500/30'
                    : 'bg-primary text-[#002b73] hover:bg-white'
                )}
              >
                {isConnected(FEATURED.id) ? 'Connected ✓' : 'Connect'}
              </button>
            </div>
          </motion.div>

          {PEOPLE.map((person) => (
            <motion.div
              key={person.id}
              whileHover={{ y: -5 }}
              className="glass-card rounded-2xl p-5 flex flex-col justify-between group transition-all"
            >
              <div className="flex justify-between items-start">
                <div className="w-12 h-12 rounded-full overflow-hidden border-2 border-primary/20 p-0.5">
                  <img src={person.avatar} className="w-full h-full object-cover rounded-full" alt={person.name} />
                </div>
                {person.active && (
                  <span className="text-[10px] font-bold text-primary flex items-center gap-1.5 uppercase tracking-wider">
                    <span className="w-1.5 h-1.5 rounded-full bg-primary animate-pulse" /> Active Now
                  </span>
                )}
              </div>
              <div className="space-y-2">
                <div>
                  <h4 className="text-white font-bold">{person.name}</h4>
                  <p className="text-slate-400 text-[11px] uppercase tracking-wider font-bold">Shared: {person.interests}</p>
                </div>
                <button
                  onClick={() => toggle(person.id, person.name)}
                  className={cn(
                    'w-full text-[10px] font-bold uppercase tracking-widest py-2 rounded-lg transition-all',
                    isConnected(person.id)
                      ? 'bg-emerald-500/15 text-emerald-400 border border-emerald-500/20'
                      : 'bg-white/5 text-white hover:bg-primary hover:text-[#002b73]'
                  )}
                >
                  {isConnected(person.id) ? 'Following' : 'Connect'}
                </button>
              </div>
            </motion.div>
          ))}

          <motion.div
            whileHover={{ y: -5 }}
            className="md:col-span-2 glass-card rounded-2xl p-5 flex items-center gap-4 bg-gradient-to-r from-primary/10 to-transparent group cursor-pointer"
            onClick={() => showToast('Joined Zen Coders circle')}
          >
            <div className="flex -space-x-3">
              {[1, 2, 3].map((n) => (
                <div key={n} className="w-10 h-10 rounded-full border-2 border-[#15191C] overflow-hidden bg-slate-800" />
              ))}
              <div className="w-10 h-10 rounded-full border-2 border-[#15191C] overflow-hidden flex items-center justify-center bg-[#272a2e] text-[10px] text-white font-bold">+12</div>
            </div>
            <div>
              <p className="text-white font-bold text-sm">Join the "Zen Coders" circle</p>
              <p className="text-slate-400 text-xs">5 new people joined today based on your tags</p>
            </div>
            <ArrowRight size={18} className="ml-auto text-primary group-hover:translate-x-1 transition-transform" />
          </motion.div>
        </div>
      </section>

      <section className="space-y-6">
        <div className="flex items-center justify-between flex-wrap gap-3">
          <h2 className="text-xl font-bold text-white">Explore Community</h2>
          <div className="flex gap-2 flex-wrap">
            <Dropdown
              value={filterTag ?? ''}
              onChange={(v) => setFilterTag(v || null)}
              size="sm"
              align="right"
              options={[
                { value: '', label: 'All tags', icon: Tag },
                ...allTags.map((t) => ({ value: t, label: t, icon: Tag })),
              ]}
            />
            <Dropdown
              value={sort}
              onChange={(v) => setSort(v as Sort)}
              size="sm"
              align="right"
              options={[
                { value: 'activity', label: 'By activity', icon: Activity },
                { value: 'mutuals', label: 'By mutuals', icon: UsersIcon },
                { value: 'name', label: 'By name', icon: ArrowDownAZ },
              ]}
            />
          </div>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          {filteredCommunity.length === 0 ? (
            <div className="md:col-span-3 glass-card rounded-2xl p-12 text-center text-slate-500">
              No matches. Adjust your filters.
            </div>
          ) : (
            filteredCommunity.map((person) => (
              <motion.div
                key={person.id}
                layout
                whileHover={{ y: -5 }}
                className="glass-card rounded-3xl overflow-hidden group border border-white/5 flex flex-col"
              >
                <div className="h-32 relative">
                  <img src={person.cover} className="w-full h-full object-cover opacity-40" alt="Cover" />
                  <div className="absolute inset-0 bg-gradient-to-t from-[#15191C] to-transparent" />
                  <div className="absolute -bottom-8 left-6 w-16 h-16 rounded-2xl overflow-hidden border-4 border-[#111417] bg-[#1d2023] shadow-xl">
                    <img src={person.avatar} className="w-full h-full object-cover" alt={person.name} />
                  </div>
                </div>
                <div className="pt-10 p-6 flex flex-col flex-1">
                  <div className="mb-4">
                    <h3 className="text-lg font-bold text-white">{person.name}</h3>
                    <p className="text-slate-400 text-xs flex items-center gap-1">
                      <span className="font-semibold">{person.role}</span>
                      <span className="text-slate-600">•</span>
                      <MapPin size={10} className="text-slate-500" />
                      <span>{person.location}</span>
                    </p>
                  </div>

                  <div className="flex flex-wrap gap-1.5 mb-6">
                    {person.tags.map((tag) => (
                      <button
                        key={tag}
                        onClick={() => setFilterTag(tag)}
                        className="bg-white/5 text-slate-300 px-2 py-0.5 rounded text-[10px] font-bold border border-white/10 hover:border-primary/40 hover:text-primary transition-colors"
                      >
                        {tag}
                      </button>
                    ))}
                  </div>

                  <div className="mt-auto pt-4 border-t border-white/5 flex items-center justify-between">
                    <div className="flex flex-col">
                      <span className="text-slate-600 uppercase text-[9px] font-black tracking-tighter">Activity</span>
                      <span className={cn('text-[10px] font-bold uppercase', person.activity === 'High' ? 'text-primary' : 'text-tertiary')}>
                        {person.activity}
                      </span>
                    </div>
                    <div className="flex flex-col items-end">
                      <span className="text-slate-600 uppercase text-[9px] font-black tracking-tighter">Mutuals</span>
                      <span className="text-white text-[10px] font-bold uppercase">{person.mutuals}</span>
                    </div>
                  </div>

                  <button
                    onClick={() => toggle(person.id, person.name)}
                    className={cn(
                      'mt-5 w-full py-2 rounded-xl text-xs font-bold transition-all flex items-center justify-center gap-2 uppercase tracking-widest',
                      isConnected(person.id)
                        ? 'bg-emerald-500/15 text-emerald-400 border border-emerald-500/30'
                        : 'bg-white/5 text-white hover:bg-primary hover:text-[#002b73]'
                    )}
                  >
                    {isConnected(person.id) ? (
                      <>
                        <Check size={14} /> Connected
                      </>
                    ) : (
                      <>
                        <UserPlus size={14} /> Connect
                      </>
                    )}
                  </button>
                </div>
              </motion.div>
            ))
          )}
        </div>
      </section>
    </div>
  );
}
