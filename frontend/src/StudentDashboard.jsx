import { useState } from 'react';

function StudentDashboard({ user, tasks, authHeaders, onLogout, loading, error, api }) {
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

          {loading ? <p>Loading assignments...</p> : null}
          {!loading && studentTasks.length === 0 ? (
            <p>No assignments yet. Check back later!</p>
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
    </main>
  );
}

export default StudentDashboard;
