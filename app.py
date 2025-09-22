import json
import streamlit as st
from utils.gemini_helper import get_gemini_response
from reportlab.platypus import SimpleDocTemplate, Paragraph, Spacer
from reportlab.lib.styles import getSampleStyleSheet
from io import BytesIO
import os
import hashlib
import tempfile
import shutil
import base64
from PIL import Image

import os
from pathlib import Path
from dotenv import load_dotenv

# Explicitly point to .env in the project root
dotenv_path = Path(__file__).parent / ".env"
load_dotenv(dotenv_path=dotenv_path)

# Test if GEMINI_API_KEY is loaded
api_key = os.getenv("GEMINI_API_KEY")
if api_key is None:
    raise ValueError("GEMINI_API_KEY not loaded! Check your .env file.")
print("API Key loaded successfully:", api_key)


# ---- Page Config ----
st.set_page_config(page_title="AI Career & Skills Advisor", layout="wide")

# st.title("🎯 AI Career & Skills Advisor")
# st.markdown("Helping students and professionals explore personalized career paths 🚀")

# ---- Files ----
HISTORY_FILE = "history.json"
PEERS_FILE = "peers.json"
PROFILE_FILE = "profile.json"
USERS_FILE = "users.json"  # Store login credentials (hashed)
PROFILE_PICS_FILE = "profile_pics.json"
DEFAULT_PROFILE_PIC = "default_photo.png"  # Make sure this file exists

# ---- Helpers ----
def atomic_save_json(file, data):
    try:
        with tempfile.NamedTemporaryFile("w", delete=False, dir=".", encoding="utf-8") as tf:
            json.dump(data, tf, indent=4)
            tempname = tf.name
        shutil.move(tempname, file)
    except Exception as e:
        st.error(f"File save error: {e}")

@st.cache_data
def load_json(file):
    try:
        if os.path.exists(file):
            with open(file, "r") as f:
                content = f.read().strip()
                if not content:
                    return {} if file in [PROFILE_FILE, USERS_FILE, PROFILE_PICS_FILE] else []
                return json.loads(content)
    except Exception:
        pass
    return {} if file in [PROFILE_FILE, USERS_FILE, PROFILE_PICS_FILE] else []

def hash_password(password):
    return hashlib.sha256(password.encode()).hexdigest()

def verify_password(password, hashed):
    return hash_password(password) == hashed

# ---- Session State Initialization ----
for key in ["history", "peers", "chat", "profile", "profile_saved", "logged_in", "username", "page", "profile_photo"]:
    if key not in st.session_state:
        if key == "logged_in":
            st.session_state[key] = False
        elif key == "username":
            st.session_state[key] = ""
        elif key == "profile_saved":
            st.session_state[key] = False
        elif key == "page":
            st.session_state[key] = "📝 Profile"
        elif key == "history":
            all_history = load_json(HISTORY_FILE)
            current_user = st.session_state.get("username", "")
            st.session_state.history = all_history.get(current_user, [])
        elif key == "profile_photo":
            st.session_state[key] = DEFAULT_PROFILE_PIC
        else:
            st.session_state[key] = load_json({
                "peers": PEERS_FILE,
                "profile": PROFILE_FILE
            }.get(key, ""))

# ---- Load users and profile pictures ----
users = load_json(USERS_FILE)
profile_pics = load_json(PROFILE_PICS_FILE)

# ---- Login / Logout Functions ----
def login(username, password):
    if username in users and verify_password(password, users[username]):
        st.session_state.logged_in = True
        st.session_state.username = username

        # Load profile
        all_profiles = load_json(PROFILE_FILE)
        profile_data = all_profiles.get(username, {
            "Name": username,
            "Age": 18,
            "Education": "Undergraduate",
            "Career Interests": [],
            "Skills": []
        })
        st.session_state.profile = profile_data

        # Load profile picture
        if username not in profile_pics:
            profile_pics[username] = DEFAULT_PROFILE_PIC
            atomic_save_json(PROFILE_PICS_FILE, profile_pics)
        st.session_state.profile_photo = profile_pics[username]

        st.session_state.page = "📝 Profile"
        st.success(f"Welcome {username}!")
        st.rerun()
    else:
        st.error("Invalid username or password")

def logout():
    st.session_state.logged_in = False
    st.session_state.username = ""
    st.session_state.page = "📝 Profile"
    st.rerun()

