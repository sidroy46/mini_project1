import React, { useEffect, useState } from "react";
import api from "../api/client";

const initialForm = {
  code: "",
  name: "",
  facultyName: "",
  classStartTime: "",
  classEndTime: ""
};

export default function SubjectManagementPage() {
  const [subjects, setSubjects] = useState([]);
  const [form, setForm] = useState(initialForm);
  const [editingId, setEditingId] = useState(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  const loadSubjects = async () => {
    try {
      const response = await api.get("/api/subjects");
      setSubjects(response.data);
      setError("");
    } catch (exception) {
      if (!exception?.response) {
        setError("Cannot connect to server. Please make sure backend is running.");
      } else if (exception?.response?.status === 401 || exception?.response?.status === 403) {
        setError("Your session expired. Please login again.");
      } else {
        setError("Failed to load subjects.");
      }
    }
  };

  useEffect(() => {
    loadSubjects();
  }, []);

  const submit = async (event) => {
    event.preventDefault();
    setLoading(true);
    setError("");
    try {
      if (editingId) {
        await api.put(`/api/subjects/${editingId}`, form);
      } else {
        await api.post("/api/subjects", form);
      }
      setForm(initialForm);
      setEditingId(null);
      await loadSubjects();
    } catch (exception) {
      if (!exception?.response) {
        setError("Cannot connect to server. Please make sure backend is running.");
      } else {
        setError(exception?.response?.data?.message || "Failed to save subject.");
      }
    } finally {
      setLoading(false);
    }
  };

  const onEdit = (subject) => {
    setEditingId(subject.id);
    setForm({
      code: subject.code,
      name: subject.name,
      facultyName: subject.facultyName,
      classStartTime: subject.classStartTime,
      classEndTime: subject.classEndTime
    });
  };

  const onDelete = async (id) => {
    try {
      await api.delete(`/api/subjects/${id}`);
      await loadSubjects();
    } catch (exception) {
      if (!exception?.response) {
        setError("Cannot connect to server. Please make sure backend is running.");
      } else {
        setError(exception?.response?.data?.message || "Failed to delete subject.");
      }
    }
  };

  return (
    <div className="space-y-6">
      <h2 className="app-title">Subject Management</h2>
      {error && (
        <p className="app-alert-error">
          {error}
        </p>
      )}
      <form className="app-card grid gap-4 md:grid-cols-2" onSubmit={submit}>
        <input
          className="app-input"
          placeholder="Subject Code"
          value={form.code}
          onChange={(e) => setForm({ ...form, code: e.target.value })}
          required
        />
        <input
          className="app-input"
          placeholder="Subject Name"
          value={form.name}
          onChange={(e) => setForm({ ...form, name: e.target.value })}
          required
        />
        <input
          className="app-input"
          placeholder="Faculty Name"
          value={form.facultyName}
          onChange={(e) => setForm({ ...form, facultyName: e.target.value })}
          required
        />
        <input
          className="app-input"
          type="time"
          value={form.classStartTime}
          onChange={(e) => setForm({ ...form, classStartTime: e.target.value })}
          required
        />
        <input
          className="app-input"
          type="time"
          value={form.classEndTime}
          onChange={(e) => setForm({ ...form, classEndTime: e.target.value })}
          required
        />
        <button
          className="app-btn-primary"
          type="submit"
          disabled={loading}
        >
          {loading ? "Saving..." : editingId ? "Update Subject" : "Add Subject"}
        </button>
      </form>

      <div className="app-table-wrap">
        <table className="app-table">
          <thead>
            <tr>
              <th>Code</th>
              <th>Name</th>
              <th>Faculty</th>
              <th>Class Time</th>
              <th>Actions</th>
            </tr>
          </thead>
          <tbody>
            {subjects.map((subject) => (
              <tr key={subject.id}>
                <td>{subject.code}</td>
                <td>{subject.name}</td>
                <td>{subject.facultyName}</td>
                <td>{subject.classStartTime} - {subject.classEndTime}</td>
                <td>
                  <button className="app-btn-secondary mr-2 px-3 py-1.5 text-xs" onClick={() => onEdit(subject)}>Edit</button>
                  <button className="app-btn-danger px-3 py-1.5 text-xs" onClick={() => onDelete(subject.id)}>Delete</button>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}
