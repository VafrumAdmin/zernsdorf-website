'use client';

import { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import {
  MessageCircle,
  Users,
  Heart,
  MessageSquare,
  Clock,
  TrendingUp,
  Plus,
  Search,
  Filter,
  ChevronRight,
  ThumbsUp,
  Share2,
  Bookmark,
  MoreHorizontal,
  AlertCircle,
  Calendar,
  MapPin,
  Package,
  HelpCircle,
  Megaphone,
} from 'lucide-react';

interface Post {
  id: string;
  author: {
    name: string;
    avatar: string;
    badge?: string;
  };
  category: string;
  title: string;
  content: string;
  timestamp: string;
  likes: number;
  comments: number;
  isLiked?: boolean;
  isPinned?: boolean;
}

interface Category {
  id: string;
  label: string;
  icon: React.ComponentType<{ className?: string }>;
  color: string;
  count: number;
}

const CATEGORIES: Category[] = [
  { id: 'all', label: 'Alle Beiträge', icon: MessageCircle, color: '#00d4ff', count: 47 },
  { id: 'announcements', label: 'Ankündigungen', icon: Megaphone, color: '#f43f5e', count: 5 },
  { id: 'events', label: 'Veranstaltungen', icon: Calendar, color: '#a855f7', count: 12 },
  { id: 'marketplace', label: 'Marktplatz', icon: Package, color: '#f59e0b', count: 18 },
  { id: 'help', label: 'Hilfe & Fragen', icon: HelpCircle, color: '#10b981', count: 8 },
  { id: 'general', label: 'Allgemein', icon: MessageSquare, color: '#71717a', count: 4 },
];

const MOCK_POSTS: Post[] = [
  {
    id: '1',
    author: { name: 'Gemeinde Zernsdorf', avatar: 'GZ', badge: 'Offiziell' },
    category: 'announcements',
    title: '650 Jahre Zernsdorf - Festwoche im Juni!',
    content: 'Liebe Zernsdorferinnen und Zernsdorfer, wir feiern dieses Jahr unser 650-jähriges Jubiläum! Vom 14.-16. Juni findet die große Festwoche statt. Programm folgt in Kürze.',
    timestamp: 'Vor 2 Stunden',
    likes: 89,
    comments: 23,
    isPinned: true,
  },
  {
    id: '2',
    author: { name: 'Marina K.', avatar: 'MK' },
    category: 'marketplace',
    title: 'Verschenke Gartenmöbel',
    content: 'Hallo zusammen! Wir haben einen 4er-Set Gartenstühle und einen Tisch abzugeben. Alles in gutem Zustand, nur Selbstabholung. Bei Interesse einfach melden!',
    timestamp: 'Vor 5 Stunden',
    likes: 12,
    comments: 8,
  },
  {
    id: '3',
    author: { name: 'Thomas B.', avatar: 'TB' },
    category: 'help',
    title: 'Suche Empfehlung für Elektriker',
    content: 'Kennt jemand einen zuverlässigen Elektriker in der Gegend? Brauche neue Steckdosen im Keller. Danke für jeden Tipp!',
    timestamp: 'Vor 8 Stunden',
    likes: 3,
    comments: 15,
  },
  {
    id: '4',
    author: { name: 'Sportverein Zernsdorf', avatar: 'SV', badge: 'Verein' },
    category: 'events',
    title: 'Sommerfest am Strandbad - 20. Juli',
    content: 'Der Sportverein lädt herzlich zum Sommerfest am Strandbad ein! Ab 14 Uhr gibt es Spiel und Spaß für die ganze Familie, Grillen und Live-Musik.',
    timestamp: 'Gestern',
    likes: 45,
    comments: 11,
  },
  {
    id: '5',
    author: { name: 'Petra M.', avatar: 'PM' },
    category: 'general',
    title: 'Wunderschöner Sonnenuntergang gestern!',
    content: 'Hat noch jemand den Sonnenuntergang über dem Lankensee gestern gesehen? Einfach traumhaft! Das ist der Grund warum ich Zernsdorf so liebe.',
    timestamp: 'Gestern',
    likes: 67,
    comments: 9,
  },
  {
    id: '6',
    author: { name: 'Frank H.', avatar: 'FH' },
    category: 'help',
    title: 'Fundsache: Schlüsselbund am Wanderweg',
    content: 'Habe heute Vormittag am Wanderweg zum See einen Schlüsselbund mit rotem Anhänger gefunden. Liegt bei mir - bitte melden wer ihn vermisst!',
    timestamp: 'Vor 2 Tagen',
    likes: 8,
    comments: 3,
  },
];

export default function CommunityPage() {
  const [selectedCategory, setSelectedCategory] = useState('all');
  const [searchQuery, setSearchQuery] = useState('');
  const [showNewPostHint, setShowNewPostHint] = useState(true);

  const filteredPosts = MOCK_POSTS.filter((post) => {
    if (selectedCategory !== 'all' && post.category !== selectedCategory) return false;
    if (searchQuery && !post.title.toLowerCase().includes(searchQuery.toLowerCase())) return false;
    return true;
  });

  const pinnedPosts = filteredPosts.filter((p) => p.isPinned);
  const regularPosts = filteredPosts.filter((p) => !p.isPinned);

  return (
    <div className="min-h-screen bg-[#050508] py-8">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        {/* Header */}
        <motion.div
          initial={{ opacity: 0, y: -20 }}
          animate={{ opacity: 1, y: 0 }}
          className="mb-8"
        >
          <h1 className="text-3xl font-bold mb-2">
            <span className="gradient-text">Community</span> Forum
          </h1>
          <p className="text-[#71717a]">
            Austausch, Neuigkeiten und Nachbarschaftshilfe für Zernsdorf
          </p>
        </motion.div>

        {/* Stats Bar */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.1 }}
          className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-8"
        >
          {[
            { icon: Users, label: 'Mitglieder', value: '342', color: '#00d4ff' },
            { icon: MessageCircle, label: 'Beiträge', value: '1.2k', color: '#a855f7' },
            { icon: TrendingUp, label: 'Diese Woche', value: '+47', color: '#10b981' },
            { icon: Heart, label: 'Reaktionen', value: '5.8k', color: '#f43f5e' },
          ].map((stat, index) => (
            <div key={stat.label} className="glass-card p-4">
              <div className="flex items-center gap-3">
                <div
                  className="w-10 h-10 rounded-xl flex items-center justify-center"
                  style={{ background: `${stat.color}20` }}
                >
                  <stat.icon className="w-5 h-5" style={{ color: stat.color }} />
                </div>
                <div>
                  <p className="text-xl font-bold">{stat.value}</p>
                  <p className="text-xs text-[#71717a]">{stat.label}</p>
                </div>
              </div>
            </div>
          ))}
        </motion.div>

        <div className="grid grid-cols-1 lg:grid-cols-4 gap-8">
          {/* Sidebar - Categories */}
          <motion.div
            initial={{ opacity: 0, x: -20 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ delay: 0.2 }}
            className="lg:col-span-1"
          >
            <div className="glass-card p-4 sticky top-24">
              <h3 className="font-semibold mb-4 flex items-center gap-2">
                <Filter className="w-4 h-4 text-[#00d4ff]" />
                Kategorien
              </h3>
              <div className="space-y-1">
                {CATEGORIES.map((category) => {
                  const isActive = selectedCategory === category.id;
                  return (
                    <button
                      key={category.id}
                      onClick={() => setSelectedCategory(category.id)}
                      className={`w-full flex items-center justify-between p-3 rounded-xl transition-all ${
                        isActive
                          ? 'bg-white/10 border border-white/20'
                          : 'hover:bg-white/5'
                      }`}
                      style={{
                        borderColor: isActive ? category.color : 'transparent',
                      }}
                    >
                      <div className="flex items-center gap-3">
                        <div style={{ color: category.color }}>
                          <category.icon className="w-4 h-4" />
                        </div>
                        <span className="text-sm">{category.label}</span>
                      </div>
                      <span className="text-xs text-[#71717a] bg-white/5 px-2 py-1 rounded-full">
                        {category.count}
                      </span>
                    </button>
                  );
                })}
              </div>

              {/* New Post Hint */}
              {showNewPostHint && (
                <div className="mt-6 p-4 rounded-xl bg-gradient-to-r from-[#00d4ff]/10 to-[#a855f7]/10 border border-[#00d4ff]/20">
                  <div className="flex items-start justify-between mb-2">
                    <AlertCircle className="w-5 h-5 text-[#00d4ff]" />
                    <button
                      onClick={() => setShowNewPostHint(false)}
                      className="text-[#71717a] hover:text-white"
                    >
                      ×
                    </button>
                  </div>
                  <p className="text-sm text-[#a1a1aa] mb-3">
                    Melde dich an, um eigene Beiträge zu erstellen und mit der Community zu interagieren.
                  </p>
                  <button className="btn-primary w-full text-sm py-2">
                    Anmelden
                  </button>
                </div>
              )}
            </div>
          </motion.div>

          {/* Main Content - Posts */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.3 }}
            className="lg:col-span-3"
          >
            {/* Search & New Post */}
            <div className="flex flex-col sm:flex-row gap-4 mb-6">
              <div className="relative flex-1">
                <Search className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-[#71717a]" />
                <input
                  type="text"
                  placeholder="Beiträge durchsuchen..."
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  className="w-full pl-12 pr-4 py-3 bg-white/5 border border-white/10 rounded-xl focus:outline-none focus:border-[#00d4ff]/50 transition-colors"
                />
              </div>
              <button className="btn-primary flex items-center justify-center gap-2 px-6">
                <Plus className="w-5 h-5" />
                <span>Neuer Beitrag</span>
              </button>
            </div>

            {/* Pinned Posts */}
            {pinnedPosts.length > 0 && (
              <div className="mb-6">
                <h3 className="text-sm font-semibold text-[#71717a] uppercase tracking-wider mb-3 flex items-center gap-2">
                  <Bookmark className="w-4 h-4" />
                  Angepinnt
                </h3>
                {pinnedPosts.map((post) => (
                  <PostCard key={post.id} post={post} />
                ))}
              </div>
            )}

            {/* Regular Posts */}
            <div className="space-y-4">
              <h3 className="text-sm font-semibold text-[#71717a] uppercase tracking-wider flex items-center gap-2">
                <Clock className="w-4 h-4" />
                Neueste Beiträge
              </h3>
              <AnimatePresence mode="popLayout">
                {regularPosts.map((post, index) => (
                  <motion.div
                    key={post.id}
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                    exit={{ opacity: 0, y: -20 }}
                    transition={{ delay: index * 0.05 }}
                  >
                    <PostCard post={post} />
                  </motion.div>
                ))}
              </AnimatePresence>

              {regularPosts.length === 0 && (
                <div className="glass-card p-8 text-center">
                  <MessageCircle className="w-12 h-12 mx-auto mb-4 text-[#71717a]" />
                  <p className="text-[#71717a]">Keine Beiträge in dieser Kategorie gefunden.</p>
                </div>
              )}
            </div>

            {/* Load More */}
            {regularPosts.length > 0 && (
              <div className="mt-8 text-center">
                <button className="btn-secondary px-8">
                  Mehr laden
                  <ChevronRight className="w-4 h-4 ml-2" />
                </button>
              </div>
            )}
          </motion.div>
        </div>
      </div>
    </div>
  );
}

