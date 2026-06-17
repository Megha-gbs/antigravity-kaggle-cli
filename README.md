# 🚀 BigQuery Release Explorer

A lightweight, modern web application designed to fetch, parse, and browse the latest Google Cloud BigQuery Release Notes RSS/Atom feed in real-time. Built with a clean Python Flask backend and a responsive, vanilla HTML/JS/CSS frontend.

The application allows users to search through release updates, filter them by category, and easily share specific updates directly to X (formerly Twitter) using a floating Tweet composer with auto-formatting constraints.

---

## ✨ Features

- **Real-Time Atom XML Parsing**: The Flask backend serves as a CORS proxy, fetching the latest feed from Google Cloud and parsing the entries into structured JSON objects.
- **Granular Updates Extraction**: The parser splits daily releases into individual cards by category (e.g. separating features, changes, and issues listed on the same day).
- **Responsive Dashboard UI**: A dark-mode developer-centric theme inspired by Google Cloud aesthetics, complete with glassmorphic elements and micro-interactions.
- **Smart Category Badging**: Updates are color-coded based on their type:
  - 🟢 **Feature**: Emerald Green
  - 🟡 **Issue**: Amber
  - 🔵 **Change**: Indigo
  - 🟣 **Announcement**: Purple
  - 🔴 **Deprecation**: Rose
- **Instant Search & Category Filters**: Client-side filtering allowing real-time searches by keywords or filtering by category tags.
- **Floating Tweet Composer**: Selecting any card opens a bottom-dock composer containing a prefilled tweet containing the date, category, truncated description (respecting X's 280 character limit), and original reference link.

---

## 📁 Project Structure

```text
├── app.py              # Flask backend server (fetches and parses RSS/Atom feed)
├── templates/
│   └── index.html      # Frontend HTML skeleton
├── static/
│   ├── app.js          # Client-side reactivity, search filters, and tweet formatting
│   └── style.css       # Premium custom CSS styling (dark-mode first design system)
├── .gitignore          # Excludes cache and configuration files
└── README.md           # Project documentation
```

---

## ⚙️ Installation & Usage

### 1. Prerequisites
Make sure you have Python 3 installed.

### 2. Install Dependencies
Install the required packages using `pip`:
```bash
pip install flask requests
```

### 3. Start the Server
Run the Flask server:
```bash
python app.py
```

By default, the server will start locally at **[http://127.0.0.1:5000](http://127.0.0.1:5000)**. Open this URL in your web browser to view the application.

---

## 🐦 How to Share an Update on X
1. Click on any release card in the feed.
2. A checkmark indicator will light up and the **Prepare Tweet Update** panel will slide up from the bottom.
3. Review or edit the text. The live character count highlights in yellow or red if you approach or exceed 280 characters.
4. Click **Post to X** to open a new tab containing the pre-filled post draft.

---

## 🔒 License
This project is open-source and available under the MIT License.