# ---- Enhanced Login/Signup Card Styling ----
def login_card():
    st.markdown("""
        <style>
        @import url('https://fonts.googleapis.com/css2?family=Inter:wght@300;400;500;600;700&display=swap');
        
        .main-container {
            padding: 2rem 1rem;
            min-height: 100vh;
            background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
            display: flex;
            align-items: center;
            justify-content: center;
        }
        
        .login-card {
            max-width: 420px;
            width: 100%;
            padding: 2rem 1.5rem;
            border-radius: 20px;
            background: rgba(255, 255, 255, 0.95);
            backdrop-filter: blur(10px);
            box-shadow: 0 20px 40px rgba(0, 0, 0, 0.1);
            border: 1px solid rgba(255, 255, 255, 0.2);
            text-align: center;
            position: relative;
            margin: 1rem auto;
        }
        
        .login-header {
            margin-bottom: 2rem;
        }
        
        .login-logo {
            width: 60px;
            height: 60px;
            background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
            border-radius: 15px;
            margin: 0 auto 1rem;
            display: flex;
            align-items: center;
            justify-content: center;
            font-size: 1.8rem;
            box-shadow: 0 8px 20px rgba(102, 126, 234, 0.3);
        }
        
        .login-title {
            font-family: 'Inter', sans-serif;
            font-size: 1.8rem;
            font-weight: 700;
            background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
            -webkit-background-clip: text;
            -webkit-text-fill-color: transparent;
            background-clip: text;
            margin-bottom: 0.5rem;
        }
        
        .login-subtitle {
            font-family: 'Inter', sans-serif;
            font-size: 0.9rem;
            color: #666;
            font-weight: 400;
            margin-bottom: 1.5rem;
        }
        
        .auth-section-title {
            font-size: 1.3rem;
            color: #667eea;
            margin: 1rem 0;
            font-weight: 600;
        }
        
        .feature-highlight {
            display: flex;
            justify-content: space-around;
            margin-top: 1.5rem;
            padding-top: 1.5rem;
            border-top: 1px solid #e9ecef;
        }
        
        .feature-item {
            text-align: center;
            flex: 1;
            padding: 0 0.3rem;
        }
        
        .feature-icon {
            width: 35px;
            height: 35px;
            background: linear-gradient(135deg, #f093fb 0%, #f5576c 100%);
            border-radius: 8px;
            margin: 0 auto 0.5rem;
            display: flex;
            align-items: center;
            justify-content: center;
            font-size: 1rem;
        }
        
        .feature-text {
            font-size: 0.75rem;
            color: #666;
            font-weight: 500;
            line-height: 1.2;
        }
        
        /* Streamlit component overrides */
        .stTextInput > div > div > input {
            border-radius: 10px !important;
            border: 2px solid #e9ecef !important;
            padding: 0.8rem 1rem !important;
            font-size: 0.9rem !important;
            transition: all 0.3s ease !important;
        }
        
        .stTextInput > div > div > input:focus {
            border-color: #667eea !important;
            box-shadow: 0 0 0 3px rgba(102, 126, 234, 0.1) !important;
        }
        
        .stButton > button {
            width: 100% !important;
            background: linear-gradient(135deg, #667eea 0%, #764ba2 100%) !important;
            border: none !important;
            border-radius: 10px !important;
            color: white !important;
            font-weight: 600 !important;
            font-size: 1rem !important;
            padding: 0.8rem 1.5rem !important;
            transition: all 0.3s ease !important;
            box-shadow: 0 4px 12px rgba(102, 126, 234, 0.3) !important;
            margin: 0.5rem 0 !important;
        }
        
        .stButton > button:hover {
            transform: translateY(-2px) !important;
            box-shadow: 0 6px 20px rgba(102, 126, 234, 0.4) !important;
        }
        
        .stButton > button:active {
            transform: translateY(0) !important;
        }
        
        /* Hide Streamlit elements that might cause issues */
        .stDeployButton {
            display: none;
        }
        
        #MainMenu {
            visibility: hidden;
        }
        
        footer {
            visibility: hidden;
        }
        
        /* Responsive adjustments */
        @media (max-width: 480px) {
            .login-card {
                margin: 0.5rem;
                padding: 1.5rem 1rem;
            }
            
            .login-title {
                font-size: 1.5rem;
            }
            
            .feature-text {
                font-size: 0.7rem;
            }
        }
        </style>
        """, unsafe_allow_html=True)

