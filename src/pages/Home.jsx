import React, { useEffect, useState } from "react";
import {
  getDocs,
  collection,
  deleteDoc,
  doc,
  query,
  orderBy,
} from "firebase/firestore";
import { useNavigate } from "react-router-dom";
import { auth, db } from "../firebase-config";

function Home({ isAuth }) {
  const [postLists, setPostList] = useState([]);
  const postsCollectionRef = collection(db, "posts");
  const navigate = useNavigate();

  const deletePost = async (id) => {
    const postDoc = doc(db, "posts", id);
    await deleteDoc(postDoc);
    setPostList((prev) => prev.filter((post) => post.id !== id));
  };

  const handleEdit = (postId) => {
    navigate(`/edit/${postId}`);
  };

  useEffect(() => {
    const getPosts = async () => {
      try {
        const postsQuery = query(postsCollectionRef, orderBy("createdAt", "desc"));
        const data = await getDocs(postsQuery);

        const posts = data.docs.map((doc) => ({
          ...doc.data(),
          id: doc.id,
        }));

        setPostList(posts);
      } catch (error) {
        console.error("❌ Error fetching posts:", error);
      }
    };

    getPosts();
  }, []);

  return (
    <div className={`homePage ${postLists.length === 0 ? "center" : ""}`}>
      <div className="postsContainer">
        {postLists.length === 0 ? (
          <p style={{ color: "white", fontSize: "20px" }}>No posts found.</p>
        ) : (
          postLists.map((post) => {
            if (!post || !post.author) return null;

            const isUserPost = isAuth && post.author?.id === auth.currentUser?.uid;

            return (
              <div className="post" key={post.id}>
                {/* Display author name above the image */}
                <h3 style={{ marginBottom: "8px" }}>{post.author?.name || "Unknown Author"}</h3>

                {/* Display post image at top if available */}
                {post.imageUrl && (
                  <div className="postImageContainer" style={{ marginBottom: "10px" }}>
                    <img
                      src={post.imageUrl}
                      alt={post.title}
                      style={{ width: "100%", maxHeight: "300px", objectFit: "cover", borderRadius: "8px" }}
                    />
                  </div>
                )}

                <div className="postHeader">
                  <div className="title">
                    <h1>{post.title}</h1>
                  </div>
                  {isUserPost && (
                    <div className="postActions">
                      <button onClick={() => handleEdit(post.id)}>✏️</button>
                      <button onClick={() => deletePost(post.id)}>🗑</button>
                    </div>
                  )}
                </div>
                <div className="postTextContainer">{post.postText}</div>
              </div>
            );
          })
        )}
      </div>
    </div>
  );
}

export default Home;
