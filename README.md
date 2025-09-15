---

# 🏠 Hostel Management System

A full-stack **Hostel Management System** built with **Django REST Framework (DRF)** on the backend and **Next.js (React + TypeScript)** on the frontend.
The system streamlines hostel operations with features for students, admins, and wardens — including room allocation, outpass management, issue tracking, and announcements.

---

## 🚀 Features

### 👨‍🎓 Student Portal

* View allocated room details.
* Apply for outpasses (leave requests).
* Track status of outpasses.
* Report hostel issues (maintenance/complaints).
* View announcements from the warden/admin.

### 🛡️ Admin/Warden Portal

* Allocate and manage student rooms.
* Approve/reject outpasses.
* Manage and resolve reported issues.
* Create and broadcast announcements.
* Dashboard with summarized hostel activity.

---

## 🏗️ Tech Stack

### Frontend

* [Next.js](https://nextjs.org/) (React + TypeScript)
* [Tailwind CSS](https://tailwindcss.com/) for styling
* Axios for API calls
* Context API for state management

### Backend

* [Django](https://www.djangoproject.com/)
* [Django REST Framework (DRF)](https://www.django-rest-framework.org/)
* SQLite

---

## 📂 Project Structure

```
hostel-management/
│
├── backend/              # Django REST API
│   ├── api/              # DRF apps (rooms, allocations, outpasses, issues, announcements)
│   ├── settings.py       # Django settings
│   └── ...
│
├── frontend/             # Next.js client
│   ├── components/       # Reusable UI components
│   │   ├── student-dashboard-content.tsx
│   │   ├── outpass-list.tsx
│   │   ├── issue-list.tsx
│   │   └── announcement-list.tsx
│   ├── lib/api.ts        # Axios instance with interceptors
│   └── pages/            # Next.js pages
│       ├── student/      # Student routes (/dashboard, /outpass, /issues, /announcements)
│       └── admin/        # Admin/Warden routes
│
└── README.md
```

---

## ⚡ Getting Started

### 1️⃣ Clone the Repository

```bash
git clone https://github.com/R-Nikhil-Ganesh/Hostel-Management.git
cd hostel-management
```

### 2️⃣ Backend Setup (Django)

```bash
cd backend
python -m venv venv
source venv/bin/activate   # On Windows: venv\Scripts\activate
pip install -r requirements.txt

# Run migrations
python manage.py migrate

# Create superuser (for admin access)
python manage.py createsuperuser

# Start server
python manage.py runserver
```

The backend will be available at:
👉 `http://localhost:8000/api/v1/`

---

### 3️⃣ Frontend Setup (Next.js)

```bash
cd frontend
npm install
npm run dev
```

The frontend will be available at:
👉 `http://localhost:3000`

---

## 🔑 Authentication

* JWT-based authentication (access + refresh tokens).
* Tokens are automatically attached via Axios interceptors in `frontend/lib/api.ts`.
* Login is required for both **students** and **admins**.

---

## 📌 Roadmap

* [ ] Email notifications for outpass approval/rejection.
* [ ] Hostel fee/payment management.
* [ ] Mobile app version (React Native/Flutter).

---

## 🤝 Contributors

* S.Nandhini - Backend
* R. Nikhil Ganesh - Frontend
