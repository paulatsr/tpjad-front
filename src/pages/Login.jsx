import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { useSchool } from "../context/SchoolContext";
import { useAuth } from "../context/AuthContext";
import { motion } from "framer-motion";
import Button from "../components/ui/Button";
import { usersAPI } from "../services/api";

export default function Login() {
  const navigate = useNavigate();
  const { login: authLogin, user: authUser } = useAuth();
  const schoolContext = useSchool();
  const schoolLogin = schoolContext?.login;
  const [username, setUsername] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);
  const [signUpMode, setSignUpMode] = useState(false);
  
  // Sign up form fields
  const [signUpUsername, setSignUpUsername] = useState("");
  const [signUpPassword, setSignUpPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [registrationCode, setRegistrationCode] = useState("");

  const handleRealLogin = async (e) => {
    e.preventDefault();
    setError("");
    setLoading(true);

    try {
      console.log("Attempting login with:", username);
      const result = await authLogin(username, password);
      console.log("Login result:", result);
      if (result && result.success && result.user) {
        // Update school context with real user data
        if (schoolLogin) {
          schoolLogin(result.user);
        }
        // Navigate to dashboard without page refresh
        navigate("/");
      } else {
        setError(result?.error || "Login failed");
      }
    } catch (err) {
      console.error("Login error:", err);
      setError(err.message || "An error occurred during login");
    } finally {
      setLoading(false);
    }
  };

  const handleSignUp = async (e) => {
    e.preventDefault();
    setError("");
    
    // Validate passwords match
    if (signUpPassword !== confirmPassword) {
      setError("Passwords do not match");
      return;
    }
    
    // Validate password length
    if (signUpPassword.length < 6) {
      setError("Password must be at least 6 characters long");
      return;
    }
    
    setLoading(true);
    
    try {
      const result = await usersAPI.registerWithCode({
        username: signUpUsername,
        password: signUpPassword,
        registrationCode: registrationCode,
      });
      
      if (result) {
        // After successful registration, automatically log in
        const loginResult = await authLogin(signUpUsername, signUpPassword);
        if (loginResult.success && loginResult.user) {
          schoolLogin(loginResult.user);
          navigate("/");
        } else {
          setError("Registration successful! Please log in.");
          setSignUpMode(false);
          setSignUpUsername("");
          setSignUpPassword("");
          setConfirmPassword("");
          setRegistrationCode("");
        }
      }
    } catch (err) {
      setError(err.message || "Registration failed. Please check your registration code.");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="h-screen w-full flex bg-gradient-to-br from-slate-50 via-blue-50/30 to-purple-50/20 overflow-hidden relative">
      {/* Animated Background Blobs */}
      <div className="absolute inset-0 overflow-hidden pointer-events-none">
        <motion.div
          className="absolute -top-40 -right-40 w-80 h-80 bg-blue-400/20 rounded-full blur-3xl"
          animate={{
            x: [0, 50, 0],
            y: [0, -50, 0],
            scale: [1, 1.2, 1],
          }}
          transition={{
            duration: 20,
            repeat: Infinity,
            ease: "easeInOut",
          }}
        />
        <motion.div
          className="absolute -bottom-40 -left-40 w-80 h-80 bg-purple-400/20 rounded-full blur-3xl"
          animate={{
            x: [0, -50, 0],
            y: [0, 50, 0],
            scale: [1, 1.2, 1],
          }}
          transition={{
            duration: 20,
            repeat: Infinity,
            ease: "easeInOut",
            delay: 2,
          }}
        />
      </div>

      {/* Partea Stângă - Formular */}
      <div className="w-full lg:w-1/2 flex items-center justify-center p-6 lg:p-8 relative z-10">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.6 }}
          className="max-w-sm w-full"
        >
          <motion.div
            initial={{ opacity: 0, scale: 0.9 }}
            animate={{ opacity: 1, scale: 1 }}
            transition={{ duration: 0.5, delay: 0.1 }}
            className="mb-8"
          >
            <motion.div
              whileHover={{ scale: 1.05, rotate: 5 }}
              whileTap={{ scale: 0.95 }}
              className="w-14 h-14 bg-gradient-to-br from-blue-600 to-cyan-500 rounded-xl flex items-center justify-center text-white font-bold text-xl mb-5 shadow-lg shadow-blue-500/30"
            >
              G
            </motion.div>
            <h1 className="text-3xl font-bold mb-2 bg-gradient-to-r from-gray-900 to-gray-700 bg-clip-text text-transparent">
              Welcome Back
            </h1>
            <p className="text-gray-600 text-sm">Sign in to access your school portal</p>
          </motion.div>

          {/* Toggle between real and demo login */}
          <motion.div
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.4, delay: 0.2 }}
            className="mb-6 flex gap-1.5 bg-white/80 backdrop-blur-sm p-1 rounded-xl border border-gray-200/50 shadow-sm"
          >
            <motion.button
              onClick={() => setSignUpMode(false)}
              whileHover={{ scale: 1.02 }}
              whileTap={{ scale: 0.98 }}
              className={`flex-1 py-2 px-3 rounded-lg text-xs font-semibold transition-all duration-300 ${
                !signUpMode
                  ? "bg-gradient-to-r from-blue-600 to-cyan-500 text-white shadow-md shadow-blue-500/30"
                  : "text-gray-600 hover:text-gray-900 hover:bg-gray-50/50"
              }`}
            >
              Login
            </motion.button>
            <motion.button
              onClick={() => setSignUpMode(true)}
              whileHover={{ scale: 1.02 }}
              whileTap={{ scale: 0.98 }}
              className={`flex-1 py-2 px-3 rounded-lg text-xs font-semibold transition-all duration-300 ${
                signUpMode
                  ? "bg-gradient-to-r from-blue-600 to-cyan-500 text-white shadow-md shadow-blue-500/30"
                  : "text-gray-600 hover:text-gray-900 hover:bg-gray-50/50"
              }`}
            >
              Sign Up
            </motion.button>
          </motion.div>

          {!signUpMode ? (
            <motion.form
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.4, delay: 0.3 }}
              onSubmit={handleRealLogin}
              className="space-y-4"
            >
              {error && (
                <motion.div
                  initial={{ opacity: 0, scale: 0.95 }}
                  animate={{ opacity: 1, scale: 1 }}
                  className="p-3 bg-red-50/80 backdrop-blur-sm border border-red-200 text-red-700 rounded-xl text-xs font-medium shadow-sm"
                >
                  {error}
                </motion.div>
              )}

              <motion.div
                initial={{ opacity: 0, x: -10 }}
                animate={{ opacity: 1, x: 0 }}
                transition={{ duration: 0.4, delay: 0.4 }}
                className="space-y-1.5"
              >
                <label className="text-xs font-semibold text-gray-700">Username</label>
                <input
                  type="text"
                  placeholder="Enter your username"
                  className="w-full px-4 py-2.5 rounded-xl border border-gray-200 bg-white/80 backdrop-blur-sm outline-none focus:border-blue-500 focus:ring-2 focus:ring-blue-500/20 transition-all duration-300 text-sm text-gray-900 placeholder:text-gray-400 shadow-sm hover:shadow-md"
                  value={username}
                  onChange={(e) => setUsername(e.target.value)}
                  required
                />
              </motion.div>

              <motion.div
                initial={{ opacity: 0, x: -10 }}
                animate={{ opacity: 1, x: 0 }}
                transition={{ duration: 0.4, delay: 0.5 }}
                className="space-y-1.5"
              >
                <label className="text-xs font-semibold text-gray-700">Password</label>
                <input
                  type="password"
                  placeholder="Enter your password"
                  className="w-full px-4 py-2.5 rounded-xl border border-gray-200 bg-white/80 backdrop-blur-sm outline-none focus:border-blue-500 focus:ring-2 focus:ring-blue-500/20 transition-all duration-300 text-sm text-gray-900 placeholder:text-gray-400 shadow-sm hover:shadow-md"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  required
                />
              </motion.div>

              <motion.div
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.4, delay: 0.6 }}
              >
                <Button
                  type="submit"
                  variant="primary"
                  className="w-full"
                  disabled={loading}
                >
                  {loading ? "Signing in..." : "Sign In"}
                </Button>
              </motion.div>
            </motion.form>
          ) : (
            <motion.form
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.4, delay: 0.3 }}
              onSubmit={handleSignUp}
              className="space-y-4"
            >
              {error && (
                <motion.div
                  initial={{ opacity: 0, scale: 0.95 }}
                  animate={{ opacity: 1, scale: 1 }}
                  className="p-3 bg-red-50/80 backdrop-blur-sm border border-red-200 text-red-700 rounded-xl text-xs font-medium shadow-sm"
                >
                  {error}
                </motion.div>
              )}

              <motion.div
                initial={{ opacity: 0, x: -10 }}
                animate={{ opacity: 1, x: 0 }}
                transition={{ duration: 0.4, delay: 0.4 }}
                className="space-y-1.5"
              >
                <label className="text-xs font-semibold text-gray-700">Username</label>
                <input
                  type="text"
                  placeholder="Choose a username"
                  className="w-full px-4 py-2.5 rounded-xl border border-gray-200 bg-white/80 backdrop-blur-sm outline-none focus:border-blue-500 focus:ring-2 focus:ring-blue-500/20 transition-all duration-300 text-sm text-gray-900 placeholder:text-gray-400 shadow-sm hover:shadow-md"
                  value={signUpUsername}
                  onChange={(e) => setSignUpUsername(e.target.value)}
                  required
                />
              </motion.div>

              <motion.div
                initial={{ opacity: 0, x: -10 }}
                animate={{ opacity: 1, x: 0 }}
                transition={{ duration: 0.4, delay: 0.5 }}
                className="space-y-1.5"
              >
                <label className="text-xs font-semibold text-gray-700">Password</label>
                <input
                  type="password"
                  placeholder="Enter your password"
                  className="w-full px-4 py-2.5 rounded-xl border border-gray-200 bg-white/80 backdrop-blur-sm outline-none focus:border-blue-500 focus:ring-2 focus:ring-blue-500/20 transition-all duration-300 text-sm text-gray-900 placeholder:text-gray-400 shadow-sm hover:shadow-md"
                  value={signUpPassword}
                  onChange={(e) => setSignUpPassword(e.target.value)}
                  required
                />
              </motion.div>

              <motion.div
                initial={{ opacity: 0, x: -10 }}
                animate={{ opacity: 1, x: 0 }}
                transition={{ duration: 0.4, delay: 0.6 }}
                className="space-y-1.5"
              >
                <label className="text-xs font-semibold text-gray-700">Confirm Password</label>
                <input
                  type="password"
                  placeholder="Confirm your password"
                  className="w-full px-4 py-2.5 rounded-xl border border-gray-200 bg-white/80 backdrop-blur-sm outline-none focus:border-blue-500 focus:ring-2 focus:ring-blue-500/20 transition-all duration-300 text-sm text-gray-900 placeholder:text-gray-400 shadow-sm hover:shadow-md"
                  value={confirmPassword}
                  onChange={(e) => setConfirmPassword(e.target.value)}
                  required
                />
              </motion.div>

              <motion.div
                initial={{ opacity: 0, x: -10 }}
                animate={{ opacity: 1, x: 0 }}
                transition={{ duration: 0.4, delay: 0.7 }}
                className="space-y-1.5"
              >
                <label className="text-xs font-semibold text-gray-700">Registration Code</label>
                <input
                  type="text"
                  placeholder="Enter your registration code"
                  className="w-full px-4 py-2.5 rounded-xl border border-gray-200 bg-white/80 backdrop-blur-sm outline-none focus:border-blue-500 focus:ring-2 focus:ring-blue-500/20 transition-all duration-300 text-sm text-gray-900 placeholder:text-gray-400 shadow-sm hover:shadow-md"
                  value={registrationCode}
                  onChange={(e) => setRegistrationCode(e.target.value)}
                  required
                />
              </motion.div>

              <motion.div
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.4, delay: 0.8 }}
              >
                <Button
                  type="submit"
                  variant="primary"
                  className="w-full"
                  disabled={loading}
                >
                  {loading ? "Creating account..." : "Sign Up"}
                </Button>
              </motion.div>
            </motion.form>
          )}
        </motion.div>
      </div>

      {/* Partea Dreaptă - Decorativ */}
      <div className="hidden lg:flex w-1/2 items-center justify-center p-8 relative z-10">
        <motion.div
          initial={{ opacity: 0, scale: 0.8 }}
          animate={{ opacity: 1, scale: 1 }}
          transition={{ duration: 0.8, delay: 0.2 }}
          className="text-center"
        >
          <motion.div
            animate={{
              y: [0, -10, 0],
              rotate: [0, 5, -5, 0],
            }}
            transition={{
              duration: 4,
              repeat: Infinity,
              ease: "easeInOut",
            }}
            className="text-7xl mb-6 filter drop-shadow-2xl"
          >
            🎓
          </motion.div>
          <h2 className="text-2xl font-bold bg-gradient-to-r from-gray-800 to-gray-600 bg-clip-text text-transparent mb-2">
            Education Portal
          </h2>
          <p className="text-sm text-gray-600">Manage your school with ease</p>
        </motion.div>
      </div>
    </div>
  );
}
