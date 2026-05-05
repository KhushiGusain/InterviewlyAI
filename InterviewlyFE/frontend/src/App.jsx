import { Navigate, Route, Routes } from "react-router-dom";
import DashboardPage from "./pages/dashboard";
import InterviewPage from "./pages/interview";
import InterviewsPage from "./pages/interviews";
import LoginPage from "./pages/login";
import ReportsPage from "./pages/reports";
import SignupPage from "./pages/signup";

function isAuthenticated() {
  return Boolean(localStorage.getItem("token"));
}

function RootRedirect() {
  return <Navigate to={isAuthenticated() ? "/dashboard" : "/login"} replace />;
}

function ProtectedRoute({ children }) {
  if (!isAuthenticated()) {
    return <Navigate to="/login" replace />;
  }
  return children;
}

function PublicOnlyRoute({ children }) {
  if (isAuthenticated()) {
    return <Navigate to="/dashboard" replace />;
  }
  return children;
}

function App() {
  return (
    <Routes>
      <Route path="/" element={<RootRedirect />} />
      <Route
        path="/dashboard"
        element={(
          <ProtectedRoute>
            <DashboardPage />
          </ProtectedRoute>
        )}
      />
      <Route
        path="/interviews"
        element={(
          <ProtectedRoute>
            <InterviewsPage />
          </ProtectedRoute>
        )}
      />
      <Route
        path="/interview/:id"
        element={(
          <ProtectedRoute>
            <InterviewPage />
          </ProtectedRoute>
        )}
      />
      <Route
        path="/reports/:id"
        element={(
          <ProtectedRoute>
            <ReportsPage />
          </ProtectedRoute>
        )}
      />
      <Route path="/interview" element={<Navigate to="/dashboard" replace />} />
      <Route
        path="/signup"
        element={(
          <PublicOnlyRoute>
            <SignupPage />
          </PublicOnlyRoute>
        )}
      />
      <Route
        path="/login"
        element={(
          <PublicOnlyRoute>
            <LoginPage />
          </PublicOnlyRoute>
        )}
      />
      <Route path="*" element={<Navigate to="/" replace />} />
    </Routes>
  );
}

export default App;
