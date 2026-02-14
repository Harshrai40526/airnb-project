const express = require('express');
const http = require("http");
const { Server } = require("socket.io");

const app = express();
const server = http.createServer(app);
const io = new Server(server);


const mongoose = require('mongoose');
const Listing = require('./models/listing.js');
const path = require('path');
const methodOverride = require('method-override');
const ejsMate = require('ejs-mate');
const session = require('express-session');

const Review=require("./models/review.js");

const flash = require("connect-flash");
const passport=require("passport");
const LocalStrategy=require("passport-local");
const User=require("./models/user.js");
const multer = require("multer");

const uploads=multer({dest:'uploads/'})


  
  
  


const storage = multer.diskStorage({
  destination: function (req, file, cb) {
    cb(null, path.join(__dirname, "public", "uploads")); // absolute path
  },
  filename: function (req, file, cb) {
    cb(null, Date.now() + path.extname(file.originalname)); // unique name
  }
});

const upload = multer({ storage: storage });
require("dotenv").config();



const mongo_url = 'mongodb://localhost:27017/WANDERLUST';

// MongoDB connection
main()
  .then(() => console.log('Connected to MongoDB'))
  .catch(err => console.log(err));

async function main() {
  await mongoose.connect(mongo_url);
}

// View engine
app.set('view engine', 'ejs');
app.set('views', path.join(__dirname, 'views'));
app.engine('ejs', ejsMate);

app.use(express.static(path.join(__dirname, 'public')));
app.use(express.urlencoded({ extended: true }));
app.use(methodOverride('_method'));

const sessionOptions = {
  secret: "thisisasecret",
  resave: false,
  saveUninitialized: true,
};

app.use(session(sessionOptions));
app.use(flash());

app.use(passport.initialize());
app.use(passport.session());
passport.use(new LocalStrategy(User.authenticate()));
passport.serializeUser(User.serializeUser());
passport.deserializeUser(User.deserializeUser());

app.use((req, res, next) => {
  res.locals.success = req.flash("success");
  res.locals.error = req.flash("error");
  res.locals.currentUser = req.user;
  next();
});




// Home
app.get('/', (req, res) => {
  res.render('home');
});

// ===== USER AUTH PAGES =====

// SIGNUP PAGE
app.get('/signup', (req, res) => {
  res.render('user/signup');
});

// LOGIN PAGE
app.get('/login', (req, res) => {
  res.render('user/login');
});
app.post("/signup", async (req, res, next) => {
  try {
    const { username, email, password } = req.body.user;
    const user = new User({ username, email });

    const registeredUser = await User.register(user, password);

    req.login(registeredUser, err => {
      if (err) return next(err);
      res.redirect("/dashboard");
    });
  } catch (e) {
    req.flash("error", e.message);
    res.redirect("/signup");
  }
});
app.get("/login", (req, res) => {
  res.render("user/login");
});


app.post(
  "/login",
  passport.authenticate("local", {
    failureRedirect: "/login",
    failureFlash: true
  }),
  (req, res) => {
    res.redirect("/dashboard");
  }
);
app.get("/dashboard", (req, res) => {
  if (!req.isAuthenticated()) {
    return res.redirect("/login");
  }
  res.render("dashboard");
});

app.get('/logout', (req, res) => {
  req.session.destroy();
  res.redirect('/');
});





// ✅ ALL LISTINGS
app.get('/listings', async (req, res, next) => {
  try {
    const { location } = req.query;

    let query = {};

    if (location) {
      query.location = new RegExp(location, "i"); // case-insensitive search
    }

    const alllistings = await Listing.find(query);
    res.render('listings/index', { alllistings });

  } catch (err) {
    next(err);
  }
});

// Add to favorites
app.post('/listings/:id/favorite', async (req, res) => {
    const { id } = req.params;
    const userId = req.user._id; // logged in user
    const user = await User.findById(userId);

    if (!user.favorites.includes(id)) {
        user.favorites.push(id);
        await user.save();
    }
    res.redirect(`/listings/${id}`);
});

// Remove from favorites
app.post('/listings/:id/unfavorite', async (req, res) => {
    const { id } = req.params;
    const userId = req.user._id;
    await User.findByIdAndUpdate(userId, {
        $pull: { favorites: id }
    });
    res.redirect(`/listings/${id}`);
});
app.get('/users/:id/favorites', async (req, res) => {
    const user = await User.findById(req.params.id).populate('favorites');
    res.render('users/favorites', { user });
});
app.get("/favorites", async (req, res) => {
  if (!req.user) {
    return res.redirect("/login");
  }

  const user = await User.findById(req.user._id).populate("favorites");

  res.render("users/favorites", { favorites: user.favorites });
});


  




// ✅ NEW LISTING FORM
app.get('/listings/new', (req, res) => {
  res.render('listings/new');
});

// ✅ CREATE LISTING

app.post('/listings', upload.single('image'), async (req, res, next) => {
  try {
    const newListing = new Listing(req.body.listing);

    // agar image upload hua ho
    if (req.file) {
      newListing.image = {
        filename: req.file.filename,
        url: '/uploads/' + req.file.filename
      };
    }

    await newListing.save();
    req.flash("success", "New listing added successfully!");
    res.redirect("/listings");

  } catch (err) {
    next(err);
  }
});