# ---- Login / Sign Up ----
if not st.session_state.logged_in:
    # Apply the styling first
    login_card()
    
    # Create the login card
    with st.container():
        
        # Header section
        st.markdown("""
            <div class='login-header'>
                <div class='login-title'>CareerCrafter</div>
                <div class='login-subtitle'>Your AI-Powered Career Guide</div>
            </div>
        """, unsafe_allow_html=True)
        
        # Auth mode toggle using Streamlit columns
        col1, col2 = st.columns(2)
        
        with col1:
            login_clicked = st.button("🔑 Login", key="login_tab", use_container_width=True)
        with col2:
            signup_clicked = st.button("📝 Sign Up", key="signup_tab", use_container_width=True)
        
        # Initialize auth mode in session state
        if 'auth_mode' not in st.session_state:
            st.session_state.auth_mode = "Login"
        
        # Update auth mode based on button clicks
        if login_clicked:
            st.session_state.auth_mode = "Login"
        elif signup_clicked:
            st.session_state.auth_mode = "Sign Up"
        
        auth_mode = st.session_state.auth_mode

        # Login Form
        if auth_mode == "Login":
            st.markdown("<h3 class='auth-section-title'>👋 Welcome Back!</h3>", unsafe_allow_html=True)
            with st.form("login_form", clear_on_submit=True):
                username_input = st.text_input("👤 Username", placeholder="Enter your username", key="login_username")
                password_input = st.text_input("🔒 Password", type="password", placeholder="Enter your password", key="login_password")
                
                submitted = st.form_submit_button("🚀 Login", use_container_width=True)
                
                if submitted:
                    if not username_input or not password_input:
                        st.error("Please fill in all fields")
                    else:
                        login(username_input.strip(), password_input)
        
        # Sign Up Form
        else:
            st.markdown("<h3 class='auth-section-title'>🌟 Create Your Account</h3>", unsafe_allow_html=True)
            with st.form("signup_form", clear_on_submit=True):
                new_username = st.text_input("👤 Username", placeholder="Choose a unique username", key="signup_username")
                new_password = st.text_input("🔒 Password", type="password", placeholder="Create a secure password", key="signup_password")
                confirm_password = st.text_input("🔒 Confirm Password", type="password", placeholder="Confirm your password", key="signup_confirm")
                
                submitted = st.form_submit_button("✨ Create Account", use_container_width=True)
                
                if submitted:
                    if not new_username or not new_password:
                        st.error("Please fill in all fields")
                    elif new_username in users:
                        st.error("Username already exists")
                    elif new_password != confirm_password:
                        st.error("Passwords do not match")
                    elif len(new_password) < 6 or len(new_username) < 3:
                        st.error("Username must be at least 3 characters, password at least 6.")
                    else:
                        users[new_username] = hash_password(new_password)
                        atomic_save_json(USERS_FILE, users)

                        # Initialize profile
                        all_profiles = load_json(PROFILE_FILE)
                        profile_data = {
                            "Name": new_username,
                            "Age": 18,
                            "Education": "Undergraduate",
                            "Career Interests": [],
                            "Skills": []
                        }
                        all_profiles[new_username] = profile_data
                        atomic_save_json(PROFILE_FILE, all_profiles)
                        st.session_state.profile = profile_data

                        # Default profile picture
                        profile_pics[new_username] = DEFAULT_PROFILE_PIC
                        atomic_save_json(PROFILE_PICS_FILE, profile_pics)
                        st.session_state.profile_photo = DEFAULT_PROFILE_PIC

                        st.session_state.logged_in = True
                        st.session_state.username = new_username
                        st.session_state.page = "📝 Profile"

                        st.success(f"Welcome to CareerCrafter, {new_username}!")
                        st.rerun()

        # Feature highlights
        st.markdown("""
            <div class='feature-highlight'>
                <div class='feature-item'>
                    <div class='feature-icon'>🤖</div>
                    <div class='feature-text'>AI-Powered<br>Guidance</div>
                </div>
                <div class='feature-item'>
                    <div class='feature-icon'>📊</div>
                    <div class='feature-text'>Career<br>Analytics</div>
                </div>
                <div class='feature-item'>
                    <div class='feature-icon'>🎯</div>
                    <div class='feature-text'>Personalized<br>Roadmaps</div>
                </div>
            </div>
        """, unsafe_allow_html=True)
        
        # Close the containers
        st.markdown('</div>', unsafe_allow_html=True)  # Close login-card
    
    st.markdown('</div>', unsafe_allow_html=True)  # Close main-container

