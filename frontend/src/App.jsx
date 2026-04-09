import { useEffect, useMemo, useState } from 'react';
import axios from 'axios';
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

        const [profileRes, studentsRes, tasksRes] = await Promise.all([
          api.get('/auth/me', { headers: authHeaders }),
          api.get('/students', { headers: authHeaders }),
          api.get('/tasks', { headers: authHeaders }),
        ]);

        setUser(profileRes.data);
        setStudents(studentsRes.data);
        setTasks(tasksRes.data);
      } catch (loadError) {
        setError(loadError.response?.data?.message || 'Failed to load dashboard data');

        if (loadError.response?.status === 401) {
          handleLogout();
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

      const response = await api.post('/auth/login', authForm);
      localStorage.setItem('token', response.data.token);
      setToken(response.data.token);
      setUser({ username: response.data.username, role: 'admin' });
    } catch (loginError) {
      setError(loginError.response?.data?.message || 'Login failed');
    } finally {
      setLoading(false);
    }
  };

  const handleLogout = () => {
    localStorage.removeItem('token');
    setToken('');
    setUser(null);
    setStudents([]);
    setTasks([]);
    setEditingStudentId('');
    setShowPassword(false);
  };

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

  const toggleTaskComplete = async (taskId, currentState) => {
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

  if (!token) {
    return (
      <main className="auth-shell">
        <section className="auth-layout">
          <div className="auth-marketing">
            <p className="eyebrow">Gridaan School Suite</p>
            <h1>Secure admin access for student and assignment management.</h1>
            <p className="subtitle">
              Log in to manage students, assign homework, and track completion from one dashboard.
            </p>

            <div className="feature-grid">
              <article>
                <strong>JWT secured</strong>
                <p>Protected endpoints and session-based access control.</p>
              </article>
              <article>
                <strong>Live dashboard</strong>
                <p>Students and tasks update immediately after each action.</p>
              </article>
              <article>
                <strong>MongoDB storage</strong>
                <p>All records persist in your connected database.</p>
              </article>
            </div>
          </div>

          <section className="auth-card">
            <div className="auth-card-header">
              <div>
                <p className="eyebrow">Admin Login</p>
                <h2>Welcome back</h2>
              </div>
              <span className="session-badge">Secure session</span>
            </div>

            <p className="subtitle">Use your admin credentials to continue to the dashboard.</p>

            <form onSubmit={handleLogin} className="stack-form">
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

              <label>
                Password
                <div className="password-field">
                  <input
                    type={showPassword ? 'text' : 'password'}
                    value={authForm.password}
                    onChange={(event) => setAuthForm((prev) => ({ ...prev, password: event.target.value }))}
                    placeholder="Enter password"
                    autoComplete="current-password"
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

              <button type="submit" disabled={loading || !readyToSignIn}>
                {loading ? 'Signing in...' : 'Sign in to dashboard'}
              </button>
            </form>

            {error ? <p className="error-text">{error}</p> : null}
          </section>
        </section>
      </main>
    );
  }

  return (
    <main className="app-shell">
      <header className="topbar">
        <div>
          <p className="eyebrow">Admin Dashboard</p>
          <h1>School Management</h1>
          <p className="subtitle">Signed in as {user?.username || 'admin'}.</p>
        </div>
        <button type="button" onClick={handleLogout} className="ghost-btn">
          Logout
        </button>
      </header>

      {error ? <p className="error-text">{error}</p> : null}

      <section className="grid-layout">
        <article className="panel">
          <h2>{editingStudentId ? 'Edit Student' : 'Add Student'}</h2>
          <form onSubmit={handleStudentSubmit} className="stack-form compact">
            <label>
              Name
              <input
                value={studentForm.name}
                onChange={(event) => setStudentForm((prev) => ({ ...prev, name: event.target.value }))}
                required
              />
            </label>
            <label>
              Class
              <input
                value={studentForm.className}
                onChange={(event) => setStudentForm((prev) => ({ ...prev, className: event.target.value }))}
                placeholder="Class 10"
                required
              />
            </label>
            <label>
              Age
              <input
                type="number"
                min="1"
                value={studentForm.age}
                onChange={(event) => setStudentForm((prev) => ({ ...prev, age: event.target.value }))}
              />
            </label>
            <div className="button-row">
              <button type="submit">{editingStudentId ? 'Update Student' : 'Add Student'}</button>
              {editingStudentId ? (
                <button
                  type="button"
                  className="ghost-btn"
                  onClick={() => {
                    setEditingStudentId('');
                    setStudentForm({ name: '', className: '', age: '' });
                  }}
                >
                  Cancel
                </button>
              ) : null}
            </div>
          </form>
        </article>

        <article className="panel">
          <h2>Assign Task</h2>
          <form onSubmit={handleTaskSubmit} className="stack-form compact">
            <label>
              Title
              <input
                value={taskForm.title}
                onChange={(event) => setTaskForm((prev) => ({ ...prev, title: event.target.value }))}
                required
              />
            </label>
            <label>
              Description
              <textarea
                value={taskForm.description}
                onChange={(event) => setTaskForm((prev) => ({ ...prev, description: event.target.value }))}
                rows="3"
              />
            </label>
            <label>
              Student
              <select
                value={taskForm.studentId}
                onChange={(event) => setTaskForm((prev) => ({ ...prev, studentId: event.target.value }))}
                required
              >
                <option value="">Select student</option>
                {students.map((student) => (
                  <option key={student._id} value={student._id}>
                    {student.name} ({student.className})
                  </option>
                ))}
              </select>
            </label>
            <label>
              Due date
              <input
                type="date"
                value={taskForm.dueDate}
                onChange={(event) => setTaskForm((prev) => ({ ...prev, dueDate: event.target.value }))}
              />
            </label>
            <button type="submit">Assign Task</button>
          </form>
        </article>
      </section>

      <section className="grid-layout">
        <article className="panel">
          <div className="panel-header">
            <h2>Students</h2>
            <span className="pill">{students.length}</span>
          </div>
          {loading ? <p>Loading students...</p> : null}
          {!loading && students.length === 0 ? <p>No students yet.</p> : null}
          <ul className="list-grid">
            {students.map((student) => (
              <li key={student._id}>
                <div>
                  <strong>{student.name}</strong>
                  <p>{student.className}{student.age ? ` • Age ${student.age}` : ''}</p>
                </div>
                <div className="button-row">
                  <button type="button" className="ghost-btn" onClick={() => handleStudentEdit(student)}>
                    Edit
                  </button>
                  <button type="button" className="danger-btn" onClick={() => handleStudentDelete(student._id)}>
                    Delete
                  </button>
                </div>
              </li>
            ))}
          </ul>
        </article>

        <article className="panel">
          <div className="panel-header">
            <h2>Assignments</h2>
            <span className="pill">{tasks.length}</span>
          </div>
          {loading ? <p>Loading tasks...</p> : null}
          {!loading && tasks.length === 0 ? <p>No tasks assigned yet.</p> : null}
          <ul className="list-grid">
            {tasks.map((task) => (
              <li key={task._id}>
                <div>
                  <strong>{task.title}</strong>
                  <p>
                    {task.student?.name || 'Unknown student'}
                    {task.student?.className ? ` (${task.student.className})` : ''}
                  </p>
                  {task.description ? <p>{task.description}</p> : null}
                </div>
                <div className="button-row">
                  <span className={task.completed ? 'status done' : 'status pending'}>
                    {task.completed ? 'Completed' : 'Pending'}
                  </span>
                  <button type="button" className="ghost-btn" onClick={() => toggleTaskComplete(task._id, task.completed)}>
                    Mark {task.completed ? 'Pending' : 'Complete'}
                  </button>
                </div>
              </li>
            ))}
          </ul>
        </article>
      </section>
    </main>
  );
}

export default App;