// ================= EDIT ROUTES =================

// ✅ EDIT FORM
app.get('/listings/:id/edit', async (req, res, next) => {
  try {
    const { id } = req.params;
    const listing = await Listing.findById(id);
    if (!listing) throw new Error("Listing not found");
    req.flash("success", "Listing Deleted!");
    res.render('listings/edit', { listing });
  } catch (err) {
    next(err);
  }
});

// ✅ UPDATE LISTING (ONLY ONE PUT ROUTE)
app.put('/listings/:id', async (req, res, next) => {
  try {
    const { id } = req.params;
    await Listing.findByIdAndUpdate(
      id,
      req.body.listing,
      { runValidators: true }
    );
    req.flash("success", "Upadate successfully!");
    res.redirect(`/listings/${id}`);
  } catch (err) {
    next(err);
  }
});

// ✅ DELETE LISTING
app.delete('/listings/:id', async (req, res, next) => {
  try {
    const { id } = req.params;
    await Listing.findByIdAndDelete(id);
    res.redirect('/listings');
  } catch (err) {
    next(err);
  }
});

// ================= REVIEWS =================

app.post("/listings/:id/reviews", async (req, res, next) => {
  try {
    const listing = await Listing.findById(req.params.id);
    if (!listing) throw new Error("Listing not found");

    const newReview = new Review(req.body.review);

    listing.reviews.push(newReview);

    await newReview.save();
    await listing.save();

    console.log("New review saved");
    res.redirect(`/listings/${listing._id}`);
  } catch (err) {
    next(err);
  }



});
app.delete("/listings/:id/reviews/:reviewId", async (req, res, next) => {
  try {
    const { id, reviewId } = req.params;

    await Listing.findByIdAndUpdate(id, {
      $pull: { reviews: reviewId }
    });

    await Review.findByIdAndDelete(reviewId);

    res.redirect(`/listings/${id}`);
  } catch (err) {
    next(err);
  }
});








// ================= SHOW ROUTE =================

app.get('/listings/:id', async (req, res, next) => {
  try {
    const { id } = req.params;
    const listing = await Listing.findById(id).populate("reviews");
    if (!listing) throw new Error("Listing not found");
    res.render('listings/show', { listing });
  } catch (err) {
    next(err);
  }
});
app.post("/listings/:id/bookings", async (req, res, next) => {
  try {
    if (!req.isAuthenticated()) {
      req.flash("error", "You must be logged in to book.");
      return res.redirect("/login");
    }

    const { checkIn, checkOut } = req.body.booking;
    const listing = await Listing.findById(req.params.id);

    listing.bookings.push({
      user: req.user._id,
      checkIn,
      checkOut,
    });

    await listing.save();
    req.flash("success", "Booking successful!");
    res.redirect(`/listings/${listing._id}`);
  } catch (err) {
    next(err);
  }
});

// ================= ALERT ERROR HANDLER =================

app.use((err, req, res, next) => {
  const message = err.message || "Something went wrong!";
  res.send(`
    <script>
      alert("${message}");
      window.history.back();
    </script>
  `);
});


io.on("connection", (socket) => {
  console.log("🟢 User connected");

  socket.on("joinRoom", (listingId) => {
    socket.join(listingId);
  });

  socket.on("sendMessage", (data) => {
    const userMsg = data.message.toLowerCase();

    // Show user's own message
    io.to(data.listingId).emit("receiveMessage", {
      user: "You",
      message: data.message
    });

    // 🤖 AI Auto Reply
    let aiReply = "I'm here to help regarding this listing!";

    if (userMsg.includes("price")) {
      aiReply = "Price upar listing me mentioned hai 💰";
    } else if (userMsg.includes("location")) {
      aiReply = "Location listing details me diya hua hai 📍";
    } else if (userMsg.includes("available")) {
      aiReply = "Availability check karne ke liye dates select karo 📅";
    } else if (userMsg.includes("hi") || userMsg.includes("hello")) {
      aiReply = "Hello! Kaise help kar sakta hoon?";
    }

    setTimeout(() => {
      io.to(data.listingId).emit("receiveMessage", {
        user: "AI Assistant",
        message: aiReply
      });
    }, 1000);
  });

  socket.on("disconnect", () => {
    console.log("🔴 User disconnected");

  });
});
  app.listen(3000, () => {
  console.log('Server running on port 3000');
  

});
const axios = require("axios");

app.get("/weather", async (req, res) => {
  try {
    const { lat, lon } = req.query;

    const response = await axios.get(
      "https://weatherbit-v1-mashape.p.rapidapi.com/forecast/3hourly",
      {
        params: { lat, lon, units: "metric", lang: "en" },
        headers: {
          "X-RapidAPI-Key": process.env.RAPIDAPI_KEY,
          "X-RapidAPI-Host": "weatherbit-v1-mashape.p.rapidapi.com"
        }
      }
    );

    res.json(response.data);
  } catch (err) {
    console.log(err.response?.data || err.message);
    res.send("Weather not available");
  }
});
