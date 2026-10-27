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

    // Setup demo credentials on role chip click
    document.querySelectorAll('.role-chip').forEach(ch => {
      ch.addEventListener('click', () => {
        const r = ch.dataset.role;
        if (DEMO_ACCOUNTS[r]) {
          if (uInput) uInput.value = DEMO_ACCOUNTS[r].u;
          if (pInput) pInput.value = DEMO_ACCOUNTS[r].p;
        }
      });
    });

    // Default to student demo credentials
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

    window.addUser = async function () {
      const role = $('uRole') ? $('uRole').value : 'STUDENT';
      const name = $('uName') ? $('uName').value.trim() : '';
      const username = $('uUsername') ? $('uUsername').value.trim() : '';
      const password = $('uPassword') ? $('uPassword').value.trim() : '';
      const phone = $('uPhone') ? $('uPhone').value.trim() : '';

      if (!name || !username || !password) {
        alert('Please fill out all required fields.');
        return;
      }

      const body = { role, name, username, password, phone };
      if (role === 'STUDENT' || role === 'Student') {
        body.rollNo = $('uRoll') && $('uRoll').value ? Number($('uRoll').value) : null;
        body.department = $('uDept') ? $('uDept').value.trim() : 'CSE';
        body.branch = $('uBranch') ? $('uBranch').value.trim() : 'COE';
        body.semester = $('uSem') && $('uSem').value ? Number($('uSem').value) : 1;
        body.cgpa = $('uCgpa') && $('uCgpa').value ? Number($('uCgpa').value) : 8.0;
      } else if (role === 'FACULTY' || role === 'Faculty') {
        body.designation = $('uDesig') ? $('uDesig').value.trim() : 'Assistant Professor';
        body.department = $('uFDept') ? $('uFDept').value.trim() : 'CSE';
      }

      const r = await apiPost('/api/admin/user', body);
      if (r.ok) {
        alert(role + ' "' + name + '" created successfully!');
        ['uName', 'uUsername', 'uPassword', 'uPhone', 'uRoll', 'uDesig'].forEach(id => { if ($(id)) $(id).value = ''; });
        refreshAdmin();
      } else {
        alert(r.data.error || 'Failed to create user');
      }
    };

    window.addCourse = async function () {
      const courseCode = $('cCode') ? $('cCode').value.trim().toUpperCase() : '';
      const courseName = $('cName') ? $('cName').value.trim() : '';
      const credits = $('cCredits') && $('cCredits').value ? Number($('cCredits').value) : 4;
      const semester = $('cSem') && $('cSem').value ? Number($('cSem').value) : 1;
      const description = $('cDesc') ? $('cDesc').value.trim() : '';

      if (!courseCode || !courseName) {
        alert('Course code and course name are required.');
        return;
      }

      const r = await apiPost('/api/admin/course', { courseCode, courseName, credits, semester, description });
      if (r.ok) {
        alert('Course ' + courseCode + ' added successfully!');
        ['cCode', 'cName', 'cDesc'].forEach(id => { if ($(id)) $(id).value = ''; });
        refreshAdmin();
      } else {
        alert(r.data.error || 'Failed to add course');
      }
    };

    window.enrollStudent = async function () {
      const rollNo = $('eStudent') ? Number($('eStudent').value) : null;
      const courseCode = $('eCourse') ? $('eCourse').value : '';
      if (!rollNo || !courseCode) { alert('Please select a student and course.'); return; }
      const r = await apiPost('/api/admin/enroll', { rollNo, courseCode });
      if (r.ok) { alert('Student enrolled in ' + courseCode + '!'); refreshAdmin(); }
      else alert(r.data.error || 'Failed to enroll');
    };

    window.assignFaculty = async function () {
      const facultyId = $('gFaculty') ? Number($('gFaculty').value) : null;
      const courseCode = $('gCourse') ? $('gCourse').value : '';
      if (!facultyId || !courseCode) { alert('Please select faculty and course.'); return; }
      const r = await apiPost('/api/admin/assign', { facultyId, courseCode });
      if (r.ok) { alert('Faculty assigned to ' + courseCode + '!'); refreshAdmin(); }
      else alert(r.data.error || 'Failed to assign');
    };

    window.addAssessment = async function () {
      const courseCode = $('aCourse') ? $('aCourse').value : '';
      const assessmentType = $('aType') ? $('aType').value.trim() : '';
      const totalMarks = $('aTotal') && $('aTotal').value ? Number($('aTotal').value) : 100;
      const passingMarks = $('aPass') && $('aPass').value ? Number($('aPass').value) : 40;
      if (!courseCode || !assessmentType) { alert('Course and assessment type are required.'); return; }
      const r = await apiPost('/api/admin/assessment', { courseCode, assessmentType, totalMarks, passingMarks });
      if (r.ok) {
        alert('Assessment created for ' + courseCode + '!');
        if ($('aType')) $('aType').value = '';
        refreshAdmin();
      } else alert(r.data.error || 'Failed to create assessment');
    };
  }

  async function refreshAdmin() {
    const data = await apiGet('/api/admin/dashboard');
    if (!data) return;

    // Stat numbers
    const stats = data.stats || {};
    const students = stats.students || stats.total_students || 0;
    const faculty = stats.faculty || stats.total_faculty || 0;
    const courses = stats.courses || stats.total_courses || 0;

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
          <td>${Number(r.attendance_pct || r.percentage || 0).toFixed(1)}%</td>
          <td>${Number(r.avg_marks || r.marks || 0).toFixed(1)} / 100</td>
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
          <td>${esc(u.role)}</td>
        </tr>
      `).join('');
    }

    // Courses Directory
    const coursesBody = $('coursesBody');
    if (coursesBody) {
      const courseList = data.courses || [];
      coursesBody.innerHTML = courseList.map(c => `
        <tr>
          <td><b>${esc(c.course_code)}</b></td>
          <td>${esc(c.course_name)} <span class="muted">(${esc(c.credits || 4)} credits)</span></td>
        </tr>
      `).join('');
    }

    // Fill Options Dropdowns
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
      fill('aCourse', opts.courses || [], c => `<option value="${c.course_code}">${esc(c.course_code)} - ${esc(c.course_name)}</option>`);
    }
  }

  // ============================================================
  //   3. FACULTY DASHBOARD (faculty.html)
  // ============================================================
  let facultyCoursesCache = {};

  async function initFacultyPage() {
    if (document.body.dataset.page !== 'faculty') return;
    await whoami();
    const d = await apiGet('/api/faculty/dashboard');
    if (!d) return;

    const courses = d.courses || [];
    const fCourse = $('fCourse');
    const mCourse = $('mCourse');
    if (fCourse) {
      fCourse.innerHTML = courses.map(c => `<option value="${esc(c.course_code)}">${esc(c.course_code)} - ${esc(c.course_name)}</option>`).join('');
    }
    if (mCourse) {
      mCourse.innerHTML = courses.map(c => `<option value="${esc(c.course_code)}">${esc(c.course_code)} - ${esc(c.course_name)}</option>`).join('');
    }

    const todayInput = $('today');
    if (todayInput && !todayInput.value) {
      todayInput.value = new Date().toISOString().slice(0, 10);
    }

    // Load students for attendance
    window.loadStudents = async function () {
      const code = fCourse ? fCourse.value : '';
      if (!code) { alert('Please select a course.'); return; }
      const cData = await apiGet('/api/faculty/course-data?course=' + encodeURIComponent(code));
      if (!cData) return;
      facultyCoursesCache[code] = cData;

      const attBody = $('attBody');
      if (attBody) {
        const students = cData.students || [];
        if (!students.length) {
          attBody.innerHTML = '';
          return;
        }
        attBody.innerHTML = students.map(s => `
          <tr>
            <td><b>${esc(s.name)}</b> <span class="muted">(Roll: ${esc(s.roll_no)})</span></td>
            <td>
              <div class="field sel fixed" style="width: 140px;">
                <select data-roll="${esc(s.roll_no)}">
                  <option value="Present" selected>Present</option>
                  <option value="Absent">Absent</option>
                </select>
              </div>
            </td>
          </tr>
        `).join('');
      }

      // Populate summary body
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
    };

    window.markAttendance = async function () {
      const code = fCourse ? fCourse.value : '';
      const date = todayInput ? todayInput.value : '';
      const selects = Array.from(document.querySelectorAll('#attBody select'));
      if (!selects.length) { alert('No students loaded to mark attendance.'); return; }
      const records = selects.map(s => ({ rollNo: Number(s.dataset.roll), status: s.value }));
      const r = await apiPost('/api/faculty/attendance', { course: code, date, records });
      if (r.ok) alert('Attendance saved for ' + (r.data.count || records.length) + ' student(s)!');
      else alert(r.data.error || 'Failed to save attendance');
    };

    window.saveMarks = async function () {
      const code = mCourse ? mCourse.value : (fCourse ? fCourse.value : '');
      const rollNo = $('mStudent') ? Number($('mStudent').value) : null;
      const assessmentId = $('mAssess') ? Number($('mAssess').value) : 1;
      const marks = $('mMarks') && $('mMarks').value ? Number($('mMarks').value) : null;

      if (!rollNo || marks == null) {
        alert('Please enter valid student roll number and marks.');
        return;
      }

      const r = await apiPost('/api/faculty/marks', { rollNo, assessmentId, marks });
      if (r.ok) {
        alert('Marks successfully recorded!');
        if ($('mMarks')) $('mMarks').value = '';
        window.loadStudents();
      } else {
        alert(r.data.error || 'Failed to save marks');
      }
    };

    if (courses.length) window.loadStudents();
  }

  // ============================================================
  //   4. STUDENT DASHBOARD (student.html)
  // ============================================================
  async function initStudentPage() {
    if (document.body.dataset.page !== 'student') return;
    await whoami();
    const data = await apiGet('/api/student/dashboard');
    if (!data) return;

    const d = data.details || {};
    const marks = data.marks || [];
    const att = data.attendance || [];

    // Greeting & Stats
    if ($('welcomeName')) $('welcomeName').textContent = d.name || 'Student';
    if ($('cgpa')) $('cgpa').textContent = (d.cgpa || 8.5).toFixed(2);
    if ($('totalCourses')) $('totalCourses').textContent = att.length || 3;

    // Overall attendance calculation
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
            <td>${esc(g)}</td>
          </tr>
        `;
      }).join('');
    }
  }

  // ---------- Bootstrap Page Specific Logic ----------
  document.addEventListener('DOMContentLoaded', () => {
    initLoginPage();
    initAdminPage();
    initFacultyPage();
    initStudentPage();
  });

})();
