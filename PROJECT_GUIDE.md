# DevRecall – Project Guide (samajhne ke liye + viva ke liye)

Ye guide padh ke tum poora project explain kar paogi: kya bana hai, kaise bana hai, kaunsi file kya karti hai, aur viva me kya poochha ja sakta hai.

---

## 1. Project kya hai (30 second pitch)

> "DevRecall ek web platform hai jahan developers aur CS students JavaScript, Python, DBMS, OS, DSA jaise subjects topic-by-topic revise kar sakte hain. Doubt ho to AI tutor se pooch sakte hain, aur AI automatically quiz banata hai jisse pata chalta hai kaunsa topic weak hai. Dashboard progress aur daily streak dikhata hai. Koi bhi naya subject (Rust, Docker, Computer Networks…) type karo to AI uska poora curriculum bana deta hai."

**LMS me jo description submit hui thi, uske har point ka mapping:**

| Description me likha tha | Project me kahan hai |
|---|---|
| Sign up, log in securely | `Auth` page + `authController` (bcrypt + JWT + validations) |
| Pick a language/subject (JS, Python, DBMS) | `Subjects` page, 5 seeded subjects + AI se koi bhi naya |
| Content topic by topic | `SubjectDetail` + `Topic` page (summary, key points, code example) |
| AI chatbot for doubts | `Chat` page + `/api/chat` |
| Quizzes automatically | `QuizStart` / `QuizRun` + `/api/quiz/*` |
| Dashboard, progress, daily streaks | `Dashboard` + `Progress` page, `streak.js` |
| Works on phones and laptops | Responsive CSS (bottom navigation on mobile) |

---

## 2. Tech stack aur kyu

| Layer | Technology | Kyu |
|---|---|---|
| Frontend | React 18 + Vite + React Router | Component-based UI, fast dev server, multiple pages bina reload ke |
| Styling | Plain CSS with variables | Dark/light theme easily, koi extra library nahi |
| Backend | Node.js + Express | REST API, JavaScript hi frontend aur backend dono me |
| Database | MongoDB + Mongoose | Flexible documents (topics subject ke andar embed hote hain) |
| Auth | JWT + bcryptjs | Stateless login, password hashed |
| AI | Gemini / Groq / OpenRouter (free tiers) | Free, aur ek khatam ho to doosra automatically use hota hai |
| Security | helmet, cors, express-rate-limit | Standard Express hardening |

---

## 3. Architecture

```
 Browser (React app)
     │  axios  →  /api/...   (token: Authorization: Bearer <JWT>)
     ▼
 Express API (backend)
  ├─ routes → middleware (protect = JWT check) → controllers
  ├─ models (Mongoose)  ───────────►  MongoDB (users, subjects, progress, quizzes)
  └─ services/aiService.js ────────►  Free LLM providers
                                        Gemini → Groq → OpenRouter  (fallback chain)
```

Request ka flow (example: "Mark as completed" click):
1. `Topic.jsx` → `api.post("/progress/toggle")` (axios token khud laga deta hai, `api.js`)
2. Express `routes/index.js` → `protect` middleware token verify karta hai → `progressController.toggle`
3. Controller `Progress` collection me save karta hai, `recordActivity()` se streak update hota hai
4. JSON response wapas → React state update → button "Completed" ho jata hai aur top bar me streak badal jata hai

---

## 4. Folder structure

### Backend (`backend/`)
```
server.js                      entry: env check → DB connect → seed → listen
src/app.js                     express app: helmet, cors, json, routes, error handler
src/config/db.js               MongoDB connection
src/models/
   User.js                     name, email, hashed password, streak, activityDates
   Subject.js                  name, icon, topics[] (embedded: title, summary, keyPoints, example)
   Progress.js                 user + topicId + completed   (unique per user+topic)
   Quiz.js                     questions (with answers), user's answers, score, status
src/controllers/
   authController.js           signup, login, me
   subjectController.js        list, getOne, getTopic, generate (AI subject)
   progressController.js       toggle topic completed
   quizController.js           generate, getOne, submit (grading), history
   chatController.js           AI tutor
   dashboardController.js      all dashboard numbers in one API call
src/middleware/auth.js         protect: verifies JWT
src/middleware/errorHandler.js clean JSON errors
src/routes/index.js            all URLs + rate limits
src/services/aiService.js      ALL AI logic (chat, quiz, subject) + provider fallback
src/utils/validators.js        signup rules, subject-name rules
src/utils/streak.js            streak calculation
src/seed/subjects.js           5 subjects × 5 topics starter content
```

