import React from "react";
import { BrowserRouter as Router, Route, Routes, Navigate } from "react-router-dom";
import Login from './pages/Login';
import SignUp from './pages/SignUp';
import AuthHome from './pages/AuthHome';
import Profile from './pages/Profile';
import EditProfile from './pages/EditProfile';
import { Helmet } from "react-helmet";
import ToastProvider from './components/ToastProvider'
import ProtectedRoute from './components/ProtectedRoute';
import MathTools from "./pages/MathTools";
import Chats from "./components/Chats";
import Questions from "./pages/Questions";
import Answer from "./pages/Answer";
import CanvasPage from "./pages/CanvasPage";
import PracticeCanvasPage from "./pages/PracticeCanvasPage";
import ForgetPassword from "./pages/ForgetPassword";

function App() {

  

  return (
    <>
      <Helmet>
        <meta charSet="utf-8" />
        <title>MathCraft</title>
        <link rel="canonical" href="http://mysite.com/example" />
      </Helmet>
      
      <ToastProvider>
      <Router>
        <Routes>
          {/* Auth-only mode: ONLY Login + SignUp enabled */}
          <Route path="/login" element={<Login />} />
          <Route path="/signup" element={<SignUp />} />

          {/* Auth-only "home" after login: show navbar only */}
          <Route element={<ProtectedRoute />}>
            <Route path="/" element={<AuthHome />} />
            <Route path="/profile" element={<Profile />} />
            <Route path="/edit-profile" element={<EditProfile />} />
            <Route path="/math-tools" element={<MathTools/>}/>
            <Route path="/chats" element={<Chats/>}/>
            <Route path="/canvas" element={<CanvasPage/>}/>
            <Route path="/questions" element={<Questions/>}/>
            <Route path="/answer/:questionId" element={<Answer/>}/>
            <Route path="/practice/:questionId" element={<PracticeCanvasPage/>}/>
          </Route>

          {/* Redirect everything else to login */}
          <Route path="*" element={<Navigate to="/login" replace />} />
          <Route path="/forget-password" element={<ForgetPassword />} />
        </Routes>
      </Router>
      </ToastProvider>
    </>
  );
}

export default App;
