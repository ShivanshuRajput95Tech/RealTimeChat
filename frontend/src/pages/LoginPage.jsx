import React, { useContext, useState } from "react";
import assets from "../assets/assets";
import { AuthContext } from "../context/AuthContext";

const LoginPage = () => {

  const [currState, setCurrState] = useState("Signup");
  const [fullName, setFullName] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [bio, setBio] = useState("");
  const [isDataSubmitted, setIsDataSubmitted] = useState(false);

  const {login} = useContext(AuthContext)

  const onSubmitHandler = (event) => {
    event.preventDefault();

    if (currState === "Signup" && !isDataSubmitted) {
      setIsDataSubmitted(true);
      return;
    }
    login(currState==="Signup"? 'signup':'login',{fullName, email, password, bio})

    console.log({ fullName, email, password, bio });
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

        <h2 className="font-medium text-2xl flex justify-between items-center">
          {currState}

          {isDataSubmitted && (
            <img
              src={assets.arrow_icon}
              alt=""
              className="w-5 cursor-pointer"
              onClick={() => setIsDataSubmitted(false)}
            />
          )}
        </h2>

        {/* Full Name */}
        {currState === "Signup" && !isDataSubmitted && (
          <input
            type="text"
            placeholder="Full Name"
            value={fullName}
            onChange={(e) => setFullName(e.target.value)}
            className="p-2 border border-gray-500 rounded-md focus:outline-none"
            required
          />
        )}

        {/* Email + Password */}
        {!isDataSubmitted && (
          <>
            <input
              type="email"
              placeholder="Email Address"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              className="p-2 border border-gray-500 rounded-md focus:outline-none focus:ring-2 focus:ring-indigo-500"
              required
            />

            <input
              type="password"
              placeholder="Password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              className="p-2 border border-gray-500 rounded-md focus:outline-none focus:ring-2 focus:ring-indigo-500"
              required
            />
          </>
        )}

        {/* Bio */}
        {currState === "Signup" && !isDataSubmitted && (
          <textarea
            rows={4}
            value={bio}
            onChange={(e) => setBio(e.target.value)}
            placeholder="Short Bio"
            className="p-2 border border-gray-500 rounded-md focus:outline-none focus:ring-2 focus:ring-indigo-500"
          />
        )}

        {/* Submit */}
        <button
          type="submit"
          className="bg-indigo-500 hover:bg-indigo-600 text-white font-bold py-2 px-4 rounded-md"
        >
          {currState === "Signup" ? "Create Account" : "Login"}
        </button>

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
                  setIsDataSubmitted(false);
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
                  setIsDataSubmitted(false);
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