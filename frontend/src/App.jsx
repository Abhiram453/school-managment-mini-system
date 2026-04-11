import { useEffect, useMemo, useState } from 'react';
import axios from 'axios';
import TeacherDashboard from './TeacherDashboard';
import StudentDashboard from './StudentDashboard';
import './App.css';

const API_BASE_URL = import.meta.env.VITE_API_URL || 'http://localhost:5000/api';

const api = axios.create({ baseURL: API_BASE_URL });

const normalizeRole = (role) => {
  if (role === 'admin') {
    return 'teacher';
  }
  return role;
};

function App() {
  const rememberedUsername = localStorage.getItem('rememberedUsername') || '';
  const [token, setToken] = useState(localStorage.getItem('token') || '');
  const [user, setUser] = useState(null);
  const [authForm, setAuthForm] = useState({
    username: localStorage.getItem('rememberMe') === 'true' ? rememberedUsername : '',
    password: '',
  });
  const [showPassword, setShowPassword] = useState(false);
  const [students, setStudents] = useState([]);
  const [tasks, setTasks] = useState([]);
  const [studentForm, setStudentForm] = useState({ name: '', className: '', age: '' });
  const [taskForm, setTaskForm] = useState({ title: '', description: '', studentId: '', dueDate: '' });
  const [editingStudentId, setEditingStudentId] = useState('');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);
  const [showLogoutConfirm, setShowLogoutConfirm] = useState(false);
  const [selectedClass, setSelectedClass] = useState('');
  const [isSignup, setIsSignup] = useState(false);
  const [rememberMe, setRememberMe] = useState(localStorage.getItem('rememberMe') === 'true');
  const [showForgotPassword, setShowForgotPassword] = useState(false);
  const [forgotEmail, setForgotEmail] = useState('');

  const authHeaders = useMemo(() => ({ Authorization: `Bearer ${token}` }), [token]);

  useEffect(() => {
    if (!token) {
      setUser(null);
      return;
    }

    const loadData = async () => {
      try {
        setLoading(true);
        setError('');

        const profileRes = await api.get('/auth/me', { headers: authHeaders });
        const normalizedRole = normalizeRole(profileRes.data.role);
        setUser({ ...profileRes.data, role: normalizedRole });

        // Only load students and tasks if teacher
        if (normalizedRole === 'teacher') {
          const [studentsRes, tasksRes] = await Promise.all([
            api.get('/students', { headers: authHeaders }),
            api.get('/tasks', { headers: authHeaders }),
          ]);
          setStudents(studentsRes.data);
          setTasks(tasksRes.data);
        } else if (normalizedRole === 'student') {
          // For students, load all tasks (they'll see only their own)
          const tasksRes = await api.get('/tasks', { headers: authHeaders });
          setTasks(tasksRes.data);
        }
      } catch (loadError) {
        setError(loadError.response?.data?.message || 'Failed to load dashboard data');

        if (loadError.response?.status === 401) {
          handleLogoutConfirmed();
        }
      } finally {
        setLoading(false);
      }
    };

    loadData();
  }, [token, authHeaders]);

  const readyToSignIn = authForm.username.trim() && authForm.password.trim();

  const handleLogin = async (event) => {
    event.preventDefault();

    try {
      setLoading(true);
      setError('');

      if (isSignup) {
        // Signup endpoint (would need backend support)
        setError('Signup feature coming soon. Use demo accounts to test.');
        setLoading(false);
        return;
      }

      const response = await api.post('/auth/login', authForm);
      localStorage.setItem('token', response.data.token);
      if (rememberMe) {
        localStorage.setItem('rememberMe', 'true');
        localStorage.setItem('rememberedUsername', authForm.username);
      } else {
        localStorage.removeItem('rememberMe');
        localStorage.removeItem('rememberedUsername');
      }
      setToken(response.data.token);
      setUser({ username: response.data.username, role: normalizeRole(response.data.role) });
    } catch (loginError) {
      setError(loginError.response?.data?.message || 'Login failed');
    } finally {
      setLoading(false);
    }
  };

  const handleForgotPassword = async (event) => {
    event.preventDefault();
    try {
      setLoading(true);
      setError('');
      // Placeholder for forgot password logic
      setError('Password reset link would be sent to email. Feature coming soon.');
      setShowForgotPassword(false);
    } finally {
      setLoading(false);
    }
  };

  const handleLogoutConfirmed = () => {
    localStorage.removeItem('token');
    localStorage.removeItem('rememberMe');
    localStorage.removeItem('rememberedUsername');
    setToken('');
    setUser(null);
    setAuthForm({ username: '', password: '' });
    setRememberMe(false);
    setStudents([]);
    setTasks([]);
    setStudentForm({ name: '', className: '', age: '' });
    setTaskForm({ title: '', description: '', studentId: '', dueDate: '' });
    setEditingStudentId('');
    setShowPassword(false);
    setShowLogoutConfirm(false);
    setSelectedClass('');
    setError('');
  };

  const handleLogoutClick = () => {
    setShowLogoutConfirm(true);
  };

  const getUniqueClasses = () => {
    const classes = new Set(students.map((s) => s.className));
    return Array.from(classes).sort();
  };

  const filteredStudents = selectedClass
    ? students.filter((student) => student.className === selectedClass)
    : students;

  const handleStudentSubmit = async (event) => {
    event.preventDefault();

    try {
      setError('');

      if (editingStudentId) {
        const response = await api.put(`/students/${editingStudentId}`, studentForm, {
          headers: authHeaders,
        });

        setStudents((prev) => prev.map((student) => (student._id === editingStudentId ? response.data : student)));
      } else {
        const response = await api.post('/students', studentForm, { headers: authHeaders });
        setStudents((prev) => [response.data, ...prev]);
      }

      setStudentForm({ name: '', className: '', age: '' });
      setEditingStudentId('');
    } catch (studentError) {
      setError(studentError.response?.data?.message || 'Could not save student');
    }
  };

  const handleStudentEdit = (student) => {
    setEditingStudentId(student._id);
    setStudentForm({
      name: student.name,
      className: student.className,
      age: student.age || '',
    });
  };

  const handleStudentDelete = async (studentId) => {
    try {
      await api.delete(`/students/${studentId}`, { headers: authHeaders });
      setStudents((prev) => prev.filter((student) => student._id !== studentId));
      setTasks((prev) => prev.filter((task) => task.student?._id !== studentId));
    } catch (deleteError) {
      setError(deleteError.response?.data?.message || 'Could not delete student');
    }
  };

  const handleTaskSubmit = async (event) => {
    event.preventDefault();

    try {
      setError('');
      const response = await api.post('/tasks', taskForm, { headers: authHeaders });
      setTasks((prev) => [response.data, ...prev]);
      setTaskForm({ title: '', description: '', studentId: '', dueDate: '' });
    } catch (taskError) {
      setError(taskError.response?.data?.message || 'Could not assign task');
    }
  };

  const handleToggleTaskComplete = async (taskId, currentState) => {
    try {
      const response = await api.patch(
        `/tasks/${taskId}/complete`,
        { completed: !currentState },
        { headers: authHeaders },
      );
      setTasks((prev) => prev.map((task) => (task._id === taskId ? response.data : task)));
    } catch (taskUpdateError) {
      setError(taskUpdateError.response?.data?.message || 'Could not update task status');
    }
  };

  // FORGOT PASSWORD MODAL
  if (showForgotPassword && !token) {
    return (
      <main className="auth-shell">
        <section className="auth-layout">
          <div className="auth-marketing">
            <p className="eyebrow">Gridaan School Suite</p>
            <h1>Password Recovery</h1>
            <p className="subtitle">
              Enter your email address and we'll send you a link to reset your password.
            </p>
          </div>

          <form onSubmit={handleForgotPassword} className="auth-card">
            <div className="auth-card-header">
              <div>
                <p className="eyebrow">Reset Password</p>
                <h2>Recover Access</h2>
              </div>
            </div>

            {error ? <p className="error-text">{error}</p> : null}

            <label>
              Email Address
              <input
                type="email"
                value={forgotEmail}
                onChange={(event) => setForgotEmail(event.target.value)}
                placeholder="your@email.com"
                required
              />
            </label>

            <button type="submit" disabled={loading}>
              {loading ? 'Sending...' : 'Send Reset Link'}
            </button>

            <button
              type="button"
              className="ghost-btn"
              onClick={() => {
                setShowForgotPassword(false);
                setError('');
              }}
            >
              Back to Login
            </button>
          </form>
        </section>
      </main>
    );
  }

  // LOGIN SCREEN
  if (!token) {
    return (
      <main className="auth-shell">
        <section className="auth-layout">
          <div className="auth-marketing">
            <p className="eyebrow">Gridaan School Suite</p>
            <h1>Secure access for teachers and students.</h1>
            <p className="subtitle">
              Teachers manage students and assignments. Students track their homework and tasks.
            </p>

            <div className="feature-grid">
              <article>
                <strong className="feature-title">
                  <span className="feature-icon" aria-hidden="true">
                    <svg viewBox="0 0 24 24" fill="none">
                      <path d="M12 5a3 3 0 110 6 3 3 0 010-6zm-5.5 12a5.5 5.5 0 0111 0" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round"/>
                      <path d="M18.5 8.5h4m-2-2v4" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round"/>
                    </svg>
                  </span>
                  Role-based access
                </strong>
                <p>Teachers and students have separate dashboards.</p>
              </article>
              <article>
                <strong className="feature-title">
                  <span className="feature-icon" aria-hidden="true">
                    <svg viewBox="0 0 24 24" fill="none">
                      <path d="M12 3l7 3v5c0 5-3.2 8.7-7 10-3.8-1.3-7-5-7-10V6l7-3z" stroke="currentColor" strokeWidth="1.8"/>
                      <path d="M9.5 12.5l1.8 1.8 3.5-3.8" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round"/>
                    </svg>
                  </span>
                  JWT secured
                </strong>
                <p>Protected endpoints and session-based access control.</p>
              </article>
              <article>
                <strong className="feature-title">
                  <span className="feature-icon" aria-hidden="true">
                    <svg viewBox="0 0 24 24" fill="none">
                      <ellipse cx="12" cy="6.5" rx="6.5" ry="2.8" stroke="currentColor" strokeWidth="1.8"/>
                      <path d="M5.5 6.5V15c0 1.5 2.9 2.8 6.5 2.8s6.5-1.3 6.5-2.8V6.5" stroke="currentColor" strokeWidth="1.8"/>
                      <path d="M5.5 10.8c0 1.5 2.9 2.8 6.5 2.8s6.5-1.3 6.5-2.8" stroke="currentColor" strokeWidth="1.8"/>
                    </svg>
                  </span>
                  MongoDB storage
                </strong>
                <p>All records persist in your connected database.</p>
              </article>
            </div>

            <div className="demo-accounts">
              <p className="demo-heading">Demo Accounts</p>
              <div className="demo-badges">
                <span className="credential-badge">
                  <strong>Teacher</strong>
                  <code>teacher1 / teacher123</code>
                </span>
                <span className="credential-badge">
                  <strong>Student</strong>
                  <code>student1 / student123</code>
                </span>
              </div>
            </div>
          </div>

          <form onSubmit={handleLogin} className="auth-card">
            <div className="auth-card-header">
              <div>
                <p className="eyebrow">{isSignup ? 'Sign Up' : 'Login'}</p>
                <h2>{isSignup ? 'Create Account' : 'Welcome'}</h2>
              </div>
              <span className="session-badge">Secure session</span>
            </div>

            <p className="subtitle">
              {isSignup
                ? 'Create a new account to get started.'
                : 'Enter your credentials to access your dashboard.'}
            </p>

            {error ? <p className="error-text">{error}</p> : null}

            <label>
              Username
              <input
                value={authForm.username}
                onChange={(event) => setAuthForm((prev) => ({ ...prev, username: event.target.value }))}
                placeholder="Enter username"
                autoComplete="username"
                required
              />
            </label>

            {isSignup ? (
              <label>
                Email Address
                <input
                  type="email"
                  placeholder="your@email.com"
                  required
                />
              </label>
            ) : null}

            <label>
              Password
              <div className="password-field">
                <input
                  type={showPassword ? 'text' : 'password'}
                  value={authForm.password}
                  onChange={(event) => setAuthForm((prev) => ({ ...prev, password: event.target.value }))}
                  placeholder="Enter password"
                  autoComplete={isSignup ? 'new-password' : 'current-password'}
                  required
                />
                <button
                  type="button"
                  className="field-action"
                  onClick={() => setShowPassword((prev) => !prev)}
                >
                  {showPassword ? 'Hide' : 'Show'}
                </button>
              </div>
            </label>

            {!isSignup ? (
              <label className="checkbox-label">
                <input
                  type="checkbox"
                  checked={rememberMe}
                  onChange={(event) => setRememberMe(event.target.checked)}
                />
                <span>Remember me on this device</span>
              </label>
            ) : null}

            <button type="submit" className="auth-submit" disabled={loading || !readyToSignIn}>
              {loading ? (isSignup ? 'Creating...' : 'Signing in...') : isSignup ? 'Create Account' : 'Sign In'}
            </button>

            <div className="auth-footer">
              {!isSignup ? (
                <>
                  <button
                    type="button"
                    className="link-btn"
                    onClick={() => setShowForgotPassword(true)}
                  >
                    Forgot password?
                  </button>
                  <span className="divider">•</span>
                  <button
                    type="button"
                    className="link-btn"
                    onClick={() => {
                      setIsSignup(true);
                      setAuthForm({ username: '', password: '' });
                      setError('');
                    }}
                  >
                    Sign up
                  </button>
                </>
              ) : (
                <button
                  type="button"
                  className="link-btn"
                  onClick={() => {
                    setIsSignup(false);
                    setAuthForm({ username: '', password: '' });
                    setError('');
                  }}
                >
                  Back to login
                </button>
              )}
            </div>
          </form>
        </section>
      </main>
    );
  }

  // TEACHER DASHBOARD
  if (user?.role === 'teacher') {
    return (
      <TeacherDashboard
        user={user}
        students={students}
        tasks={tasks}
        studentForm={studentForm}
        setStudentForm={setStudentForm}
        taskForm={taskForm}
        setTaskForm={setTaskForm}
        editingStudentId={editingStudentId}
        setEditingStudentId={setEditingStudentId}
        selectedClass={selectedClass}
        setSelectedClass={setSelectedClass}
        loading={loading}
        error={error}
        onStudentSubmit={handleStudentSubmit}
        onTaskSubmit={handleTaskSubmit}
        onStudentEdit={handleStudentEdit}
        onStudentDelete={handleStudentDelete}
        onToggleTaskComplete={handleToggleTaskComplete}
        onLogout={() => setShowLogoutConfirm(true)}
        showLogoutConfirm={showLogoutConfirm}
        setShowLogoutConfirm={setShowLogoutConfirm}
        onLogoutConfirmed={handleLogoutConfirmed}
      />
    );
  }

  // STUDENT DASHBOARD
  if (user?.role === 'student') {
    return (
      <StudentDashboard
        user={user}
        tasks={tasks}
        authHeaders={authHeaders}
        onLogout={() => setShowLogoutConfirm(true)}
        showLogoutConfirm={showLogoutConfirm}
        setShowLogoutConfirm={setShowLogoutConfirm}
        onLogoutConfirmed={handleLogoutConfirmed}
        loading={loading}
        error={error}
        api={api}
      />
    );
  }

  // UNKNOWN ROLE FALLBACK (prevents blank page for legacy/bad tokens)
  if (token && user && user.role !== 'teacher' && user.role !== 'student') {
    return (
      <main className="auth-shell">
        <section className="auth-layout">
          <div className="auth-marketing">
            <p className="eyebrow">Gridaan School Suite</p>
            <h1>Session role is not supported</h1>
            <p className="subtitle">
              Detected role: <strong>{String(user.role)}</strong>. Please clear this old session and sign in again.
            </p>
          </div>

          <div className="auth-card">
            <div className="auth-card-header">
              <div>
                <p className="eyebrow">Role Check</p>
                <h2>Action Required</h2>
              </div>
              <span className="session-badge">Session</span>
            </div>

            <p className="subtitle">
              This usually happens with older tokens from previous versions.
            </p>

            <button type="button" className="auth-submit" onClick={handleLogoutConfirmed}>
              Clear Session and Login Again
            </button>
          </div>
        </section>
      </main>
    );
  }

  // SESSION FALLBACK (prevents blank page when token exists but profile cannot load)
  if (token && !user) {
    return (
      <main className="auth-shell">
        <section className="auth-layout">
          <div className="auth-marketing">
            <p className="eyebrow">Gridaan School Suite</p>
            <h1>Restoring your session...</h1>
            <p className="subtitle">
              We could not load your profile. This can happen if the backend is down or your session expired.
            </p>
          </div>

          <div className="auth-card">
            <div className="auth-card-header">
              <div>
                <p className="eyebrow">Session Check</p>
                <h2>{loading ? 'Loading profile' : 'Unable to continue'}</h2>
              </div>
              <span className="session-badge">Recovery</span>
            </div>

            {error ? <p className="error-text">{error}</p> : null}

            <div className="button-row">
              <button type="button" className="auth-submit" onClick={() => window.location.reload()}>
                Retry
              </button>
              <button type="button" className="ghost-btn" onClick={handleLogoutConfirmed}>
                Clear Session
              </button>
            </div>
          </div>
        </section>
      </main>
    );
  }

  return null;
}

export default App;
