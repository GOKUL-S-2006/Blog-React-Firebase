import React, { useEffect, useState } from "react";
import {
  getDocs,
  collection,
  deleteDoc,
  doc,
  query,
  orderBy,
  Timestamp ,
} from "firebase/firestore";
import { auth, db } from "../firebase-config";

function Home({ isAuth }) {
  const [postLists, setPostList] = useState([]);
  const postsCollectionRef = collection(db, "posts");

  const deletePost = async (id) => {
    const postDoc = doc(db, "posts", id);
    await deleteDoc(postDoc);
    setPostList((prev) => prev.filter((post) => post.id !== id));
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

      console.log("Ordered Posts:", posts);
      setPostList(posts);
    } catch (error) {
      console.error("❌ Error fetching posts:", error);
    }
  };

  getPosts();
}, []);


  return (
    <div className="homePage">
      <div className="postsContainer">
        {postLists.length === 0 ? (
          <p style={{ color: "white", fontSize: "20px" }}>No posts found.</p>
        ) : (
          postLists.map((post) => {
            if (!post || !post.author) return null;

            return (
              <div className="post" key={post.id}>
                <div className="postHeader">
                  <div className="title">
                    <h1>{post.title}</h1>
                  </div>
                  <div className="deletePost">
                    {isAuth && post.author?.id === auth.currentUser?.uid && (
                      <button onClick={() => deletePost(post.id)}>🗑</button>
                    )}
                  </div>
                </div>
                <div className="postTextContainer">{post.postText}</div>
                <h3>@{post.author?.name || "Unknown Author"}</h3>
              </div>
            );
          })
        )}
      </div>
    </div>
  );
}

export default Home;