# ---- Main App (Authenticated) ----
else:
    profile = st.session_state.get("profile", {})
    full_name = profile.get("Name", st.session_state.username)

    # ---- Enhanced Sidebar Styling ----
    st.markdown("""
        <style>
        .sidebar-header {
            background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
            padding: 2rem 1rem;
            margin: -1rem -1rem 2rem -1rem;
            border-radius: 0 0 20px 20px;
            text-align: center;
            color: white;
        }
        .sidebar-title {
            font-size: 1.5rem;
            font-weight: bold;
            margin-bottom: 0.5rem;
            text-shadow: 2px 2px 4px rgba(0,0,0,0.3);
        }
        .sidebar-subtitle {
            font-size: 0.9rem;
            opacity: 0.9;
            margin-bottom: 1rem;
        }
        .profile-section {
            padding: 1rem 1rem 0 1rem;
            margin: 0 -1rem;
            text-align: center;
        }
        .profile-pic-container {
            display: flex;
            justify-content: center;
            margin-bottom: 1rem;
        }
        .profile-pic-round {
            border-radius: 50% !important;
            border: 3px solid #667eea !important;
            box-shadow: 0 4px 15px rgba(102, 126, 234, 0.3) !important;
            object-fit: cover !important;
            width: 120px !important;
            height: 120px !important;
        }
        .profile-name {
            font-size: 1.1rem;
            font-weight: bold;
            color: #333;
            margin-bottom: 0.2rem;
            text-align: center;
        }
        .profile-username {
            font-size: 0.85rem;
            color: #666;
            margin-bottom: 1rem;
            text-align: center;
        }
        .nav-section {
            margin: 2rem 0 1rem 0;
        }
        .nav-title {
            font-size: 0.9rem;
            font-weight: bold;
            color: #555;
            margin-bottom: 1.5rem;
            padding-left: 0.5rem;
            border-left: 3px solid #667eea;
        }
        .nav-button {
            width: 100%;
            border-radius: 12px !important;
            border: none !important;
            padding: 0.9rem 1.2rem !important;
            margin-bottom: 0.7rem !important;
            font-weight: 500 !important;
            font-size: 0.95rem !important;
            transition: all 0.3s cubic-bezier(0.4, 0, 0.2, 1) !important;
            box-shadow: 0 2px 8px rgba(0,0,0,0.1) !important;
            position: relative !important;
            overflow: hidden !important;
            text-align: left !important;
        }
        .nav-button:before {
            content: '';
            position: absolute;
            top: 0;
            left: -100%;
            width: 100%;
            height: 100%;
            background: linear-gradient(90deg, transparent, rgba(255,255,255,0.2), transparent);
            transition: left 0.5s;
        }
        .nav-button:hover:before {
            left: 100%;
        }
        .nav-button-profile {
            background: linear-gradient(135deg, #667eea 0%, #764ba2 100%) !important;
            color: white !important;
        }
        .nav-button-career {
            background: linear-gradient(135deg, #f093fb 0%, #f5576c 100%) !important;
            color: white !important;
        }
        .nav-button-peer {
            background: linear-gradient(135deg, #4facfe 0%, #00f2fe 100%) !important;
            color: white !important;
        }
        .nav-button-chat {
            background: linear-gradient(135deg, #43e97b 0%, #38f9d7 100%) !important;
            color: white !important;
        }
        .nav-button-history {
            background: linear-gradient(135deg, #fa709a 0%, #fee140 100%) !important;
            color: white !important;
        }
        .nav-button:hover {
            transform: translateY(-2px) !important;
            box-shadow: 0 6px 20px rgba(0,0,0,0.15) !important;
        }
        .nav-button:active {
            transform: translateY(0px) !important;
            box-shadow: 0 2px 8px rgba(0,0,0,0.1) !important;
        }
        .nav-icon {
            margin-right: 0.7rem;
            font-size: 1.1rem;
        }
        .logout-section {
            margin-top: 2rem;
            padding-top: 1.5rem;
            border-top: 1px solid #eee;
            text-align: center;
        }
        .logout-button {
            background: linear-gradient(135deg, #ff6b6b 0%, #ee5a52 100%) !important;
            color: white !important;
            border: none !important;
            border-radius: 12px !important;
            padding: 0.8rem 1.5rem !important;
            font-weight: 500 !important;
            transition: all 0.3s ease !important;
            box-shadow: 0 2px 8px rgba(255, 107, 107, 0.3) !important;
            width: 100% !important;
        }
        .logout-button:hover {
            transform: translateY(-2px) !important;
            box-shadow: 0 4px 15px rgba(255, 107, 107, 0.4) !important;
        }
        .stats-card {
            background: linear-gradient(135deg, #ffecd2 0%, #fcb69f 100%);
            padding: 1rem;
            border-radius: 10px;
            margin: 1rem 0;
            text-align: center;
            color: #333;
        }
        .stats-number {
            font-size: 1.5rem;
            font-weight: bold;
            margin-bottom: 0.2rem;
        }
        .stats-label {
            font-size: 0.8rem;
            opacity: 0.8;
        }
        </style>
    """, unsafe_allow_html=True)

    # Helper functions for profile image
    def get_profile_image_path():
        path = st.session_state.get("profile_photo", DEFAULT_PROFILE_PIC)
        if not os.path.exists(path):
            path = DEFAULT_PROFILE_PIC
        return path

    @st.cache_data
    def get_profile_image_base64(username):
        try:
            path = get_profile_image_path()
            with Image.open(path) as img:
                img = img.resize((120, 120))  # Resize for performance
                buffered = BytesIO()
                img.save(buffered, format="PNG", quality=85)  # Compress
                return base64.b64encode(buffered.getvalue()).decode()
        except Exception:
            return ""

    # ---- Sidebar ----
    with st.sidebar:
        # Header Section
        st.markdown("""
            <div class='sidebar-header'>
                <div class='sidebar-title'>🎯 CareerCrafter</div>
                <div class='sidebar-subtitle'>Your AI-Powered Career Guide</div>
            </div>
        """, unsafe_allow_html=True)

        # Profile Section
        st.markdown("<div class='profile-section'>", unsafe_allow_html=True)
        
        # Display profile picture (centered and round)
        profile_img_b64 = get_profile_image_base64(st.session_state.username)
        if profile_img_b64:
            st.markdown(f"""
                <div class='profile-pic-container'>
                    <img src="data:image/png;base64,{profile_img_b64}" class='profile-pic-round' alt='Profile Picture' />
                </div>
            """, unsafe_allow_html=True)
        else:
            # Show placeholder if no image available
            st.markdown("""
                <div class='profile-pic-container'>
                    <div class='profile-pic-round' style='display: flex; align-items: center; justify-content: center; background: linear-gradient(135deg, #667eea 0%, #764ba2 100%); color: white; font-size: 2rem;'>👤</div>
                </div>
            """, unsafe_allow_html=True)
        
        st.markdown(f"<div class='profile-name'>{full_name}</div>", unsafe_allow_html=True)
        st.markdown(f"<div class='profile-username'>@{st.session_state.username}</div>", unsafe_allow_html=True)
        
        # Quick Stats
        st.markdown(f"""
            <div class='stats-card'>
                <div class='stats-number'>{len(st.session_state.get('history', []))}</div>
                <div class='stats-label'>Career Reports Generated</div>
            </div>
        """, unsafe_allow_html=True)
        
        st.markdown("</div>", unsafe_allow_html=True)

        # Navigation Section
        st.markdown("<div class='nav-section'>", unsafe_allow_html=True)
        st.markdown("<div class='nav-title'>🧭 Navigation</div>", unsafe_allow_html=True)
        
        # Navigation options with custom styling
        nav_config = [
            {"label": "📝 Profile", "class": "nav-button-profile", "icon": "👤"},
            {"label": "🎯 Career Advisor", "class": "nav-button-career", "icon": "🚀"},
            {"label": "🤝 Peer Matching", "class": "nav-button-peer", "icon": "👥"},
            {"label": "💬 Chat Advisor", "class": "nav-button-chat", "icon": "💭"},
            {"label": "📜 History", "class": "nav-button-history", "icon": "📊"}
        ]
        
        for nav_item in nav_config:
            if st.button(
                f"{nav_item['icon']} {nav_item['label'][2:]}",  # Remove emoji from label and add icon
                key=f"nav_{nav_item['label']}", 
                help=f"Go to {nav_item['label']}",
                type="primary" if st.session_state.page == nav_item['label'] else "secondary"
            ):
                st.session_state.page = nav_item['label']
                st.rerun()
        
        # Apply custom CSS to navigation buttons
        st.markdown("""
            <script>
            const buttons = document.querySelectorAll('button[kind="primary"], button[kind="secondary"]');
            buttons.forEach((button, index) => {
                if (button.innerText.includes('👤') || button.innerText.includes('🚀') || 
                    button.innerText.includes('👥') || button.innerText.includes('💭') || 
                    button.innerText.includes('📊')) {
                    const classes = ['nav-button-profile', 'nav-button-career', 'nav-button-peer', 'nav-button-chat', 'nav-button-history'];
                    button.className += ' nav-button ' + classes[index % 5];
                }
            });
            </script>
        """, unsafe_allow_html=True)
        
        st.markdown("</div>", unsafe_allow_html=True)
        
        # Logout Section
        st.markdown("<div class='logout-section'>", unsafe_allow_html=True)
        if st.button("🚪 Logout", key="sidebar_logout", help="Sign out of your account"):
            logout()
        st.markdown("</div>", unsafe_allow_html=True)

    page = st.session_state.page

    # ---- Profile Page ----
    if page == "📝 Profile":
        st.header("📝 Your Profile")
        
        # Profile picture section with upload functionality (moved from sidebar)
        col1, col2 = st.columns([1, 3])
        with col1:
            st.subheader("Profile Picture")
            st.image(get_profile_image_path(), width=200)
            
            # Upload new profile picture (moved here from sidebar)
            uploaded_file = st.file_uploader("Upload New Profile Picture", type=["png", "jpg", "jpeg"], key="profile_pic_upload")
            if uploaded_file and uploaded_file.name not in st.session_state.get('uploaded_files', []):
                try:
                    os.makedirs("uploads", exist_ok=True)
                    file_path = f"uploads/{st.session_state.username}.png"
                    with open(file_path, "wb") as f:
                        f.write(uploaded_file.getbuffer())
                    st.session_state.profile_photo = file_path
                    profile_pics[st.session_state.username] = file_path
                    atomic_save_json(PROFILE_PICS_FILE, profile_pics)
                    
                    # Track uploaded files to prevent continuous processing
                    if 'uploaded_files' not in st.session_state:
                        st.session_state.uploaded_files = []
                    st.session_state.uploaded_files.append(uploaded_file.name)
                    
                    st.success("✅ Profile picture updated successfully!")
                except Exception as e:
                    st.error(f"Error uploading file: {e}")

        with col2:
            st.subheader("Profile Information")
            with st.form("profile_form"):
                default_name = profile.get("Name") or st.session_state.username
                name_input = st.text_input("Full Name", value=default_name)
                age_input = st.number_input("Age", min_value=10, max_value=100, value=profile.get("Age", 18))
                education_input = st.selectbox(
                    "Highest Education",
                    ["High School", "Undergraduate", "Postgraduate", "Other"],
                    index=["High School", "Undergraduate", "Postgraduate", "Other"].index(profile.get("Education", "Undergraduate"))
                )
                interests_input = st.multiselect(
                    "Career Interests",
                    ["AI/ML", "Web Development", "Data Science", "Cloud Computing", "Cybersecurity", "Other"],
                    default=profile.get("Career Interests", [])
                )
                skills_input = st.text_area("Current Skills (comma-separated)", value=",".join(profile.get("Skills", [])))

                save_profile = st.form_submit_button("💾 Save Profile", use_container_width=True)

                if save_profile:
                    profile_data = {
                        "Name": name_input.strip(),
                        "Age": age_input,
                        "Education": education_input,
                        "Career Interests": interests_input,
                        "Skills": [skill.strip() for skill in skills_input.split(",") if skill.strip()]
                    }
                    
                    # Save to session and file
                    st.session_state.profile = profile_data
                    st.session_state.profile_saved = True
                    
                    # Save to file
                    all_profiles = load_json(PROFILE_FILE)
                    all_profiles[st.session_state.username] = profile_data
                    atomic_save_json(PROFILE_FILE, all_profiles)

                    st.success("Profile saved successfully!")
                    st.session_state.page = "🎯 Career Advisor"
                    st.rerun()

    # ---- Career Advisor Page ----
    elif page == "🎯 Career Advisor":
        st.header("🎯 Career Advisor")
        education_input = profile.get("Education", "")
        skills_input = ",".join(profile.get("Skills", []))
        interests_input = ",".join(profile.get("Career Interests", []))
        goal_input = st.text_input("🏆 Career Goal")

        st.markdown(f"**Using Profile Data:** 🎓 {education_input} | 🛠 {skills_input} | 💡 {interests_input}")

        if st.button("🚀 Get Recommendations"):
            user_data = {
                "education": education_input,
                "skills": skills_input,
                "interests": interests_input,
                "goal": goal_input
            }
            user_input = (
                f"Education: {education_input}\n"
                f"Skills: {skills_input}\n"
                f"Interests: {interests_input}\n"
                f"Goal: {goal_input}"
            )

            with st.spinner("🔍 Analyzing your profile and preparing a roadmap..."):
                response = get_gemini_response(user_input, roles_data=user_data)

            st.subheader("💼 AI Recommendations")
            st.markdown(response)

            # Save in history
            entry = {
                "education": education_input,
                "skills": skills_input,
                "interests": interests_input,
                "goal": goal_input,
                "response": response
            }
            all_history = load_json(HISTORY_FILE)
            current_user = st.session_state.get("username", "")
            if current_user not in all_history:
                all_history[current_user] = []
            all_history[current_user].append(entry)
            st.session_state.history = all_history[current_user]
            atomic_save_json(HISTORY_FILE, all_history)

            # Export to PDF
            buffer = BytesIO()
            doc = SimpleDocTemplate(buffer)
            styles = getSampleStyleSheet()
            story = [
                Paragraph("🎯 AI Career Advisor Report", styles['Title']),
                Spacer(1, 12),
                Paragraph(f"<b>Education:</b> {education_input}", styles['Normal']),
                Paragraph(f"<b>Skills:</b> {skills_input}", styles['Normal']),
                Paragraph(f"<b>Interests:</b> {interests_input}", styles['Normal']),
                Paragraph(f"<b>Goal:</b> {goal_input}", styles['Normal']),
                Spacer(1, 12),
                Paragraph("<b>AI Recommendations:</b>", styles['Heading2']),
                Paragraph(response.replace("\n", "<br/>"), styles['Normal'])
            ]
            doc.build(story)
            buffer.seek(0)

            st.download_button(
                "📥 Download Report",
                data=buffer,
                file_name="career_report.pdf",
                mime="application/pdf"
            )

    # ---- Other Pages Placeholder ----
    elif page == "🤝 Peer Matching":
        st.header("🤝 Peer Matching")
        st.info("Find other users with similar career interests and skills!")

        # Load all user profiles
        all_profiles = load_json(PROFILE_FILE)
        current_user_profile = st.session_state.profile
        current_username = st.session_state.username

        if not isinstance(current_user_profile, dict):
            current_user_profile = {}

        # Show loading spinner/logo while computing matches
        with st.spinner("🔍 Searching for peers..."):
            matches = []
            for username, profile in all_profiles.items():
                if username == current_username or not isinstance(profile, dict):
                    continue

                # Overlaps
                interests_overlap = set(current_user_profile.get("Career Interests", [])) & set(profile.get("Career Interests", []))
                skills_overlap = set(current_user_profile.get("Skills", [])) & set(profile.get("Skills", []))

                # Weighted score: interests = 2 points, skills = 1 point
                score = len(interests_overlap) * 2 + len(skills_overlap)

                if score > 0:
                    matches.append({
                        "username": username,
                        "profile": profile,
                        "interests_overlap": list(interests_overlap),
                        "skills_overlap": list(skills_overlap),
                        "score": score
                    })

            # Sort by score descending
            matches = sorted(matches, key=lambda x: x["score"], reverse=True)

        if not matches:
            st.info("No matching peers found. Update your interests or skills to find peers!")
        else:
            st.subheader(f"Top {min(5, len(matches))} Matches")
            for match in matches[:5]:
                profile_img_path = profile_pics.get(match["username"], DEFAULT_PROFILE_PIC)
                col1, col2 = st.columns([1, 4])
                with col1:
                    st.image(profile_img_path, width=80)
                with col2:
                    st.markdown(f"**{match['profile'].get('Name', match['username'])}** (@{match['username']})")
                    if match['interests_overlap']:
                        st.markdown(f"**Shared Interests:** {', '.join(match['interests_overlap'])}")
                    if match['skills_overlap']:
                        st.markdown(f"**Shared Skills:** {', '.join(match['skills_overlap'])}")
                    st.markdown(f"**Match Score:** {match['score']}")
                    st.markdown("---")

            # Download top 10 matches as PDF
            if st.button("📥 Download Matches as PDF"):
                buffer = BytesIO()
                doc = SimpleDocTemplate(buffer)
                styles = getSampleStyleSheet()
                story = [Paragraph("🤝 Peer Matching Report", styles['Title']), Spacer(1, 12)]
                for match in matches[:10]:
                    story.append(Paragraph(f"Name: {match['profile'].get('Name', match['username'])}", styles['Heading2']))
                    story.append(Paragraph(f"Username: @{match['username']}", styles['Normal']))
                    if match['interests_overlap']:
                        story.append(Paragraph(f"Shared Interests: {', '.join(match['interests_overlap'])}", styles['Normal']))
                    if match['skills_overlap']:
                        story.append(Paragraph(f"Shared Skills: {', '.join(match['skills_overlap'])}", styles['Normal']))
                    story.append(Paragraph(f"Match Score: {match['score']}", styles['Normal']))
                    story.append(Spacer(1, 12))
                doc.build(story)
                buffer.seek(0)
                st.download_button("Download PDF", data=buffer, file_name=f"{current_username}_peer_matches.pdf", mime="application/pdf")



    elif page == "💬 Chat Advisor":
        st.header("💬 AI Career Chat Advisor")
        st.info("Ask anything about your career, skills, or learning paths!")

        if "chat_history" not in st.session_state:
            st.session_state.chat_history = []

        user_message = st.text_input("Type your question here:")

        if st.button("Send") and user_message.strip():
            with st.spinner("🤖 AI Advisor is analyzing your question..."):
                ai_response = get_gemini_response(
                    user_message,
                    roles_data={
                        "education": st.session_state.profile.get("Education", ""),
                        "skills": ",".join(st.session_state.profile.get("Skills", [])),
                        "interests": ",".join(st.session_state.profile.get("Career Interests", [])),
                        "goal": ""
                    }
                )
            st.session_state.chat_history.append({"user": user_message, "ai": ai_response})

        # Display chat history
        for chat in st.session_state.chat_history:
            st.markdown(f"**You:** {chat['user']}")
            st.markdown(f"**AI Advisor:** {chat['ai']}")
            st.markdown("---")



    elif page == "📜 History":
        st.header("📜 Past AI Recommendations")

        current_user = st.session_state.get("username", "")
        all_history = load_json(HISTORY_FILE)

        # Use session state history if exists, else initialize from JSON
        if "history" not in st.session_state or st.session_state.history is None:
            st.session_state.history = all_history.get(current_user, [])

        if not st.session_state.history:
            st.info("No past recommendations found. Use 🎯 Career Advisor to get started!")
        else:
            for i, entry in enumerate(reversed(st.session_state.history), 1):
                with st.expander(f"Recommendation #{i}"):
                    st.markdown(f"**Education:** {entry.get('education', '')}")
                    st.markdown(f"**Skills:** {entry.get('skills', '')}")
                    st.markdown(f"**Interests:** {entry.get('interests', '')}")
                    st.markdown(f"**Goal:** {entry.get('goal', '')}")
                    st.markdown("**AI Recommendation:**")
                    st.markdown(entry.get("response", ""), unsafe_allow_html=True)

            if st.button("📥 Download All Recommendations as PDF"):
                buffer = BytesIO()
                doc = SimpleDocTemplate(buffer)
                styles = getSampleStyleSheet()
                story = []
                for i, entry in enumerate(reversed(st.session_state.history), 1):
                    story.append(Paragraph(f"Recommendation #{i}", styles['Heading2']))
                    story.append(Paragraph(f"<b>Education:</b> {entry.get('education', '')}", styles['Normal']))
                    story.append(Paragraph(f"<b>Skills:</b> {entry.get('skills', '')}", styles['Normal']))
                    story.append(Paragraph(f"<b>Interests:</b> {entry.get('interests', '')}", styles['Normal']))
                    story.append(Paragraph(f"<b>Goal:</b> {entry.get('goal', '')}", styles['Normal']))
                    story.append(Spacer(1, 6))
                    story.append(Paragraph("<b>AI Recommendation:</b>", styles['Heading3']))
                    story.append(Paragraph(entry.get("response", ""), styles['Normal']))
                    story.append(Spacer(1, 12))
                doc.build(story)
                buffer.seek(0)
                st.download_button(
                    "Download PDF",
                    data=buffer,
                    file_name=f"{current_user}_ai_recommendations_history.pdf",
                    mime="application/pdf"
                )

            if st.button("🗑 Clear History"):
                st.session_state.history = []
                all_history[current_user] = []
                atomic_save_json(HISTORY_FILE, all_history)
                st.success("History cleared successfully!")
                st.rerun()
