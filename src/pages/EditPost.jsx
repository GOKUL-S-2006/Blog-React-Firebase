import React, { useEffect, useState } from "react";
import { useParams, useNavigate } from "react-router-dom";
import { doc, getDoc, updateDoc } from "firebase/firestore";
import { db, auth } from "../firebase-config";

function EditPost({ isAuth }) {
  const { postId } = useParams();
  const navigate = useNavigate();

  const [title, setTitle] = useState("");
  const [postText, setPostText] = useState("");
  const [imageUrl, setImageUrl] = useState("");
  const [newImage, setNewImage] = useState(null);

  useEffect(() => {
    if (!isAuth) {
      navigate("/login");
    }

    const fetchPost = async () => {
      const postRef = doc(db, "posts", postId);
      const postSnap = await getDoc(postRef);

      if (postSnap.exists()) {
        const data = postSnap.data();

        if (data.author?.id !== auth.currentUser?.uid) {
          alert("You are not authorized to edit this post.");
          navigate("/");
          return;
        }

        setTitle(data.title || "");
        setPostText(data.postText || "");
        setImageUrl(data.imageUrl || "");
      } else {
        alert("Post not found.");
        navigate("/");
      }
    };

    fetchPost();
  }, [postId, navigate, isAuth]);

  const uploadImageToCloudinary = async () => {
    if (!newImage) return imageUrl;

    const formData = new FormData();
    formData.append("file", newImage);
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
      if (!response.ok || !data.secure_url) throw new Error("Image upload failed");

      return data.secure_url;
    } catch (err) {
      console.error("Image upload error:", err);
      alert("Failed to upload image.");
      return imageUrl;
    }
  };

  const updatePost = async () => {
    const uploadedImageUrl = await uploadImageToCloudinary();

    const postRef = doc(db, "posts", postId);
    await updateDoc(postRef, {
      title,
      postText,
      imageUrl: uploadedImageUrl,
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
            type="text"
            placeholder="Title..."
            value={title}
            onChange={(e) => setTitle(e.target.value)}
          />
        </div>

        <div className="inputGp">
          <label>Post:</label>
          <textarea
            placeholder="Post..."
            value={postText}
            onChange={(e) => setPostText(e.target.value)}
          />
        </div>

        <div className="inputGp">
          <label>Current Image:</label>
          {imageUrl && (
            <img
              src={imageUrl}
              alt="Post"
              style={{ maxWidth: "100%", maxHeight: "200px", borderRadius: "8px" }}
            />
          )}
        </div>

        <div className="inputGp">
          <label>Change Image (optional):</label>
          <input
            type="file"
            accept="image/*"
            onChange={(e) => setNewImage(e.target.files[0])}
          />
        </div>

        <button onClick={updatePost}>Update Post</button>
      </div>
    </div>
  );
}

export default EditPost;
