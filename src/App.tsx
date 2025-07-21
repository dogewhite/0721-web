import { Routes, Route, Navigate } from "react-router-dom";
import Home from "@/pages/Home";
import Upload from "@/pages/Upload";
import Analysis from "@/pages/Analysis";
import JDAnalysis from "@/pages/JDAnalysis";
import Talent from "@/pages/Talent";
import ComponentLibrary from "@/pages/ComponentLibrary";
import ProjectManagement from "@/pages/ProjectManagement";
import Layout from "@/components/Layout";
import { createContext, useState } from "react";
// 新增导入
import ResumeUpload from "@/pages/ResumeUpload";
import ResumeDraftList from "@/pages/ResumeDraftList";
import ResumeDraftDetail from "@/pages/ResumeDraftDetail";
import Login from "@/pages/Login";

export const AuthContext = createContext({
  isAuthenticated: false,
  setIsAuthenticated: (value: boolean) => {},
  setUsername: (value: string) => {},
  logout: () => {},
  username: "",
});

export default function App() {
  const [isAuthenticated, setIsAuthenticated] = useState(!!localStorage.getItem("token"));
  const [username, setUsername] = useState(localStorage.getItem("username") || "");

  const logout = () => {
    setIsAuthenticated(false);
    setUsername("");
    localStorage.removeItem("token");
    localStorage.removeItem("username");
  };

  return (
    <AuthContext.Provider
      value={{ isAuthenticated, setIsAuthenticated, setUsername, logout, username }}
    >
      <Layout>
        <Routes>
          <Route path="/login" element={<Login />} />
          <Route
            path="*"
            element={
              isAuthenticated ? (
                <>
                  <Routes>
                    <Route path="/" element={<Navigate to="/jd-analysis" replace />} />
                    <Route path="/jd-analysis" element={<JDAnalysis />} />
                    <Route path="/project-management" element={<ProjectManagement />} />
                    <Route path="/upload" element={<Upload />} />
                    <Route path="/analysis" element={<Analysis />} />
                    <Route path="/talent" element={<Talent />} />
                    <Route path="/component-library" element={<ComponentLibrary />} />
                    <Route path="/resume/upload" element={<ResumeUpload />} />
                    <Route path="/resume/draft" element={<ResumeDraftList />} />
                    <Route path="/resume/draft/:id" element={<ResumeDraftDetail />} />
                  </Routes>
                </>
              ) : (
                <Navigate to="/login" replace />
              )
            }
          />
        </Routes>
      </Layout>
    </AuthContext.Provider>
  );
} 