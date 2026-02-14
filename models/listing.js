const mongoose = require('mongoose');
const Schema = mongoose.Schema;

const listingSchema = new Schema({
  title: {
    type: String,
    required: true,
  },

  description: String,

  image: {
  filename: {
    type: String,
    default: "listingimage"
  },
  url: {
    type: String,
    default:
      "https://images.unsplash.com/photo-1500530855697-b586d89ba3ee",
    set: (v) =>
      v === ""
        ? "https://images.unsplash.com/photo-1500530855697-b586d89ba3ee"
        : v,
  }
},


  price: Number,
  location: String,
  country: String,
  reviews:[
    {
      type:Schema.Types.ObjectId,
      ref:"Review"

    }
  ],
   bookings: [
    {
      user: { type: Schema.Types.ObjectId, ref: "User" },
      checkIn: { type: Date, required: true },
      checkOut: { type: Date, required: true }
    }
  ]
});

const Listing = mongoose.model('Listing', listingSchema);
module.exports = Listing;
