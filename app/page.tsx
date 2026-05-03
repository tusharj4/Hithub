"use client";

import React, { useEffect, useState } from "react";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardHeader } from "@/components/ui/card";
import { ChevronUp, ExternalLink, Star, Code2, Sparkles, Github, Search } from "lucide-react";
import { motion } from "motion/react";

export default function Home() {
  const [repos, setRepos] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [user, setUser] = useState<any>(null);
  const [searchQuery, setSearchQuery] = useState("");

  const fetchRepos = async () => {
    try {
      const res = await fetch("/api/repos");
      const data = await res.json();
      if (data.data) {
        setRepos(data.data);
      }
    } catch (error) {
      console.error("Failed to fetch repos", error);
    } finally {
      setLoading(false);
    }
  };

  const seedDatabase = async () => {
    try {
      setLoading(true);
      await fetch("/api/seed", { method: "POST" });
      await fetchRepos();
    } catch (e) {
      console.error(e);
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchRepos();
    
    // Sync mock user status (For Preview)
    setUser((window as any).__MOCK_USER__);
    const handleUserUpdate = (e: any) => setUser(e.detail);
    window.addEventListener("userUpdate", handleUserUpdate);
    return () => window.removeEventListener("userUpdate", handleUserUpdate);
  }, []);

  const handleUpvote = async (repositoryId: string) => {
    if (!user) {
      alert("Please login via GitHub first!");
      return;
    }

    // Optimistic UI update
    setRepos(current => current.map(repo => {
      if (repo.id === repositoryId) {
        const hasUpvoted = repo.upvotes?.some((u: any) => u.userId === user.id);
        const diff = hasUpvoted ? -1 : 1;
        const newUpvotes = hasUpvoted 
          ? repo.upvotes.filter((u: any) => u.userId !== user.id)
          : [...(repo.upvotes || []), { userId: user.id }];
        return { 
          ...repo, 
          hithubScore: repo.hithubScore + diff,
          upvotes: newUpvotes 
        };
      }
      return repo;
    }));

    try {
      await fetch("/api/upvote", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ userId: user.id, repositoryId })
      });
      // Re-fetch to ensure sync (optional)
      // fetchRepos();
    } catch (err) {
      console.error("Upvote failed", err);
      // Revert optimism if failed
      fetchRepos();
    }
  };

  const filteredRepos = repos.filter(repo => {
    if (!searchQuery.trim()) return true;
    const q = searchQuery.toLowerCase();
    return repo.name?.toLowerCase().includes(q) || 
           repo.description?.toLowerCase().includes(q) ||
           repo.aiWhatItDoes?.toLowerCase().includes(q);
  });

  return (
    <div className="w-full relative z-10">
      <div className="flex flex-col items-center justify-center text-center space-y-6 mb-24 mt-16 overflow-hidden">
        <motion.div
           initial={{ opacity: 0, scale: 0.8, filter: "blur(10px)", y: 20 }}
           animate={{ opacity: 1, scale: 1, filter: "blur(0px)", y: 0 }}
           transition={{ duration: 0.8, ease: [0.16, 1, 0.3, 1] }}
        >
          <Badge className="px-5 py-2 bg-orange-500/10 text-orange-400 border border-orange-500/20 hover:bg-orange-500/20 uppercase tracking-[0.2em] text-[10px] font-bold shadow-[0_0_20px_rgba(249,115,22,0.15)]">
            <Sparkles className="h-3 w-3 mr-2" />
            AI-Powered Insights
          </Badge>
        </motion.div>
        
        <motion.h1 
          initial={{ opacity: 0, y: 50, filter: "blur(10px)" }}
          animate={{ opacity: 1, y: 0, filter: "blur(0px)" }}
          transition={{ duration: 1, ease: [0.16, 1, 0.3, 1], delay: 0.1 }}
          className="text-5xl md:text-7xl lg:text-8xl font-black tracking-tighter text-white leading-[1.1]"
        >
          Product Hunt for <br className="hidden md:block" />
          <span className="text-transparent bg-clip-text bg-gradient-to-br from-orange-400 to-orange-600 inline-block transform -rotate-2 hover:rotate-0 transition-transform duration-500 cursor-default px-2">GitHub</span>
        </motion.h1>
        
        <motion.p 
          initial={{ opacity: 0, y: 20, filter: "blur(10px)" }}
          animate={{ opacity: 1, y: 0, filter: "blur(0px)" }}
          transition={{ duration: 1, ease: [0.16, 1, 0.3, 1], delay: 0.2 }}
          className="text-slate-400 max-w-2xl text-lg md:text-xl font-medium mt-6"
        >
          Discover the top trending repositories of the day. Upvote the best tools. 
          Powered by Gemini AI for instant developer insights.
        </motion.p>

        <motion.div 
          initial={{ opacity: 0, y: 20, filter: "blur(10px)" }}
          animate={{ opacity: 1, y: 0, filter: "blur(0px)" }}
          transition={{ duration: 1, ease: [0.16, 1, 0.3, 1], delay: 0.3 }}
          className="w-full max-w-xl mt-8 relative group"
        >
          <div className="absolute inset-y-0 left-0 pl-5 flex items-center pointer-events-none">
            <Search className="h-5 w-5 text-slate-500 group-focus-within:text-orange-500 transition-colors" />
          </div>
          <input
            type="text"
            placeholder="Search by repo name or description..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="w-full bg-[#18181B]/50 backdrop-blur-md border border-white/10 rounded-2xl py-4 pl-14 pr-4 text-slate-200 placeholder-slate-500 focus:outline-none focus:border-orange-500/50 focus:ring-1 focus:ring-orange-500/50 transition-all font-medium shadow-inner"
          />
        </motion.div>
      </div>

      <motion.div 
        initial="hidden"
        animate="show"
        variants={{
          hidden: { opacity: 0 },
          show: {
            opacity: 1,
            transition: { staggerChildren: 0.1 }
          }
        }}
        className="grid grid-cols-1 md:grid-cols-12 gap-4 auto-rows-[minmax(0,_1fr)]"
      >
        {loading ? (
          Array.from({ length: 3 }).map((_, i) => (
            <Card key={i} className="animate-pulse bg-[#18181B] border-white/5 rounded-[2rem] col-span-1 md:col-span-4 lg:-row-span-2 shadow-2xl">
              <CardHeader className="h-32 bg-white/5 rounded-t-[2rem]"></CardHeader>
            </Card>
          ))
        ) : filteredRepos.length === 0 ? (
          <div className="col-span-1 md:col-span-12 text-center py-32 border border-dashed rounded-[3rem] border-white/10 bg-[#18181B] flex flex-col items-center justify-center">
            <h3 className="text-2xl font-bold mb-3 text-slate-200">No Repositories Found</h3>
            <p className="text-slate-400 mb-8 max-w-md">Try a different search term or force seed the database.</p>
            <Button onClick={seedDatabase} className="bg-white text-black hover:bg-slate-200 rounded-full font-bold px-8 py-6 shadow-[0_0_40px_rgba(255,255,255,0.2)] hover:scale-105 transition-all">
              <Code2 className="mr-2 h-5 w-5" />
              Force Seed Database (Demo Mode)
            </Button>
          </div>
        ) : (
          <>
            {filteredRepos.map((repo, i) => {
              const hasUpvoted = user && repo.upvotes?.some((u: any) => u.userId === user.id);
              
              if (i === 0) {
                // Spotlight card
                return (
                  <motion.div 
                    variants={{
                      hidden: { opacity: 0, y: 50, scale: 0.95 },
                      show: { opacity: 1, y: 0, scale: 1, transition: { duration: 0.8, ease: [0.16, 1, 0.3, 1] } }
                    }}
                    whileHover={{ y: -10, scale: 1.01 }}
                    key={repo.id} 
                    className="relative overflow-hidden col-span-1 md:col-span-12 lg:col-span-8 lg:row-span-2 bg-[#18181B] bg-gradient-to-br from-[#1c1c1f] to-[#121214] border border-white/5 rounded-[2.5rem] p-8 md:p-12 flex flex-col group h-full hover:border-orange-500/40 hover:shadow-[0_0_60px_-15px_rgba(249,115,22,0.25)] transition-all duration-500 will-change-transform"
                  >
                    <div className="absolute inset-0 bg-gradient-to-br from-orange-500/10 via-transparent to-orange-500/5 opacity-0 group-hover:opacity-100 transition-all duration-700 pointer-events-none" />
                    <div className="absolute -top-24 -right-24 w-64 h-64 bg-orange-500/10 blur-[80px] rounded-full group-hover:bg-orange-500/20 transition-all duration-700 pointer-events-none" />
                    <div className="flex justify-between items-start relative z-10">
                      <div className="pr-4">
                        <span className="inline-block px-4 py-1.5 bg-orange-500/10 text-orange-400 text-[10px] uppercase tracking-widest font-bold rounded-full mb-6 border border-orange-500/20 backdrop-blur-md">
                          SPOTLIGHT OF THE DAY
                        </span>
                        <a href={repo.url} target="_blank" rel="noreferrer" className="flex items-center gap-3 hover:opacity-80 transition-opacity mb-4">
                          <h1 className="text-4xl md:text-5xl lg:text-6xl font-black text-white tracking-tight">{repo.name}</h1>
                          <ExternalLink className="h-6 w-6 lg:h-8 lg:w-8 text-orange-500 opacity-0 -ml-4 group-hover:opacity-100 group-hover:ml-0 transition-all duration-300" />
                        </a>
                        <p className="text-slate-400 text-base md:text-lg max-w-xl mb-8 leading-relaxed line-clamp-3">
                          {repo.aiWhatItDoes || repo.description}
                        </p>
                      </div>
                      <motion.button 
                        onClick={() => handleUpvote(repo.id)}
                        whileTap={{ scale: 0.95 }}
                        className={`flex flex-col items-center gap-1 ${hasUpvoted ? "bg-orange-600 border-orange-500 shadow-[0_0_20px_rgba(234,88,12,0.4)]" : "bg-[#27272A] border-white/10"} p-4 md:p-5 rounded-3xl border hover:border-orange-500/50 hover:bg-[#323236] transition-colors duration-300 flex-shrink-0 min-w-[80px] hover:-translate-y-1`}
                      >
                        <motion.div animate={hasUpvoted ? { y: [0, -8, 0], scale: [1, 1.3, 1] } : {}} transition={{ duration: 0.4, ease: "easeOut" }}>
                          <ChevronUp className={`w-6 h-6 md:w-8 md:h-8 ${hasUpvoted ? "text-white" : "text-orange-500"}`} />
                        </motion.div>
                        <span className={`text-xl md:text-2xl font-black ${hasUpvoted ? "text-white" : "text-slate-100"}`}>{repo.hithubScore}</span>
                        <span className={`text-[10px] font-bold uppercase tracking-widest ${hasUpvoted ? "text-orange-200" : "text-slate-500"}`}>Votes</span>
                      </motion.button>
                    </div>
                    <div className="mt-auto grid grid-cols-1 md:grid-cols-3 gap-6 md:gap-8 md:border-t border-white/5 pt-8 md:pt-10 w-full relative z-10">
                      <div className="space-y-3">
                        <h3 className="text-[10px] font-black text-slate-500 uppercase tracking-[0.2em] flex items-center">
                          <Code2 className="h-4 w-4 mr-2 text-slate-400" /> What it does
                        </h3>
                        <p className="text-sm text-slate-300 leading-relaxed line-clamp-2 font-medium">{repo.description}</p>
                      </div>
                      <div className="space-y-3">
                        <h3 className="text-[10px] font-black text-slate-500 uppercase tracking-[0.2em] flex items-center">
                          <Sparkles className="h-4 w-4 mr-2 text-orange-400" /> Under the hood
                        </h3>
                        <p className="text-sm text-slate-300 leading-relaxed line-clamp-2 font-medium">{repo.aiUnderTheHood || "Info not available."}</p>
                      </div>
                      <div className="space-y-3">
                        <h3 className="text-[10px] font-black text-slate-500 uppercase tracking-[0.2em]">
                          How to use
                        </h3>
                        <p className="text-sm text-slate-300 leading-relaxed hover:text-white transition-colors cursor-pointer line-clamp-2 font-medium underline underline-offset-4 decoration-white/20 hover:decoration-white">{repo.aiHowToUse || "Check README."}</p>
                      </div>
                    </div>
                  </motion.div>
                );
              }
              
              // Standard bento card
              return (
                <motion.div 
                  variants={{
                    hidden: { opacity: 0, y: 30, scale: 0.95 },
                    show: { opacity: 1, y: 0, scale: 1, transition: { duration: 0.8, ease: [0.16, 1, 0.3, 1] } }
                  }}
                  whileHover={{ y: -8, scale: 1.02 }}
                  key={repo.id} 
                  className="relative overflow-hidden col-span-1 md:col-span-6 lg:col-span-4 bg-gradient-to-b from-[#18181B] to-[#121214] border border-white/5 hover:border-orange-500/30 transition-all duration-500 rounded-[2rem] p-8 flex flex-col h-full min-h-[280px] will-change-transform shadow-lg hover:shadow-[0_0_40px_-10px_rgba(249,115,22,0.15)] group"
                >
                  <div className="absolute inset-0 bg-gradient-to-tr from-orange-500/5 via-transparent to-transparent opacity-0 group-hover:opacity-100 transition-all duration-700 pointer-events-none" />
                  <div className="absolute top-0 right-0 w-32 h-32 bg-white/5 blur-[50px] rounded-full group-hover:bg-orange-500/10 transition-all duration-700 pointer-events-none" />
                  <div className="flex justify-between items-center mb-6 relative z-10">
                    <span className="text-[10px] font-black text-slate-500 uppercase tracking-[0.2em]">Trending #{i + 1}</span>
                    <span className="text-xs font-mono font-medium text-cyan-400 bg-cyan-400/10 px-3 py-1.5 rounded-lg border border-cyan-400/20">{repo.language || "Unknown"}</span>
                  </div>
                  <a href={repo.url} target="_blank" rel="noreferrer" className="group/link flex items-center gap-3 mb-4 relative z-10">
                    <h2 className="text-2xl font-bold text-white truncate group-hover/link:text-orange-400 transition-colors">{repo.name}</h2>
                    <ExternalLink className="h-4 w-4 text-orange-500 opacity-0 -translate-x-2 group-hover/link:opacity-100 group-hover/link:translate-x-0 transition-all duration-300" />
                  </a>
                  <p className="text-sm text-slate-400 leading-relaxed line-clamp-3 mb-6 flex-grow relative z-10 font-medium">{repo.aiWhatItDoes || repo.description}</p>
                  
                  <div className="mt-auto flex justify-between items-center pt-5 border-t border-white/5 relative z-10">
                    <span className="text-sm font-bold text-slate-200 flex items-center gap-2">
                      <Star className="h-4 w-4 text-slate-500" />
                      {repo.githubStars?.toLocaleString()}
                    </span>
                    <div className="flex items-center gap-4">
                      <span className="text-sm font-bold text-slate-200 flex items-center gap-1">
                        <ChevronUp className="h-4 w-4 text-orange-500" />
                        {repo.hithubScore}
                      </span>
                      <motion.button 
                        onClick={() => handleUpvote(repo.id)} 
                        whileTap={{ scale: 0.9 }}
                        whileHover={{ scale: 1.05 }}
                        className={`px-4 py-2 rounded-xl text-xs font-bold transition-colors min-w-[80px] flex justify-center items-center ${hasUpvoted ? "bg-orange-500 text-white shadow-[0_0_15px_rgba(249,115,22,0.4)]" : "bg-white/5 hover:bg-white/10 text-slate-200"}`}
                      >
                        {hasUpvoted ? (
                          <motion.span 
                            initial={{ scale: 0.8, opacity: 0 }} 
                            animate={{ scale: 1, opacity: 1 }} 
                            transition={{ type: "spring", stiffness: 400, damping: 10 }}
                            className="flex items-center gap-1"
                          >
                            <ChevronUp className="w-3 h-3" /> Voted
                          </motion.span>
                        ) : "Upvote"}
                      </motion.button>
                    </div>
                  </div>
                </motion.div>
              );
            })}
            
            {/* Bento decorations if space permits (we append them at the end of the lists) */}
            <motion.div 
              variants={{
                hidden: { opacity: 0, y: 30, scale: 0.95 },
                show: { opacity: 1, y: 0, scale: 1, transition: { duration: 0.8, ease: [0.16, 1, 0.3, 1] } }
              }}
              whileHover={{ y: -8, scale: 1.02 }}
              className="col-span-1 md:col-span-6 lg:col-span-4 bg-gradient-to-tr from-[#18181B] to-[#202025] border border-white/5 hover:border-orange-500/30 transition-all duration-500 rounded-[2rem] p-8 flex flex-col justify-between min-h-[260px] will-change-transform shadow-lg hover:shadow-[0_0_40px_-10px_rgba(249,115,22,0.15)] relative overflow-hidden group"
            >
              <div className="absolute inset-0 bg-gradient-to-tr from-transparent via-transparent to-orange-500/5 opacity-0 group-hover:opacity-100 transition-all duration-700 pointer-events-none" />
              <div className="absolute top-0 right-0 w-32 h-32 bg-orange-500/10 blur-[50px] rounded-full group-hover:bg-orange-500/20 transition-all duration-700 pointer-events-none" />
              <div className="flex items-center gap-4 mb-4 relative z-10">
                <div className="w-12 h-12 rounded-full bg-orange-500/10 text-orange-400 border border-orange-500/20 flex items-center justify-center text-xl shadow-[0_0_20px_rgba(249,115,22,0.1)] group-hover:scale-110 transition-transform duration-500">⚡</div>
                <div>
                  <h4 className="text-sm font-bold text-slate-100">AI Analysis</h4>
                  <p className="text-[10px] text-slate-500 font-bold uppercase tracking-[0.2em] mt-1">Powered by Gemini</p>
                </div>
              </div>
              <p className="text-sm text-slate-400 leading-relaxed italic border-l-2 border-orange-500/30 pl-5 font-medium relative z-10">"We're seeing a massive shift towards 'Local-First' AI tools and high-performance Rust backends in today's trending repositories."</p>
            </motion.div>

            <motion.div 
              variants={{
                hidden: { opacity: 0, y: 30, scale: 0.95 },
                show: { opacity: 1, y: 0, scale: 1, transition: { duration: 0.8, ease: [0.16, 1, 0.3, 1] } }
              }}
              whileHover={{ scale: 0.98 }}
              className="col-span-1 md:col-span-6 lg:col-span-8 bg-gradient-to-br from-orange-500 to-orange-700 rounded-[2rem] p-8 md:p-10 text-white relative overflow-hidden flex flex-col justify-center min-h-[260px] group cursor-pointer shadow-xl shadow-orange-500/20 will-change-transform"
            >
              <div className="absolute inset-0 bg-[url('data:image/svg+xml,%3Csvg viewBox=%220 0 200 200%22 xmlns=%22http://www.w3.org/2000/svg%22%3E%3Cfilter id=%22noiseFilter%22%3E%3CfeTurbulence type=%22fractalNoise%22 baseFrequency=%220.85%22 numOctaves=%223%22 stitchTiles=%22stitch%22/%3E%3C/filter%3E%3Crect width=%22100%25%22 height=%22100%25%22 filter=%22url(%23noiseFilter)%22/%3E%3C/svg%3E')] opacity-10 mix-blend-overlay pointer-events-none" />
              <div className="relative z-10 max-w-sm">
                <h3 className="text-3xl lg:text-4xl font-black mb-4 tracking-tight">SUBMIT REPO</h3>
                <p className="text-orange-100 text-lg leading-relaxed mb-8 font-medium">Have a project trending on GitHub? Let our AI analyze and feature it on the grid.</p>
                <button className="bg-black text-white px-8 py-4 rounded-2xl text-sm font-bold hover:bg-slate-900 hover:scale-105 transition-all shadow-2xl active:scale-95 uppercase tracking-widest flex items-center gap-2">
                  Submit Now
                  <ChevronUp className="w-4 h-4 rotate-90" />
                </button>
              </div>
              <div className="absolute -bottom-10 -right-10 text-orange-900/40 group-hover:rotate-12 group-hover:scale-125 transition-transform duration-1000 font-black text-[12rem] md:text-[18rem] opacity-30 select-none leading-none">
                REPO
              </div>
            </motion.div>
          </>
        )}
      </motion.div>
    </div>
  );
}