function PostCard({ post }: { post: Post }) {
  const [isLiked, setIsLiked] = useState(post.isLiked || false);
  const [likes, setLikes] = useState(post.likes);

  const category = CATEGORIES.find((c) => c.id === post.category);

  const handleLike = () => {
    setIsLiked(!isLiked);
    setLikes(isLiked ? likes - 1 : likes + 1);
  };

  return (
    <div
      className={`glass-card p-5 transition-all hover:border-white/20 ${
        post.isPinned ? 'border-[#f43f5e]/30 bg-[#f43f5e]/5' : ''
      }`}
    >
      {/* Header */}
      <div className="flex items-start justify-between mb-3">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-full bg-gradient-to-br from-[#00d4ff] to-[#a855f7] flex items-center justify-center text-sm font-bold">
            {post.author.avatar}
          </div>
          <div>
            <div className="flex items-center gap-2">
              <span className="font-medium">{post.author.name}</span>
              {post.author.badge && (
                <span className="text-[10px] px-2 py-0.5 rounded-full bg-[#00d4ff]/20 text-[#00d4ff]">
                  {post.author.badge}
                </span>
              )}
            </div>
            <div className="flex items-center gap-2 text-xs text-[#71717a]">
              <span>{post.timestamp}</span>
              {category && (
                <>
                  <span>•</span>
                  <span style={{ color: category.color }}>{category.label}</span>
                </>
              )}
            </div>
          </div>
        </div>
        <button className="btn-icon w-8 h-8">
          <MoreHorizontal className="w-4 h-4" />
        </button>
      </div>

      {/* Content */}
      <h3 className="font-semibold text-lg mb-2">{post.title}</h3>
      <p className="text-[#a1a1aa] text-sm leading-relaxed mb-4">{post.content}</p>

      {/* Actions */}
      <div className="flex items-center justify-between pt-3 border-t border-white/5">
        <div className="flex items-center gap-4">
          <button
            onClick={handleLike}
            className={`flex items-center gap-2 text-sm transition-colors ${
              isLiked ? 'text-[#f43f5e]' : 'text-[#71717a] hover:text-white'
            }`}
          >
            <ThumbsUp className={`w-4 h-4 ${isLiked ? 'fill-current' : ''}`} />
            <span>{likes}</span>
          </button>
          <button className="flex items-center gap-2 text-sm text-[#71717a] hover:text-white transition-colors">
            <MessageSquare className="w-4 h-4" />
            <span>{post.comments}</span>
          </button>
        </div>
        <div className="flex items-center gap-2">
          <button className="btn-icon w-8 h-8">
            <Share2 className="w-4 h-4" />
          </button>
          <button className="btn-icon w-8 h-8">
            <Bookmark className="w-4 h-4" />
          </button>
        </div>
      </div>
    </div>
  );
}
