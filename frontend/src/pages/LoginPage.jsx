import React, { useContext, useState } from "react";
import assets from "../assets/assets";
import { AuthContext } from "../context/AuthContext";

const LoginPage = () => {
  const [currState, setCurrState] = useState("Login");
  const [fullName, setFullName] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [bio, setBio] = useState("");
  const [errorMessage, setErrorMessage] = useState("");

  const { login, isLoading } = useContext(AuthContext);

  const onSubmitHandler = async (event) => {
    event.preventDefault();

    const result = await login(currState.toLowerCase(), { fullName, email, password, bio });

    if (!result.success) {
      setErrorMessage(result.message);
      return;
    }

    setErrorMessage("");
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-indigo-950 via-slate-950 to-slate-900 flex flex-col items-center justify-center px-4 py-10">
      <div className="max-w-[1100px] w-full grid grid-cols-1 lg:grid-cols-2 gap-10 items-center">
        <div className="flex flex-col items-center gap-4 text-center">
          <img src={assets.logo_big} alt="logo" className="w-40" />
          <h1 className="text-3xl font-semibold text-white">Welcome to RealTimeChat</h1>
          <p className="text-sm text-white/60 max-w-md">
            Connect instantly with friends. Send messages, images, and see who&apos;s online in real time.
          </p>
          <div className="mt-6 flex gap-3">
            <span
              onClick={() => setCurrState("Login")}
              className={`cursor-pointer rounded-full px-4 py-2 text-sm font-medium transition ${
                currState === "Login" ? "bg-indigo-500 text-white" : "bg-white/10 text-white/70"
              }`}
            >
              Login
            </span>
            <span
              onClick={() => setCurrState("Signup")}
              className={`cursor-pointer rounded-full px-4 py-2 text-sm font-medium transition ${
                currState === "Signup" ? "bg-indigo-500 text-white" : "bg-white/10 text-white/70"
              }`}
            >
              Signup
            </span>
          </div>
        </div>

        <form
          onSubmit={onSubmitHandler}
          className="relative rounded-3xl bg-white/10 border border-white/20 backdrop-blur-lg p-8 shadow-lg"
        >
          <h2 className="text-xl font-semibold text-white mb-3">{currState}</h2>

          {errorMessage && (
            <div className="mb-4 rounded-xl bg-red-500/20 border border-red-500/30 px-4 py-3 text-sm text-red-100">
              {errorMessage}
            </div>
          )}

          {currState === "Signup" && (
            <input
              type="text"
              placeholder="Full Name"
              value={fullName}
              onChange={(e) => setFullName(e.target.value)}
              className="w-full mb-3 rounded-xl bg-white/10 px-4 py-3 text-white placeholder-white/50 outline-none focus:ring-2 focus:ring-indigo-400"
              required
            />
          )}

          <input
            type="email"
            placeholder="Email Address"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            className="w-full mb-3 rounded-xl bg-white/10 px-4 py-3 text-white placeholder-white/50 outline-none focus:ring-2 focus:ring-indigo-400"
            required
          />

          <input
            type="password"
            placeholder="Password"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            className="w-full mb-3 rounded-xl bg-white/10 px-4 py-3 text-white placeholder-white/50 outline-none focus:ring-2 focus:ring-indigo-400"
            required
          />

          {currState === "Signup" && (
            <textarea
              rows={4}
              value={bio}
              onChange={(e) => setBio(e.target.value)}
              placeholder="Short Bio"
              className="w-full mb-4 resize-none rounded-xl bg-white/10 px-4 py-3 text-white placeholder-white/50 outline-none focus:ring-2 focus:ring-indigo-400"
              required
            />
          )}

          <button
            type="submit"
            disabled={isLoading}
            className="w-full rounded-xl bg-gradient-to-r from-indigo-500 to-violet-500 py-3 text-sm font-semibold text-white shadow-lg shadow-indigo-500/25 hover:opacity-90 disabled:cursor-not-allowed disabled:opacity-50"
          >
            {isLoading ? "Processing..." : currState === "Signup" ? "Create Account" : "Login"}
          </button>

          <p className="mt-4 text-xs text-white/60">
            {currState === "Signup"
              ? "Already have an account?"
              : "Don’t have an account?"}{" "}
            <span
              onClick={() => setCurrState(currState === "Signup" ? "Login" : "Signup")}
              className="cursor-pointer text-white font-semibold"
            >
              {currState === "Signup" ? "Login" : "Sign up"}
            </span>
          </p>
        </form>
      </div>
    </div>
  );
};

export default LoginPage;