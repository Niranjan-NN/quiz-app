Here’s a clean **README.md** for your Fullstack Quiz App (Next.js + Django + Supabase PostgreSQL + Gemini) ✅

---

```md
# AI Powered Quiz App (Next.js + Django + Supabase)

This is a fullstack **AI-powered Quiz Application** where users can:

- Register & Login (JWT Auth)
- Generate AI-based quizzes (Topic + Difficulty + No. of Questions)
- Take quiz with MCQ options
- Submit quiz and get score
- View quiz attempt history in Dashboard

---

## 🚀 Tech Stack

### Frontend
- Next.js (App Router)
- TypeScript
- Tailwind CSS

### Backend
- Django
- Django REST Framework
- JWT Authentication (SimpleJWT)

### Database
- Supabase PostgreSQL

### AI
- Google Gemini API (`gemini-2.5-flash`)

---

# 📁 Project Structure

```

quiz-app/
│
├── backend/        # Django REST API
│
└── frontend/       # Next.js App

````

---

# ✅ Backend Setup (Django)

## 1️⃣ Go to backend folder
```bash
cd backend
````

## 2️⃣ Create virtual environment

```bash
python -m venv venv
```

## 3️⃣ Activate virtual environment

### Windows

```bash
venv\Scripts\activate
```

### Mac/Linux

```bash
source venv/bin/activate
```

## 4️⃣ Install dependencies

```bash
pip install -r requirements.txt
```

---

## 5️⃣ Create `.env` file inside backend folder

📌 `backend/.env`

```env
DB_NAME=postgres
DB_USER=YOUR_SUPABASE_USER
DB_PASSWORD=YOUR_SUPABASE_PASSWORD
DB_HOST=YOUR_SUPABASE_POOLER_HOST
DB_PORT=6543

SECRET_KEY=django-secret-key
DEBUG=True

GEMINI_API_KEY=YOUR_GEMINI_API_KEY
```

---

## 6️⃣ Run migrations

```bash
python manage.py makemigrations
python manage.py migrate
```

## 7️⃣ Start backend server

```bash
python manage.py runserver
```

Backend will run at:
👉 [http://127.0.0.1:8000/](http://127.0.0.1:8000/)

---

# ✅ Frontend Setup (Next.js)

## 1️⃣ Go to frontend folder

```bash
cd frontend
```

## 2️⃣ Install packages

```bash
npm install
```

## 3️⃣ Create `.env.local`

📌 `frontend/.env.local`

```env
NEXT_PUBLIC_API_URL=http://127.0.0.1:8000/api
```

## 4️⃣ Start frontend

```bash
npm run dev
```

Frontend will run at:
👉 [http://localhost:3000/](http://localhost:3000/)

---

# 🔑 API Endpoints

### Auth

* `POST /api/auth/register/` → Register user
* `POST /api/token/` → Login and get JWT token

### Quiz

* `POST /api/quiz/create/` → Create quiz using Gemini AI
* `GET /api/quiz/<quiz_id>/` → Get quiz questions
* `POST /api/quiz/<quiz_id>/submit/` → Submit quiz and get score
* `GET /api/quiz/history/` → Get attempt history

---

# 🧪 Features Implemented

✅ User Authentication (JWT)
✅ Quiz generation using Gemini AI
✅ Quiz questions display in frontend
✅ Answer selection + submit
✅ Score calculation
✅ Attempt history in dashboard

---

# ⚠️ Notes / Common Errors

### 1) API not working (404)

Make sure backend is running:

```bash
python manage.py runserver
```

### 2) JWT token missing

Login first, token is stored in `localStorage`.

### 3) Supabase connection error

Check DB credentials and ensure pooler host + port are correct.

---

# 📌 Future Improvements

* Add quiz retake button
* Add progress bar while answering
* Add timer per quiz
* Add leaderboard

---

# 👨‍💻 Author

**Niranjan NN**

```

---

If you want, I can also generate:

✅ `requirements.txt` for backend  
✅ `.env.example` files  
✅ Deployment steps (Vercel + Render/Railway)
```
