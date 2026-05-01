import { Navigate, Route, Routes } from "react-router-dom";
import DashboardPage from "./pages/dashboard";
import InterviewPage from "./pages/interview";
import LoginPage from "./pages/login";
import ReportsPage from "./pages/reports";
import SignupPage from "./pages/signup";

function RootRedirect() {
  const token = localStorage.getItem("token");
  return <Navigate to={token ? "/dashboard" : "/dashboard"} replace />;
}

function App() {
  return (
    <Routes>
      <Route path="/" element={<RootRedirect />} />
      <Route path="/dashboard" element={<DashboardPage />} />
      <Route path="/interview/:id" element={<InterviewPage />} />
      <Route path="/reports/:id" element={<ReportsPage />} />
      <Route path="/signup" element={<SignupPage />} />
      <Route path="/login" element={<LoginPage />} />
    </Routes>
  );
}

export default App;
