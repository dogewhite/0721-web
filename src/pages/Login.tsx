import { useState, useContext } from "react";
import { useNavigate } from "react-router-dom";
import { AuthContext } from "@/App";

export default function Login() {
  const [username, setUsernameInput] = useState("");
  const [password, setPassword] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const navigate = useNavigate();
  const { setIsAuthenticated, setUsername } = useContext(AuthContext);

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError("");
    
    try {
      const formData = new FormData();
      formData.append("username", username);
      formData.append("password", password);
      
      console.log("发送登录请求...");
      const res = await fetch("/api/login", {
        method: "POST",
        body: formData,
      });
      
      console.log("响应状态:", res.status);
      console.log("响应头:", Object.fromEntries(res.headers.entries()));
      
      if (!res.ok) {
        const errorText = await res.text();
        console.error("登录失败:", errorText);
        setError(`登录失败: ${res.status} - ${errorText}`);
        setLoading(false);
        return;
      }
      
      // 检查响应内容类型
      const contentType = res.headers.get("content-type");
      console.log("响应内容类型:", contentType);
      
      let data;
      if (contentType && contentType.includes("application/json")) {
        data = await res.json();
      } else {
        const text = await res.text();
        console.log("响应文本:", text);
        try {
          data = JSON.parse(text);
        } catch (parseError) {
          console.error("JSON解析失败:", parseError);
          setError("服务器响应格式错误");
          setLoading(false);
          return;
        }
      }
      
      console.log("登录成功，响应数据:", data);
      
      if (data.access_token && data.username) {
        localStorage.setItem("token", data.access_token);
        localStorage.setItem("username", data.username);
        setIsAuthenticated(true);
        setUsername(data.username);
        navigate("/");
      } else {
        console.error("响应数据缺少必要字段:", data);
        setError("登录响应数据格式错误");
      }
    } catch (err) {
      console.error("登录请求失败:", err);
      setError("网络错误，请重试");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="flex items-center justify-center min-h-screen bg-gray-100">
      <form
        onSubmit={handleLogin}
        className="bg-white p-8 rounded shadow-md w-80 flex flex-col gap-4"
      >
        <h2 className="text-2xl font-bold mb-4 text-center">用户登录</h2>
        <input
          className="border p-2 rounded"
          type="text"
          placeholder="用户名"
          value={username}
          onChange={e => setUsernameInput(e.target.value)}
          required
        />
        <input
          className="border p-2 rounded"
          type="password"
          placeholder="密码"
          value={password}
          onChange={e => setPassword(e.target.value)}
          required
        />
        {error && <div className="text-red-500 text-sm">{error}</div>}
        <button
          type="submit"
          className="bg-blue-600 text-white p-2 rounded hover:bg-blue-700 disabled:opacity-50"
          disabled={loading}
        >
          {loading ? "登录中..." : "登录"}
        </button>
      </form>
    </div>
  );
} 