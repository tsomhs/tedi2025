import { BrowserRouter as Router, Routes, Route } from "react-router-dom";
import Login from "./Pages/Login/index.jsx";
import SignUp from "./Pages/SignUp/index.jsx";
import PendingApproval from "./Pages/PendingApproval/index.jsx";
import Homepage from "./Pages/Homepage/index.jsx";
import Admin from "./Pages/Admin/index.jsx";
import UserDetails from "./Pages/UserDetails/index.jsx";
import MyAuctions from "./Pages/MyAuctions/index.jsx";
import Auction from "./Pages/Auction/index.jsx";
import Browse from "./Pages/Browse/index.jsx";
import UserRole from "./Pages/UserRole/index.jsx";
import AuctionsBought from "./Pages/AuctionsBought/index.jsx";

function App() {
  return (
    <Router>
      <Routes>
        <Route path="/" element={<Login />} />
        <Route path="/sign-up" element={<SignUp />} />
        <Route path="/pending-approval" element={<PendingApproval />} />
        <Route path="/home" element={<Homepage />} />
        <Route path="/user-role" element={<UserRole />} />
        <Route path="/admin" element={<Admin />} />
        <Route path="/admin/user/:id" element={<UserDetails />} />
        <Route path="/my-auctions" element={<MyAuctions />} />
        <Route path="/my-auctions/:id" element={<Auction />} />
        <Route path="/browse" element={<Browse />} />
        <Route path="/auctions-bought" element={<AuctionsBought />} />
      </Routes>
    </Router>
  );
}

export default App;
