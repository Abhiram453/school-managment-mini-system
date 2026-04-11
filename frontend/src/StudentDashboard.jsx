import { useState } from 'react';

function StudentDashboard({
  user,
  tasks,
  authHeaders,
  onLogout,
  showLogoutConfirm,
  setShowLogoutConfirm,
  onLogoutConfirmed,
  loading,
  error,
  api,
}) {
  const studentTasks = tasks.filter((task) => task.student?._id === user?.studentId || task.student?.username === user?.username);

  const handleToggleComplete = async (taskId, currentState) => {
    try {
      const response = await api.patch(
        `/tasks/${taskId}/complete`,
        { completed: !currentState },
        { headers: authHeaders },
      );
      // Task update would be handled by parent component
    } catch (err) {
      console.error('Could not update task status');
    }
  };

  return (
    <main className="app-shell">
      <header className="topbar">
        <div>
          <p className="eyebrow">Student Dashboard</p>
          <h1>My Assignments</h1>
          <p className="subtitle">Logged in as {user?.username || 'student'}.</p>
        </div>
        <button type="button" onClick={onLogout} className="ghost-btn">
          Logout
        </button>
      </header>

      {error ? <p className="error-text">{error}</p> : null}

      <section className="grid-layout">
        <article className="panel full-width">
          <div className="panel-header">
            <h2>My Assignments</h2>
            <span className="pill">{studentTasks.length}</span>
          </div>

          {loading ? <p style={{ padding: '1rem 0', color: 'var(--text-soft)' }}>Loading assignments...</p> : null}
          {!loading && studentTasks.length === 0 ? (
            <div className="empty-state">
              <div className="empty-state-icon">📚</div>
              <div className="empty-state-title">No Assignments Yet</div>
              <div className="empty-state-text">
                Check back soon! Your teacher will assign tasks here.
              </div>
            </div>
          ) : null}

          <ul className="list-grid">
            {studentTasks.map((task) => (
              <li key={task._id}>
                <div>
                  <strong>{task.title}</strong>
                  {task.description ? <p>{task.description}</p> : null}
                  {task.dueDate ? (
                    <p style={{ marginTop: '0.5rem', fontSize: '0.9rem' }}>
                      Due: {new Date(task.dueDate).toLocaleDateString()}
                    </p>
                  ) : null}
                </div>
                <div className="button-row">
                  <span className={task.completed ? 'status done' : 'status pending'}>
                    {task.completed ? 'Completed' : 'Pending'}
                  </span>
                  <button
                    type="button"
                    className="ghost-btn"
                    onClick={() => handleToggleComplete(task._id, task.completed)}
                  >
                    Mark {task.completed ? 'Pending' : 'Complete'}
                  </button>
                </div>
              </li>
            ))}
          </ul>
        </article>
      </section>

      {showLogoutConfirm ? (
        <div className="modal-overlay">
          <div className="modal-dialog">
            <h3>Confirm Logout</h3>
            <p>Are you sure you want to log out?</p>
            <div className="modal-actions">
              <button type="button" className="ghost-btn" onClick={() => setShowLogoutConfirm(false)}>
                Cancel
              </button>
              <button type="button" className="danger-btn" onClick={onLogoutConfirmed}>
                Logout
              </button>
            </div>
          </div>
        </div>
      ) : null}
    </main>
  );
}

export default StudentDashboard;
