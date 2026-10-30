// ============================================================
//   AcadHub · app.js
//   Core application and API connectivity layer
//   Compatible with ui.js and all Spring Boot REST endpoints
// ============================================================

(function () {
  'use strict';

  const $ = (id) => document.getElementById(id);
  const esc = (s) => String(s == null ? '' : s).replace(/[&<>"']/g, c => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[c]));

  // ---------- Generic API Callers ----------
  async function apiGet(url) {
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
  }

  async function apiPost(url, body) {
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
  }

  async function apiDelete(url) {
    const res = await fetch(url, { method: 'DELETE' });
    if (res.status === 401 || res.status === 403) {
      location.href = 'index.html';
      return { ok: false, data: {} };
    }
    let data = {};
    try { data = await res.json(); } catch (e) {}
    return { ok: res.ok, status: res.status, data };
  }

  window.logout = async function () {
    await fetch('/api/logout', { method: 'POST' });
    location.href = 'index.html';
  };

  async function whoami() {
    const res = await fetch('/api/me');
    if (res.ok) {
      const u = await res.json();
      const el = $('welcomeName');
      if (el) el.textContent = u.name;
      return u;
    }
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
  let lastCreatedCredentials = null;

  async function initAdminPage() {
    if (document.body.dataset.page !== 'admin') return;
    await whoami();
    await refreshAdmin();

    // Auto-Generate Credentials helper for admin
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

    // Add user with instant credential display
    window.addUser = async function () {
      const role = $('uRole') ? $('uRole').value : 'Student';
      const name = $('uName') ? $('uName').value.trim() : '';
      const username = $('uUsername') ? $('uUsername').value.trim() : '';
      const password = $('uPassword') ? $('uPassword').value.trim() : '';
      const phone = $('uPhone') ? $('uPhone').value.trim() : '';

      if (!name || !username || !password) {
        if (window.UI && window.UI.toast) window.UI.toast('error', 'Please fill out name, username, and password.');
        else alert('Please fill out all required fields.');
        return;
      }

      const body = { role, name, username, password, phone };
      if (role.toLowerCase() === 'student') {
        body.rollNo = $('uRoll') && $('uRoll').value ? Number($('uRoll').value) : null;
        body.department = $('uDept') ? $('uDept').value.trim() : 'CSE';
        body.branch = 'COE';
        body.semester = 1;
        body.cgpa = 8.0;
        body.courseCode = $('uCourse') ? $('uCourse').value : null;
      } else if (role.toLowerCase() === 'faculty') {
        body.designation = 'Assistant Professor';
        body.department = $('uDept') ? $('uDept').value.trim() : 'CSE';
      }

      const r = await apiPost('/api/admin/user', body);
      if (r.ok) {
        lastCreatedCredentials = {
          name: name,
          username: username,
          password: password,
          role: role,
          rollNo: r.data.rollNo || body.rollNo || 'N/A',
          course: body.courseCode || 'None'
        };

        // Show credentials box
        const cBox = $('createdCredsBox');
        if (cBox) {
          if ($('credName')) $('credName').textContent = lastCreatedCredentials.name;
          if ($('credRoll')) $('credRoll').textContent = lastCreatedCredentials.rollNo;
          if ($('credUser')) $('credUser').textContent = lastCreatedCredentials.username;
          if ($('credPass')) $('credPass').textContent = lastCreatedCredentials.password;
          if ($('credCourse')) $('credCourse').textContent = lastCreatedCredentials.course;
          cBox.style.display = 'block';
        }

        if (window.UI && window.UI.toast) {
          window.UI.toast('success', role + ' account created! Student can log in now.');
        } else {
          alert(role + ' account created successfully!');
        }

        // Clear input form
        ['uName', 'uUsername', 'uPassword', 'uRoll'].forEach(id => { if ($(id)) $(id).value = ''; });
        refreshAdmin();
      } else {
        const err = r.data.error || 'Failed to create user';
        if (window.UI && window.UI.toast) window.UI.toast('error', err);
        else alert(err);
      }
    };

    window.copyCredentials = function () {
      if (!lastCreatedCredentials) return;
      const text = `AcadHub Login Credentials\nName: ${lastCreatedCredentials.name}\nRole: ${lastCreatedCredentials.role}\nRoll No: ${lastCreatedCredentials.rollNo}\nUsername: ${lastCreatedCredentials.username}\nPassword: ${lastCreatedCredentials.password}\nEnrolled Course: ${lastCreatedCredentials.course}\nSign In: http://localhost:8085`;
      navigator.clipboard.writeText(text).then(() => {
        if (window.UI && window.UI.toast) window.UI.toast('success', 'Login credentials copied to clipboard!');
        else alert('Credentials copied to clipboard!');
      });
    };

    window.addCourse = async function () {
      const courseCode = $('cCode') ? $('cCode').value.trim().toUpperCase() : '';
      const courseName = $('cName') ? $('cName').value.trim() : '';
      const credits = $('cCredits') && $('cCredits').value ? Number($('cCredits').value) : 4;
      const semester = $('cSem') && $('cSem').value ? Number($('cSem').value) : 1;
      const description = $('cDesc') ? $('cDesc').value.trim() : '';

      if (!courseCode || !courseName) {
        if (window.UI && window.UI.toast) window.UI.toast('error', 'Course code and course name are required.');
        return;
      }

      const r = await apiPost('/api/admin/course', { courseCode, courseName, credits, semester, description });
      if (r.ok) {
        if (window.UI && window.UI.toast) window.UI.toast('success', 'Course ' + courseCode + ' added successfully!');
        ['cCode', 'cName', 'cDesc'].forEach(id => { if ($(id)) $(id).value = ''; });
        refreshAdmin();
      } else {
        const err = r.data.error || 'Failed to add course';
        if (window.UI && window.UI.toast) window.UI.toast('error', err);
      }
    };

    window.enrollStudent = async function () {
      const rollNo = $('eStudent') ? Number($('eStudent').value) : null;
      const courseCode = $('eCourse') ? $('eCourse').value : '';
      if (!rollNo || !courseCode) {
        if (window.UI && window.UI.toast) window.UI.toast('error', 'Please select a student and course.');
        return;
      }
      const r = await apiPost('/api/admin/enroll', { rollNo, courseCode });
      if (r.ok) {
        if (window.UI && window.UI.toast) window.UI.toast('success', 'Student enrolled in ' + courseCode + '!');
        refreshAdmin();
      } else {
        const err = r.data.error || 'Failed to enroll';
        if (window.UI && window.UI.toast) window.UI.toast('error', err);
      }
    };

    window.assignFaculty = async function () {
      const facultyId = $('gFaculty') ? Number($('gFaculty').value) : null;
      const courseCode = $('gCourse') ? $('gCourse').value : '';
      if (!facultyId || !courseCode) {
        if (window.UI && window.UI.toast) window.UI.toast('error', 'Please select faculty and course.');
        return;
      }
      const r = await apiPost('/api/admin/assign', { facultyId, courseCode });
      if (r.ok) {
        if (window.UI && window.UI.toast) window.UI.toast('success', 'Faculty assigned to ' + courseCode + '!');
        refreshAdmin();
      } else {
        const err = r.data.error || 'Failed to assign';
        if (window.UI && window.UI.toast) window.UI.toast('error', err);
      }
    };
  }

  async function refreshAdmin() {
    const data = await apiGet('/api/admin/dashboard');
    if (!data) return;

    const summary = (data.summary && data.summary[0]) || {};
    const students = summary.total_students || 0;
    const faculty = summary.total_faculty || 0;
    const courses = summary.total_courses || 0;

    if ($('totalStudents')) $('totalStudents').textContent = students;
    if ($('totalFaculty')) $('totalFaculty').textContent = faculty;
    if ($('totalCourses')) $('totalCourses').textContent = courses;

    // At-Risk Table
    const riskBody = $('riskBody');
    if (riskBody) {
      const atRisk = data.atRisk || [];
      riskBody.innerHTML = atRisk.map(r => `
        <tr class="risk-row">
          <td><b>${esc(r.name || r.roll_no)}</b> <span class="muted">(Roll: ${esc(r.roll_no)})</span></td>
          <td>${esc(r.course_code || r.course)}</td>
          <td>${Number(r.attendance_pct || 0).toFixed(1)}%</td>
          <td>${Number(r.avg_marks || 0).toFixed(1)} / 100</td>
        </tr>
      `).join('');
    }

    // Users Directory
    const usersBody = $('usersBody');
    if (usersBody) {
      const users = data.users || [];
      usersBody.innerHTML = users.map(u => `
        <tr>
          <td><b>${esc(u.name)}</b> <span class="muted">(@${esc(u.username)})</span></td>
          <td><span class="chip ${u.role === 'Admin' ? 'warn' : u.role === 'Faculty' ? 'sky' : 'ok'}">${esc(u.role)}</span></td>
        </tr>
      `).join('');
    }

    // Populate Options Dropdowns
    const opts = await apiGet('/api/admin/options');
    if (opts) {
      const fill = (id, items, fn) => {
        const el = $(id);
        if (el) el.innerHTML = items.map(fn).join('');
      };
      fill('eStudent', opts.students || [], s => `<option value="${s.roll_no}">${esc(s.roll_no)} - ${esc(s.name)}</option>`);
      fill('eCourse', opts.courses || [], c => `<option value="${c.course_code}">${esc(c.course_code)} - ${esc(c.course_name)}</option>`);
      fill('gFaculty', opts.faculty || [], f => `<option value="${f.faculty_id}">${esc(f.faculty_id)} - ${esc(f.name)}</option>`);
      fill('gCourse', opts.courses || [], c => `<option value="${c.course_code}">${esc(c.course_code)} - ${esc(c.course_name)}</option>`);
      
      // uCourse dropdown for initial student course enrollment
      const uCourse = $('uCourse');
      if (uCourse) {
        uCourse.innerHTML = '<option value="">-- Optional: Enroll in Course --</option>' +
          (opts.courses || []).map(c => `<option value="${c.course_code}">${esc(c.course_code)} - ${esc(c.course_name)}</option>`).join('');
      }

      // Courses Directory
      const coursesBody = $('coursesBody');
      if (coursesBody) {
        coursesBody.innerHTML = (opts.courses || []).map(c => `
          <tr>
            <td><b>${esc(c.course_code)}</b></td>
            <td>${esc(c.course_name)}</td>
          </tr>
        `).join('');
      }
    }
  }

  // ============================================================
  //   3. FACULTY DASHBOARD (faculty.html)
  // ============================================================
  async function initFacultyPage() {
    if (document.body.dataset.page !== 'faculty') return;
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

  // Load students for attendance, summary, and assessments
  window.loadStudents = async function () {
    const fCourse = $('fCourse');
    const mCourse = $('mCourse');
    const faCourse = $('faCourse');
    const code = fCourse ? fCourse.value : (mCourse ? mCourse.value : '');
    if (!code) return;

    const cData = await apiGet('/api/faculty/course-data?course=' + encodeURIComponent(code));
    if (!cData) return;

    // Populate attendance table
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

    // Populate summary table
    const sumBody = $('summaryBody');
    if (sumBody) {
      sumBody.innerHTML = (cData.students || []).map(s => {
        const sMarks = (cData.marks || []).filter(m => m.roll_no === s.roll_no);
        const avg = sMarks.length ? Math.round(sMarks.reduce((a, b) => a + (b.marks_obtained || 0), 0) / sMarks.length) : null;
        return `
          <tr>
            <td><b>${esc(s.name)}</b> <span class="muted">(${esc(s.roll_no)})</span></td>
            <td>${avg != null ? avg + '%' : 'N/A'}</td>
            <td>${avg != null ? (avg >= 85 ? 'A+' : avg >= 75 ? 'A' : avg >= 60 ? 'B' : avg >= 50 ? 'C' : 'F') : 'Pending'}</td>
          </tr>
        `;
      }).join('');
    }

    // Populate assessment dropdown for marks tab
    const mAssess = $('mAssess');
    if (mAssess) {
      mAssess.innerHTML = (cData.assessments || []).map(a => `<option value="${a.assessment_id}">${esc(a.assessment_type)} (out of ${a.total_marks})</option>`).join('');
    }

    // Populate active assessments table
    const facAssessBody = $('facAssessBody');
    if (facAssessBody) {
      facAssessBody.innerHTML = (cData.assessments || []).map(a => `
        <tr>
          <td><b>${esc(a.assessment_type)}</b></td>
          <td>${esc(a.total_marks)}</td>
          <td>${esc(a.passing_marks || 40)}</td>
        </tr>
      `).join('');
    }
  };

  window.markAttendance = async function () {
    const fCourse = $('fCourse');
    const code = fCourse ? fCourse.value : '';
    const todayInput = $('today');
    const date = todayInput ? todayInput.value : '';
    const selects = Array.from(document.querySelectorAll('#attBody select'));
    if (!selects.length) {
      if (window.UI && window.UI.toast) window.UI.toast('error', 'No students loaded to mark attendance.');
      return;
    }
    const records = selects.map(s => ({ rollNo: Number(s.dataset.roll), status: s.value }));
    const r = await apiPost('/api/faculty/attendance', { course: code, date, records });
    if (r.ok) {
      if (window.UI && window.UI.toast) window.UI.toast('success', 'Attendance saved for ' + records.length + ' student(s)!');
    } else {
      const err = r.data.error || 'Failed to save attendance';
      if (window.UI && window.UI.toast) window.UI.toast('error', err);
    }
  };

  window.saveMarks = async function () {
    const mCourse = $('mCourse');
    const rollNo = $('mStudent') ? Number($('mStudent').value) : null;
    const assessmentId = $('mAssess') ? Number($('mAssess').value) : null;
    const marks = $('mMarks') && $('mMarks').value ? Number($('mMarks').value) : null;

    if (!rollNo || assessmentId == null || marks == null) {
      if (window.UI && window.UI.toast) window.UI.toast('error', 'Please enter student roll number, assessment and marks.');
      return;
    }

    const r = await apiPost('/api/faculty/marks', { rollNo, assessmentId, marks });
    if (r.ok) {
      if (window.UI && window.UI.toast) window.UI.toast('success', 'Marks recorded successfully!');
      if ($('mMarks')) $('mMarks').value = '';
      window.loadStudents();
    } else {
      const err = r.data.error || 'Failed to save marks';
      if (window.UI && window.UI.toast) window.UI.toast('error', err);
    }
  };

  // Faculty: Create Assessment / Assignment
  window.addFacultyAssessment = async function () {
    const course = $('faCourse') ? $('faCourse').value : '';
    const assessmentType = $('faType') ? $('faType').value.trim() : '';
    const totalMarks = $('faTotal') && $('faTotal').value ? Number($('faTotal').value) : 100;
    const passingMarks = $('faPass') && $('faPass').value ? Number($('faPass').value) : 40;

    if (!course || !assessmentType) {
      if (window.UI && window.UI.toast) window.UI.toast('error', 'Course and assessment title/type are required.');
      return;
    }

    const r = await apiPost('/api/faculty/assessment', { course, assessmentType, totalMarks, passingMarks });
    if (r.ok) {
      if (window.UI && window.UI.toast) window.UI.toast('success', 'Assignment "' + assessmentType + '" published for ' + course + '!');
      if ($('faType')) $('faType').value = '';
      window.loadStudents();
    } else {
      const err = r.data.error || 'Failed to publish assessment';
      if (window.UI && window.UI.toast) window.UI.toast('error', err);
    }
  };

  // Faculty: Upload Study Material
  window.uploadStudyMaterial = async function () {
    const course = $('smCourse') ? $('smCourse').value : '';
    const title = $('smTitle') ? $('smTitle').value.trim() : '';
    const type = $('smType') ? $('smType').value : 'Notes';
    const content = $('smContent') ? $('smContent').value.trim() : '';

    if (!course || !title) {
      if (window.UI && window.UI.toast) window.UI.toast('error', 'Course and Title are required.');
      return;
    }

    const r = await apiPost('/api/faculty/material', { course, title, type, content });
    if (r.ok) {
      if (window.UI && window.UI.toast) window.UI.toast('success', 'Study Material published successfully!');
      ['smTitle', 'smContent'].forEach(id => { if ($(id)) $(id).value = ''; });
      window.loadFacultyMaterials();
    } else {
      const err = r.data.error || 'Failed to upload material';
      if (window.UI && window.UI.toast) window.UI.toast('error', err);
    }
  };

  // Faculty: Load Materials
  window.loadFacultyMaterials = async function () {
    const listEl = $('facultyMaterialsList');
    if (!listEl) return;

    const materials = await apiGet('/api/faculty/materials');
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
          <div class="mat-content">${esc(m.content || 'No description provided.')}</div>
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
  };

  window.deleteFacultyMaterial = async function (id) {
    if (!confirm('Are you sure you want to delete this study material?')) return;
    const r = await apiDelete('/api/faculty/material/' + id);
    if (r.ok) {
      if (window.UI && window.UI.toast) window.UI.toast('success', 'Material deleted.');
      window.loadFacultyMaterials();
    }
  };

  // Faculty: Load Submissions from Students
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
              <button class="btn" style="padding:4px 10px;font-size:12px;" onclick="window.openReviewModal(${s.submission_id}, '${esc(s.student_name)}', '${esc(s.title)}', '${encodeURIComponent(s.submission_text || '')}', '${esc(s.status || 'Reviewed')}', '${encodeURIComponent(s.feedback || '')}')"><i data-i="award"></i>Review</button>
            </div>
          </div>
          <div style="font-weight:700;font-size:15px;color:var(--text);">${esc(s.title)}</div>
          <div class="sub-body">${esc(s.submission_text)}</div>
          ${s.file_url ? `<div style="font-size:13px;"><a href="${esc(s.file_url)}" target="_blank" rel="noopener" style="color:var(--sky);text-decoration:underline;"><i data-i="file"></i>View Attached Work / Document</a></div>` : ''}
          ${s.feedback ? `<div class="sub-feedback"><strong>Teacher Feedback:</strong> ${esc(s.feedback)}</div>` : ''}
        </div>
      `;
    }).join('');
  };

  // Review Modal Handlers
  window.openReviewModal = function (subId, studentName, title, encContent, status, encFeedback) {
    if ($('revSubId')) $('revSubId').value = subId;
    if ($('revStudentName')) $('revStudentName').textContent = studentName;
    if ($('revTitle')) $('revTitle').textContent = title;
    if ($('revContent')) $('revContent').textContent = decodeURIComponent(encContent);
    if ($('revStatus')) $('revStatus').value = status || 'Reviewed';
    if ($('revFeedback')) $('revFeedback').value = decodeURIComponent(encFeedback) || 'Good work!';
    const modal = $('reviewModal');
    if (modal) modal.classList.add('open');
  };

  window.closeReviewModal = function () {
    const modal = $('reviewModal');
    if (modal) modal.classList.remove('open');
  };

  window.submitReview = async function () {
    const submissionId = Number($('revSubId').value);
    const status = $('revStatus').value;
    const feedback = $('revFeedback').value.trim();

    const r = await apiPost('/api/faculty/submission/grade', { submissionId, status, feedback });
    if (r.ok) {
      if (window.UI && window.UI.toast) window.UI.toast('success', 'Submission review saved!');
      window.closeReviewModal();
      window.loadFacultySubmissions();
    } else {
      const err = r.data.error || 'Failed to save review';
      if (window.UI && window.UI.toast) window.UI.toast('error', err);
    }
  };

  // ============================================================
  //   4. STUDENT DASHBOARD (student.html)
  // ============================================================
  let studentMaterialsCache = [];

  async function initStudentPage() {
    if (document.body.dataset.page !== 'student') return;
    await whoami();
    await window.refreshStudent();
  }

  window.refreshStudent = async function () {
    const data = await apiGet('/api/student/dashboard');
    if (!data) return;

    const d = data.details || {};
    const marks = data.marks || [];
    const att = data.attendance || [];
    const enrolledCourses = data.enrolledCourses || [];

    // Greeting & Meta
    if ($('welcomeName')) $('welcomeName').textContent = d.name || 'Student';
    if ($('studentSubMeta')) $('studentSubMeta').textContent = `Roll No: ${d.rollNo || '--'} · Department: ${d.department || 'CSE'} (Sem ${d.semester || 1})`;
    if ($('cgpa')) $('cgpa').textContent = (d.cgpa || 8.25).toFixed(2);
    if ($('totalCourses')) $('totalCourses').textContent = enrolledCourses.length || att.length || 0;

    // Attendance Calculation
    const present = att.reduce((acc, a) => acc + (a.presentCount || 0), 0);
    const total = att.reduce((acc, a) => acc + (a.totalClasses || 0), 0);
    const overallPct = total ? Math.round((present / total) * 100) : (att.length ? Math.round(att[0].attendancePct) : 85);

    const attVal = $('attPercent');
    if (attVal) attVal.textContent = overallPct + '%';

    // Attendance Table
    const attBody = $('attBody');
    if (attBody) {
      attBody.innerHTML = att.map(a => `
        <tr>
          <td><b>${esc(a.courseCode)}</b></td>
          <td>${Math.round(a.attendancePct)}%</td>
        </tr>
      `).join('');
    }

    // Marks & Grades Table
    const marksBody = $('marksBody');
    if (marksBody) {
      marksBody.innerHTML = marks.map(m => {
        const pct = m.percentage || (m.totalMarks ? (m.marksObtained / m.totalMarks) * 100 : 0);
        let g = m.grade || (pct >= 85 ? 'A+' : pct >= 75 ? 'A' : pct >= 65 ? 'B' : pct >= 50 ? 'C' : 'F');
        return `
          <tr>
            <td><b>${esc(m.courseName)}</b> <span class="muted">(${esc(m.assessmentType)})</span></td>
            <td><b>${esc(m.marksObtained)}</b> / ${esc(m.totalMarks)}</td>
            <td><span class="chip ${g === 'A+' || g === 'A' ? 'ok' : g === 'F' ? 'danger' : 'warn'}">${esc(g)}</span></td>
          </tr>
        `;
      }).join('');
    }

    // Populate Course Filter dropdown
    const filterSelect = $('stCourseFilter');
    if (filterSelect) {
      filterSelect.innerHTML = '<option value="">All My Enrolled Courses</option>' +
        enrolledCourses.map(c => `<option value="${esc(c.course_code)}">${esc(c.course_code)} - ${esc(c.course_name)}</option>`).join('');
    }

    await window.loadStudentMaterials();
    await window.loadStudentSubmissions();
  };

  // Student: Load Study Materials (Strict Course Isolation: only for enrolled courses)
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
  };

  window.filterStudentMaterials = function (courseCode) {
    if (!courseCode) {
      window.renderStudentMaterials(studentMaterialsCache);
    } else {
      const filtered = studentMaterialsCache.filter(m => m.course_code === courseCode);
      window.renderStudentMaterials(filtered);
    }
  };

  // Student: Open Submit Work Modal
  window.openSubmitModal = function (materialId, courseCode, title, facultyName) {
    if ($('subMaterialId')) $('subMaterialId').value = materialId || '';
    if ($('subCourseCode')) $('subCourseCode').value = courseCode;
    if ($('subCourseBadge')) $('subCourseBadge').textContent = courseCode;
    if ($('subMaterialTitle')) $('subMaterialTitle').textContent = title || 'Course Assignment';
    if ($('subFacultyName')) $('subFacultyName').textContent = 'Instructor: ' + (facultyName || 'Professor');
    if ($('subTitle')) $('subTitle').value = 'Solution for: ' + (title || 'Assignment');
    if ($('subContent')) $('subContent').value = '';
    if ($('subFileUrl')) $('subFileUrl').value = '';

    const modal = $('submitWorkModal');
    if (modal) modal.classList.add('open');
  };

  window.closeSubmitModal = function () {
    const modal = $('submitWorkModal');
    if (modal) modal.classList.remove('open');
  };

  // Student: Confirm Send Work to Teacher
  window.confirmSubmitWork = async function () {
    const materialId = $('subMaterialId') && $('subMaterialId').value ? Number($('subMaterialId').value) : null;
    const courseCode = $('subCourseCode') ? $('subCourseCode').value : '';
    const title = $('subTitle') ? $('subTitle').value.trim() : '';
    const submissionText = $('subContent') ? $('subContent').value.trim() : '';
    const fileUrl = $('subFileUrl') ? $('subFileUrl').value.trim() : '';

    if (!courseCode || !title || !submissionText) {
      if (window.UI && window.UI.toast) window.UI.toast('error', 'Please provide submission title and content.');
      return;
    }

    const r = await apiPost('/api/student/submit', { materialId, courseCode, title, submissionText, fileUrl });
    if (r.ok) {
      if (window.UI && window.UI.toast) window.UI.toast('success', 'Work sent successfully to your professor!');
      window.closeSubmitModal();
      window.loadStudentSubmissions();
    } else {
      const err = r.data.error || 'Failed to submit work';
      if (window.UI && window.UI.toast) window.UI.toast('error', err);
    }
  };

  // Student: Load Submissions & Feedback
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
          ${s.file_url ? `<div style="font-size:13px;"><a href="${esc(s.file_url)}" target="_blank" rel="noopener" style="color:var(--sky);text-decoration:underline;"><i data-i="file"></i>View Attached Work</a></div>` : ''}
          ${s.feedback ? `
            <div class="sub-feedback">
              <strong>Professor Feedback:</strong> ${esc(s.feedback)}
            </div>
          ` : '<p class="muted" style="font-size:12px;margin:0;"><i data-i="info"></i>Waiting for professor review.</p>'}
        </div>
      `;
    }).join('');
  };

  // ---------- Bootstrap Page Specific Logic ----------
  document.addEventListener('DOMContentLoaded', () => {
    initLoginPage();
    initAdminPage();
    initFacultyPage();
    initStudentPage();
  });

})();
