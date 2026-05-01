import { Navigate, Route, Routes } from "react-router-dom";
import LoginPage from "./pages/login";
import SignupPage from "./pages/signup";

function RootRedirect() {
  const token = localStorage.getItem("token");
  return <Navigate to={token ? "/signup" : "/login"} replace />;
}

function App() {
  return (
    <Routes>
      <Route path="/" element={<RootRedirect />} />
      <Route path="/signup" element={<SignupPage />} />
      <Route path="/login" element={<LoginPage />} />
    </Routes>
  );
}

export default App;