### Frontend (`frontend/src/`)
```
main.jsx, App.jsx              entry + route table
api.js                         axios instance (adds token automatically)
context/AuthContext.jsx        logged-in user state (login, signup, logout, refreshUser)
components/Layout.jsx          sidebar (desktop), top bar, bottom nav (mobile), theme toggle
components/ProtectedRoute.jsx  blocks pages if not logged in
components/ui.jsx              Spinner, ErrorBox, ProgressBar, TrendChart (SVG)
pages/                         Auth, Dashboard, Subjects, SubjectDetail, Topic,
                               Chat, QuizStart, QuizRun (taking + result), Progress
utils/helpers.js               date format, theme hook, signup form validation
styles.css                     whole design system (dark + light theme)
```

---

## 5. Database design

| Collection | Important fields |
|---|---|
| **users** | `name`, `email` (unique), `password` (bcrypt hash, hidden by default), `streak {current, longest, lastActive}`, `activityDates[]` |
| **subjects** | `name`, `slug` (unique), `icon`, `color`, `topics[ {title, summary, keyPoints[], example{language, code}} ]`, `isCustom`, `createdBy` |
| **progresses** | `user`, `subject`, `topicId`, `completed`, `completedAt` — unique index on (user, subject, topicId) |
| **quizzes** | `user`, `subject`, `topicId`, `questions[ {question, options[4], answerIndex, explanation} ]`, `answers[]`, `score`, `total`, `status` (pending/submitted) |

**Design decision (viva me bol sakti ho):** topics ko subject ke andar *embed* kiya kyunki hum hamesha subject ke saath topics load karte hain (ek query me sab). Progress alag collection me hai kyunki wo har user ke liye alag hota hai.

---

## 6. Features kaise bane (important logic)

### 6.1 Signup / Login
- `validators.js` me rules: naam 2–80 letters only, valid email, disposable emails (mailinator etc.) blocked, password min 8 + letter + number.
- Frontend (`helpers.js`) me same rules, taaki typing ke time hi error dikhe. **Server pe bhi check hota hai** (frontend pe bharosa nahi karte).
- Password `bcrypt.hash(password, 10)` se hash hota hai — database me plain password kabhi nahi jata.
- Login pe `bcrypt.compare`. Galat email aur galat password dono pe **same message** ("Invalid email or password") taaki koi ye na pata kar sake ki email registered hai ya nahi.
- Login ke baad server **JWT token** deta hai (7 din valid). Frontend isse `localStorage` me rakhta hai aur har request me bhejta hai. `protect` middleware token verify karke `req.user` set karta hai.

### 6.2 Topic-wise content aur progress
- Starter content `seed/subjects.js` me hai (5 subjects × 5 topics). Server pehli baar chalte hi DB me daal deta hai (`seedSubjects`) — already hai to dobara nahi daalta.
- "Mark as completed" → `Progress` document upsert hota hai. Subject card pe `completedCount / topicCount` se progress bar banta hai.

### 6.3 Daily streak (`utils/streak.js`)
- Jab user kuch padhai wala kaam kare (topic complete, quiz submit, AI se sawal) → `recordActivity(user)`.
- Agar aaj ka din already count ho chuka → kuch nahi. Agar `lastActive` kal tha → `current + 1`. Warna `current = 1`.
- Dikhane ke time `currentStreak()` check karta hai ki last activity aaj ya kal thi — warna 0 dikhata hai (streak toot gayi).
- Din ka calculation India timezone (+5:30) me hota hai (`TZ_OFFSET_MINUTES`).

### 6.4 AI Tutor (Chat)
- Frontend last 8 messages `history` ke saath bhejta hai. Server ek **system prompt** banata hai: "tum friendly tutor ho, Markdown me jawab do, Hinglish me pooche to Hinglish me jawab do, non-tech sawal pe wapas padhai pe lao".
- Agar user kisi topic se chat khol raha hai ("Ask AI about this"), to us topic ka summary + key points bhi system prompt me jaate hain, isliye jawab context-aware hota hai.
- Reply `react-markdown` se render hota hai (code blocks, lists sahi dikhte hain).

### 6.5 Quiz (sabse zyada puchha jaane wala part)
1. `POST /quiz/generate` → server AI ko topic ka content deta hai aur JSON me 5 MCQ maangta hai.
2. Server response ko **validate** karta hai (4 options, answerIndex 0–3 etc.) aur galat questions hata deta hai. Options ko **shuffle** karta hai taaki correct answer hamesha ek jagah na ho.
3. Quiz DB me *answers ke saath* save hota hai, lekin browser ko **sirf questions + options** bhejte hain (answers nahi) — isliye user network tab se cheating nahi kar sakta.
4. `POST /quiz/:id/submit` → **server pe grading** hoti hai, score save hota hai, streak update hota hai. Dobara submit karne pe score change nahi hota.
5. Result page par har question ka review + explanation dikhta hai.

