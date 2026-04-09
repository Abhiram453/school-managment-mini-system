import { useEffect, useMemo, useState } from 'react';
import axios from 'axios';
import TeacherDashboard from './TeacherDashboard';
import StudentDashboard from './StudentDashboard';
import './App.css';

const API_BASE_URL = import.meta.env.VITE_API_URL || 'http://localhost:5000/api';

const api = axios.create({ baseURL: API_BASE_URL });

function App() {
  const [token, setToken] = useState(localStorage.getItem('token') || '');
  const [user, setUser] = useState(null);
  const [authForm, setAuthForm] = useState({ username: '', password: '' });
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
        setUser(profileRes.data);

        // Only load students and tasks if teacher
        if (profileRes.data.role === 'teacher') {
          const [studentsRes, tasksRes] = await Promise.all([
            api.get('/students', { headers: authHeaders }),
            api.get('/tasks', { headers: authHeaders }),
          ]);
          setStudents(studentsRes.data);
          setTasks(tasksRes.data);
        } else if (profileRes.data.role === 'student') {
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
      setUser({ username: response.data.username, role: response.data.role });
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
    setToken('');
    setUser(null);
    setStudents([]);
    setTasks([]);
    setEditingStudentId('');
    setShowPassword(false);
    setShowLogoutConfirm(false);
    setSelectedClass('');
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
    const rememberedUsername = localStorage.getItem('rememberedUsername') || '';

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
                <strong>Role-based access</strong>
                <p>Teachers and students have separate dashboards.</p>
              </article>
              <article>
                <strong>JWT secured</strong>
                <p>Protected endpoints and session-based access control.</p>
              </article>
              <article>
                <strong>MongoDB storage</strong>
                <p>All records persist in your connected database.</p>
              </article>
            </div>

            <div style={{ marginTop: '1.5rem', padding: '1rem', background: 'rgba(2, 168, 152, 0.1)', borderRadius: '12px' }}>
              <p style={{ fontSize: '0.9rem', margin: 0 }}>
                <strong>Demo Accounts:</strong><br />
                Teacher: teacher1 / teacher123<br />
                Student: student1 / student123
              </p>
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
                defaultValue={rememberMe && !isSignup ? rememberedUsername : ''}
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

            <button type="submit" disabled={loading || !readyToSignIn}>
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
        loading={loading}
        error={error}
        api={api}
      />
    );
  }

  return null;
}

export default App;
