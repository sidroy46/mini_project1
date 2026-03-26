import React, { useCallback, useEffect, useRef, useState } from "react";
import Webcam from "react-webcam";
import api from "../api/client";

export default function AttendancePage() {
  const webcamRef = useRef(null);
  const [subjects, setSubjects] = useState([]);
  const [latestRows, setLatestRows] = useState([]);
  const [subjectId, setSubjectId] = useState("");
  const [status, setStatus] = useState("");
  const [isError, setIsError] = useState(false);
  const [loading, setLoading] = useState(false);

  const today = new Date().toISOString().slice(0, 10);

  const loadLatestAttendance = useCallback(async () => {
    const response = await api.get(`/api/attendance/report/daily?date=${today}`);
    setLatestRows(response.data || []);
  }, [today]);

  useEffect(() => {
    const fetchInitialData = async () => {
      try {
        const subjectsResponse = await api.get("/api/subjects");

        setSubjects(subjectsResponse.data);
        if (subjectsResponse.data.length > 0) {
          setSubjectId(subjectsResponse.data[0].id);
        }

        await loadLatestAttendance();
      } catch {
        setIsError(true);
        setStatus("Failed to load subjects");
      }
    };

    fetchInitialData();
  }, [loadLatestAttendance]);

  const captureAndMark = async () => {
    setLoading(true);
    setStatus("");
    setIsError(false);

    try {
      if (!subjectId) {
        setIsError(true);
        setStatus("Please select a subject first");
        return;
      }

      const image = webcamRef.current?.getScreenshot();
      if (!image) {
        setIsError(true);
        setStatus("Could not capture image");
        return;
      }

      const response = await api.post("/api/attendance/mark", {
        image,
        subjectId: Number(subjectId)
      });

      if (response.data?.status !== "success") {
        setIsError(true);
        setStatus(response.data?.message || "Face Not Recognized");
        return;
      }

      const details = [
        response.data.name ? `Name: ${response.data.name}` : null,
        response.data.subject ? `Subject: ${response.data.subject}` : null,
        response.data.date ? `Date: ${response.data.date}` : null,
        response.data.time ? `Time: ${response.data.time}` : null,
        response.data.attendanceId ? `ID: ${response.data.attendanceId}` : null,
        response.data.confidence ? `Confidence: ${response.data.confidence}` : null
      ].filter(Boolean).join(" | ");

      setStatus(`Attendance Marked for ${response.data?.name || "student"}.${details ? ` ${details}` : ""}`);
      await loadLatestAttendance();
    } catch (exception) {
      setIsError(true);
      setStatus(exception.response?.data?.message || "Failed to process attendance");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="space-y-6">
      <h2 className="app-title">Attendance Capture</h2>
      <div className="app-card space-y-4">
        <label className="block text-sm font-medium text-slate-300">Subject</label>
        <select
          className="app-select"
          value={subjectId}
          onChange={(event) => setSubjectId(event.target.value)}
        >
          {subjects.map((subject) => (
            <option key={subject.id} value={subject.id}>{subject.name} ({subject.code})</option>
          ))}
        </select>

        <Webcam
          ref={webcamRef}
          screenshotFormat="image/jpeg"
          className="w-full max-w-lg rounded-2xl border border-slate-700"
          videoConstraints={{ facingMode: "user" }}
        />

        <button
          className="app-btn-primary"
          onClick={captureAndMark}
          disabled={loading}
        >
          {loading ? "Processing..." : "Capture & Mark Attendance"}
        </button>

        {status && (
          <p
            className={[
              "rounded-xl px-3 py-2 text-sm",
              isError
                ? "app-alert-error"
                : "app-alert-success"
            ].join(" ")}
          >
            {status}
          </p>
        )}
      </div>

      <div className="app-table-wrap">
        <h3>Latest Attendance (Today)</h3>
        <table className="app-table mt-3">
          <thead>
            <tr>
              <th>ID</th>
              <th>Student</th>
              <th>Roll</th>
              <th>Subject</th>
              <th>Date</th>
              <th>Time</th>
            </tr>
          </thead>
          <tbody>
            {latestRows.map((row) => (
              <tr key={row.id}>
                <td>{row.id}</td>
                <td>{row.studentName}</td>
                <td>{row.rollNumber}</td>
                <td>{row.subjectName}</td>
                <td>{row.date}</td>
                <td>{row.time}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}