### 6.6 "Koi bhi subject" (AI se curriculum)
- User "Kotlin" type karta hai → `POST /subjects/generate`.
- Pehle DB me slug se check hota hai (`kotlin`). Mil gaya to wahi return (**cache** — AI dobara call nahi hota, free quota bachta hai).
- Nahi mila to AI se 6 topics ka curriculum JSON me banwaya jata hai, validate karke `Subject` (isCustom = true) me save hota hai. Ab ye sab users ko dikhega.
- Non-technical subject (jaise "Cooking") pe AI `not_technical` bolta hai aur user ko friendly error milta hai.

### 6.7 Free AI models + fallback (`aiService.js`)
- Teen providers: **Gemini**, **Groq**, **OpenRouter** (teeno ka free tier hai).
- `.env` me jo keys hain unhi providers ko `AI_PROVIDERS` ke order me try kiya jata hai.
- Agar kisi provider ka free quota khatam (HTTP 429), model retire (404), ya timeout ho → **automatically agla model/provider** try hota hai. Galat key (401/403) pe wo provider skip hota hai.
- Sab fail ho jaye to user ko saaf message milta hai ("free AI quota is used up, wait a minute").
- Free models kabhi kabhi JSON ke aas-paas extra text likh dete hain, isliye `parseJSON` lenient hai (pehle `{` se aakhri `}` tak nikalta hai) aur ek baar retry karta hai.

### 6.8 Dashboard
- `GET /dashboard` ek hi call me sab deta hai: streak, stats (topics done, quizzes, average), last 7 din ki activity, "Continue learning" (agla incomplete topic), subject-wise progress, recent quizzes, score trend.
- Score trend chart plain **SVG** se bana hai (koi chart library nahi).

---

## 7. API list

| Method | URL | Kya karta hai | Login? |
|---|---|---|---|
| POST | `/api/auth/signup` | naya account | – |
| POST | `/api/auth/login` | login | – |
| GET | `/api/auth/me` | current user + streak | ✔ |
| GET | `/api/dashboard` | dashboard data | ✔ |
| GET | `/api/subjects` | sab subjects + mera progress | ✔ |
| POST | `/api/subjects/generate` | AI se naya subject | ✔ |
| GET | `/api/subjects/:id` | subject + topics list | ✔ |
| GET | `/api/subjects/:id/topics/:topicId` | topic ka poora content | ✔ |
| POST | `/api/progress/toggle` | topic complete / undo | ✔ |
| POST | `/api/quiz/generate` | naya quiz | ✔ |
| GET | `/api/quiz/history` | meri quiz history | ✔ |
| GET | `/api/quiz/:id` | quiz (pending) ya review (submitted) | ✔ |
| POST | `/api/quiz/:id/submit` | answers submit, grading | ✔ |
| POST | `/api/chat` | AI tutor | ✔ |
| GET | `/api/health` | server alive check | – |

---

## 8. Security (viva me zaroor bolna)

1. Passwords **bcrypt** hash (salt rounds 10); API kabhi password wapas nahi bhejti.
2. **JWT** auth; protected routes `protect` middleware se.
3. **Input validation** server par (frontend ke alawa) + disposable email block.
4. **Rate limiting**: auth routes 30 requests / 15 min (brute force rokne ke liye), AI routes 40 / 10 min (free quota bachane ke liye).
5. **helmet** (secure HTTP headers) aur **CORS** sirf allowed frontend URL ke liye.
6. Quiz answers browser ko tab tak nahi jaate jab tak submit na ho; grading server pe.
7. **Ownership check**: koi user doosre ka quiz nahi dekh sakta (404 milta hai).
8. API keys sirf backend `.env` me — frontend me kabhi nahi. `.env` `.gitignore` me hai.

---

## 9. Free AI keys kaise banayein (5 minute)

1. **Gemini**: https://aistudio.google.com/apikey → "Create API key" → `GEMINI_API_KEY`
2. **Groq**: https://console.groq.com/keys → "Create API Key" → `GROQ_API_KEY`
3. **OpenRouter**: https://openrouter.ai/keys → "Create key" → `OPENROUTER_API_KEY`

Suggestion: **Gemini + Groq dono** bana lo. Viva ke time ek ka quota khatam bhi ho jaye to doosra chal jayega. Keys kabhi GitHub pe push mat karna.

---

## 10. Maine kya test kiya (aur kya tumhe khud dekhna hai) — honest note

**Test ho chuka hai:**
- Backend ke 40 API tests (signup validations, duplicate email, wrong password, JWT protection, subjects, progress, streak, quiz generate/grade/review, doosre user ka quiz block, chat, custom subject cache, dashboard) — sab pass.
- AI provider layer ke 12 tests (fake Gemini/Groq/OpenRouter servers ke saath): quota khatam → next provider, galat key, model retire, provider order, koi key nahi, sab fail, chatty JSON parsing — sab pass.
- Pura UI journey (signup validation → dashboard → subject → topic → complete → quiz → result → chat → naya subject → progress → logout/login) real backend ke saath automated test me pass; frontend production build bhi pass.

