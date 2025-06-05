import React, { useState, useEffect } from "react";
import { addDoc, collection, Timestamp } from "firebase/firestore";
import { db, auth } from "../firebase-config";
import { useNavigate } from "react-router-dom";

function CreatePost({ isAuth }) {
  const [title, setTitle] = useState("");
  const [postText, setPostText] = useState("");
  const [image, setImage] = useState(null);

  const postsCollectionRef = collection(db, "posts");
  const navigate = useNavigate();

  const uploadImageToCloudinary = async () => {
    if (!image) return "";

    const formData = new FormData();
    formData.append("file", image);
    formData.append("upload_preset", "blog_upload");

    try {
      const response = await fetch(
        "https://api.cloudinary.com/v1_1/do9vxkhgm/image/upload",
        {
          method: "POST",
          body: formData,
        }
      );

      const data = await response.json();

      if (!response.ok || !data.secure_url) {
        throw new Error("Image upload failed");
      }

      return data.secure_url;
    } catch (error) {
      console.error("Image upload error:", error);
      alert("Image upload failed. Please try again.");
      return "";
    }
  };

  const createPost = async () => {
    try {
      const imageUrl = await uploadImageToCloudinary();

      await addDoc(postsCollectionRef, {
        title,
        postText,
        imageUrl,
        createdAt: Timestamp.now(),
        author: {
          name: auth.currentUser.displayName,
          id: auth.currentUser.uid,
        },
      });

      navigate("/");
    } catch (err) {
      console.error("Error creating post:", err);
      alert("Post creation failed. Please check the console for more details.");
    }
  };

  useEffect(() => {
    if (!isAuth) {
      navigate("/login");
    }
  }, [isAuth, navigate]);

  return (
    <div className="createPostPage">
      <div className="cpContainer">
        <h1>Create A Post</h1>

        <div className="inputGp">
          <label>Title:</label>
          <input
            type="text"
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

        <div className="inputGp">
          <label>Image:</label>
          <input
            type="file"
            accept="image/*"
            onChange={(e) => setImage(e.target.files[0])}
          />
        </div>

        <button onClick={createPost}>Submit Post</button>
      </div>
    </div>
  );
}

export default CreatePost;
