import { Navigate, Route, Routes } from "react-router-dom";
import Layout from "./components/Layout";
import ProtectedRoute from "./components/ProtectedRoute";
import { useAuth } from "./context/AuthContext";
import Auth from "./pages/Auth";
import Dashboard from "./pages/Dashboard";
import Subjects from "./pages/Subjects";
import SubjectDetail from "./pages/SubjectDetail";
import Topic from "./pages/Topic";
import Chat from "./pages/Chat";
import QuizStart from "./pages/QuizStart";
import QuizRun from "./pages/QuizRun";
import Progress from "./pages/Progress";
import InterviewVault from "./pages/InterviewVault";

export default function App() {
  const { user } = useAuth();
  return (
    <Routes>
      <Route path="/login" element={user ? <Navigate to="/" replace /> : <Auth mode="login" />} />
      <Route path="/signup" element={user ? <Navigate to="/" replace /> : <Auth mode="signup" />} />

      <Route element={<ProtectedRoute><Layout /></ProtectedRoute>}>
        <Route index element={<Dashboard />} />
        <Route path="subjects" element={<Subjects />} />
        <Route path="subjects/:id" element={<SubjectDetail />} />
        <Route path="subjects/:id/topics/:topicId" element={<Topic />} />
        <Route path="interview-vault" element={<InterviewVault />} />
        <Route path="chat" element={<Chat />} />
        <Route path="quiz" element={<QuizStart />} />
        <Route path="quiz/:id" element={<QuizRun />} />
        <Route path="progress" element={<Progress />} />
      </Route>

      <Route path="*" element={<Navigate to="/" replace />} />
    </Routes>
  );
}
