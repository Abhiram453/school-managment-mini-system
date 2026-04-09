import { useState } from 'react';

function TeacherDashboard({
  user,
  students,
  tasks,
  studentForm,
  setStudentForm,
  taskForm,
  setTaskForm,
  editingStudentId,
  setEditingStudentId,
  selectedClass,
  setSelectedClass,
  loading,
  error,
  onStudentSubmit,
  onTaskSubmit,
  onStudentEdit,
  onStudentDelete,
  onToggleTaskComplete,
  onLogout,
  showLogoutConfirm,
  setShowLogoutConfirm,
  onLogoutConfirmed,
}) {
  const getUniqueClasses = () => {
    const classes = new Set(students.map((s) => s.className));
    return Array.from(classes).sort();
  };

  const filteredStudents = selectedClass ? students.filter((student) => student.className === selectedClass) : students;

  return (
    <main className="app-shell">
      <header className="topbar">
        <div>
          <p className="eyebrow">Teacher Dashboard</p>
          <h1>School Management</h1>
          <p className="subtitle">Signed in as {user?.username || 'teacher'}.</p>
        </div>
        <button type="button" onClick={onLogout} className="ghost-btn">
          Logout
        </button>
      </header>

      {error ? <p className="error-text">{error}</p> : null}

      <section className="grid-layout">
        <article className="panel">
          <h2>{editingStudentId ? 'Edit Student' : 'Add Student'}</h2>
          <form onSubmit={onStudentSubmit} className="stack-form compact">
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
          <form onSubmit={onTaskSubmit} className="stack-form compact">
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
            <span className="pill">{filteredStudents.length}</span>
          </div>
          {getUniqueClasses().length > 0 ? (
            <label className="class-filter">
              Filter by Class
              <select value={selectedClass} onChange={(event) => setSelectedClass(event.target.value)}>
                <option value="">All Classes ({students.length})</option>
                {getUniqueClasses().map((cls) => (
                  <option key={cls} value={cls}>
                    {cls} ({students.filter((s) => s.className === cls).length})
                  </option>
                ))}
              </select>
            </label>
          ) : null}
          {loading ? <p>Loading students...</p> : null}
          {!loading && students.length === 0 ? <p>No students yet.</p> : null}
          {!loading && students.length > 0 && filteredStudents.length === 0 ? <p>No students in {selectedClass}.</p> : null}
          <ul className="list-grid">
            {filteredStudents.map((student) => (
              <li key={student._id}>
                <div>
                  <strong>{student.name}</strong>
                  <p>{student.className}{student.age ? ` • Age ${student.age}` : ''}</p>
                </div>
                <div className="button-row">
                  <button type="button" className="ghost-btn" onClick={() => onStudentEdit(student)}>
                    Edit
                  </button>
                  <button type="button" className="danger-btn" onClick={() => onStudentDelete(student._id)}>
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
                  <button type="button" className="ghost-btn" onClick={() => onToggleTaskComplete(task._id, task.completed)}>
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
            <p>Are you sure you want to log out? Any unsaved changes will be lost.</p>
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

export default TeacherDashboard;
