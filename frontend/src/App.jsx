import React, { useContext, lazy, Suspense } from "react";
import { Navigate, Route, Routes } from "react-router-dom";
import HomePage from "./pages/HomePage";
import { Toaster } from "react-hot-toast";
import { AuthContext } from "./context/AuthContext";

// Lazy load ProfilePage
const ProfilePage = lazy(() => import("./pages/ProfilePage"));
const LoginPage = lazy(() => import("./pages/LoginPage"));

const App = () => {

  const { authUser } = useContext(AuthContext);

  return (
    <div className="bg-[url('./src/assets/bgImage.svg')] bg-contain min-h-screen">

      <Toaster />

<<<<<<< HEAD
      <Suspense fallback={<div className="min-h-screen flex items-center justify-center">Loading...</div>}>
        <Routes>
          <Route
            path="/"
            element={authUser ? <HomePage /> : <Navigate to="/login" />}
          />

          <Route
            path="/profile"
            element={authUser ? <ProfilePage /> : <Navigate to="/login" />}
          />

          <Route
            path="/login"
            element={!authUser ? <LoginPage /> : <Navigate to="/" />}
          />
        </Routes>
      </Suspense>
=======
      <Routes>

        <Route
          path="/"
          element={authUser ? <HomePage /> : <Navigate to="/login" replace />}
        />

        <Route
          path="/profile"
          element={authUser ? <ProfilePage /> : <Navigate to="/login" replace />}
        />

        <Route
          path="/login"
          element={!authUser ? <LoginPage /> : <Navigate to="/" replace />}
        />

      </Routes>

>>>>>>> d0590308b28233ab2211eb13903613211721ba1c
    </div>
  );
};

export default App;