# AcadHub · Next-Gen University Academic Platform

AcadHub is a unified academic accountability, learning management, and course operations platform built with **Java 17 LTS, Spring Boot 3.5.6, and MySQL 8.0**.

Featuring real-time 75% attendance threshold monitoring, automated trigger-based grading, multi-role RBAC, laptop/PC file uploads, and an interactive 3D cyberpunk-inspired UI.

---

## 🚀 Quick Start Guide (Two Flexible Ways to Run)

AcadHub is engineered to run in **two seamless modes** so you and your team can operate without any friction on any laptop:

### 🌟 Option 1: Instant Zero-Setup Browser Mode (No Java or MySQL required!)
*Best for quick reviews, collaborator testing, laptops without MySQL, or running directly from GitHub / GitHub Pages!*
1. Simply double-click **`index.html`** in the repository root to open it in Chrome, Edge, or Firefox.
2. Sign in with any of the demo accounts (Student `kriti16`, Faculty `rumneek24`, or Admin `doaa30`).
3. You can browse courses, read lecture notes, upload solution files from your laptop, review submissions, and download attached documents — **100% locally with zero installation required!**

---

### 💻 Option 2: Full-Stack Enterprise Mode (Spring Boot 3.5 + MySQL 8.0)
*Best for persistent database operations and production simulation.*

#### Prerequisites
- **Java 17 or higher** (JDK 17, 21, or Corretto / Eclipse Adoptium)
- **Maven**: Optional (bundled Maven Wrapper `mvnw.cmd` is included)
- **MySQL 8.0+** (Running locally on default port `3306` or `3307`)

---

### Step 1: Set Up the Database (One-time)
Double-click `setup-db.bat` in the project root:
- It auto-detects MySQL on your machine.
- Prompts for your MySQL port (default is `3306`, or `3307`).
- Prompts for your MySQL `root` password.
- Automatically executes all database schemas, tables, views, triggers, and sample seed data.

---

### Step 2: Start the Web Platform
Double-click `run-web.bat` in the project root:
- Automatically detects your Java JDK and Maven.
- Auto-initializes file upload storage folders (`uploads/materials` and `uploads/submissions`).
- Detects running MySQL instances (port `3306` or `3307`).
- Launches Spring Boot and automatically opens your browser to:
  👉 **`http://localhost:8085`**

*(Or manually in terminal: `mvn spring-boot:run`)*

---

## 🔑 Demo Login Credentials

Click any role chip on the login page to automatically load demo credentials:

| Role | Username | Password | Features & Workflows |
| :--- | :--- | :--- | :--- |
| **Student** (Kriti) | `kriti16` | `kri16` | View course notes, download slides, submit assignments with PC files, track grades & 75% attendance. |
| **Student** (Lavdeep) | `lavdeep23` | `lav23` | Enrolled in DBMS (`UCS310`) and OS (`CS102`). |
| **Faculty** (Prof. Rumneek) | `rumneek24` | `rum24` | Publish study materials with PC file dropzone, review student assignment submissions, grade work, save attendance. |
| **Admin** (System Administrator) | `doaa30` | `adm@123` | University accountability metrics, enrollment graph, student & faculty directories, course assignment. |

---

## 📁 PC / Laptop File Uploads & Downloads

AcadHub supports uploading and downloading any files directly from your computer:

### 1. Faculty Study Materials
- Go to the **Study Material** tab in Faculty Portal (`faculty.html`).
- Select course (e.g. `UCS310`), title, category (`Notes`, `Slides`, `Tutorials`, `Reference`).
- Drag and drop or browse any file from your PC (PDF, Word DOCX, PPTX, ZIP, Code, Images - **up to 50MB**).
- Click **"Publish Study Material"**.
- Enrolled students immediately see the material in their library with a 1-click **Download File** link.

### 2. Student Assignment Submissions
- Go to the **Course Study Material** section in Student Portal (`student.html`).
- Click **"Send Work to Professor"** on any course material card.
- Drag and drop your solution file (PDF, ZIP, code archive, etc.).
- Click **"Send to Teacher"**.
- Your professor can review your submission and download your solution file in their **Student Submissions** tab.

---

## 🛠️ Troubleshooting FAQ

### 1. "Could not connect to MySQL database"
- AcadHub features **smart multi-port auto-detection**: it automatically tries port `3307` and standard port `3306` with common passwords.
- If your MySQL uses a custom password or port, you can set environment variables:
  ```powershell
  $env:DB_PORT = "3306"
  $env:DB_PASSWORD = "your_mysql_password"
  ```
  Or run `setup-db.bat` to import the database.

### 2. "Uploading file failed"
- Ensure the file is under **50MB**.
- Storage folders are automatically created at `uploads/materials/` and `uploads/submissions/`.
- If using an external link (Google Drive / GitHub), you can paste the URL directly into the external link field.

### 3. "Java not found"
- Ensure Java 17+ is installed. Set your `JAVA_HOME` environment variable to your JDK folder (e.g. `C:\Program Files\Eclipse Adoptium\jdk-17...`).

---

## 👥 Dual GitHub Repository Remotes
This project is linked to two remotes and kept in sync:
- `https://github.com/guntaas0108-eng/Acadhub_java.git`
- `https://github.com/kriti006/Acadhub_java.git`
