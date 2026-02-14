
const mongoose = require("mongoose");

// ✅ Add .default for Node 22+
const passportLocalMongoose = require("passport-local-mongoose").default;

const userSchema = new mongoose.Schema({
  username: {
    type: String,
    required: true,
    unique: true
  },
  email: {
    type: String,
    required: true,
    unique: true
  },
  favorites: [
    { type: mongoose.Schema.Types.ObjectId, ref: "Listing" } // Add this line
  ]
});



// plugin must be a function
userSchema.plugin(passportLocalMongoose);

module.exports = mongoose.model("User", userSchema);
