import React, { useEffect, useState } from "react";

function App() {
    const [token, setToken] = useState(localStorage.getItem("token"));
    const [posts, setPosts] = useState([]);
    const [email, setEmail] = useState("");
    const [password, setPassword] = useState("");
    const [imageUrl, setImageUrl] = useState("");
    const [caption, setCaption] = useState("");
    const [commentText, setCommentText] = useState("");

    // LOGIN
    const loginUser = async () => {
        const res = await fetch("http://localhost:5000/login", {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({ email, password })
        });
        const data = await res.json();
        if (data.token) {
            localStorage.setItem("token", data.token);
            setToken(data.token);
        }
    };

    // LOAD FEED
    const loadFeed = async () => {
        const res = await fetch("http://localhost:5000/feed", {
            headers: { authorization: token }
        });
        const data = await res.json();
        setPosts(data);
    };

    // CREATE POST
    const createPost = async () => {
        await fetch("http://localhost:5000/post", {
            method: "POST",
            headers: {
                "Content-Type": "application/json",
                authorization: token
            },
            body: JSON.stringify({ imageUrl, caption })
        });
        setImageUrl("");
        setCaption("");
        loadFeed(); // UI updates without refresh
    };

    // LIKE POST
    const likePost = async (id) => {
        await fetch(`http://localhost:5000/like/${id}`, {
            method: "POST",
            headers: { authorization: token }
        });
        loadFeed();
    };

    // COMMENT
    const addComment = async (id) => {
        await fetch(`http://localhost:5000/comment/${id}`, {
            method: "POST",
            headers: {
                "Content-Type": "application/json",
                authorization: token
            },
            body: JSON.stringify({ text: commentText })
        });
        setCommentText("");
        loadFeed();
    };

    useEffect(() => {
        if (token) loadFeed();
    }, [token]);

    // LOGIN SCREEN
    if (!token) {
        return (
            <div style={styles.center}>
                <h2>Login</h2>
                <input
                    style={styles.input}
                    placeholder="Email"
                    onChange={(e) => setEmail(e.target.value)}
                />
                <input
                    style={styles.input}
                    type="password"
                    placeholder="Password"
                    onChange={(e) => setPassword(e.target.value)}
                />
                <button style={styles.button} onClick={loginUser}>
                    Login
                </button>
            </div>
        );
    }

    // FEED SCREEN
    return (
        <div style={styles.container}>
            <h2>Home Feed</h2>

            <div style={styles.card}>
                <input
                    style={styles.input}
                    placeholder="Image URL"
                    value={imageUrl}
                    onChange={(e) => setImageUrl(e.target.value)}
                />
                <input
                    style={styles.input}
                    placeholder="Caption"
                    value={caption}
                    onChange={(e) => setCaption(e.target.value)}
                />
                <button style={styles.button} onClick={createPost}>
                    Post
                </button>
            </div>

            {posts.map((p) => (
                <div key={p._id} style={styles.card}>
                    <h4>{p.user.username}</h4>
                    <img src={p.imageUrl} style={styles.image} />
                    <p>{p.caption}</p>
                    <p>Likes: {p.likes.length}</p>

                    <button style={styles.smallBtn} onClick={() => likePost(p._id)}>
                        Like
                    </button>

                    <div>
                        {p.comments.map((c, i) => (
                            <p key={i}>
                                <b>{c.user}</b>: {c.text}
                            </p>
                        ))}
                    </div>

                    <input
                        style={styles.input}
                        placeholder="Add comment"
                        value={commentText}
                        onChange={(e) => setCommentText(e.target.value)}
                    />
                    <button
                        style={styles.smallBtn}
                        onClick={() => addComment(p._id)}
                    >
                        Comment
                    </button>
                </div>
            ))}
        </div>
    );
}

// BASIC RESPONSIVE STYLES (INLINE – SIMPLE HUMAN STYLE)
const styles = {
    container: {
        maxWidth: "600px",
        margin: "auto",
        padding: "10px"
    },
    center: {
        maxWidth: "300px",
        margin: "100px auto",
        textAlign: "center"
    },
    card: {
        border: "1px solid #ccc",
        padding: "10px",
        marginBottom: "15px",
        borderRadius: "6px"
    },
    input: {
        width: "100%",
        padding: "8px",
        marginBottom: "8px"
    },
    button: {
        width: "100%",
        padding: "8px",
        cursor: "pointer"
    },
    smallBtn: {
        padding: "5px 10px",
        marginTop: "5px",
        cursor: "pointer"
    },
    image: {
        width: "100%",
        maxHeight: "300px",
        objectFit: "cover"
    }
};

export default App;
