"use client";

import React, { useEffect, useState } from "react";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardHeader } from "@/components/ui/card";
import { ChevronUp, ExternalLink, Star, Code2, Sparkles, Github } from "lucide-react";
import { motion } from "motion/react";

export default function Home() {
  const [repos, setRepos] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [user, setUser] = useState<any>(null);

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

  return (
    <div className="w-full">
      <div className="flex flex-col items-center justify-center text-center space-y-3 mb-10 mt-4">
        <Badge className="px-3 py-1 bg-orange-500/10 text-orange-400 border border-orange-500/20 hover:bg-orange-500/20">
          <Sparkles className="h-3 w-3 mr-1.5" />
          AI-Powered Insights
        </Badge>
        <h1 className="text-3xl md:text-5xl font-extrabold tracking-tight text-slate-100">
          Product Hunt for <span className="text-orange-500">GitHub</span>
        </h1>
        <p className="text-slate-400 max-w-xl text-md md:text-lg">
          Discover the top trending repositories of the day. Upvote the best tools. 
          Powered by Gemini AI for instant developer insights.
        </p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-12 gap-4">
        {loading ? (
          Array.from({ length: 3 }).map((_, i) => (
            <Card key={i} className="animate-pulse bg-[#18181B] border-white/5 rounded-3xl col-span-1 md:col-span-4 lg:-row-span-2">
              <CardHeader className="h-32 bg-white/5 rounded-t-3xl"></CardHeader>
            </Card>
          ))
        ) : repos.length === 0 ? (
          <div className="col-span-1 md:col-span-12 text-center py-24 border border-dashed rounded-3xl border-white/10 bg-[#18181B]">
            <h3 className="text-lg font-bold mb-2 text-slate-200">No Repositories Found</h3>
            <p className="text-slate-400 mb-6">The cron job hasn't run yet or the database is empty.</p>
            <Button onClick={seedDatabase} className="bg-white text-black hover:bg-slate-200 rounded-full font-semibold">
              <Code2 className="mr-2 h-4 w-4" />
              Force Seed Database (Demo Mode)
            </Button>
          </div>
        ) : (
          <>
            {repos.map((repo, i) => {
              const hasUpvoted = user && repo.upvotes?.some((u: any) => u.userId === user.id);
              
              if (i === 0) {
                // Spotlight card
                return (
                  <motion.div 
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ duration: 0.5, delay: i * 0.1 }}
                    key={repo.id} 
                    className="col-span-1 md:col-span-12 lg:col-span-8 lg:row-span-2 bg-[#18181B] bg-gradient-to-br from-[#18181B] to-[#121214] border border-white/5 rounded-3xl p-6 md:p-8 flex flex-col group h-full hover:border-white/10 transition-all duration-300"
                  >
                    <div className="flex justify-between items-start">
                      <div className="pr-4">
                        <span className="inline-block px-3 py-1 bg-orange-500/10 text-orange-400 text-xs font-bold rounded-full mb-4 border border-orange-500/20">
                          SPOTLIGHT OF THE DAY
                        </span>
                        <a href={repo.url} target="_blank" rel="noreferrer" className="flex items-center gap-2 hover:underline decoration-orange-500 underline-offset-4 mb-2">
                          <h1 className="text-3xl md:text-4xl font-extrabold text-slate-100">{repo.name}</h1>
                          <ExternalLink className="h-5 w-5 text-slate-500 opacity-50 group-hover:opacity-100 transition-opacity" />
                        </a>
                        <p className="text-slate-400 text-base md:text-lg max-w-lg mb-6 leading-relaxed line-clamp-3">
                          {repo.aiWhatItDoes || repo.description}
                        </p>
                      </div>
                      <button 
                        onClick={() => handleUpvote(repo.id)}
                        className={`flex flex-col items-center gap-1 ${hasUpvoted ? "bg-orange-600 border-orange-500" : "bg-[#27272A] border-white/10"} p-3 md:p-4 rounded-2xl border hover:border-orange-500/50 transition-all flex-shrink-0 min-w-[70px]`}
                      >
                        <ChevronUp className={`w-5 h-5 md:w-6 md:h-6 ${hasUpvoted ? "text-white" : "text-orange-500"}`} />
                        <span className={`text-lg md:text-xl font-bold ${hasUpvoted ? "text-white" : "text-slate-100"}`}>{repo.hithubScore}</span>
                        <span className={`text-[10px] font-bold uppercase ${hasUpvoted ? "text-orange-200" : "text-slate-500"}`}>Votes</span>
                      </button>
                    </div>
                    <div className="mt-auto grid grid-cols-1 md:grid-cols-3 gap-6 md:gap-4 md:border-t border-white/5 pt-6 md:pt-8 w-full">
                      <div className="space-y-2">
                        <h3 className="text-xs font-bold text-slate-500 uppercase tracking-widest flex items-center">
                          <Code2 className="h-3.5 w-3.5 mr-1" /> What it does
                        </h3>
                        <p className="text-sm text-slate-200 leading-snug line-clamp-2">{repo.description}</p>
                      </div>
                      <div className="space-y-2">
                        <h3 className="text-xs font-bold text-slate-500 uppercase tracking-widest flex items-center">
                          <Sparkles className="h-3.5 w-3.5 mr-1" /> Under the hood
                        </h3>
                        <p className="text-sm text-slate-200 leading-snug line-clamp-2">{repo.aiUnderTheHood || "Info not available."}</p>
                      </div>
                      <div className="space-y-2">
                        <h3 className="text-xs font-bold text-slate-500 uppercase tracking-widest">
                          How to use
                        </h3>
                        <p className="text-sm text-slate-200 leading-snug hover:underline cursor-pointer line-clamp-2">{repo.aiHowToUse || "Check README."}</p>
                      </div>
                    </div>
                  </motion.div>
                );
              }
              
              // Standard bento card
              return (
                <motion.div 
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ duration: 0.5, delay: i * 0.1 }}
                  key={repo.id} 
                  className="col-span-1 md:col-span-6 lg:col-span-4 bg-[#18181B] hover:bg-[#1C1C20] border border-white/5 hover:border-white/10 transition-all duration-300 rounded-3xl p-6 flex flex-col min-h-[220px]"
                >
                  <div className="flex justify-between items-center mb-4">
                    <span className="text-xs font-bold text-slate-500 uppercase tracking-widest">Trending #{i + 1}</span>
                    <span className="text-xs font-mono text-cyan-400 bg-cyan-400/10 px-2 py-0.5 rounded-md">{repo.language || "Unknown"}</span>
                  </div>
                  <a href={repo.url} target="_blank" rel="noreferrer" className="group flex items-center gap-2 hover:underline decoration-orange-500 underline-offset-4 mb-2">
                    <h2 className="text-xl font-bold text-slate-100 truncate">{repo.name}</h2>
                    <ExternalLink className="h-3 w-3 text-slate-500 mb-1 opacity-0 group-hover:opacity-100 transition-opacity" />
                  </a>
                  <p className="text-sm text-slate-400 line-clamp-2 flex-grow">{repo.aiWhatItDoes || repo.description}</p>
                  
                  <div className="mt-4 flex justify-between items-center pt-4 border-t border-white/5">
                    <span className="text-sm font-bold text-slate-200 flex items-center gap-1.5">
                      <Star className="h-4 w-4 text-slate-500" />
                      {repo.githubStars?.toLocaleString()}
                    </span>
                    <div className="flex items-center gap-3">
                      <span className="text-sm font-bold text-slate-200 flex items-center gap-1">
                        <ChevronUp className="h-4 w-4 text-orange-500" />
                        {repo.hithubScore}
                      </span>
                      <button 
                        onClick={() => handleUpvote(repo.id)} 
                        className={`px-3 py-1 rounded-lg text-xs font-medium transition-colors ${hasUpvoted ? "bg-orange-500 text-white" : "bg-white/5 hover:bg-white/10 text-slate-200"}`}
                      >
                        {hasUpvoted ? "Voted" : "Upvote"}
                      </button>
                    </div>
                  </div>
                </motion.div>
              );
            })}
            
            {/* Bento decorations if space permits (we append them at the end of the lists) */}
            <motion.div 
              initial={{ opacity: 0, scale: 0.95 }}
              animate={{ opacity: 1, scale: 1 }}
              transition={{ duration: 0.5, delay: 0.5 }}
              className="col-span-1 md:col-span-6 lg:col-span-4 bg-gradient-to-tr from-[#18181B] to-[#202025] border border-white/5 rounded-3xl p-6 flex flex-col justify-between"
            >
              <div className="flex items-center gap-4 mb-4">
                <div className="w-10 h-10 rounded-full bg-slate-800 flex items-center justify-center text-lg">⚡</div>
                <div>
                  <h4 className="text-sm font-bold text-slate-100">AI Analysis</h4>
                  <p className="text-[10px] text-slate-500 uppercase">Powered by Gemini</p>
                </div>
              </div>
              <p className="text-xs text-slate-400 leading-relaxed italic">"We're seeing a massive shift towards 'Local-First' AI tools and high-performance Rust backends in today's trending repositories."</p>
            </motion.div>

            <motion.div 
              initial={{ opacity: 0, y: 30 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.6, delay: 0.6 }}
              className="col-span-1 md:col-span-6 lg:col-span-8 bg-gradient-to-br from-orange-500 to-orange-700 rounded-3xl p-6 md:p-8 text-white relative overflow-hidden flex flex-col justify-center min-h-[180px] group cursor-pointer"
            >
              <div className="relative z-10 max-w-sm">
                <h3 className="text-2xl font-black mb-2">SUBMIT REPO</h3>
                <p className="text-orange-100 text-sm leading-tight mb-4">Have a project trending on GitHub? Let our AI analyze and feature it on the grid.</p>
                <button className="bg-black text-white px-5 py-2 rounded-xl text-xs font-bold hover:bg-slate-900 transition-colors">
                  Submit Now
                </button>
              </div>
              <div className="absolute -bottom-6 -right-6 text-orange-900/50 group-hover:scale-110 transition-transform duration-700 font-black text-8xl md:text-9xl opacity-30 select-none">
                REPO
              </div>
            </motion.div>
          </>
        )}
      </div>
    </div>
  );
}
