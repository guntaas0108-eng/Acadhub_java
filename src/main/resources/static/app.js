// ============================================================
//   AcadHub · app.js
//   Universal Dual-Engine Application & API Connectivity Layer
//   - Mode 1: Live Full-Stack Mode (Spring Boot & MySQL on port 8085)
//   - Mode 2: Zero-Config Standalone / GitHub Pages Mode (Local persistence & real file handling)
// ============================================================

(function () {
  'use strict';

  const $ = (id) => document.getElementById(id);
  const esc = (s) => String(s == null ? '' : s).replace(/[&<>"']/g, c => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[c]));

  // ---------- Backend Auto-Detection ----------
  window.__ACADHUB_BACKEND_LIVE = false;
  let backendChecked = false;

  async function checkBackendLive() {
    if (backendChecked) return window.__ACADHUB_BACKEND_LIVE;
    if (location.protocol === 'file:' || location.hostname.endsWith('github.io')) {
      window.__ACADHUB_BACKEND_LIVE = false;
      backendChecked = true;
      renderModeBadge(false);
      return false;
    }
    try {
      const controller = new AbortController();
      const timer = setTimeout(() => controller.abort(), 1400);
      const res = await fetch('/api/me', { signal: controller.signal });
      clearTimeout(timer);
      window.__ACADHUB_BACKEND_LIVE = (res.status === 200 || res.status === 401 || res.status === 403);
    } catch (e) {
      window.__ACADHUB_BACKEND_LIVE = false;
    }
    backendChecked = true;
    renderModeBadge(window.__ACADHUB_BACKEND_LIVE);
    return window.__ACADHUB_BACKEND_LIVE;
  }

  // ---------- Preloaded Standalone Store (For GitHub & Offline Frictionless Operation) ----------
  const DEFAULT_MATERIALS = [
    {
      material_id: 10,
      course_code: 'UCS310',
      course_name: 'Database Management Systems',
      title: 'Unit 5 Advanced Indexing Slides',
      material_type: 'Slides',
      content: 'Comprehensive slide deck covering B+ trees, primary and secondary indexes, and hash indexing.',
      upload_date: '2026-11-03',
      file_name: 'CS310_Unit5_Indexing_Slides.pdf',
      file_size: '48 B',
      submissions_count: 1,
      faculty_name: 'Dr. Rumneek Kaur'
    },
    {
      material_id: 5,
      course_code: 'UCS310',
      course_name: 'Database Management Systems',
      title: 'Unit 4 B+ Trees & Indexing',
      material_type: 'Notes',
      content: 'Complete guide on multi-level indexing, node splitting algorithms, and order p calculations.',
      upload_date: '2026-10-30',
      file_name: 'Unit4_BPlus_Trees_Guide.pdf',
      file_size: '1.8 MB',
      submissions_count: 1,
      faculty_name: 'Dr. Rumneek Kaur'
    },
    {
      material_id: 4,
      course_code: 'UCS520',
      course_name: 'Operating Systems',
      title: 'ER Diagram Guide & Cardinalities',
      material_type: 'Slides',
      content: 'Entity-Relationship modelling, mapping cardinalities, and weak entity sets.',
      upload_date: '2025-04-13',
      file_name: 'ER_Diagrams_Reference_Slides.pdf',
      file_size: '2.4 MB',
      submissions_count: 0,
      faculty_name: 'Dr. Rumneek Kaur'
    },
    {
      material_id: 2,
      course_code: 'UCS310',
      course_name: 'Database Management Systems',
      title: 'SQL Joins & Complex Queries',
      material_type: 'Tutorials',
      content: 'Hands-on practice exercises for INNER JOIN, LEFT JOIN, FULL OUTER JOIN, and subqueries.',
      upload_date: '2025-04-11',
      file_name: 'SQL_Joins_Cheatsheet.pdf',
      file_size: '950 KB',
      submissions_count: 0,
      faculty_name: 'Dr. Rumneek Kaur'
    },
    {
      material_id: 1,
      course_code: 'UCS310',
      course_name: 'Database Management Systems',
      title: 'Normalization Notes (1NF, 2NF, 3NF, BCNF)',
      material_type: 'Notes',
      content: 'Step-by-step breakdown of functional dependencies, closure sets, and lossless decompositions.',
      upload_date: '2025-04-10',
      file_name: 'Normalization_1NF_2NF_3NF_Guide.pdf',
      file_size: '1.2 MB',
      submissions_count: 1,
      faculty_name: 'Dr. Rumneek Kaur'
    }
  ];

  const DEFAULT_SUBMISSIONS = [
    {
      submission_id: 3,
      material_id: 10,
      course_code: 'UCS310',
      roll_no: 1024030107,
      student_name: 'Lavdeep',
      title: 'Assignment 5 Solution - Lavdeep',
      submission_text: 'Here is my completed B+ tree simulation code and test results.',
      file_name: 'Lavdeep_Assignment5_Solution.zip',
      file_size: '50 B',
      submitted_at: '2026-11-03T21:44:50',
      status: 'Submitted',
      feedback: null,
      material_title: 'Unit 5 Advanced Indexing Slides'
    },
    {
      submission_id: 2,
      material_id: 5,
      course_code: 'UCS310',
      roll_no: 102403111,
      student_name: 'Kriti',
      title: 'Solutions for B+ Tree Node Splitting',
      submission_text: 'Attached are step-by-step insertions for keys [10, 20, 30, 40, 50, 60] with order p=3.',
      file_name: 'Kriti_BTree_Node_Splitting_Solutions.pdf',
      file_size: '1.4 MB',
      submitted_at: '2026-10-30T10:38:17',
      status: 'Approved',
      feedback: 'Well done! Tree splitting handled properly without overflow.',
      material_title: 'Unit 4 B+ Trees & Indexing'
    },
    {
      submission_id: 1,
      material_id: 1,
      course_code: 'UCS310',
      roll_no: 102403111,
      student_name: 'Kriti',
      title: 'Normalization 3NF Practice Exercise',
      submission_text: 'Here are my solutions for the BCNF and 3NF dependency preservation decomposition problems. All functional dependencies have been verified.',
      file_name: 'Kriti_Normalization_3NF_Practice.pdf',
      file_size: '820 KB',
      submitted_at: '2026-10-30T10:28:26',
      status: 'Reviewed',
      feedback: 'Excellent decomposition steps, clear candidate keys identification!',
      material_title: 'Normalization Notes'
    }
  ];

  function getLocalMaterials() {
    try {
      const raw = localStorage.getItem('acadhub_materials');
      if (raw) return JSON.parse(raw);
    } catch (e) {}
    try { localStorage.setItem('acadhub_materials', JSON.stringify(DEFAULT_MATERIALS)); } catch (e) {}
    return DEFAULT_MATERIALS.slice();
  }

  function saveLocalMaterials(arr) {
    try { localStorage.setItem('acadhub_materials', JSON.stringify(arr)); } catch (e) {}
  }

  function getLocalSubmissions() {
    try {
      const raw = localStorage.getItem('acadhub_submissions');
      if (raw) return JSON.parse(raw);
    } catch (e) {}
    try { localStorage.setItem('acadhub_submissions', JSON.stringify(DEFAULT_SUBMISSIONS)); } catch (e) {}
    return DEFAULT_SUBMISSIONS.slice();
  }

  function saveLocalSubmissions(arr) {
    try { localStorage.setItem('acadhub_submissions', JSON.stringify(arr)); } catch (e) {}
  }

  // Pre-seed local storage if empty
  getLocalMaterials();
  getLocalSubmissions();

  // ---------- Mode Badge Indicator ----------
  function renderModeBadge(isLive) {
    let pill = $('acadHubModePill');
    if (!pill) {
      pill = document.createElement('div');
      pill.id = 'acadHubModePill';
      pill.className = 'acadhub-mode-pill ' + (isLive ? 'live' : 'standalone');
      document.body.appendChild(pill);
      pill.addEventListener('click', () => {
        if (window.__ACADHUB_BACKEND_LIVE) {
          if (window.UI && window.UI.toast) window.UI.toast('success', 'Connected to live Spring Boot backend & MySQL database on port 8085.');
        } else {
          if (window.UI && window.UI.toast) window.UI.toast('info', 'Standalone Browser Mode Active: All features, course data, and PC file uploads work smoothly in your browser with zero setup.');
        }
      });
    }
    pill.className = 'acadhub-mode-pill ' + (isLive ? 'live' : 'standalone');
    pill.innerHTML = isLive
      ? '<span class="dot"></span><span>AcadHub Live · Backend Connected</span>'
      : '<span class="dot"></span><span>⚡ Standalone Mode · Zero Setup Active</span>';
  }

  // ---------- Generic API Callers with Offline Fallback ----------
  async function apiGet(url) {
    const live = await checkBackendLive();
    if (!live) return handleOfflineGet(url);
    try {
      const res = await fetch(url);
      if (res.status === 401 || res.status === 403) {
        location.href = 'index.html';
        return null;
      }
      let data = null;
      try { data = await res.json(); } catch (e) {}
      if (!res.ok) {
        const err = (data && data.error) || 'Request failed (' + res.status + ')';
        if (window.UI && window.UI.toast) window.UI.toast('error', err);
        return null;
      }
      return data;
    } catch (e) {
      console.warn('apiGet fetch failed, switching to offline fallback for ' + url, e);
      window.__ACADHUB_BACKEND_LIVE = false;
      renderModeBadge(false);
      return handleOfflineGet(url);
    }
  }

  async function apiPost(url, body) {
    const live = await checkBackendLive();
    if (!live) return handleOfflinePost(url, body);
    try {
      const res = await fetch(url, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: body ? JSON.stringify(body) : undefined
      });
      if (res.status === 401 || res.status === 403) {
        location.href = 'index.html';
        return { ok: false, data: {} };
      }
      let data = {};
      try { data = await res.json(); } catch (e) {}
      return { ok: res.ok, status: res.status, data };
    } catch (e) {
      console.warn('apiPost fetch failed, switching to offline fallback for ' + url, e);
      window.__ACADHUB_BACKEND_LIVE = false;
      renderModeBadge(false);
      return handleOfflinePost(url, body);
    }
  }

  async function apiDelete(url) {
    const live = await checkBackendLive();
    if (!live) return handleOfflineDelete(url);
    try {
      const res = await fetch(url, { method: 'DELETE' });
      if (res.status === 401 || res.status === 403) {
        location.href = 'index.html';
        return { ok: false, data: {} };
      }
      let data = {};
      try { data = await res.json(); } catch (e) {}
      return { ok: res.ok, status: res.status, data };
    } catch (e) {
      console.warn('apiDelete fetch failed, switching to offline fallback for ' + url, e);
      window.__ACADHUB_BACKEND_LIVE = false;
      renderModeBadge(false);
      return handleOfflineDelete(url);
    }
  }

  async function apiPostFormData(url, formData) {
    const live = await checkBackendLive();
    if (!live) return handleOfflineFormData(url, formData);
    try {
      const res = await fetch(url, {
        method: 'POST',
        body: formData
      });
      if (res.status === 401 || res.status === 403) {
        location.href = 'index.html';
        return { ok: false, data: {} };
      }
      let data = {};
      try { data = await res.json(); } catch (e) {}
      if (!res.ok) {
        const errMsg = (data && data.error) || ('Upload failed with status ' + res.status);
        if (window.UI && window.UI.toast) window.UI.toast('error', errMsg);
      }
      return { ok: res.ok, status: res.status, data };
    } catch (e) {
      console.warn('apiPostFormData fetch failed, switching to offline storage fallback for ' + url, e);
      window.__ACADHUB_BACKEND_LIVE = false;
      renderModeBadge(false);
      return handleOfflineFormData(url, formData);
    }
  }

  // ---------- Offline Engine Handlers ----------
  function handleOfflineGet(url) {
    if (url.includes('/api/me')) {
      let u = null;
      try { u = JSON.parse(localStorage.getItem('acadhub_session')); } catch (e) {}
      if (!u) {
        const p = document.body.dataset.page;
        if (p === 'student') u = { name: 'Kriti Sharma', role: 'Student', username: 'kriti16', roll_no: 102403111 };
        else if (p === 'faculty') u = { name: 'Dr. Rumneek Kaur', role: 'Faculty', username: 'rumneek24', faculty_id: 1 };
        else if (p === 'admin') u = { name: 'Dean of Academic Affairs', role: 'Admin', username: 'doaa30', user_id: 3 };
        else u = { name: 'Kriti Sharma', role: 'Student', username: 'kriti16' };
      }
      return u;
    }

    if (url.includes('/api/faculty/dashboard')) {
      return {
        courses: [
          { course_code: 'UCS310', course_name: 'Database Management Systems' },
          { course_code: 'UCS520', course_name: 'Computer Networks' }
        ]
      };
    }

    if (url.includes('/api/faculty/course-data')) {
      return {
        students: [
          { roll_no: 102403111, name: 'Kriti Sharma' },
          { roll_no: 1024030107, name: 'Lavdeep' },
          { roll_no: 1024030101, name: 'Aarav Patel' },
          { roll_no: 1024030102, name: 'Priya Singh' }
        ],
        assessments: [
          { assessment_id: 1, assessment_type: 'Mid Term Exam', total_marks: 50, passing_marks: 20 },
          { assessment_id: 2, assessment_type: 'Assignment 1', total_marks: 30, passing_marks: 12 },
          { assessment_id: 3, assessment_type: 'Quiz 1', total_marks: 20, passing_marks: 8 }
        ],
        summary: [
          { student_name: 'Kriti Sharma', avg_marks: 88, grade: 'A' },
          { student_name: 'Lavdeep', avg_marks: 84, grade: 'A' },
          { student_name: 'Aarav Patel', avg_marks: 74, grade: 'B' },
          { student_name: 'Priya Singh', avg_marks: 92, grade: 'A+' }
        ]
      };
    }

    if (url.includes('/api/faculty/materials')) {
      return getLocalMaterials();
    }

    if (url.includes('/api/faculty/submissions')) {
      return getLocalSubmissions();
    }

    if (url.includes('/api/student/dashboard')) {
      return {
        student: { name: 'Kriti Sharma', roll_no: 102403111, cgpa: 8.45 },
        overallAttendance: { total_classes: 48, attended: 41, percentage: 85.4 },
        courses: [
          { course_code: 'UCS310', course_name: 'Database Management Systems', credits: 4, attendance_pct: 84.0, total_classes: 25, attended: 21, marks: 42, max_marks: 50, grade: 'A' },
          { course_code: 'UCS520', course_name: 'Computer Networks', credits: 4, attendance_pct: 87.5, total_classes: 24, attended: 21, marks: 45, max_marks: 50, grade: 'A+' }
        ]
      };
    }

    if (url.includes('/api/student/materials')) {
      return getLocalMaterials();
    }

    if (url.includes('/api/student/submissions')) {
      return getLocalSubmissions();
    }

    if (url.includes('/api/admin/dashboard')) {
      return {
        summary: { total_students: 9, total_faculty: 4, total_courses: 5, total_enrollments: 17 },
        stats: { total_students: 9, total_faculty: 4, total_courses: 5, total_enrollments: 17 },
        enrollmentGraph: [
          { course_code: 'UCS310', course_name: 'Database Management Systems', credits: 4, semester: 6, enrolled_students: 8, faculty_names: 'Dr. Rumneek Kaur' },
          { course_code: 'UCS520', course_name: 'Computer Networks', credits: 4, semester: 6, enrolled_students: 5, faculty_names: 'Dr. Rumneek Kaur' },
          { course_code: 'UCS503', course_name: 'Software Engineering', credits: 3, semester: 6, enrolled_students: 4, faculty_names: 'Unassigned' }
        ],
        accountabilityMatrix: [
          { course_code: 'UCS310', course_name: 'Database Management Systems', credits: 4, semester: 6, enrolled_count: 8, faculty_names: 'Dr. Rumneek Kaur', enrolled_students_list: 'Kriti Sharma (Roll: 102403111); Lavdeep (Roll: 1024030107); Aarav Patel (Roll: 1024030101)' },
          { course_code: 'UCS520', course_name: 'Computer Networks', credits: 4, semester: 6, enrolled_count: 5, faculty_names: 'Dr. Rumneek Kaur', enrolled_students_list: 'Kriti Sharma (Roll: 102403111); Priya Singh (Roll: 1024030102)' },
          { course_code: 'UCS503', course_name: 'Software Engineering', credits: 3, semester: 6, enrolled_count: 4, faculty_names: 'Unassigned', enrolled_students_list: 'Kriti Sharma (Roll: 102403111); Rohan Verma (Roll: 1024030103)' }
        ],
        facultyAccountability: [
          { faculty_id: 1, faculty_name: 'Dr. Rumneek Kaur', username: 'rumneek24', designation: 'Associate Professor', department: 'CSE', courses_taught: 'UCS310, UCS520', total_students_mentored: 8 }
        ],
        atRisk: [
          { roll_no: 1024030105, name: 'Rahul Sharma', student_name: 'Rahul Sharma', course_code: 'UCS310', attendance_pct: 64.0, avg_marks: 52.0 }
        ],
        users: [
          { user_id: 1, username: 'kriti16', name: 'Kriti Sharma', role: 'Student', phone: '9876543210' },
          { user_id: 2, username: 'rumneek24', name: 'Dr. Rumneek Kaur', role: 'Faculty', phone: '9876543211' },
          { user_id: 3, username: 'doaa30', name: 'Dean of Academic Affairs', role: 'Admin', phone: '9876543212' }
        ]
      };
    }

    if (url.includes('/api/admin/options')) {
      return {
        courses: [
          { course_code: 'UCS310', course_name: 'Database Management Systems' },
          { course_code: 'UCS520', course_name: 'Computer Networks' }
        ],
        students: [
          { roll_no: 102403111, name: 'Kriti Sharma' },
          { roll_no: 1024030107, name: 'Lavdeep' }
        ],
        faculty: [
          { faculty_id: 1, name: 'Dr. Rumneek Kaur' }
        ],
        users: [
          { user_id: 1, username: 'kriti16', name: 'Kriti Sharma', role: 'Student' },
          { user_id: 2, username: 'rumneek24', name: 'Dr. Rumneek Kaur', role: 'Faculty' },
          { user_id: 3, username: 'doaa30', name: 'Dean of Academic Affairs', role: 'Admin' }
        ]
      };
    }

    return null;
  }

  function handleOfflinePost(url, body) {
    if (url.includes('/api/login')) {
      const u = (body && body.username || '').toLowerCase();
      let role = 'Student';
      let name = 'Kriti Sharma';
      if (u.includes('rum') || u.includes('fac')) {
        role = 'Faculty';
        name = 'Dr. Rumneek Kaur';
      } else if (u.includes('adm') || u.includes('doaa')) {
        role = 'Admin';
        name = 'Dean of Academic Affairs';
      }
      const sessionUser = { username: body.username, name, role };
      try { localStorage.setItem('acadhub_session', JSON.stringify(sessionUser)); } catch (e) {}
      return { ok: true, status: 200, data: sessionUser };
    }

    if (url.includes('/api/logout')) {
      try { localStorage.removeItem('acadhub_session'); } catch (e) {}
      return { ok: true, status: 200, data: { status: 'logged_out' } };
    }

    if (url.includes('/api/faculty/attendance')) {
      return { ok: true, status: 200, data: { status: 'saved', count: 4 } };
    }

    if (url.includes('/api/faculty/marks')) {
      return { ok: true, status: 200, data: { status: 'saved' } };
    }

    if (url.includes('/api/faculty/assessment')) {
      return { ok: true, status: 200, data: { status: 'created' } };
    }

    if (url.includes('/api/faculty/submission-grade')) {
      const subs = getLocalSubmissions();
      const sub = subs.find(s => s.submission_id == body.submissionId);
      if (sub) {
        sub.status = body.status;
        sub.feedback = body.feedback;
        saveLocalSubmissions(subs);
      }
      return { ok: true, status: 200, data: { status: 'updated' } };
    }

    if (url.includes('/api/admin/user')) {
      return { ok: true, status: 200, data: { status: 'created' } };
    }

    return { ok: true, status: 200, data: {} };
  }

  function handleOfflineDelete(url) {
    if (url.includes('/api/faculty/material/')) {
      const parts = url.split('/');
      const id = parts[parts.length - 1];
      let mats = getLocalMaterials();
      mats = mats.filter(m => m.material_id != id);
      saveLocalMaterials(mats);
      return { ok: true, status: 200, data: { status: 'deleted' } };
    }
    return { ok: true, status: 200, data: { status: 'deleted' } };
  }

  function handleOfflineFormData(url, formData) {
    return new Promise((resolve) => {
      if (url.includes('/api/faculty/material-upload')) {
        const course = formData.get('course') || 'UCS310';
        const title = formData.get('title') || 'Study Material';
        const type = formData.get('type') || 'Notes';
        const content = formData.get('content') || '';
        const file = formData.get('file');

        const mats = getLocalMaterials();
        const matId = Date.now();

        if (file && file instanceof File && file.size > 0) {
          const reader = new FileReader();
          reader.onload = function (e) {
            const newMat = {
              material_id: matId,
              course_code: course,
              course_name: course === 'UCS310' ? 'Database Management Systems' : 'Operating Systems',
              title: title,
              material_type: type,
              content: content,
              upload_date: new Date().toISOString().slice(0, 10),
              file_name: file.name,
              file_size: formatBytes(file.size),
              file_data: e.target.result,
              submissions_count: 0,
              faculty_name: 'Dr. Rumneek Kaur'
            };
            mats.unshift(newMat);
            saveLocalMaterials(mats);
            resolve({ ok: true, status: 200, data: { status: 'saved', materialId: matId, fileName: file.name, fileSize: formatBytes(file.size) } });
          };
          reader.readAsDataURL(file);
        } else {
          const newMat = {
            material_id: matId,
            course_code: course,
            course_name: course === 'UCS310' ? 'Database Management Systems' : 'Operating Systems',
            title: title,
            material_type: type,
            content: content,
            upload_date: new Date().toISOString().slice(0, 10),
            file_name: null,
            file_size: null,
            file_data: null,
            submissions_count: 0,
            faculty_name: 'Dr. Rumneek Kaur'
          };
          mats.unshift(newMat);
          saveLocalMaterials(mats);
          resolve({ ok: true, status: 200, data: { status: 'saved', materialId: matId } });
        }
        return;
      }

      if (url.includes('/api/student/submit-upload')) {
        const courseCode = formData.get('courseCode') || 'UCS310';
        const title = formData.get('title') || 'Assignment Solution';
        const submissionText = formData.get('submissionText') || '';
        const materialId = formData.get('materialId');
        const fileUrl = formData.get('fileUrl') || '';
        const file = formData.get('file');

        const subs = getLocalSubmissions();
        const subId = Date.now();

        if (file && file instanceof File && file.size > 0) {
          const reader = new FileReader();
          reader.onload = function (e) {
            const newSub = {
              submission_id: subId,
              material_id: materialId ? Number(materialId) : null,
              course_code: courseCode,
              roll_no: 102403111,
              student_name: 'Kriti Sharma',
              title: title,
              submission_text: submissionText,
              file_name: file.name,
              file_size: formatBytes(file.size),
              file_data: e.target.result,
              file_url: file.name,
              submitted_at: new Date().toISOString(),
              status: 'Submitted',
              feedback: null,
              material_title: 'Course Assignment'
            };
            subs.unshift(newSub);
            saveLocalSubmissions(subs);
            resolve({ ok: true, status: 200, data: { status: 'submitted', submissionId: subId } });
          };
          reader.readAsDataURL(file);
        } else {
          const newSub = {
            submission_id: subId,
            material_id: materialId ? Number(materialId) : null,
            course_code: courseCode,
            roll_no: 102403111,
            student_name: 'Kriti Sharma',
            title: title,
            submission_text: submissionText,
            file_name: null,
            file_size: null,
            file_data: null,
            file_url: fileUrl,
            submitted_at: new Date().toISOString(),
            status: 'Submitted',
            feedback: null,
            material_title: 'Course Assignment'
          };
          subs.unshift(newSub);
          saveLocalSubmissions(subs);
          resolve({ ok: true, status: 200, data: { status: 'submitted', submissionId: subId } });
        }
        return;
      }

      resolve({ ok: true, status: 200, data: {} });
    });
  }

  // ---------- Zero-Friction File Opener / Downloader ----------
  window.handleFileDownload = function (e, type, id, fileName) {
    if (window.__ACADHUB_BACKEND_LIVE) {
      // In live mode, allow default anchor behavior to download from Spring Boot backend
      return true;
    }
    // In standalone/offline or GitHub pages mode, download directly from client storage
    if (e && e.preventDefault) e.preventDefault();
    downloadOfflineFile(type, id, fileName);
    return false;
  };

  function downloadOfflineFile(type, id, fileName) {
    let item = null;
    if (type === 'material') {
      const mats = getLocalMaterials();
      item = mats.find(m => m.material_id == id);
    } else {
      const subs = getLocalSubmissions();
      item = subs.find(s => s.submission_id == id);
    }

    const targetName = fileName || (item ? item.file_name : 'acadhub_document.pdf') || 'acadhub_document.pdf';

    if (item && item.file_data) {
      // User uploaded file stored as Base64 Data URL
      const a = document.createElement('a');
      a.href = item.file_data;
      a.download = targetName;
      document.body.appendChild(a);
      a.click();
      setTimeout(() => a.remove(), 200);
      if (window.UI && window.UI.toast) window.UI.toast('success', 'Downloaded ' + targetName);
      return;
    }

    // Generate valid sample document Blob for instant viewing
    const blob = generateSamplePdfBlob(targetName, item ? item.title : targetName);
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = targetName;
    document.body.appendChild(a);
    a.click();
    setTimeout(() => { a.remove(); URL.revokeObjectURL(url); }, 500);
    if (window.UI && window.UI.toast) window.UI.toast('success', 'Downloaded ' + targetName);
  }

  function generateSamplePdfBlob(fileName, title) {
    const cleanTitle = (title || fileName || 'AcadHub Document').replace(/[()]/g, '');
    const pdfData = `%PDF-1.4\n1 0 obj<</Type/Catalog/Pages 2 0 R>>endobj\n2 0 obj<</Type/Pages/Kids[3 0 R]/Count 1>>endobj\n3 0 obj<</Type/Page/MediaBox[0 0 612 792]/Parent 2 0 R/Resources<</Font<</F1 4 0 R>>>>/Contents 5 0 R>>endobj\n4 0 obj<</Type/Font/Subtype/Type1/BaseFont/Helvetica>>endobj\n5 0 obj<</Length 120>>stream\nBT\n/F1 18 Tf\n50 720 Td\n(AcadHub - ${cleanTitle}) Tj\n/F1 12 Tf\n0 -30 Td\n(Course document verified. Ready for academic review.) Tj\nET\nendstream\nendobj\nxref\n0 6\n0000000000 65535 f\n0000000009 00000 n\n0000000052 00000 n\n0000000109 00000 n\n0000000223 00000 n\n0000000293 00000 n\ntrailer<</Size 6/Root 1 0 R>>\nstartxref\n460\n%%EOF`;
    return new Blob([pdfData], { type: 'application/pdf' });
  }

  // ---------- Material Viewer Modal ----------
  window.openMaterialViewer = function (materialId) {
    const mats = (window.__facultyMaterialsCache && window.__facultyMaterialsCache.length)
      ? window.__facultyMaterialsCache
      : ((window.studentMaterialsCache && window.studentMaterialsCache.length) ? window.studentMaterialsCache : getLocalMaterials());
    
    const m = mats.find(x => x.material_id == materialId) || mats[0];
    if (!m) return;

    if ($('mvModalHead')) $('mvModalHead').textContent = 'Study Material Details';
    if ($('mvCategory')) {
      $('mvCategory').className = 'badge ' + (m.material_type || 'Notes').toLowerCase();
      $('mvCategory').textContent = m.material_type || 'Notes';
    }
    if ($('mvCourse')) $('mvCourse').textContent = m.course_code + (m.course_name ? ' · ' + m.course_name : '');
    if ($('mvDate')) $('mvDate').textContent = 'Posted: ' + (m.upload_date || 'Recent');
    if ($('mvTitle')) $('mvTitle').textContent = m.title;
    if ($('mvContent')) $('mvContent').textContent = m.content || 'Topic lecture notes and reference instructions.';

    const fileSec = $('mvFileSection');
    if (fileSec) {
      if (m.file_name) {
        fileSec.innerHTML = `
          <div style="font-size:13px;color:var(--muted);margin-bottom:6px;">Attached Document / Presentation:</div>
          <a href="/api/files/material/${m.material_id}" class="mat-file-link" style="width:100%;justify-content:center;padding:12px;" download="${esc(m.file_name)}" onclick="return window.handleFileDownload(event, 'material', ${m.material_id}, '${esc(m.file_name)}')">
            <i data-i="file"></i>
            <span>Download Attached File: <b>${esc(m.file_name)}</b></span>
            <span class="muted" style="margin-left:auto;font-size:11.5px;">(${esc(m.file_size || 'Attached')})</span>
          </a>
        `;
      } else {
        fileSec.innerHTML = `
          <div style="font-size:12.5px;color:var(--muted);background:var(--raised);padding:10px 14px;border-radius:10px;border:1px solid var(--border);">
            <i data-i="info"></i> Standard text-only lecture guidance posted by professor.
          </div>
        `;
      }
    }

    const actionSlot = $('mvActionSlot');
    if (actionSlot) {
      if (document.body.dataset.page === 'student') {
        actionSlot.innerHTML = `<button class="btn primary magnetic" onclick="window.closeMaterialViewer();window.openSubmitModal(${m.material_id}, '${esc(m.course_code)}', '${esc(m.title)}', '${esc(m.faculty_name || 'Professor')}')"><i data-i="send"></i>Send Work to Professor</button>`;
      } else {
        actionSlot.innerHTML = '';
      }
    }

    const modal = $('materialViewerModal');
    if (modal) modal.classList.add('open');
    if (window.UI && window.UI.icons) window.UI.icons();
  };

  window.closeMaterialViewer = function () {
    const modal = $('materialViewerModal');
    if (modal) modal.classList.remove('open');
  };

  function formatBytes(bytes) {
    if (!bytes || bytes <= 0) return '0 B';
    const k = 1024, dm = 1, sizes = ['B', 'KB', 'MB', 'GB'];
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    return parseFloat((bytes / Math.pow(k, i)).toFixed(dm)) + ' ' + sizes[i];
  }

  window.logout = async function () {
    try { localStorage.removeItem('acadhub_session'); } catch (e) {}
    try { await fetch('/api/logout', { method: 'POST' }); } catch (e) {}
    location.href = 'index.html';
  };

  async function whoami() {
    const live = await checkBackendLive();
    if (!live) {
      const u = handleOfflineGet('/api/me');
      const el = $('welcomeName');
      if (el) el.textContent = u.name;
      return u;
    }
    try {
      const res = await fetch('/api/me');
      if (res.ok) {
        const u = await res.json();
        const el = $('welcomeName');
        if (el) el.textContent = u.name;
        try { localStorage.setItem('acadhub_session', JSON.stringify(u)); } catch (e) {}
        return u;
      }
    } catch (e) {}
    return null;
  }

  // ============================================================
  //   1. LOGIN PAGE (index.html)
  // ============================================================
  const DEMO_ACCOUNTS = {
    STUDENT: { u: 'kriti16', p: 'kri16' },
    FACULTY: { u: 'rumneek24', p: 'rum24' },
    ADMIN:   { u: 'doaa30', p: 'adm@123' }
  };

  function initLoginPage() {
    const form = $('loginForm');
    if (!form) return;

    const uInput = $('username');
    const pInput = $('password');
    const errBox = $('loginError');

    document.querySelectorAll('.role-chip').forEach(ch => {
      ch.addEventListener('click', () => {
        const r = ch.dataset.role;
        if (DEMO_ACCOUNTS[r]) {
          if (uInput) uInput.value = DEMO_ACCOUNTS[r].u;
          if (pInput) pInput.value = DEMO_ACCOUNTS[r].p;
        }
      });
    });

    if (uInput && !uInput.value) uInput.value = DEMO_ACCOUNTS.STUDENT.u;
    if (pInput && !pInput.value) pInput.value = DEMO_ACCOUNTS.STUDENT.p;

    window.login = async function () {
      if (errBox) errBox.textContent = '';
      const username = (uInput ? uInput.value : '').trim();
      const password = (pInput ? pInput.value : '').trim();

      if (!username || !password) {
        if (errBox) errBox.textContent = 'Please enter both username and password.';
        return;
      }

      const res = await apiPost('/api/login', { username, password });
      if (res.ok && res.data) {
        const role = (res.data.role || '').toLowerCase();
        if (window.UI && window.UI.toast) window.UI.toast('success', 'Welcome, ' + res.data.name + '!');
        setTimeout(() => {
          if (role === 'admin') location.href = 'admin.html';
          else if (role === 'faculty') location.href = 'faculty.html';
          else location.href = 'student.html';
        }, 300);
      } else {
        const msg = res.data.error || 'Invalid credentials. Please try again.';
        if (errBox) errBox.textContent = msg;
        if (window.UI && window.UI.toast) window.UI.toast('error', msg);
      }
    };
  }

  // ============================================================
  //   2. ADMIN DASHBOARD (admin.html)
  // ============================================================
  async function initAdminPage() {
    if (document.body.dataset.page !== 'admin') return;
    await whoami();
    await refreshAdmin();

    window.autoGenUserCreds = function () {
      const name = ($('uName') ? $('uName').value.trim() : '') || 'Student';
      const cleanName = name.toLowerCase().replace(/[^a-z0-9]/g, '');
      const randNum = Math.floor(100 + Math.random() * 900);
      const randChar = ['#', '@', '$', '!'][Math.floor(Math.random() * 4)];
      
      const genUser = cleanName + randNum;
      const genPass = 'Acad' + randChar + (Math.floor(1000 + Math.random() * 9000));
      
      if ($('uUsername')) $('uUsername').value = genUser;
      if ($('uPassword')) $('uPassword').value = genPass;
      
      const rollInput = $('uRoll');
      if (rollInput && !rollInput.value) {
        rollInput.value = 1024030100 + Math.floor(10 + Math.random() * 80);
      }

      if (window.UI && window.UI.toast) {
        window.UI.toast('info', 'Generated credentials: @' + genUser);
      }
    };

    window.addUser = async function () {
      const role = $('uRole') ? $('uRole').value : 'Student';
      const name = $('uName') ? $('uName').value.trim() : '';
      const username = $('uUsername') ? $('uUsername').value.trim() : '';
      const password = $('uPassword') ? $('uPassword').value.trim() : '';
      const phone = $('uPhone') ? $('uPhone').value.trim() : '';

      if (!name || !username || !password) {
        if (window.UI && window.UI.toast) window.UI.toast('error', 'Please fill name, username, and password.');
        return;
      }

      const rollNo = (role === 'Student' && $('uRoll') && $('uRoll').value) ? parseInt($('uRoll').value, 10) : null;
      const dept = (role === 'Faculty' && $('uDept') && $('uDept').value) ? $('uDept').value : null;

      const r = await apiPost('/api/admin/user', { role, name, username, password, phone, rollNo, department: dept });
      if (r.ok) {
        if (window.UI && window.UI.toast) window.UI.toast('success', `User @${username} added successfully!`);
        ['uName', 'uUsername', 'uPassword', 'uPhone', 'uRoll'].forEach(id => { if ($(id)) $(id).value = ''; });
        refreshAdmin();
      } else {
        const err = r.data.error || 'Failed to add user.';
        if (window.UI && window.UI.toast) window.UI.toast('error', err);
      }
    };

    window.deleteUser = async function (id, username) {
      if (!confirm(`Are you sure you want to permanently delete user @${username}?`)) return;
      const r = await apiDelete('/api/admin/user/' + id);
      if (r.ok) {
        if (window.UI && window.UI.toast) window.UI.toast('success', `User @${username} deleted.`);
        refreshAdmin();
      } else {
        const err = r.data.error || 'Failed to delete user.';
        if (window.UI && window.UI.toast) window.UI.toast('error', err);
      }
    };

    window.assignCourse = async function () {
      const facultyId = $('aFaculty') ? parseInt($('aFaculty').value, 10) : 0;
      const courseCode = $('aCourse') ? $('aCourse').value : '';
      if (!facultyId || !courseCode) {
        if (window.UI && window.UI.toast) window.UI.toast('error', 'Select faculty and course.');
        return;
      }
      const r = await apiPost('/api/admin/assign', { facultyId, courseCode });
      if (r.ok) {
        if (window.UI && window.UI.toast) window.UI.toast('success', 'Faculty assigned to course.');
        refreshAdmin();
      } else {
        if (window.UI && window.UI.toast) window.UI.toast('error', r.data.error || 'Failed to assign.');
      }
    };

    window.enrollStudent = async function () {
      const rollNo = $('eStudent') ? parseInt($('eStudent').value, 10) : 0;
      const courseCode = $('eCourse') ? $('eCourse').value : '';
      if (!rollNo || !courseCode) {
        if (window.UI && window.UI.toast) window.UI.toast('error', 'Select student and course.');
        return;
      }
      const r = await apiPost('/api/admin/enroll', { rollNo, courseCode });
      if (r.ok) {
        if (window.UI && window.UI.toast) window.UI.toast('success', 'Student enrolled.');
        refreshAdmin();
      } else {
        if (window.UI && window.UI.toast) window.UI.toast('error', r.data.error || 'Failed to enroll.');
      }
    };

    window.addCourse = async function () {
      const courseCode = $('cCode') ? $('cCode').value.trim() : '';
      const courseName = $('cName') ? $('cName').value.trim() : '';
      const credits = $('cCredits') ? parseInt($('cCredits').value, 10) : 4;
      if (!courseCode || !courseName) {
        if (window.UI && window.UI.toast) window.UI.toast('error', 'Course code and name required.');
        return;
      }
      const r = await apiPost('/api/admin/course', { courseCode, courseName, credits });
      if (r.ok) {
        if (window.UI && window.UI.toast) window.UI.toast('success', `Course ${courseCode} created!`);
        ['cCode', 'cName'].forEach(id => { if ($(id)) $(id).value = ''; });
        refreshAdmin();
      } else {
        if (window.UI && window.UI.toast) window.UI.toast('error', r.data.error || 'Failed to create course.');
      }
    };
  }

  async function refreshAdmin() {
    const data = await apiGet('/api/admin/dashboard');
    if (!data) return;

    // Support both direct Map and List<Map>
    const summary = (Array.isArray(data.summary) ? data.summary[0] : data.summary) ||
                    (Array.isArray(data.stats) ? data.stats[0] : data.stats) ||
                    data.kpis || {};

    const students = Number(summary.total_students ?? summary.totalStudents ?? 0);
    const faculty = Number(summary.total_faculty ?? summary.totalFaculty ?? 0);
    const courses = Number(summary.total_courses ?? summary.totalCourses ?? 0);
    const enrollments = Number(summary.total_enrollments ?? summary.totalEnrollments ?? 0);

    if ($('totalStudents')) $('totalStudents').textContent = students;
    if ($('totalFaculty')) $('totalFaculty').textContent = faculty;
    if ($('totalCourses')) $('totalCourses').textContent = courses;
    if ($('totalEnrollments')) $('totalEnrollments').textContent = enrollments;

    // 1. Live Course Enrollment Distribution Graph
    const graphBars = $('enrollmentGraphBars');
    if (graphBars) {
      const list = data.enrollmentGraph || [];
      const maxCount = Math.max(...list.map(c => Number(c.enrolled_students || 0)), 1);
      const totalActive = list.reduce((a, b) => a + Number(b.enrolled_students || 0), 0);
      if ($('graphTotalBadge')) $('graphTotalBadge').textContent = `Total Active: ${totalActive}`;

      if (!list.length) {
        graphBars.innerHTML = '<p class="muted" style="text-align:center;padding:20px;">No course enrollments recorded yet.</p>';
      } else {
        graphBars.innerHTML = list.map(c => {
          const count = Number(c.enrolled_students || 0);
          const pct = Math.max(8, Math.round((count / maxCount) * 100));
          return `
            <div class="graph-bar-row">
              <div class="graph-course-info">
                <span class="graph-course-code">${esc(c.course_code)}</span>
                <span class="graph-course-faculty">Instructor: ${esc(c.faculty_names || 'Unassigned')}</span>
              </div>
              <div class="graph-track" title="${count} enrolled in ${esc(c.course_name)}">
                <div class="graph-fill" style="width: ${pct}%;"></div>
              </div>
              <div class="graph-val">${count} ${count === 1 ? 'student' : 'students'}</div>
            </div>
          `;
        }).join('');
      }
    }

    // 2. Academic Accountability & Connectivity Matrix (Course <-> Faculty <-> Students)
    const accBody = $('accountabilityBody');
    if (accBody) {
      const matrix = data.accountabilityMatrix || [];
      if (!matrix.length) {
        accBody.innerHTML = '';
      } else {
        accBody.innerHTML = matrix.map(m => {
          const rawStudents = m.enrolled_students_list || '';
          const students = rawStudents.split(';').map(s => s.trim()).filter(Boolean);
          const isAssigned = m.faculty_names && m.faculty_names !== 'Unassigned';
          return `
            <tr>
              <td>
                <b class="graph-course-code" style="font-size:14px;">${esc(m.course_code)}</b>
                <div style="font-weight:600;font-size:13px;color:var(--text);margin-top:2px;">${esc(m.course_name)}</div>
                <div class="muted" style="font-size:11.5px;margin-top:2px;">Semester ${esc(m.semester || 6)} · ${esc(m.credits || 4)} credits</div>
              </td>
              <td>
                <span class="chip ${isAssigned ? 'ok' : 'warn'}">
                  <i data-i="users"></i>${esc(m.faculty_names || 'Unassigned')}
                </span>
              </td>
              <td>
                <span style="font-family:'JetBrains Mono',monospace;font-size:15px;font-weight:700;color:var(--teal);">${esc(m.enrolled_count || 0)}</span>
              </td>
              <td>
                <div class="student-tags-wrap">
                  ${students.length && rawStudents !== 'No students enrolled' ? students.map(st => `
                    <span class="stu-tag"><i data-i="cap"></i>${esc(st)}</span>
                  `).join('') : '<span class="muted" style="font-size:12px;">No students enrolled yet</span>'}
                </div>
              </td>
            </tr>
          `;
        }).join('');
      }
    }

    // 3. Faculty Workload & Accountability Grid
    const facWorkload = $('facultyWorkloadList');
    if (facWorkload) {
      const facList = data.facultyAccountability || [];
      if (!facList.length) {
        facWorkload.innerHTML = '<p class="muted" style="grid-column:1/-1;text-align:center;padding:16px;">No faculty members registered.</p>';
      } else {
        facWorkload.innerHTML = facList.map(f => `
          <div class="fac-card">
            <div class="fac-top">
              <div class="fac-avatar">${esc((f.faculty_name || 'P').charAt(0))}</div>
              <div>
                <div style="font-weight:700;font-size:14.5px;color:var(--text);">${esc(f.faculty_name)}</div>
                <div class="muted" style="font-size:12px;">${esc(f.designation || 'Faculty')} · ${esc(f.department || 'CSE')} (@${esc(f.username)})</div>
              </div>
            </div>
            <div style="margin-top:10px;font-size:13px;display:flex;justify-content:space-between;padding-top:8px;border-top:1px solid var(--border);">
              <span class="muted">Courses Assigned:</span>
              <strong class="graph-course-code">${esc(f.courses_taught || 'None')}</strong>
            </div>
            <div style="margin-top:6px;font-size:13px;display:flex;justify-content:space-between;">
              <span class="muted">Students Mentored:</span>
              <strong style="color:var(--teal);font-family:'JetBrains Mono',monospace;">${esc(f.total_students_mentored || 0)} enrolled</strong>
            </div>
          </div>
        `).join('');
      }
    }

    // 4. At-Risk Table
    const riskBody = $('riskBody') || $('atRiskBody');
    if (riskBody) {
      const atRisk = data.atRisk || [];
      if (!atRisk.length) {
        riskBody.innerHTML = '';
      } else {
        riskBody.innerHTML = atRisk.map(r => `
          <tr class="risk-row">
            <td><b>${esc(r.name || r.student_name || r.roll_no)}</b> <span class="muted">(Roll: ${esc(r.roll_no)})</span></td>
            <td>${esc(r.course_code || r.course)}</td>
            <td>${Number(r.attendance_pct || r.percentage || 0).toFixed(1)}%</td>
            <td>${Number(r.avg_marks || 0).toFixed(1)} / 100</td>
          </tr>
        `).join('');
      }
    }

    // 5. Options & User Directory
    const opts = await apiGet('/api/admin/options');
    if (opts) {
      if (opts.courses) {
        const cOpts = opts.courses.map(c => `<option value="${esc(c.course_code)}">${esc(c.course_code)} - ${esc(c.course_name)}</option>`).join('');
        ['aCourse', 'eCourse', 'uCourse'].forEach(id => { if ($(id)) $(id).innerHTML = cOpts; });
      }
      if (opts.students && $('eStudent')) {
        $('eStudent').innerHTML = opts.students.map(s => `<option value="${esc(s.roll_no)}">${esc(s.name)} (Roll: ${esc(s.roll_no)})</option>`).join('');
      }
      if (opts.faculty && $('aFaculty')) {
        $('aFaculty').innerHTML = opts.faculty.map(f => `<option value="${esc(f.faculty_id)}">${esc(f.name)}</option>`).join('');
      }
      const userListEl = $('userListBody') || $('usersBody');
      if (opts.users && userListEl) {
        userListEl.innerHTML = opts.users.map(u => `
          <tr>
            <td>@${esc(u.username)}</td>
            <td><b>${esc(u.name)}</b></td>
            <td><span class="chip ${u.role === 'Admin' ? 'warn' : (u.role === 'Faculty' ? 'sky' : 'ok')}">${esc(u.role)}</span></td>
            <td>
              <button class="btn ghost" style="padding:4px 8px;font-size:12px;color:var(--danger);" onclick="window.deleteUser(${u.user_id}, '${esc(u.username)}')"><i data-i="trash"></i></button>
            </td>
          </tr>
        `).join('');
      }
    }

    if (window.UI && window.UI.icons) window.UI.icons();
  }

  // ============================================================
  //   3. FACULTY DASHBOARD (faculty.html)
  // ============================================================
  window.__facultyMaterialsCache = [];

  function setupDropzoneEvents(zoneId, inputId, onSelect) {
    const zone = $(zoneId);
    const input = $(inputId);
    if (!zone || !input) return;

    ['dragenter', 'dragover'].forEach(n => {
      zone.addEventListener(n, e => {
        e.preventDefault(); e.stopPropagation();
        zone.classList.add('drag-active');
      });
    });
    ['dragleave', 'drop'].forEach(n => {
      zone.addEventListener(n, e => {
        e.preventDefault(); e.stopPropagation();
        zone.classList.remove('drag-active');
      });
    });
    zone.addEventListener('drop', e => {
      if (e.dataTransfer && e.dataTransfer.files && e.dataTransfer.files.length) {
        input.files = e.dataTransfer.files;
        if (onSelect) onSelect(input);
      }
    });
  }

  async function initFacultyPage() {
    if (document.body.dataset.page !== 'faculty') return;
    setupDropzoneEvents('smDropzone', 'smFileInput', window.handleMaterialFileSelect);
    await whoami();
    await window.refreshFaculty();
  }

  window.refreshFaculty = async function () {
    const d = await apiGet('/api/faculty/dashboard');
    if (!d) return;

    const courses = d.courses || [];
    ['fCourse', 'mCourse', 'faCourse', 'smCourse'].forEach(id => {
      const el = $(id);
      if (el) {
        el.innerHTML = courses.map(c => `<option value="${esc(c.course_code)}">${esc(c.course_code)} - ${esc(c.course_name)}</option>`).join('');
      }
    });

    const todayInput = $('today');
    if (todayInput && !todayInput.value) {
      todayInput.value = new Date().toISOString().slice(0, 10);
    }

    if (courses.length) {
      await window.loadStudents();
      await window.loadFacultyMaterials();
      await window.loadFacultySubmissions();
    }
  };

  window.loadStudents = async function () {
    const fCourse = $('fCourse');
    const mCourse = $('mCourse');
    const code = fCourse ? fCourse.value : (mCourse ? mCourse.value : '');
    if (!code) return;

    const cData = await apiGet('/api/faculty/course-data?course=' + encodeURIComponent(code));
    if (!cData) return;

    const attBody = $('attBody');
    if (attBody) {
      const students = cData.students || [];
      attBody.innerHTML = students.map(s => `
        <tr>
          <td><b>${esc(s.name)}</b> <span class="muted">(Roll: ${esc(s.roll_no)})</span></td>
          <td>
            <div class="field sel fixed" style="width: 140px; margin: 0;">
              <select data-roll="${esc(s.roll_no)}">
                <option value="Present" selected>Present</option>
                <option value="Absent">Absent</option>
              </select>
            </div>
          </td>
        </tr>
      `).join('');
    }

    const summaryBody = $('summaryBody');
    if (summaryBody && cData.summary) {
      summaryBody.innerHTML = cData.summary.map(s => `
        <tr>
          <td><b>${esc(s.student_name)}</b></td>
          <td>${esc(s.avg_marks)}</td>
          <td><span class="chip ${s.grade === 'A+' || s.grade === 'A' ? 'ok' : 'sky'}">${esc(s.grade)}</span></td>
        </tr>
      `).join('');
    }

    const mAssess = $('mAssess');
    if (mAssess && cData.assessments) {
      mAssess.innerHTML = cData.assessments.map(a => `<option value="${esc(a.assessment_id)}">${esc(a.assessment_type)} (${esc(a.total_marks)} pts)</option>`).join('');
    }

    const facAssessBody = $('facAssessBody');
    if (facAssessBody && cData.assessments) {
      facAssessBody.innerHTML = cData.assessments.map(a => `
        <tr>
          <td><b>${esc(a.assessment_type)}</b></td>
          <td>${esc(a.total_marks)}</td>
          <td>${esc(a.passing_marks)}</td>
        </tr>
      `).join('');
    }
  };

  window.markAttendance = async function () {
    const course = $('fCourse') ? $('fCourse').value : '';
    const date = $('today') ? $('today').value : '';
    const selects = document.querySelectorAll('#attBody select[data-roll]');
    const records = [];
    selects.forEach(sel => {
      records.push({ rollNo: parseInt(sel.dataset.roll, 10), status: sel.value });
    });

    if (!records.length) {
      if (window.UI && window.UI.toast) window.UI.toast('error', 'No students to record.');
      return;
    }

    const r = await apiPost('/api/faculty/attendance', { course, date, records });
    if (r.ok) {
      if (window.UI && window.UI.toast) window.UI.toast('success', `Attendance recorded for ${records.length} students.`);
    } else {
      if (window.UI && window.UI.toast) window.UI.toast('error', r.data.error || 'Failed to save attendance.');
    }
  };

  window.saveMarks = async function () {
    const course = $('mCourse') ? $('mCourse').value : '';
    const assessmentId = $('mAssess') ? parseInt($('mAssess').value, 10) : 0;
    const rollNo = $('mStudent') ? parseInt($('mStudent').value, 10) : 0;
    const marks = $('mMarks') ? parseFloat($('mMarks').value) : null;

    if (!course || !assessmentId || !rollNo || marks === null || isNaN(marks)) {
      if (window.UI && window.UI.toast) window.UI.toast('error', 'Please fill all marks fields.');
      return;
    }

    const r = await apiPost('/api/faculty/marks', { course, assessmentId, rollNo, marks });
    if (r.ok) {
      if (window.UI && window.UI.toast) window.UI.toast('success', 'Marks saved successfully.');
      if ($('mStudent')) $('mStudent').value = '';
      if ($('mMarks')) $('mMarks').value = '';
      window.loadStudents();
    } else {
      if (window.UI && window.UI.toast) window.UI.toast('error', r.data.error || 'Failed to save marks.');
    }
  };

  window.addFacultyAssessment = async function () {
    const course = $('faCourse') ? $('faCourse').value : '';
    const type = $('faType') ? $('faType').value.trim() : '';
    const total = $('faTotal') ? parseInt($('faTotal').value, 10) : 100;
    const pass = $('faPass') ? parseInt($('faPass').value, 10) : 40;

    if (!course || !type) {
      if (window.UI && window.UI.toast) window.UI.toast('error', 'Course and assessment title required.');
      return;
    }

    const r = await apiPost('/api/faculty/assessment', { course, assessmentType: type, totalMarks: total, passingMarks: pass });
    if (r.ok) {
      if (window.UI && window.UI.toast) window.UI.toast('success', `Assessment "${type}" published!`);
      if ($('faType')) $('faType').value = '';
      window.loadStudents();
    } else {
      if (window.UI && window.UI.toast) window.UI.toast('error', r.data.error || 'Failed to publish assessment.');
    }
  };

  window.handleMaterialFileSelect = function (input) {
    if (!input || !input.files || !input.files[0]) return;
    const file = input.files[0];
    if (file.size > 50 * 1024 * 1024) {
      if (window.UI && window.UI.toast) window.UI.toast('error', 'File exceeds 50MB limit: ' + formatBytes(file.size));
      input.value = '';
      return;
    }
    const nameEl = $('smSelectedName');
    const sizeEl = $('smSelectedSize');
    const extEl = $('smExtBadge');
    const box = $('smSelectedBox');
    const dropzone = $('smDropzone');

    if (nameEl) nameEl.textContent = file.name;
    if (sizeEl) sizeEl.textContent = formatBytes(file.size);
    if (extEl) {
      const parts = file.name.split('.');
      extEl.textContent = (parts.length > 1 ? parts.pop() : 'FILE').toUpperCase().slice(0, 4);
    }
    if (box) box.style.display = 'flex';
    if (dropzone) dropzone.style.display = 'none';
  };

  window.clearMaterialFile = function () {
    const input = $('smFileInput');
    if (input) input.value = '';
    const box = $('smSelectedBox');
    const dropzone = $('smDropzone');
    if (box) box.style.display = 'none';
    if (dropzone) dropzone.style.display = 'flex';
  };

  window.resetMaterialForm = function () {
    ['smTitle', 'smContent'].forEach(id => { if ($(id)) $(id).value = ''; });
    window.clearMaterialFile();
  };

  window.uploadStudyMaterial = async function () {
    const course = $('smCourse') ? $('smCourse').value : '';
    const title = $('smTitle') ? $('smTitle').value.trim() : '';
    const type = $('smType') ? $('smType').value : 'Notes';
    const content = $('smContent') ? $('smContent').value.trim() : '';
    const fileInput = $('smFileInput');
    const file = (fileInput && fileInput.files && fileInput.files[0]) ? fileInput.files[0] : null;

    if (!course || !title) {
      if (window.UI && window.UI.toast) window.UI.toast('error', 'Course and Title are required.');
      return;
    }

    const fd = new FormData();
    fd.append('course', course);
    fd.append('title', title);
    fd.append('type', type);
    fd.append('content', content);
    if (file) fd.append('file', file);

    const r = await apiPostFormData('/api/faculty/material-upload', fd);
    if (r.ok) {
      if (window.UI && window.UI.toast) {
        window.UI.toast('success', file ? `Material & file "${file.name}" uploaded successfully!` : 'Study Material published!');
      }
      ['smTitle', 'smContent'].forEach(id => { if ($(id)) $(id).value = ''; });
      window.clearMaterialFile();
      window.loadFacultyMaterials();
    } else {
      const err = (r.data && r.data.error) || 'Failed to upload material';
      if (window.UI && window.UI.toast) window.UI.toast('error', err);
    }
  };

  window.loadFacultyMaterials = async function () {
    const listEl = $('facultyMaterialsList');
    if (!listEl) return;

    const materials = await apiGet('/api/faculty/materials');
    window.__facultyMaterialsCache = materials || [];

    if (!materials || !materials.length) {
      listEl.innerHTML = '<p class="muted" style="grid-column:1/-1;padding:20px;text-align:center;">No study materials published yet. Use the form above to add notes, slides, or tutorials.</p>';
      return;
    }

    listEl.innerHTML = materials.map(m => {
      const typeClass = (m.material_type || 'Notes').toLowerCase();
      return `
        <div class="mat-card">
          <div class="mat-top">
            <span class="mat-course">${esc(m.course_code)}</span>
            <span class="badge ${typeClass}">${esc(m.material_type || 'Notes')}</span>
          </div>
          <div class="mat-title">${esc(m.title)}</div>
          <div class="mat-content">${esc(m.content || 'Topic lecture notes and reference instructions.')}</div>
          ${m.file_name ? `
            <div style="margin-top:6px;margin-bottom:8px;">
              <a href="/api/files/material/${m.material_id}" class="mat-file-link" download="${esc(m.file_name)}" onclick="return window.handleFileDownload(event, 'material', ${m.material_id}, '${esc(m.file_name)}')">
                <i data-i="file"></i>
                <span>Download Attached File: <b>${esc(m.file_name)}</b></span>
                <span class="muted" style="margin-left:auto;font-size:11.5px;">(${esc(m.file_size || 'Attached')})</span>
              </a>
            </div>
          ` : ''}
          <div class="mat-card-actions">
            <button type="button" class="mat-view-btn" onclick="window.openMaterialViewer(${m.material_id})">
              <i data-i="book"></i> Read Notes & Details
            </button>
          </div>
          <div class="mat-footer">
            <span>Uploaded: ${esc(m.upload_date || 'Recent')}</span>
            <div style="display:flex;gap:6px;align-items:center;">
              <span class="muted" style="font-size:11px;">Submissions: ${m.submissions_count || 0}</span>
              <button class="btn ghost" style="padding:4px 8px;font-size:12px;color:var(--danger);" onclick="window.deleteFacultyMaterial(${m.material_id})" title="Delete material"><i data-i="trash"></i></button>
            </div>
          </div>
        </div>
      `;
    }).join('');

    if (window.UI && window.UI.icons) window.UI.icons();
  };

  window.deleteFacultyMaterial = async function (id) {
    if (!confirm('Are you sure you want to delete this study material?')) return;
    const r = await apiDelete('/api/faculty/material/' + id);
    if (r.ok) {
      if (window.UI && window.UI.toast) window.UI.toast('success', 'Material deleted.');
      window.loadFacultyMaterials();
    }
  };

  window.loadFacultySubmissions = async function () {
    const listEl = $('facultySubmissionsList');
    if (!listEl) return;

    const submissions = await apiGet('/api/faculty/submissions');
    if (!submissions || !submissions.length) {
      listEl.innerHTML = '<p class="muted" style="padding:20px;text-align:center;">No student submissions received yet.</p>';
      return;
    }

    listEl.innerHTML = submissions.map(s => {
      const isRev = s.status === 'Reviewed' || s.status === 'Approved';
      const hasLocalFile = !!s.file_name;
      return `
        <div class="sub-card">
          <div class="sub-top">
            <div class="sub-student">
              <i data-i="cap" style="color:var(--teal)"></i>
              <span>${esc(s.student_name)}</span>
              <span class="muted">(Roll: ${esc(s.roll_no)})</span>
              <span class="mat-course">${esc(s.course_code)}</span>
            </div>
            <div style="display:flex;gap:8px;align-items:center;">
              <span class="chip ${isRev ? 'ok' : 'sky'}">${esc(s.status || 'Submitted')}</span>
              <button class="btn" style="padding:4px 10px;font-size:12px;" onclick="window.openReviewModal(${s.submission_id}, '${esc(s.student_name)}', '${esc(s.title)}', '${encodeURIComponent(s.submission_text || '')}', '${esc(s.status || 'Reviewed')}', '${encodeURIComponent(s.feedback || '')}', '${esc(s.file_name || '')}', '${esc(s.file_size || '')}', '${esc(s.file_url || '')}')"><i data-i="award"></i>Review</button>
            </div>
          </div>
          <div style="font-weight:700;font-size:15px;color:var(--text);">${esc(s.title)}</div>
          <div class="sub-body">${esc(s.submission_text)}</div>
          ${hasLocalFile ? `
            <div style="margin-top:4px;">
              <a href="/api/files/submission/${s.submission_id}" class="mat-file-link" download="${esc(s.file_name)}" onclick="return window.handleFileDownload(event, 'submission', ${s.submission_id}, '${esc(s.file_name)}')">
                <i data-i="file"></i>
                <span>Download Attached File: <b>${esc(s.file_name)}</b></span>
                <span class="muted" style="margin-left:auto;font-size:11.5px;">(${esc(s.file_size || 'Attached')})</span>
              </a>
            </div>
          ` : (s.file_url ? `<div style="font-size:13px;"><a href="${esc(s.file_url)}" target="_blank" rel="noopener" style="color:var(--sky);text-decoration:underline;"><i data-i="file"></i>View Attached Work / Document</a></div>` : '')}
          ${s.feedback ? `<div class="sub-feedback"><strong>Teacher Feedback:</strong> ${esc(s.feedback)}</div>` : ''}
        </div>
      `;
    }).join('');

    if (window.UI && window.UI.icons) window.UI.icons();
  };

  window.openReviewModal = function (subId, studentName, title, encContent, status, encFeedback, fileName, fileSize, fileUrl) {
    if ($('revSubId')) $('revSubId').value = subId;
    if ($('revStudentName')) $('revStudentName').textContent = studentName;
    if ($('revTitle')) $('revTitle').textContent = title;
    if ($('revContent')) $('revContent').textContent = decodeURIComponent(encContent);
    if ($('revStatus')) $('revStatus').value = status || 'Reviewed';
    if ($('revFeedback')) $('revFeedback').value = decodeURIComponent(encFeedback) || 'Good work!';

    const fileSection = $('revFileSection');
    if (fileSection) {
      if (fileName) {
        fileSection.innerHTML = `
          <div style="font-size:13px;color:var(--muted);margin-bottom:4px;">Attached File from PC / Laptop:</div>
          <a href="/api/files/submission/${subId}" class="mat-file-link" download="${esc(fileName)}" onclick="return window.handleFileDownload(event, 'submission', ${subId}, '${esc(fileName)}')">
            <i data-i="file"></i>
            <span>Download File: <b>${esc(fileName)}</b></span>
            <span class="muted" style="margin-left:auto;font-size:11.5px;">(${esc(fileSize || 'Attached')})</span>
          </a>
        `;
      } else if (fileUrl) {
        fileSection.innerHTML = `
          <div style="font-size:13px;color:var(--muted);margin-bottom:4px;">External Link:</div>
          <a href="${esc(fileUrl)}" target="_blank" rel="noopener" style="color:var(--sky);text-decoration:underline;font-size:13px;">${esc(fileUrl)}</a>
        `;
      } else {
        fileSection.innerHTML = '';
      }
    }

    const modal = $('reviewModal');
    if (modal) modal.classList.add('open');
    if (window.UI && window.UI.icons) window.UI.icons();
  };

  window.closeReviewModal = function () {
    const modal = $('reviewModal');
    if (modal) modal.classList.remove('open');
  };

  window.submitReview = async function () {
    const subId = $('revSubId') ? parseInt($('revSubId').value, 10) : 0;
    const status = $('revStatus') ? $('revStatus').value : 'Reviewed';
    const feedback = $('revFeedback') ? $('revFeedback').value.trim() : '';

    if (!subId) return;

    const r = await apiPost('/api/faculty/submission-grade', { submissionId: subId, status, feedback });
    if (r.ok) {
      if (window.UI && window.UI.toast) window.UI.toast('success', 'Review and feedback saved!');
      window.closeReviewModal();
      window.loadFacultySubmissions();
    } else {
      if (window.UI && window.UI.toast) window.UI.toast('error', r.data.error || 'Failed to save review.');
    }
  };

  // ============================================================
  //   4. STUDENT DASHBOARD (student.html)
  // ============================================================
  let studentMaterialsCache = [];

  async function initStudentPage() {
    if (document.body.dataset.page !== 'student') return;
    setupDropzoneEvents('subDropzone', 'subFileInput', window.handleStudentFileSelect);
    await whoami();
    await refreshStudent();
    await window.loadStudentMaterials();
    await window.loadStudentSubmissions();
  }

  async function refreshStudent() {
    const d = await apiGet('/api/student/dashboard');
    if (!d) return;

    if (d.student) {
      if ($('welcomeName')) $('welcomeName').textContent = d.student.name;
      if ($('studentRollBadge')) $('studentRollBadge').textContent = 'Roll: ' + d.student.roll_no;
      if ($('cgpa')) $('cgpa').textContent = (d.student.cgpa || 8.0).toFixed(2);
    }

    if (d.overallAttendance && $('overallAttVal')) {
      const pct = d.overallAttendance.percentage || 0;
      $('overallAttVal').textContent = pct.toFixed(1) + '%';
      const pill = $('overallAttPill');
      if (pill) {
        pill.textContent = pct >= 75 ? 'Safe' : 'At Risk';
        pill.className = 'pill ' + (pct >= 75 ? 'ok' : 'danger');
      }
    }

    const courses = d.courses || [];
    if ($('totalCourses')) $('totalCourses').textContent = courses.length;

    const attBody = $('attBody');
    if (attBody) {
      attBody.innerHTML = courses.map(c => {
        const pct = c.attendance_pct || 0;
        const isSafe = pct >= 75;
        return `
          <tr>
            <td><b>${esc(c.course_code)}</b> - ${esc(c.course_name)}</td>
            <td>
              <div style="display:flex;align-items:center;gap:8px;">
                <span class="chip ${isSafe ? 'ok' : 'danger'}">${pct.toFixed(1)}%</span>
                <span class="muted" style="font-size:12px;">(${esc(c.attended)}/${esc(c.total_classes)})</span>
              </div>
            </td>
          </tr>
        `;
      }).join('');
    }

    const marksBody = $('marksBody');
    if (marksBody) {
      marksBody.innerHTML = courses.map(c => `
        <tr>
          <td><b>${esc(c.course_code)}</b></td>
          <td>${esc(c.marks != null ? c.marks : 'N/A')} / ${esc(c.max_marks || 100)}</td>
          <td><span class="chip ${c.grade === 'A+' || c.grade === 'A' ? 'ok' : 'sky'}">${esc(c.grade || 'Pending')}</span></td>
        </tr>
      `).join('');
    }

    const filterEl = $('stCourseFilter');
    if (filterEl) {
      filterEl.innerHTML = '<option value="">All My Enrolled Courses</option>' +
        courses.map(c => `<option value="${esc(c.course_code)}">${esc(c.course_code)} - ${esc(c.course_name)}</option>`).join('');
    }
  }

  window.handleStudentFileSelect = function (input) {
    if (!input || !input.files || !input.files[0]) return;
    const file = input.files[0];
    if (file.size > 50 * 1024 * 1024) {
      if (window.UI && window.UI.toast) window.UI.toast('error', 'File exceeds 50MB limit: ' + formatBytes(file.size));
      input.value = '';
      return;
    }
    const nameEl = $('subSelectedName');
    const sizeEl = $('subSelectedSize');
    const extEl = $('subExtBadge');
    const box = $('subSelectedBox');
    const dropzone = $('subDropzone');

    if (nameEl) nameEl.textContent = file.name;
    if (sizeEl) sizeEl.textContent = formatBytes(file.size);
    if (extEl) {
      const parts = file.name.split('.');
      extEl.textContent = (parts.length > 1 ? parts.pop() : 'FILE').toUpperCase().slice(0, 4);
    }
    if (box) box.style.display = 'flex';
    if (dropzone) dropzone.style.display = 'none';
  };

  window.clearStudentFile = function () {
    const input = $('subFileInput');
    if (input) input.value = '';
    const box = $('subSelectedBox');
    const dropzone = $('subDropzone');
    if (box) box.style.display = 'none';
    if (dropzone) dropzone.style.display = 'flex';
  };

  window.loadStudentMaterials = async function () {
    const listEl = $('studentMaterialsList');
    if (!listEl) return;

    const materials = await apiGet('/api/student/materials');
    studentMaterialsCache = materials || [];
    window.renderStudentMaterials(studentMaterialsCache);
  };

  window.renderStudentMaterials = function (materials) {
    const listEl = $('studentMaterialsList');
    if (!listEl) return;

    if (!materials || !materials.length) {
      listEl.innerHTML = '<p class="muted" style="grid-column:1/-1;padding:24px;text-align:center;">No study materials posted yet for your enrolled courses.</p>';
      return;
    }

    listEl.innerHTML = materials.map(m => {
      const typeClass = (m.material_type || 'Notes').toLowerCase();
      return `
        <div class="mat-card">
          <div class="mat-top">
            <span class="mat-course">${esc(m.course_code)} · ${esc(m.course_name || '')}</span>
            <span class="badge ${typeClass}">${esc(m.material_type || 'Notes')}</span>
          </div>
          <div class="mat-title">${esc(m.title)}</div>
          <div class="mat-content">${esc(m.content || 'Study notes and instructions.')}</div>
          ${m.file_name ? `
            <div style="margin-top:6px;margin-bottom:8px;">
              <a href="/api/files/material/${m.material_id}" class="mat-file-link" download="${esc(m.file_name)}" onclick="return window.handleFileDownload(event, 'material', ${m.material_id}, '${esc(m.file_name)}')">
                <i data-i="file"></i>
                <span>Download Attached File: <b>${esc(m.file_name)}</b></span>
                <span class="muted" style="margin-left:auto;font-size:11.5px;">(${esc(m.file_size || 'Attached')})</span>
              </a>
            </div>
          ` : ''}
          <div class="mat-card-actions">
            <button type="button" class="mat-view-btn" onclick="window.openMaterialViewer(${m.material_id})">
              <i data-i="book"></i> Read Notes & Details
            </button>
          </div>
          <div class="mat-footer">
            <div>
              <span style="display:block;font-weight:600;color:var(--text);">${esc(m.faculty_name || 'Professor')}</span>
              <span style="font-size:11px;">Posted: ${esc(m.upload_date || 'Recent')}</span>
            </div>
            <button class="btn primary magnetic" style="font-size:12px;padding:6px 12px;" onclick="window.openSubmitModal(${m.material_id}, '${esc(m.course_code)}', '${esc(m.title)}', '${esc(m.faculty_name || 'Professor')}')">
              <i data-i="send"></i>Send Work
            </button>
          </div>
        </div>
      `;
    }).join('');

    if (window.UI && window.UI.icons) window.UI.icons();
  };

  window.filterStudentMaterials = function (courseCode) {
    if (!courseCode) {
      window.renderStudentMaterials(studentMaterialsCache);
    } else {
      const filtered = studentMaterialsCache.filter(m => m.course_code === courseCode);
      window.renderStudentMaterials(filtered);
    }
  };

  window.openSubmitModal = function (materialId, courseCode, title, facultyName) {
    if ($('subMaterialId')) $('subMaterialId').value = materialId || '';
    if ($('subCourseCode')) $('subCourseCode').value = courseCode;
    if ($('subCourseBadge')) $('subCourseBadge').textContent = courseCode;
    if ($('subMaterialTitle')) $('subMaterialTitle').textContent = title || 'Course Assignment';
    if ($('subFacultyName')) $('subFacultyName').textContent = 'Instructor: ' + (facultyName || 'Professor');
    if ($('subTitle')) $('subTitle').value = 'Solution for: ' + (title || 'Assignment');
    if ($('subContent')) $('subContent').value = '';
    if ($('subFileUrl')) $('subFileUrl').value = '';
    window.clearStudentFile();

    const modal = $('submitWorkModal');
    if (modal) modal.classList.add('open');
  };

  window.closeSubmitModal = function () {
    const modal = $('submitWorkModal');
    if (modal) modal.classList.remove('open');
    window.clearStudentFile();
  };

  window.confirmSubmitWork = async function () {
    const materialId = $('subMaterialId') && $('subMaterialId').value ? Number($('subMaterialId').value) : null;
    const courseCode = $('subCourseCode') ? $('subCourseCode').value : '';
    const title = $('subTitle') ? $('subTitle').value.trim() : '';
    const submissionText = $('subContent') ? $('subContent').value.trim() : '';
    const fileUrl = $('subFileUrl') ? $('subFileUrl').value.trim() : '';
    const fileInput = $('subFileInput');
    const file = (fileInput && fileInput.files && fileInput.files[0]) ? fileInput.files[0] : null;

    if (!courseCode || !title || (!submissionText && !file && !fileUrl)) {
      if (window.UI && window.UI.toast) window.UI.toast('error', 'Please provide a title and either answer notes, attached file, or link.');
      return;
    }

    const fd = new FormData();
    fd.append('courseCode', courseCode);
    fd.append('title', title);
    fd.append('submissionText', submissionText || '');
    if (materialId) fd.append('materialId', materialId);
    if (fileUrl) fd.append('fileUrl', fileUrl);
    if (file) fd.append('file', file);

    const r = await apiPostFormData('/api/student/submit-upload', fd);
    if (r.ok) {
      if (window.UI && window.UI.toast) {
        window.UI.toast('success', file ? `Work with file "${file.name}" sent to professor!` : 'Work sent successfully to professor!');
      }
      window.closeSubmitModal();
      window.loadStudentSubmissions();
    } else {
      const err = (r.data && r.data.error) || 'Failed to submit work';
      if (window.UI && window.UI.toast) window.UI.toast('error', err);
    }
  };

  window.loadStudentSubmissions = async function () {
    const listEl = $('studentSubmissionsList');
    if (!listEl) return;

    const submissions = await apiGet('/api/student/submissions');
    if (!submissions || !submissions.length) {
      listEl.innerHTML = '<p class="muted" style="padding:20px;text-align:center;">You have not submitted any assignments or coursework yet.</p>';
      return;
    }

    listEl.innerHTML = submissions.map(s => {
      const isRev = s.status === 'Reviewed' || s.status === 'Approved';
      const hasLocalFile = !!s.file_name;
      return `
        <div class="sub-card">
          <div class="sub-top">
            <div>
              <span class="mat-course">${esc(s.course_code)}</span>
              <span style="font-weight:700;font-size:15px;margin-left:8px;">${esc(s.title)}</span>
            </div>
            <div style="display:flex;align-items:center;gap:8px;">
              <span class="chip ${isRev ? 'ok' : 'sky'}">${esc(s.status || 'Submitted')}</span>
              <span class="muted" style="font-size:12px;">${esc(s.submitted_at ? s.submitted_at.slice(0, 10) : 'Recent')}</span>
            </div>
          </div>
          <div class="sub-body">${esc(s.submission_text)}</div>
          ${hasLocalFile ? `
            <div style="margin-top:6px;">
              <a href="/api/files/submission/${s.submission_id}" class="mat-file-link" download="${esc(s.file_name)}" onclick="return window.handleFileDownload(event, 'submission', ${s.submission_id}, '${esc(s.file_name)}')">
                <i data-i="file"></i>
                <span>Attached File: <b>${esc(s.file_name)}</b></span>
                <span class="muted" style="margin-left:auto;font-size:11.5px;">(${esc(s.file_size || 'Attached')})</span>
              </a>
            </div>
          ` : (s.file_url ? `<div style="font-size:13px;margin-top:6px;"><a href="${esc(s.file_url)}" target="_blank" rel="noopener" style="color:var(--sky);text-decoration:underline;"><i data-i="file"></i>View Attached Work</a></div>` : '')}
          ${s.feedback ? `
            <div class="sub-feedback" style="margin-top:6px;">
              <strong>Professor Feedback:</strong> ${esc(s.feedback)}
            </div>
          ` : '<p class="muted" style="font-size:12px;margin:4px 0 0;"><i data-i="info"></i>Waiting for professor review.</p>'}
        </div>
      `;
    }).join('');

    if (window.UI && window.UI.icons) window.UI.icons();
  };

  // ---------- Bootstrap Page Specific Logic ----------
  document.addEventListener('DOMContentLoaded', () => {
    checkBackendLive();
    initLoginPage();
    initAdminPage();
    initFacultyPage();
    initStudentPage();
  });

})();
