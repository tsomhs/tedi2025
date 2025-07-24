import { BrowserRouter as Router, Routes, Route } from "react-router-dom";
import Login from "./Pages/Login/index.jsx";
import SignUp from "./Pages/SignUp/index.jsx";
import PendingApproval from "./Pages/PendingApproval/index.jsx";
import Homepage from "./Pages/Homepage/index.jsx";
import Admin from "./Pages/AdminPage/index.jsx";
import UserDetails from "./Pages/UserDetails/index.jsx";
import MyAuctions from "./Pages/MyAuctions/index.jsx";
import Browse from "./Pages/Browse/index.jsx";

function App() {
  return (
    <Router>
      <Routes>
        <Route path="/" element={<Login />} />
        <Route path="/sign-up" element={<SignUp />} />
        <Route path="/pending-approval" element={<PendingApproval />} />
        <Route path="/home" element={<Homepage />} />
        <Route path="/admin" element={<Admin />} />
        <Route path="/admin/user/:id" element={<UserDetails />} />
        <Route path="/my-auctions" element={<MyAuctions />} />
        <Route path="/browse" element={<Browse />} />
      </Routes>
    </Router>
  );
}

export default App;