**Jo main yahan se nahi kar paya (tumhe check karna hai):**
1. **Asli Gemini / Groq / OpenRouter ko call** — mere environment se ye sites reachable nahi thi, isliye testing fake servers se hui. Code in providers ke documented API format par hai, lekin **tumhari keys ke saath ek baar chat + quiz + naya subject zaroor try karna**. Agar model naam purana nikle to `.env` me `*_MODELS` badal do.
2. **Real MongoDB Atlas** — maine MongoDB-compatible server par test kiya. Atlas par bhi chalna chahiye, lekin pehli baar `npm run dev` pe "MongoDB connected" dikhna chahiye (Atlas me IP `0.0.0.0/0` allow karna mat bhulna).
3. **Real browser / phone me dikhna** — UI maine jsdom me chalaya aur build kiya, par screen pe khud nahi dekha. Ek baar laptop aur phone me khol ke dekh lena; rang/spacing ka koi change chahiye ho to batana.

---

## 11. Viva Q&A

**Q1. Aapne MERN stack kyu chuna?** React se interactive multi-page UI, Express se simple REST API, MongoDB ka flexible schema (topics subject me embed), aur poora project ek hi language (JavaScript) me.

**Q2. JWT kya hai aur kaise use kiya?** Login pe server ek signed token deta hai. Browser har request me `Authorization: Bearer <token>` bhejta hai; `protect` middleware signature verify karke user pehchanta hai. Session store karne ki zarurat nahi.

**Q3. Password kaise safe hai?** bcrypt se hash + salt. Hash se original password wapas nahi nikal sakte; login pe `bcrypt.compare` hota hai.

**Q4. AI se kya kya karwaya?** Teen kaam: tutor chat, quiz generation, aur naye subject ka curriculum. Teeno me prompt engineering + response validation hai.

**Q5. AI galat ya kharab JSON de to?** `parseJSON` lenient hai, ek baar retry hota hai, aur har question validate hota hai (4 options, valid answerIndex). Valid questions 3 se kam ho to user ko error milta hai, kharab quiz nahi milta.

**Q6. Free quota khatam ho jaye to?** `aiService` automatically agle model/provider pe chala jata hai (Gemini → Groq → OpenRouter). Naye subjects DB me cache hote hain, isliye same subject ke liye AI dobara call nahi hota.

**Q7. Quiz me cheating kaise rokte ho?** Correct answers DB me hain lekin browser ko submit se pehle nahi jaate; grading server pe hoti hai; dobara submit se score nahi badalta.

**Q8. Streak kaise kaam karti hai?** Har study activity pe `recordActivity` check karta hai ki `lastActive` kal tha ya aaj. Kal tha to +1, aaj tha to kuch nahi, warna 1 se restart. Din ka hisaab IST me.

**Q9. Mobile responsive kaise banaya?** CSS media queries: 860px se neeche sidebar hat jata hai aur bottom navigation aata hai; grids single column ho jaate hain.

**Q10. Is project ka novelty/innovation?** (a) Koi bhi subject type karo to AI curriculum + quizzes banata hai, fixed content pe depend nahi; (b) free LLMs ke beech automatic fallback; (c) quizzes server-graded aur progress/streak se linked — sirf flashcard app nahi.

**Q11. Limitations?** AI answers 100% accurate nahi hote (isliye seeded content hand-written hai); free quota limited; abhi sirf MCQ quiz; email verification nahi hai.

**Q12. Future scope?** Spaced repetition (weak topics baar baar), apni coding mistakes se personal revision cards, active-recall (type karke answer, AI evaluate kare), leaderboard, email verification/reCAPTCHA, PWA/mobile app.

---

## 12. Report (capstone) ke liye mapping

| Chapter | Kya likhna hai |
|---|---|
| 1 Introduction | Problem: revision material bikhra hua, passive padhna. Aim, scope, importance (exam + interview prep) |
| 2 Review of Literature | Anki/Quizlet jaise tools aur limitations; active recall / spaced repetition research; GenAI in education (papers oldest → latest) |
| 3 Implementation | Section 2–8 of this guide: architecture, DB design, AI prompts, fallback, security |
| 4 Results & Discussion | Screenshots: login, dashboard, subjects, topic, chat, quiz, result, progress (dark + mobile view bhi), test results (40 API tests) |
| 5 Conclusion & Future Scope | Section 11 (Q11, Q12) |

**Screenshots list (Chapter 4):** Signup (validation errors), Dashboard, Subjects + "Add with AI", Topic page, AI Tutor answer, Quiz question, Quiz result + review, Progress page, mobile view (bottom nav).
