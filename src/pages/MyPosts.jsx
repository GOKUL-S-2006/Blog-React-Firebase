import React, { useEffect, useState } from "react";
import {
  getDocs,
  collection,
  deleteDoc,
  doc,
  query,
  orderBy,
  updateDoc,
  arrayUnion,
  arrayRemove,
  addDoc,
  serverTimestamp,
} from "firebase/firestore";
import { useNavigate } from "react-router-dom";
import { auth, db } from "../firebase-config";
import "../App.css";

function MyPosts({ isAuth }) {
  const [postLists, setPostList] = useState([]);
  const [commentInputs, setCommentInputs] = useState({});
  const [replyInputs, setReplyInputs] = useState({});
  const [editingComment, setEditingComment] = useState(null);
  const [editText, setEditText] = useState("");
  const [showComments, setShowComments] = useState({});

  const postsCollectionRef = collection(db, "posts");
  const navigate = useNavigate();

  const deletePost = async (id) => {
    const postDoc = doc(db, "posts", id);
    await deleteDoc(postDoc);
    setPostList((prev) => prev.filter((post) => post.id !== id));
  };

  const deleteComment = async (postId, commentId) => {
    const commentRef = doc(db, "posts", postId, "comments", commentId);
    await deleteDoc(commentRef);
    setPostList((prevPosts) =>
      prevPosts.map((post) =>
        post.id === postId
          ? { ...post, comments: post.comments.filter((c) => c.id !== commentId) }
          : post
      )
    );
  };

  const editComment = async (postId, commentId, newText) => {
    if (!newText.trim()) return;
    const commentRef = doc(db, "posts", postId, "comments", commentId);
    await updateDoc(commentRef, { commentText: newText });
    setEditingComment(null);

    setPostList((prevPosts) =>
      prevPosts.map((post) =>
        post.id === postId
          ? {
              ...post,
              comments: post.comments.map((c) =>
                c.id === commentId ? { ...c, commentText: newText } : c
              ),
            }
          : post
      )
    );
  };

  const togglePostLike = async (postId, likes = []) => {
    const postRef = doc(db, "posts", postId);
    const userId = auth.currentUser.uid;
    const hasLiked = likes.includes(userId);

    await updateDoc(postRef, {
      likes: hasLiked ? arrayRemove(userId) : arrayUnion(userId),
    });

    setPostList((prevPosts) =>
      prevPosts.map((post) =>
        post.id === postId
          ? {
              ...post,
              likes: hasLiked
                ? post.likes.filter((id) => id !== userId)
                : [...(post.likes || []), userId],
            }
          : post
      )
    );
  };

  const toggleCommentLike = async (postId, commentId, likes = []) => {
    const commentRef = doc(db, "posts", postId, "comments", commentId);
    const userId = auth.currentUser.uid;
    const hasLiked = likes.includes(userId);

    await updateDoc(commentRef, {
      likes: hasLiked ? arrayRemove(userId) : arrayUnion(userId),
    });

    setPostList((prevPosts) =>
      prevPosts.map((post) =>
        post.id === postId
          ? {
              ...post,
              comments: post.comments.map((c) =>
                c.id === commentId
                  ? {
                      ...c,
                      likes: hasLiked
                        ? c.likes.filter((id) => id !== userId)
                        : [...(c.likes || []), userId],
                    }
                  : c
              ),
            }
          : post
      )
    );
  };

  const addComment = async (postId) => {
    const commentText = commentInputs[postId];
    if (!commentText?.trim()) return;

    const commentRef = collection(db, "posts", postId, "comments");
    const docRef = await addDoc(commentRef, {
      userId: auth.currentUser.uid,
      userName: auth.currentUser.displayName || "Anonymous",
      commentText,
      createdAt: serverTimestamp(),
      likes: [],
    });

    setCommentInputs((prev) => ({ ...prev, [postId]: "" }));

    setPostList((prevPosts) =>
      prevPosts.map((post) =>
        post.id === postId
          ? {
              ...post,
              comments: [
                ...post.comments,
                {
                  id: docRef.id,
                  userId: auth.currentUser.uid,
                  userName: auth.currentUser.displayName || "Anonymous",
                  commentText,
                  createdAt: new Date(),
                  likes: [],
                  replies: [],
                },
              ],
            }
          : post
      )
    );
  };

  const addReply = async (postId, commentId) => {
    const replyText = replyInputs[commentId];
    if (!replyText?.trim()) return;

    const replyRef = collection(db, "posts", postId, "comments", commentId, "replies");
    const docRef = await addDoc(replyRef, {
      userId: auth.currentUser.uid,
      userName: auth.currentUser.displayName || "Anonymous",
      replyText,
      createdAt: serverTimestamp(),
    });

    setReplyInputs((prev) => ({ ...prev, [commentId]: "" }));

    setPostList((prevPosts) =>
      prevPosts.map((post) =>
        post.id === postId
          ? {
              ...post,
              comments: post.comments.map((comment) =>
                comment.id === commentId
                  ? {
                      ...comment,
                      replies: [
                        ...comment.replies,
                        {
                          id: docRef.id,
                          userId: auth.currentUser.uid,
                          userName: auth.currentUser.displayName || "Anonymous",
                          replyText,
                          createdAt: new Date(),
                        },
                      ],
                    }
                  : comment
              ),
            }
          : post
      )
    );
  };

  const fetchReplies = async (postId, commentId) => {
    const replyRef = collection(db, "posts", postId, "comments", commentId, "replies");
    const q = query(replyRef, orderBy("createdAt", "asc"));
    const snapshot = await getDocs(q);

    return snapshot.docs.map((doc) => ({ id: doc.id, ...doc.data() }));
  };

  const fetchComments = async (postId) => {
    const commentRef = collection(db, "posts", postId, "comments");
    const q = query(commentRef, orderBy("createdAt", "asc"));
    const snapshot = await getDocs(q);

    return Promise.all(
      snapshot.docs.map(async (doc) => {
        const commentData = doc.data();
        const replies = await fetchReplies(postId, doc.id);
        return {
          id: doc.id,
          ...commentData,
          replies,
        };
      })
    );
  };

  const fetchPosts = async () => {
    try {
      const postsQuery = query(postsCollectionRef, orderBy("createdAt", "desc"));
      const data = await getDocs(postsQuery);

      const posts = await Promise.all(
        data.docs.map(async (doc) => {
          const postData = doc.data();
          const comments = await fetchComments(doc.id);
          return {
            ...postData,
            id: doc.id,
            comments,
          };
        })
      );

      // Filter posts to include only those by current user
      const userPosts = posts.filter(
        (post) => post.author?.id === auth.currentUser?.uid
      );

      setPostList(userPosts);
    } catch (error) {
      console.error("❌ Error fetching posts:", error);
    }
  };

  const toggleCommentsVisibility = (postId) => {
    setShowComments((prev) => ({
      ...prev,
      [postId]: !prev[postId],
    }));
  };

  useEffect(() => {
    fetchPosts();
  }, []);

  return (
    <div className={`homePage ${postLists.length === 0 ? "center" : ""}`}>
      <div className="postsContainer">
        {postLists.length === 0 ? (
          <p className="noPosts">No posts found.</p>
        ) : (
          postLists.map((post) => (
            <div className="post" key={post.id}>
              <h3>{post.author.name || "Unknown Author"}</h3>

              {post.imageUrl && (
                <div className="postImageContainer">
                  <img src={post.imageUrl} alt={post.title} className="postImage" />
                </div>
              )}

              <div className="postHeader">
                <h1>{post.title}</h1>
                <div className="comment-actions">
                  <button className="action-btn edit" onClick={() => navigate(`/edit/${post.id}`)}>Edit</button>
                  <button className="action-btn delete" onClick={() => deletePost(post.id)}>Delete</button>
                </div>
              </div>

              <div className="postTextContainer">{post.postText}</div>

              <button
                onClick={() => togglePostLike(post.id, post.likes)}
                style={{
                  backgroundColor: "black",
                  color: "white",
                  border: "none",
                  padding: "0.5rem 1rem",
                  borderRadius: "20px",
                  fontWeight: "bold",
                  cursor: "pointer",
                  transition: "background-color 0.3s ease, transform 0.2s ease",
                }}
                onMouseOver={(e) => (e.currentTarget.style.backgroundColor = "#e73370")}
                onMouseOut={(e) => (e.currentTarget.style.backgroundColor = "black")}
              >
                ❤️ {post.likes?.length || 0}
              </button>

              <button
                onClick={() => toggleCommentsVisibility(post.id)}
                className="toggle-comments-btn"
              >
                {showComments[post.id] ? "Hide Comments" : "Show Comments"}
              </button>

              <div className="commentsSection">
                <h4 className="commentsTitle">💬 Comments</h4>

                {showComments[post.id] ? (
                  <>
                    {post.comments.length === 0 ? (
                      <p>No comments yet. Be the first to comment!</p>
                    ) : (
                      post.comments.map((comment) => {
                        const isOwner = auth.currentUser?.uid === comment.userId;
                        const isEditing = editingComment?.commentId === comment.id;

                        return (
                          <div key={comment.id} className="comment">
                            {isEditing ? (
                              <>
                                <input
                                  className="edit-input"
                                  type="text"
                                  value={editText}
                                  onChange={(e) => setEditText(e.target.value)}
                                />
                                <div className="comment-actions">
                                  <button
                                    className="action-btn save"
                                    onClick={() => editComment(post.id, comment.id, editText)}
                                  >
                                    Save
                                  </button>
                                  <button
                                    className="action-btn cancel"
                                    onClick={() => setEditingComment(null)}
                                  >
                                    Cancel
                                  </button>
                                </div>
                              </>
                            ) : (
                              <>
                                <strong>{comment.userName}:</strong> {comment.commentText}
                                <button
                                  onClick={() => toggleCommentLike(post.id, comment.id, comment.likes || [])}
                                  className="like-btn"
                                  style={{
                                    backgroundColor: "black",
                                    color: "white",
                                    border: "none",
                                    padding: "0.4rem 0.8rem",
                                    borderRadius: "20px",
                                    cursor: "pointer",
                                    fontWeight: "bold",
                                    transition: "background-color 0.3s ease, transform 0.2s ease",
                                  }}
                                  onMouseOver={(e) => (e.currentTarget.style.backgroundColor = "#e73370")}
                                  onMouseOut={(e) => (e.currentTarget.style.backgroundColor = "black")}
                                >
                                  ❤️ {comment.likes?.length || 0}
                                </button>

                                {isOwner && (
                                  <div className="comment-actions">
                                    <button
                                      className="action-btn edit"
                                      onClick={() => {
                                        setEditingComment({ postId: post.id, commentId: comment.id });
                                        setEditText(comment.commentText);
                                      }}
                                    >
                                      Edit
                                    </button>
                                    <button
                                      className="action-btn delete"
                                      onClick={() => deleteComment(post.id, comment.id)}
                                    >
                                      Delete
                                    </button>
                                  </div>
                                )}
                              </>
                            )}

                            <div className="replySection">
                              {comment.replies.map((reply) => (
                                <div key={reply.id} className="reply">
                                  <strong>{reply.userName}:</strong> {reply.replyText}
                                </div>
                              ))}

                              {isAuth && (
                                <div className="reply-box">
                                  <input
                                    type="text"
                                    placeholder="Reply..."
                                    value={replyInputs[comment.id] || ""}
                                    onChange={(e) =>
                                      setReplyInputs((prev) => ({
                                        ...prev,
                                        [comment.id]: e.target.value,
                                      }))
                                    }
                                  />
                                  <button
                                    onClick={() => addReply(post.id, comment.id)}
                                    style={{
                                      backgroundColor: "#4CAF50",
                                      color: "white",
                                      border: "none",
                                      padding: "0.5rem 1rem",
                                      borderRadius: "20px",
                                      cursor: "pointer",
                                      fontWeight: "bold",
                                      transition: "background-color 0.3s ease, transform 0.2s ease",
                                    }}
                                  >
                                    Reply
                                  </button>
                                </div>
                              )}
                            </div>
                          </div>
                        );
                      })
                    )}

                    {isAuth && (
                      <div className="comment-box">
                        <input
                          type="text"
                          placeholder="Add a comment..."
                          value={commentInputs[post.id] || ""}
                          onChange={(e) =>
                            setCommentInputs((prev) => ({
                              ...prev,
                              [post.id]: e.target.value,
                            }))
                          }
                        />
                        <button onClick={() => addComment(post.id)}>➕ Add Comment</button>
                      </div>
                    )}
                  </>
                ) : (
                  <p style={{ opacity: 0.7 }}>
                    Comments are hidden. Click "Show Comments" to view them.
                  </p>
                )}
              </div>
            </div>
          ))
        )}
      </div>
    </div>
  );
}

export default MyPosts;
