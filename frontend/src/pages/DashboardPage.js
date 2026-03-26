import React, { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { Line, LineChart, ResponsiveContainer, Tooltip, XAxis, YAxis } from "recharts";
import api from "../api/client";

export default function DashboardPage() {
  const navigate = useNavigate();
  const [summary, setSummary] = useState({ totalStudents: 0, todayAttendance: 0, attendancePercentage: 0 });
  const [chartData, setChartData] = useState([]);
  const [error, setError] = useState("");

  useEffect(() => {
    const fetchData = async () => {
      try {
        setError("");
        const [summaryResponse, chartResponse] = await Promise.all([
          api.get("/api/dashboard/summary"),
          api.get("/api/dashboard/chart")
        ]);
        setSummary(summaryResponse.data);
        setChartData(
          Object.entries(chartResponse.data).map(([date, count]) => ({ date: date.slice(5), count }))
        );
      } catch (err) {
        const status = err?.response?.status;
        if (!status) {
          setError("Cannot connect to server. Please make sure backend is running.");
        } else if (status === 401 || status === 403) {
          setError("Your session expired. Please login again.");
        } else {
          setError("Failed to load dashboard data.");
        }
      }
    };

    fetchData();
  }, []);

  return (
    <div className="space-y-6">
      <h2 className="app-title">Dashboard</h2>
      <p className="app-subtitle">Live overview of student activity and attendance trends.</p>
      <button
        className="app-btn-primary"
        onClick={() => navigate("/students")}
      >
        Student Details
      </button>
      {error && (
        <div className="app-alert-error">
          {error}
        </div>
      )}
      <div className="grid gap-4 md:grid-cols-3">
        <div className="app-card">
          <p className="text-sm text-slate-400">Total Students</p>
          <h3 className="mt-2 text-3xl font-semibold text-cyan-200">{summary.totalStudents}</h3>
        </div>
        <div className="app-card">
          <p className="text-sm text-slate-400">Today Attendance</p>
          <h3 className="mt-2 text-3xl font-semibold text-indigo-200">{summary.todayAttendance}</h3>
        </div>
        <div className="app-card">
          <p className="text-sm text-slate-400">Attendance %</p>
          <h3 className="mt-2 text-3xl font-semibold text-fuchsia-200">{summary.attendancePercentage}%</h3>
        </div>
      </div>

      <div className="app-card">
        <h3>Last 7 Days Attendance</h3>
        <ResponsiveContainer width="100%" height={280}>
          <LineChart data={chartData}>
            <XAxis dataKey="date" />
            <YAxis allowDecimals={false} />
            <Tooltip />
            <Line type="monotone" dataKey="count" stroke="#4f46e5" strokeWidth={3} />
          </LineChart>
        </ResponsiveContainer>
      </div>
    </div>
  );
}
