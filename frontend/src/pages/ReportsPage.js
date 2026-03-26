import React, { useState } from "react";
import api from "../api/client";

export default function ReportsPage() {
  const [date, setDate] = useState(new Date().toISOString().slice(0, 10));
  const [year, setYear] = useState(String(new Date().getFullYear()));
  const [month, setMonth] = useState(String(new Date().getMonth() + 1));
  const [studentId, setStudentId] = useState("");
  const [rows, setRows] = useState([]);
  const [status, setStatus] = useState("");
  const [isError, setIsError] = useState(false);

  const getErrorMessage = (error, fallbackMessage) => {
    const backendMessage = error?.response?.data?.message;
    if (backendMessage) {
      return backendMessage;
    }

    if (error?.response?.status === 401) {
      return "Session expired. Please login again.";
    }

    if (error?.response?.status === 403) {
      return "You are not allowed to access reports.";
    }

    if (error?.response?.status >= 500) {
      return "Server error while loading report. Try again.";
    }

    if (error?.code === "ERR_NETWORK") {
      return "Cannot connect to backend. Check if server is running.";
    }

    return fallbackMessage;
  };

  const loadDaily = async () => {
    if (!date) {
      setRows([]);
      setIsError(true);
      setStatus("Select a valid date for daily report");
      return;
    }
    try {
      const response = await api.get(`/api/attendance/report/daily?date=${date}`);
      setRows(response.data);
      setIsError(false);
      setStatus(`Loaded ${response.data.length} daily rows`);
    } catch (error) {
      setRows([]);
      setIsError(true);
      setStatus(getErrorMessage(error, "Failed to load daily report"));
    }
  };

  const loadMonthly = async () => {
    if (!year || !month) {
      setRows([]);
      setIsError(true);
      setStatus("Enter year and month for monthly report");
      return;
    }

    try {
      const response = await api.get(`/api/attendance/report/monthly?year=${year}&month=${month}`);
      setRows(response.data);
      setIsError(false);
      setStatus(`Loaded ${response.data.length} monthly rows`);
    } catch (error) {
      setRows([]);
      setIsError(true);
      setStatus(getErrorMessage(error, "Failed to load monthly report"));
    }
  };

  const loadStudent = async () => {
    if (!studentId) {
      setIsError(true);
      setStatus("Enter student ID for student-wise report");
      return;
    }
    try {
      const response = await api.get(`/api/attendance/report/student?studentId=${studentId}`);
      setRows(response.data);
      setIsError(false);
      setStatus(`Loaded ${response.data.length} student rows`);
    } catch (error) {
      setRows([]);
      setIsError(true);
      setStatus(getErrorMessage(error, "Failed to load student report"));
    }
  };

  const downloadExcel = async () => {
    if (!date) {
      setIsError(true);
      setStatus("Select a valid date before exporting Excel");
      return;
    }

    try {
      const response = await api.get(`/api/attendance/report/export/excel?date=${date}`, { responseType: "blob" });
      const url = window.URL.createObjectURL(response.data);
      const a = document.createElement("a");
      a.href = url;
      a.download = `attendance-${date}.xlsx`;
      a.click();
      setIsError(false);
      setStatus("Excel report downloaded");
    } catch (error) {
      setIsError(true);
      setStatus(getErrorMessage(error, "Failed to export Excel report"));
    }
  };

  const downloadPdf = async () => {
    if (!date) {
      setIsError(true);
      setStatus("Select a valid date before exporting PDF");
      return;
    }

    try {
      const response = await api.get(`/api/attendance/report/export/pdf?date=${date}`, { responseType: "blob" });
      const url = window.URL.createObjectURL(response.data);
      const a = document.createElement("a");
      a.href = url;
      a.download = `attendance-${date}.pdf`;
      a.click();
      setIsError(false);
      setStatus("PDF report downloaded");
    } catch (error) {
      setIsError(true);
      setStatus(getErrorMessage(error, "Failed to export PDF report"));
    }
  };

  return (
    <div className="space-y-6">
      <h2 className="app-title">Reports</h2>
      <div className="app-card space-y-4">
        <div className="grid gap-4 md:grid-cols-2">
          <div className="app-card-soft space-y-3">
            <p className="text-xs font-semibold uppercase tracking-wider text-slate-400">Daily Report</p>
            <input
              className="app-input"
              type="date"
              value={date}
              onChange={(event) => setDate(event.target.value)}
            />
            <button className="app-btn-primary w-full" onClick={loadDaily}>Load Daily</button>
          </div>

          <div className="app-card-soft space-y-3">
            <p className="text-xs font-semibold uppercase tracking-wider text-slate-400">Monthly Report</p>
            <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
              <input
                className="app-input"
                type="number"
                placeholder="Year"
                value={year}
                onChange={(event) => setYear(event.target.value)}
              />
              <input
                className="app-input"
                type="number"
                min="1"
                max="12"
                placeholder="Month"
                value={month}
                onChange={(event) => setMonth(event.target.value)}
              />
            </div>
            <button className="app-btn-secondary w-full" onClick={loadMonthly}>Load Monthly</button>
          </div>

          <div className="app-card-soft space-y-3 md:col-span-2">
            <p className="text-xs font-semibold uppercase tracking-wider text-slate-400">Student Report</p>
            <div className="grid grid-cols-1 gap-3 sm:grid-cols-[minmax(0,1fr)_auto]">
              <input
                className="app-input"
                type="number"
                placeholder="Student ID"
                value={studentId}
                onChange={(event) => setStudentId(event.target.value)}
              />
              <button className="app-btn-secondary w-full sm:w-auto" onClick={loadStudent}>Load Student</button>
            </div>
          </div>
        </div>

        <div className="border-t border-slate-700/60 pt-4">
          <p className="mb-3 text-xs font-semibold uppercase tracking-wider text-slate-400">Export</p>
          <div className="grid grid-cols-1 gap-3 sm:grid-cols-2 md:max-w-md md:ml-auto">
            <button className="app-btn-secondary w-full" onClick={downloadExcel}>Export Excel</button>
            <button className="app-btn-secondary w-full" onClick={downloadPdf}>Export PDF</button>
          </div>
        </div>
      </div>

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

      <div className="app-table-wrap">
        <table className="app-table">
          <thead>
            <tr>
              <th>Student</th>
              <th>Roll</th>
              <th>Subject</th>
              <th>Faculty</th>
              <th>Date</th>
              <th>Time</th>
            </tr>
          </thead>
          <tbody>
            {rows.map((row) => (
              <tr key={row.id}>
                <td>{row.studentName}</td>
                <td>{row.rollNumber}</td>
                <td>{row.subjectName}</td>
                <td>{row.facultyName}</td>
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
