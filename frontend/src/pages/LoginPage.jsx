import React, { useContext, useState } from "react";
import assets from "../assets/assets";
import { AuthContext } from "../context/AuthContext";

const LoginPage = () => {

  const [currState, setCurrState] = useState("Signup");
  const [fullName, setFullName] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [bio, setBio] = useState("");

  const { login, isLoading } = useContext(AuthContext);
  const [errorMessage, setErrorMessage] = useState("");

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
    <div className="min-h-screen bg-cover bg-center flex items-center justify-center gap-8 sm:justify-evenly max-sm:flex-col backdrop-blur-2xl">

      {/* Logo */}
      <img
        src={assets.logo_big}
        alt="logo"
        className="w-[min(30vh,250px)]"
      />

      {/* Form */}
      <form
        onSubmit={onSubmitHandler}
        className="border-2 bg-white/8 text-white border-gray-500 p-6 flex flex-col gap-6 rounded-lg shadow-lg"
      >

        <h2 className="font-medium text-2xl">
          {currState}
        </h2>

        {/* Full Name */}
        {currState === "Signup" && (
          <input
            type="text"
            placeholder="Full Name"
            value={fullName}
            onChange={(e) => setFullName(e.target.value)}
            className="p-2 border border-gray-500 rounded-md focus:outline-none"
            required
          />
        )}

        {/* Email */}
        <input
          type="email"
          placeholder="Email Address"
          value={email}
          onChange={(e) => setEmail(e.target.value)}
          className="p-2 border border-gray-500 rounded-md focus:outline-none focus:ring-2 focus:ring-indigo-500"
          required
        />

        {/* Password */}
        <input
          type="password"
          placeholder="Password"
          value={password}
          onChange={(e) => setPassword(e.target.value)}
          className="p-2 border border-gray-500 rounded-md focus:outline-none focus:ring-2 focus:ring-indigo-500"
          required
        />

        {/* Bio */}
        {currState === "Signup" && (
          <textarea
            rows={4}
            value={bio}
            onChange={(e) => setBio(e.target.value)}
            placeholder="Short Bio"
            className="p-2 border border-gray-500 rounded-md focus:outline-none focus:ring-2 focus:ring-indigo-500"
            required
          />
        )}

        {/* Submit */}
        <button
          type="submit"
          disabled={isLoading}
          className="bg-indigo-500 hover:bg-indigo-600 disabled:bg-indigo-400 text-white font-bold py-2 px-4 rounded-md disabled:cursor-not-allowed"
        >
          {isLoading ? "Processing..." : (currState === "Signup" ? "Create Account" : "Login")}
        </button>

        {/* Error message */}
        {errorMessage && (
          <p className="text-red-300 text-sm mt-2" role="alert">
            {errorMessage}
          </p>
        )}

        {/* Terms */}
        <div className="flex items-center gap-2 text-sm">
          <input type="checkbox" />
          <p>Agree to the terms of use & privacy policy.</p>
        </div>

        {/* Switch Login/Signup */}
        <div className="flex flex-col gap-2">

          {currState === "Signup" ? (
            <p className="text-sm text-gray-300">
              Already have an account?{" "}
              <span
                onClick={() => {
                  setCurrState("Login");
                }}
                className="text-indigo-400 cursor-pointer"
              >
                Login here
              </span>
            </p>
          ) : (
            <p className="text-sm text-gray-300">
              Create an account{" "}
              <span
                onClick={() => {
                  setCurrState("Signup");
                }}
                className="text-indigo-400 cursor-pointer"
              >
                Click here
              </span>
            </p>
          )}

        </div>

      </form>

    </div>
  );
};

export default LoginPage;