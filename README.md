<div align="center">```
 ██████╗ █████╗ ██████╗ ███████╗███████╗██████╗      
██╔════╝██╔══██╗██╔══██╗██╔════╝██╔════╝██╔══██╗     
██║     ███████║██████╔╝█████╗  █████╗  ██████╔╝     
██║     ██╔══██║██╔══██╗██╔══╝  ██╔══╝  ██╔══██╗     
╚██████╗██║  ██║██║  ██║███████╗███████╗██║  ██║     
 ╚═════╝╚═╝  ╚═╝╚═╝  ╚═╝╚══════╝╚══════╝╚═╝  ╚═╝    
 ██████╗██████╗  █████╗ ███████╗████████╗███████╗██████╗ 
██╔════╝██╔══██╗██╔══██╗██╔════╝╚══██╔══╝██╔════╝██╔══██╗
██║     ██████╔╝███████║█████╗     ██║   █████╗  ██████╔╝
██║     ██╔══██╗██╔══██║██╔══╝     ██║   ██╔══╝  ██╔══██╗
╚██████╗██║  ██║██║  ██║██║        ██║   ███████╗██║  ██║
 ╚═════╝╚═╝  ╚═╝╚═╝  ╚═╝╚═╝        ╚═╝   ╚══════╝╚═╝  ╚═╝
```

### `AI-Powered Career Guidance Platform`

