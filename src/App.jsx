import "./App.css";
import { BrowserRouter as Router, Routes, Route, Link } from "react-router-dom";
import Home from "./pages/Home";
import CreatePost from "./pages/CreatePost";
import Login from "./pages/Login";
import { useState } from "react";
import { signOut } from "firebase/auth";
import { auth } from "./firebase-config";
import EditPost from "./pages/EditPost";
import MyPosts from "./pages/MyPosts";

function App() {
  const [isAuth, setIsAuth] = useState(localStorage.getItem("isAuth"));
  const [dropdownVisible, setDropdownVisible] = useState(false);

  const signUserOut = () => {
    signOut(auth).then(() => {
      localStorage.clear();
      setIsAuth(false);
      window.location.pathname = "/login";
    });
  };

  return (
    <Router>
      <nav className="navbar">
        <div className="left-nav">
          {/* Removed search input */}
        </div>

        {isAuth && (
          <>
            <Link to="/" className="navLink" style={{ marginRight: "1rem", fontWeight: "bold", color: "white" , textDecoration: "none" }}>
              Home
            </Link>
            <Link to="/myposts" className="navLink" style={{ marginRight: "1rem", fontWeight: "bold", color: "white", textDecoration: "none"  }}>
              My Posts
            </Link>
          </>
        )}

        <div className="right-nav">
          {!isAuth ? (
            <button>
              <Link to="/login">Login</Link>
              <div className="arrow-wrapper">
                <div className="arrow"></div>
              </div>
            </button>
          ) : (
            <>
              <Link to="/createpost" className="nav-link">Create Post</Link>

              <div className="profile-wrapper">
                <div
                  className="profile-circle"
                  onClick={() => setDropdownVisible((prev) => !prev)}
                >
                  {auth.currentUser?.displayName?.[0] || "U"}
                </div>

                {dropdownVisible && (
                  <div className="profile-dropdown">
                    <div className="username">
                      {auth.currentUser?.displayName || "Unknown User"}
                    </div>
                    <button className="logout-btn" onClick={signUserOut}>
                      Logout
                    </button>
                  </div>
                )}
              </div>
            </>
          )}
        </div>
      </nav>

      <Routes>
        <Route path="/" element={<Home isAuth={isAuth} />} />
        <Route path="/createpost" element={<CreatePost isAuth={isAuth} />} />
        <Route path="/login" element={<Login setIsAuth={setIsAuth} />} />
        <Route path="/edit/:postId" element={<EditPost isAuth={isAuth} />} />
        <Route path="/myposts" element={<MyPosts isAuth={isAuth} />} />
      </Routes>
    </Router>
  );
}

export default App;
