import { Routes, Route, Navigate } from "react-router-dom";
import ProtectedLayout from "@/components/ProtectedLayout";
import Home from "@/pages/Home";
import Login from "@/pages/Login";
import LoginTeacher from "@/pages/LoginTeacher";
import LoginAdmin from "@/pages/LoginAdmin";
import Dashboard from "@/pages/Dashboard";
import Classes from "@/pages/Classes";
import ClassDetail from "@/pages/ClassDetail";
import Students from "@/pages/Students";
import StudentDetail from "@/pages/StudentDetail";
import Teachers from "@/pages/Teachers";
import ScanAttendance from "@/pages/ScanAttendance";

export default function App() {
  return (
    <Routes>
      <Route path="/" element={<Home />} />
      <Route path="/login" element={<Login />} />
      <Route path="/login/teacher" element={<LoginTeacher />} />
      <Route path="/login/admin" element={<LoginAdmin />} />
      <Route
        path="/dashboard"
        element={
          <ProtectedLayout>
            <Dashboard />
          </ProtectedLayout>
        }
      />
      <Route
        path="/classes"
        element={
          <ProtectedLayout>
            <Classes />
          </ProtectedLayout>
        }
      />
      <Route
        path="/classes/:id"
        element={
          <ProtectedLayout>
            <ClassDetail />
          </ProtectedLayout>
        }
      />
      <Route
        path="/students"
        element={
          <ProtectedLayout>
            <Students />
          </ProtectedLayout>
        }
      />
      <Route
        path="/students/:id"
        element={
          <ProtectedLayout>
            <StudentDetail />
          </ProtectedLayout>
        }
      />
      <Route
        path="/teachers"
        element={
          <ProtectedLayout>
            <Teachers />
          </ProtectedLayout>
        }
      />
      <Route
        path="/scan"
        element={
          <ProtectedLayout>
            <ScanAttendance />
          </ProtectedLayout>
        }
      />
      <Route path="*" element={<Navigate to="/" replace />} />
    </Routes>
  );
}