[![Live Demo](https://img.shields.io/badge/🚀_LIVE_DEMO-careercrafter-00C7B7?style=for-the-badge&logo=streamlit&logoColor=white)](https://careercrafter-deps5jbzjd9avnkskgepgu.streamlit.app/)
[![Python](https://img.shields.io/badge/Python-3.10+-3776AB?style=for-the-badge&logo=python&logoColor=white)](https://python.org)
[![Streamlit](https://img.shields.io/badge/Streamlit-FF4B4B?style=for-the-badge&logo=streamlit&logoColor=white)](https://streamlit.io)
[![Google Gemini](https://img.shields.io/badge/Google_Gemini-AI-4285F4?style=for-the-badge&logo=google&logoColor=white)](https://deepmind.google/technologies/gemini/)
[![License: MIT](https://img.shields.io/badge/License-MIT-yellow?style=for-the-badge)](./LICENSE)

<br/>

> *Your career journey, intelligently navigated.*  
> Personalized paths · Peer discovery · AI mentorship — all in one platform.

<br/>

---

</div>

<br/>

## ⚡ What is CareerCrafter?

**CareerCrafter** is an AI-powered web platform built for students and professionals who want more than generic career advice. It combines the reasoning power of **Google Gemini AI** with a peer-matching engine and a persistent chat advisor — so you're never navigating your career alone.

Whether you're a fresh graduate unsure of your path, or a professional pivoting to something new, CareerCrafter meets you exactly where you are.

<br/>

## ✨ Features

<table>
<tr>
<td width="50%">

### 🧠 AI Career Recommendations
Get deeply personalized career path suggestions powered by **Google Gemini**. CareerCrafter analyzes your skills, interests, and goals to surface paths you might never have considered.

</td>
<td width="50%">

### 🤝 Peer Matching Engine
Connect with peers who share your career interests and skill profile. CareerCrafter's matching system helps you find your tribe — people on similar journeys who can grow with you.

</td>
</tr>
<tr>
<td width="50%">

### 💬 Interactive Chat Advisor
Have a real-time conversation with an AI career mentor. Ask anything — from resume tips to industry transitions — and get context-aware, intelligent responses.

</td>
<td width="50%">

### 📂 History & Persistence
All your past recommendations are saved and accessible anytime. Track how your interests evolve and revisit guidance that mattered.

</td>
</tr>
<tr>
<td width="50%">

### 📄 PDF Report Export
Generate and download polished career reports via **ReportLab** — perfect for sharing with mentors, counselors, or keeping as a personal roadmap.

</td>
<td width="50%">

### 👤 User Profiles
Create and manage your personal profile with skills, goals, and a profile picture. Your data shapes every recommendation you receive.

</td>
</tr>
</table>

<br/>

## 🛠️ Tech Stack

```
┌─────────────────────────────────────────────────────────────────┐
│                        CAREERCRAFTER STACK                      │
├──────────────────────┬──────────────────────────────────────────┤
│  Frontend / UI       │  Streamlit                               │
├──────────────────────┼──────────────────────────────────────────┤
│  AI Engine           │  Google Gemini (google-generativeai)     │
├──────────────────────┼──────────────────────────────────────────┤
│  Backend Language    │  Python 3.10+                            │
├──────────────────────┼──────────────────────────────────────────┤
│  Data Layer          │  JSON (users, peers, history, profiles)  │
├──────────────────────┼──────────────────────────────────────────┤
│  PDF Generation      │  ReportLab                               │
├──────────────────────┼──────────────────────────────────────────┤
│  Data Processing     │  Pandas                                  │
├──────────────────────┼──────────────────────────────────────────┤
│  Config Management   │  python-dotenv                           │
└──────────────────────┴──────────────────────────────────────────┘
```

<br/>

## 📁 Project Structure

```
CareerCrafter/
│
├── app.py                  # 🚀 Main Streamlit application entry point
│
├── utils/                  # 🔧 Helper modules & utilities
│
├── data/                   # 📦 Static data assets
│
├── uploads/                # 📸 User-uploaded profile pictures
│
├── users.json              # 👥 Registered user data
├── peers.json              # 🤝 Peer connection data
├── profile.json            # 🪪 User profile information
├── profile_pics.json       # 🖼️ Profile picture references
├── history.json            # 📜 Past recommendation history
│
├── requirements.txt        # 📋 Python dependencies
├── .gitignore
└── LICENSE
```

<br/>

## 🚀 Getting Started

### Prerequisites

- Python **3.10+** installed
- A **Google Gemini API key** — get yours free at [Google AI Studio](https://aistudio.google.com/)

### Installation

**1. Clone the repository**
```bash
git clone https://github.com/Shub-ways/CareerCrafter.git
cd CareerCrafter
```

**2. Create and activate a virtual environment** *(recommended)*
```bash
python -m venv venv

# On Windows
venv\Scripts\activate

# On macOS / Linux
source venv/bin/activate
```

**3. Install dependencies**
```bash
pip install -r requirements.txt
```

**4. Set up your API key**

Create a `.env` file in the project root:
```env
GOOGLE_API_KEY=your_gemini_api_key_here
```

**5. Launch the app**
```bash
streamlit run app.py
```

The app will open automatically at `http://localhost:8501` 🎉

<br/>

## 🌐 Live Demo

> Try it instantly — no installation required.

[![Open App](https://img.shields.io/badge/▶_Open_CareerCrafter-Live_App-00C7B7?style=for-the-badge&logo=streamlit)](https://careercrafter-deps5jbzjd9avnkskgepgu.streamlit.app/)

<br/>

## 📦 Dependencies

| Package | Purpose |
|---|---|
| `streamlit` | Web UI framework |
| `google-generativeai` | Gemini AI integration |
| `python-dotenv` | Environment variable management |
| `pandas` | Data processing & manipulation |
| `reportlab` | PDF generation |

<br/>

## 🗺️ Roadmap

- [ ] OAuth-based authentication
- [ ] Real-time peer messaging
- [ ] Career progress tracker
- [ ] Integration with LinkedIn / GitHub profiles
- [ ] Multi-language support

<br/>

## 🤝 Contributing

Contributions, issues, and feature requests are welcome!

1. Fork the project
2. Create your feature branch: `git checkout -b feature/AmazingFeature`
3. Commit your changes: `git commit -m 'Add some AmazingFeature'`
4. Push to the branch: `git push origin feature/AmazingFeature`
5. Open a Pull Request

<br/>

## 📄 License

Distributed under the **MIT License**. See [`LICENSE`](./LICENSE) for more information.

<br/>

## 👨‍💻 Author

<div align="center">

**Shubham Kumar**

[![GitHub](https://img.shields.io/badge/GitHub-Shub--ways-181717?style=for-the-badge&logo=github)](https://github.com/Shub-ways)

*Built with ❤️ as a Gen AI Project*

---

⭐ **If CareerCrafter helped you, consider giving it a star!** ⭐

</div>
