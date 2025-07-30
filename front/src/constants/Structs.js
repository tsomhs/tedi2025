import { use } from "react";

const User = {
  id: "",
  role: "",
  username: "",
  firstName: "",
  lastName: "",
  email: "",
  phoneNumber: "",
  country: "",
  address: "",
  vatNumber: "",
  password: "",
  confirmedPassword: "",
  status: "",
};

const Bid = {
  id: "",
  name: "",
  categories: [],
  currently: "",
  buyPrice: "",
  firstBid: "",
  numberOfBids: 0,
  location: "",
  country: "",
  started: "",
  ends: "",
  seller: "",
  description: "",
  images: [],
};

const Bidder = {
  id: "",
  address: "",
  country: "",
};

export default { User, Bid, Bidder };
