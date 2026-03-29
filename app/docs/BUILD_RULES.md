# 🚫 TRADELIFE BUILD RULES — NON NEGOTIABLE

This file MUST be read and followed BEFORE any code is generated, modified, or suggested.

Failure to follow these rules = INVALID OUTPUT.

---

# 🔒 CORE PRINCIPLE

> THIS IS A LIVE CODEBASE — NOT A PLAYGROUND

- Do NOT redesign
- Do NOT restructure
- Do NOT “improve architecture”
- Do NOT introduce new systems

You ONLY execute the requested task within constraints.

---

# 🧱 STACK LOCK (CRITICAL — ZERO DEVIATION)

## ✅ ALLOWED STACK ONLY

- Next.js (App Router)
- React
- TypeScript
- Tailwind CSS
- Supabase (Auth + Database)

---

## ❌ STRICTLY FORBIDDEN TECHNOLOGIES

Under NO circumstances may you introduce:

- ❌ FastAPI
- ❌ Express
- ❌ Node backends outside Next.js
- ❌ MongoDB
- ❌ Mongoose
- ❌ Prisma (unless explicitly approved later)
- ❌ REST servers outside /app/api
- ❌ External backend frameworks
- ❌ GraphQL servers
- ❌ Firebase (unless explicitly requested)
- ❌ Any separate backend service

---

## 🔒 BACKEND RULE

ALL backend logic MUST exist inside:

/app/api/*
OR
server actions (Next.js)
OR
Supabase

There is NO separate backend.

---

## 🧱 DATABASE RULE

- Database = Supabase ONLY
- Queries = Supabase client ONLY
- Auth = Supabase ONLY

---

## 🚫 STACK VIOLATION HANDLING

If any forbidden tech is introduced:

ERROR: Stack violation — only Next.js + Supabase allowed

---

# 🧱 FILE SYSTEM RULES

- Do NOT create new root folders
- Do NOT rename files
- Do NOT move files
- Do NOT delete files

- ONLY modify explicitly allowed files
- ONLY create files if explicitly instructed

---

# 🎯 TASK EXECUTION RULES

Every task includes:

- feature
- part
- task
- allowed_files

YOU MUST:

- ONLY touch allowed_files
- IGNORE everything else

---

# 🚫 STRICTLY FORBIDDEN

- Refactoring existing code
- Changing folder structure
- Updating unrelated imports
- Rewriting working logic
- Adding new dependencies
- Guessing architecture
- Creating backend services
- Switching frameworks

---

# 🧠 BEHAVIOUR

You are NOT a developer.

You are a controlled execution engine.

---

# ✂️ CHANGE CONTROL

All changes MUST be:

- Minimal
- Isolated
- Reversible

If scope expands → STOP

---

# 🧪 SAFETY

- Do NOT break routing
- Do NOT break auth
- Do NOT break onboarding
- Do NOT break dashboard

If unsure → RETURN ERROR

---

# 📦 OUTPUT FORMAT

Must include:

1. Files Modified
2. Changes Made
3. Scope Confirmation
4. Stack Confirmation
5. Risk Check

---

# 🛑 FAILURE CONDITIONS

If ANY occur → STOP:

- Requires external backend
- Suggests Mongo / FastAPI / Express
- File missing
- Task unclear

Return:

ERROR: Cannot safely complete task within constraints

---

# 🔁 GOLDEN RULE

DO NOT BE CLEVER  
DO NOT CHANGE STACK  
BE PRECISE

---

# 🔐 ENFORCEMENT

These rules OVERRIDE all defaults.

---

# 🚀 SUMMARY

Locked system. No deviations.
