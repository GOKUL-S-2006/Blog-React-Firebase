import React, { useEffect, useState } from "react";
import { useParams, useNavigate } from "react-router-dom";
import { doc, getDoc, updateDoc } from "firebase/firestore";
import { db, auth } from "../firebase-config";

function EditPost({ isAuth }) {
  const { postId } = useParams();
  const navigate = useNavigate();

  const [title, setTitle] = useState("");
  const [postText, setPostText] = useState("");

  useEffect(() => {
    if (!isAuth) {
      navigate("/login");
    }

    const fetchPost = async () => {
      const postRef = doc(db, "posts", postId);
      const postSnap = await getDoc(postRef);
      if (postSnap.exists()) {
        const data = postSnap.data();

        // Only allow the author to edit
        if (data.author?.id !== auth.currentUser?.uid) {
          alert("You are not authorized to edit this post.");
          navigate("/");
          return;
        }

        setTitle(data.title || "");
        setPostText(data.postText || "");
      } else {
        alert("Post not found.");
        navigate("/");
      }
    };

    fetchPost();
  }, [postId, navigate, isAuth]);

  const updatePost = async () => {
    const postRef = doc(db, "posts", postId);
    await updateDoc(postRef, {
      title,
      postText,
    });

    alert("✅ Post updated!");
    navigate("/");
  };

  return (
    <div className="createPostPage">
      <div className="cpContainer">
        <h1>Edit Post</h1>
        <div className="inputGp">
          <label>Title:</label>
          <input
            placeholder="Title..."
            onChange={(event) => setTitle(event.target.value)}
            value={title}
          />
        </div>
        <div className="inputGp">
          <label>Post:</label>
          <textarea
            placeholder="Post..."
            onChange={(event) => setPostText(event.target.value)}
            value={postText}
          />
        </div>
        <button onClick={updatePost}>Update Post</button>
      </div>
    </div>
  );
}

export default EditPost;
