const express = require("express");
const mongoose = require("mongoose");
const bcrypt = require("bcryptjs");
const jwt = require("jsonwebtoken");

const app = express();
app.use(express.json());

mongoose.connect("mongodb://127.0.0.1/miniinsta");

const UserSchema = new mongoose.Schema({
    username: String,
    email: String,
    password: String,
    followers: [{ type: mongoose.Schema.Types.ObjectId, ref: "User" }],
    following: [{ type: mongoose.Schema.Types.ObjectId, ref: "User" }]
});

const PostSchema = new mongoose.Schema({
    user: { type: mongoose.Schema.Types.ObjectId, ref: "User" },
    imageUrl: String,
    caption: String,
    likes: [{ type: mongoose.Schema.Types.ObjectId, ref: "User" }],
    comments: [
        {
            user: { type: mongoose.Schema.Types.ObjectId, ref: "User" },
            text: String
        }
    ],
    createdAt: { type: Date, default: Date.now }
});

const User = mongoose.model("User", UserSchema);
const Post = mongoose.model("Post", PostSchema);

const auth = (req, res, next) => {
    const token = req.headers.authorization;
    if (!token) return res.status(401).json({ msg: "No token" });
    try {
        const decoded = jwt.verify(token, "secretkey");
        req.userId = decoded.id;
        next();
    } catch {
        res.status(401).json({ msg: "Invalid token" });
    }
};

/* AUTH */
app.post("/signup", async (req, res) => {
    const hashed = await bcrypt.hash(req.body.password, 10);
    const user = new User({
        username: req.body.username,
        email: req.body.email,
        password: hashed
    });
    await user.save();
    res.json({ msg: "Signup successful" });
});

app.post("/login", async (req, res) => {
    const user = await User.findOne({ email: req.body.email });
    if (!user) return res.json({ msg: "User not found" });

    const ok = await bcrypt.compare(req.body.password, user.password);
    if (!ok) return res.json({ msg: "Wrong password" });

    const token = jwt.sign({ id: user._id }, "secretkey");
    res.json({ token });
});

/* FOLLOW / UNFOLLOW */
app.post("/follow/:id", auth, async (req, res) => {
    const me = await User.findById(req.userId);
    const other = await User.findById(req.params.id);

    me.following.push(other._id);
    other.followers.push(me._id);

    await me.save();
    await other.save();

    res.json({ msg: "Followed" });
});

app.post("/unfollow/:id", auth, async (req, res) => {
    const me = await User.findById(req.userId);
    const other = await User.findById(req.params.id);

    me.following.pull(other._id);
    other.followers.pull(me._id);

    await me.save();
    await other.save();

    res.json({ msg: "Unfollowed" });
});

/* POSTS */
app.post("/post", auth, async (req, res) => {
    const post = new Post({
        user: req.userId,
        imageUrl: req.body.imageUrl,
        caption: req.body.caption
    });
    await post.save();
    res.json(post);
});

app.post("/like/:id", auth, async (req, res) => {
    const post = await Post.findById(req.params.id);
    post.likes.push(req.userId);
    await post.save();
    res.json({ msg: "Liked" });
});

app.post("/unlike/:id", auth, async (req, res) => {
    const post = await Post.findById(req.params.id);
    post.likes.pull(req.userId);
    await post.save();
    res.json({ msg: "Unliked" });
});

app.post("/comment/:id", auth, async (req, res) => {
    const post = await Post.findById(req.params.id);
    post.comments.push({
        user: req.userId,
        text: req.body.text
    });
    await post.save();
    res.json({ msg: "Comment added" });
});

/* FEED */
app.get("/feed", auth, async (req, res) => {
    const user = await User.findById(req.userId);
    const posts = await Post.find({ user: { $in: user.following } })
        .populate("user", "username")
        .sort({ createdAt: -1 });

    res.json(posts);
});

app.listen(5000, () => console.log("Server running"));
