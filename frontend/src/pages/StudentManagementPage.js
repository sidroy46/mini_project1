import React, { useEffect, useRef, useState } from "react";
import Webcam from "react-webcam";
import api from "../api/client";

const initialForm = {
  name: "",
  rollNumber: "",
  email: "",
  department: ""
};

export default function StudentManagementPage() {
  const webcamRef = useRef(null);
  const [students, setStudents] = useState([]);
  const [form, setForm] = useState(initialForm);
  const [faceImages, setFaceImages] = useState([]);
  const [editingId, setEditingId] = useState(null);
  const [showForm, setShowForm] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  const loadStudents = async () => {
    try {
      const response = await api.get("/api/students");
      setStudents(response.data);
      setError("");
    } catch (exception) {
      if (!exception?.response) {
        setError("Cannot connect to server. Please make sure backend is running.");
      } else if (exception?.response?.status === 401 || exception?.response?.status === 403) {
        setError("Your session expired. Please login again.");
      } else {
        setError("Failed to load students.");
      }
    }
  };

  useEffect(() => {
    loadStudents();
  }, []);

  const submitForm = async (event) => {
    event.preventDefault();
    setLoading(true);
    setError("");

    try {
      const payload = new FormData();
      Object.entries(form).forEach(([key, value]) => payload.append(key, value));
      faceImages.slice(0, 3).forEach((file) => payload.append("faceImages", file));

      if (editingId) {
        await api.put(`/api/students/${editingId}`, payload);
      } else {
        await api.post("/api/students", payload);
      }

      setForm(initialForm);
      setFaceImages([]);
      setEditingId(null);
      setShowForm(false);
      await loadStudents();
    } catch (exception) {
      if (!exception?.response) {
        setError("Cannot connect to server. Please make sure backend is running.");
      } else {
        setError(exception?.response?.data?.message || "Failed to save student.");
      }
    } finally {
      setLoading(false);
    }
  };

  const editStudent = (student) => {
    setEditingId(student.id);
    setForm({
      name: student.name,
      rollNumber: student.rollNumber,
      email: student.email,
      department: student.department
    });
    setShowForm(true);
  };

  const deleteStudent = async (id) => {
    try {
      await api.delete(`/api/students/${id}`);
      await loadStudents();
    } catch (exception) {
      if (!exception?.response) {
        setError("Cannot connect to server. Please make sure backend is running.");
      } else {
        setError(exception?.response?.data?.message || "Failed to delete student.");
      }
    }
  };

  const captureFaceImage = () => {
    const image = webcamRef.current?.getScreenshot();
    if (!image || faceImages.length >= 3) {
      return;
    }

    const blob = dataUrlToBlob(image);
    const file = new File([blob], `capture-${Date.now()}.jpg`, { type: "image/jpeg" });
    setFaceImages((previous) => [...previous, file].slice(0, 3));
  };

  const dataUrlToBlob = (dataUrl) => {
    const [meta, content] = dataUrl.split(",");
    const mimeMatch = meta.match(/data:(.*);base64/);
    const mime = mimeMatch ? mimeMatch[1] : "image/jpeg";
    const binary = atob(content);
    const bytes = new Uint8Array(binary.length);
    for (let index = 0; index < binary.length; index += 1) {
      bytes[index] = binary.charCodeAt(index);
    }
    return new Blob([bytes], { type: mime });
  };

  return (
    <div className="space-y-6">
      <h2 className="app-title">Student Details</h2>
      <button
        className="app-btn-primary"
        onClick={() => setShowForm((previous) => !previous)}
      >
        {showForm ? "Close Student Form" : "Student Details"}
      </button>
      {error && (
        <p className="app-alert-error">
          {error}
        </p>
      )}

      {showForm && (
        <form className="app-card grid gap-4 md:grid-cols-2" onSubmit={submitForm}>
          <input className="app-input" placeholder="Name" value={form.name} onChange={(e) => setForm({ ...form, name: e.target.value })} required />
          <input className="app-input" placeholder="Roll Number" value={form.rollNumber} onChange={(e) => setForm({ ...form, rollNumber: e.target.value })} required />
          <input className="app-input" placeholder="Email" value={form.email} onChange={(e) => setForm({ ...form, email: e.target.value })} required />
          <input className="app-input" placeholder="Department" value={form.department} onChange={(e) => setForm({ ...form, department: e.target.value })} required />
          <input
            className="app-input text-slate-300"
            type="file"
            accept="image/*"
            multiple
            onChange={(e) => setFaceImages(Array.from(e.target.files || []).slice(0, 3))}
          />

          <div className="md:col-span-2">
            <Webcam
              ref={webcamRef}
              screenshotFormat="image/jpeg"
              className="w-full max-w-lg rounded-2xl border border-slate-700"
              videoConstraints={{ facingMode: "user" }}
            />
            <button
              type="button"
              className="app-btn-secondary mt-3"
              onClick={captureFaceImage}
            >
              Capture Face Image
            </button>
            <p className="mt-2 text-sm text-slate-400">Selected images: {faceImages.length}/3</p>
          </div>

          <button
            className="app-btn-primary"
            type="submit"
            disabled={loading || faceImages.length < 2}
          >
            {loading ? "Saving..." : editingId ? "Update Student" : "Add Student"}
          </button>
        </form>
      )}

      <div className="app-table-wrap">
        <table className="app-table">
          <thead>
            <tr>
              <th>Name</th>
              <th>Roll</th>
              <th>Email</th>
              <th>Department</th>
              <th>Actions</th>
            </tr>
          </thead>
          <tbody>
            {students.map((student) => (
              <tr key={student.id}>
                <td>{student.name}</td>
                <td>{student.rollNumber}</td>
                <td>{student.email}</td>
                <td>{student.department}</td>
                <td>
                  <button className="app-btn-secondary mr-2 px-3 py-1.5 text-xs" onClick={() => editStudent(student)}>Edit</button>
                  <button className="app-btn-danger px-3 py-1.5 text-xs" onClick={() => deleteStudent(student.id)}>Delete</button>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}
