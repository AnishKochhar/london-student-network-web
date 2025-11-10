"use client";

import { useEffect, useState } from "react";
import { PlusIcon, TrashIcon } from "@heroicons/react/24/outline";
import toast from "react-hot-toast";
import { Profile, ProfileSkill, ProfileExperience } from "@/app/lib/types"

interface User {
  id: string;
  name: string;
  email: string;
  role: string;
}

interface Props {
  user: User;
}

export default function ProfileSection({ user }: Props) {
  const [profile, setProfile] = useState<Profile | null>(null);
  const [skills, setSkills] = useState<ProfileSkill[]>([]);
  const [experiences, setExperiences] = useState<ProfileExperience[]>([]);
  const [loading, setLoading] = useState(true);
  const [newSkill, setNewSkill] = useState("");
  const [newExperience, setNewExperience] = useState<Omit<ProfileExperience, "id" | "profile_id">>({
    title: "",
    company: "",
    start_date: "",
    end_date: "",
    description: "",
  });

  // --- Load profile, skills, and experiences ---
  useEffect(() => {
    if (user.role !== "user") return;

    async function loadData() {
      try {
        const [pRes, sRes, eRes] = await Promise.all([
          fetch("/api/profiles").then((r) => r.json()),
          fetch("/api/profiles/skills").then((r) => r.json()),
          fetch("/api/profiles/experiences").then((r) => r.json()),
        ]);

        if (pRes.success) setProfile(pRes.profile);
        if (sRes.success) setSkills(sRes.skills);
        if (eRes.success) {
          const sortedExperiences = eRes.experiences.sort(
            (a: ProfileExperience, b: ProfileExperience) =>
              new Date(b.start_date).getTime() - new Date(a.start_date).getTime()
          );
          setExperiences(sortedExperiences);
        }
      } catch (err) {
        console.error(err);
        toast.error("Failed to load profile data");
      } finally {
        setLoading(false);
      }
    }

    loadData();
  }, [user.role]);

  if (user.role !== "user") {
    return (
      <section className="scroll-mt-8">
        <h2 className="text-2xl md:text-3xl font-semibold text-white mb-4 md:mb-8">
          Profile
        </h2>
        <div className="bg-white/5 backdrop-blur-sm rounded-2xl p-6 border border-white/10">
          <p className="text-gray-300">
            You are <span className="font-semibold">{user.role}</span>. Profile section is not available.
          </p>
        </div>
      </section>
    );
  }

  if (loading) {
    return (
      <div className="flex justify-center items-center py-10 text-gray-400">
        Loading profile...
      </div>
    );
  }

  // --- Handlers ---
  const addSkill = async () => {
    if (!newSkill.trim()) return;
    const toastId = toast.loading("Adding skill...");
    try {
      const res = await fetch("/api/profiles/skills", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ skill_name: newSkill }),
      });
      const data = await res.json();
      if (data.success) {
        setSkills((prev) => [...prev, data.skill]);
        toast.success("Skill added!", { id: toastId });
        setNewSkill("");
      } else throw new Error(data.message);
    } catch {
      toast.error("Failed to add skill", { id: toastId });
    }
  };

  const removeSkill = async (id: number) => {
    const toastId = toast.loading("Deleting skill...");
    try {
      const res = await fetch("/api/profiles/skills", {
        method: "DELETE",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ skill_id: id }),
      });
      const data = await res.json();
      if (data.success) {
        setSkills((prev) => prev.filter((s) => s.id !== id));
        toast.success("Skill deleted", { id: toastId });
      } else throw new Error(data.message);
    } catch {
      toast.error("Failed to delete skill", { id: toastId });
    }
  };

  const addExperience = async () => {
    const toastId = toast.loading("Adding experience...");
    try {
      const res = await fetch("/api/profiles/experiences", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(newExperience),
      });
      const data = await res.json();
      if (data.success) {
        setExperiences((prev) =>
          [data.experience, ...prev].sort(
            (a: ProfileExperience, b: ProfileExperience) =>
              new Date(b.start_date).getTime() - new Date(a.start_date).getTime()
          )
        );
        setNewExperience({ title: "", company: "", start_date: "", end_date: "", description: "" });
        toast.success("Experience added!", { id: toastId });
      } else throw new Error(data.message);
    } catch {
      toast.error("Failed to add experience", { id: toastId });
    }
  };

  const removeExperience = async (id: number) => {
    const toastId = toast.loading("Deleting experience...");
    try {
      const res = await fetch("/api/profiles/experiences", {
        method: "DELETE",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ experience_id: id }),
      });
      const data = await res.json();
      if (data.success) {
        setExperiences((prev) => prev.filter((e) => e.id !== id));
        toast.success("Experience deleted", { id: toastId });
      } else throw new Error(data.message);
    } catch {
      toast.error("Failed to delete experience", { id: toastId });
    }
  };

  // --- JSX ---
  return (
    <section id="profile" className="scroll-mt-8">
      {/* --- Basic Info --- */}
      <h2 className="text-2xl md:text-3xl font-semibold text-white mb-4 md:mb-8">Your Profile</h2>
      <p className="text-gray-300 mb-4 md:mb-8">Manage your public profile and experience details</p>

      <div className="bg-white/5 backdrop-blur-sm rounded-2xl p-6 border border-white/10 mb-6">
        <div className="flex items-center gap-4 mb-4">
          {profile?.profile_picture_url ? (
            <img
              src={profile.profile_picture_url}
              alt="Profile"
              className="w-16 h-16 rounded-full border border-white/20 object-cover"
            />
          ) : (
            <div className="w-16 h-16 rounded-full bg-gray-700 flex items-center justify-center text-gray-400 text-xl">
              {user.name?.[0]?.toUpperCase() || "?"}
            </div>
          )}
          <div>
            <h3 className="text-xl font-semibold text-white">{user.name}</h3>
            <p className="text-gray-400 text-sm">{profile?.headline || "No headline yet"}</p>
          </div>
        </div>
        <p className="text-gray-300 mb-3">{profile?.bio || "No bio yet"}</p>
        <div className="flex flex-wrap gap-4 text-sm text-gray-400">
          {profile?.location && <span>📍 {profile.location}</span>}
          {profile?.portfolio_url && <a href={profile.portfolio_url} target="_blank" rel="noopener noreferrer" className="underline hover:text-blue-400">🌐 Website</a>}
          {profile?.linkedin_url && <a href={profile.linkedin_url} target="_blank" rel="noopener noreferrer" className="underline hover:text-blue-400">💼 LinkedIn</a>}
          {profile?.github_url && <a href={profile.github_url} target="_blank" rel="noopener noreferrer" className="underline hover:text-blue-400">💻 GitHub</a>}
        </div>
      </div>

      {/* --- Skills --- */}
      <div className="bg-white/5 backdrop-blur-sm rounded-2xl p-6 border border-white/10 mb-6">
        <div className="flex justify-between items-center mb-4">
          <h3 className="text-lg font-semibold text-white">Skills</h3>
          <div className="flex gap-2">
            <input
              type="text"
              value={newSkill}
              onChange={(e) => setNewSkill(e.target.value)}
              placeholder="Add new skill"
              className="bg-white/10 rounded-lg px-3 py-1.5 text-sm text-white border border-white/20 focus:border-blue-400 focus:outline-none"
            />
            <button
              className="bg-blue-500/20 border border-blue-400 text-blue-300 px-3 py-1.5 rounded-lg flex items-center gap-1 hover:bg-blue-500/30 transition-colors"
              onClick={addSkill}
            >
              <PlusIcon className="w-4 h-4" /> Add
            </button>
          </div>
        </div>
        {skills.length > 0 ? (
          <div className="flex flex-wrap gap-2">
            {skills.map((s) => (
              <div key={s.id} className="flex items-center gap-1 bg-white/10 px-3 py-1 rounded-full text-sm text-gray-200">
                {s.skill_name}
                <TrashIcon className="w-4 h-4 text-gray-400 hover:text-red-400 cursor-pointer" onClick={() => removeSkill(s.id)} />
              </div>
            ))}
          </div>
        ) : (
          <p className="text-gray-400 text-sm">No skills added yet.</p>
        )}
      </div>

      {/* --- Experiences --- */}
      <div className="bg-white/5 backdrop-blur-sm rounded-2xl p-6 border border-white/10">
        <h3 className="text-lg font-semibold text-white mb-4">Experience</h3>

        {experiences.length > 0 ? (
          <ul className="space-y-4">
            {experiences.map((exp) => (
              <li key={exp.id} className="bg-white/10 rounded-xl p-4 border border-white/10 text-gray-300">
                <div className="flex justify-between items-center mb-2">
                  <div>
                    <p className="text-white font-semibold">{exp.title}</p>
                    <p className="text-sm text-gray-400">{exp.company}</p>
                    <p className="text-xs text-gray-500 mt-1">{exp.start_date} → {exp.end_date || "Present"}</p>
                  </div>
                  <TrashIcon className="w-5 h-5 text-gray-400 hover:text-red-400 cursor-pointer" onClick={() => removeExperience(exp.id)} />
                </div>
                <p className="text-sm text-gray-400">{exp.description}</p>
              </li>
            ))}
          </ul>
        ) : (
          <p className="text-gray-400 text-sm mb-3">No experiences yet.</p>
        )}

        {/* Add Experience Form */}
        <div className="mt-6 space-y-2">
          <input type="text" placeholder="Job Title" value={newExperience.title} onChange={(e) => setNewExperience({ ...newExperience, title: e.target.value })} className="w-full bg-white/10 rounded-lg px-3 py-2 text-sm text-white border border-white/20" />
          <input type="text" placeholder="Company" value={newExperience.company} onChange={(e) => setNewExperience({ ...newExperience, company: e.target.value })} className="w-full bg-white/10 rounded-lg px-3 py-2 text-sm text-white border border-white/20" />
          <div className="flex gap-2">
            <input type="date" value={newExperience.start_date} onChange={(e) => setNewExperience({ ...newExperience, start_date: e.target.value })} className="flex-1 bg-white/10 rounded-lg px-3 py-2 text-sm text-white border border-white/20" />
            <input type="date" value={newExperience.end_date} onChange={(e) => setNewExperience({ ...newExperience, end_date: e.target.value })} className="flex-1 bg-white/10 rounded-lg px-3 py-2 text-sm text-white border border-white/20" />
          </div>
          <textarea placeholder="Description" value={newExperience.description} onChange={(e) => setNewExperience({ ...newExperience, description: e.target.value })} className="w-full bg-white/10 rounded-lg px-3 py-2 text-sm text-white border border-white/20" />
          <button className="w-full bg-blue-500/20 border border-blue-400 text-blue-300 px-4 py-2 rounded-lg hover:bg-blue-500/30 transition-colors flex justify-center items-center gap-2" onClick={addExperience}>
            <PlusIcon className="w-4 h-4" /> Add Experience
          </button>
        </div>
      </div>
    </section>
  );
}
