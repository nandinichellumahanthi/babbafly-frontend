import { useState } from "react";
import { BrowserRouter as Router, Routes, Route } from "react-router-dom";

// Existing pages
import Home from "./pages/Home";
import Listings from "./pages/Listings";
import ListingDetails from "./pages/ListingDetails";
import AddListing from "./pages/AddListing";
import EditListing from "./pages/EditListing";
import Login from "./pages/Login";
import Register from "./pages/Register";
import Profile from "./pages/Profile";
import Categories from "./pages/Categories";

// New pages
import SellerProfile from "./pages/SellerProfile";
import Chat from "./pages/Chat";

// Splash + Toast
import SplashScreen from "./components/SplashScreen";
import { ToastProvider } from "./components/Toast";

function App() {
  const [showSplash, setShowSplash] = useState(true);

  if (showSplash) {
    return <SplashScreen onFinish={() => setShowSplash(false)} />;
  }

  return (
    <ToastProvider>
      <Router>
        <Routes>
          {/* Existing routes */}
          <Route path="/" element={<Home />} />
          <Route path="/listings" element={<Listings />} />
          <Route path="/listing/:id" element={<ListingDetails />} />
          <Route path="/add-listing" element={<AddListing />} />
          <Route path="/edit-listing/:id" element={<EditListing />} />
          <Route path="/login" element={<Login />} />
          <Route path="/register" element={<Register />} />
          <Route path="/profile" element={<Profile />} />
          <Route path="/categories" element={<Categories />} />

          {/* New routes */}
          <Route path="/seller/:sellerId" element={<SellerProfile />} />
          <Route path="/chat" element={<Chat />} />
          <Route path="/chat/:conversationId" element={<Chat />} />
          <Route path="*" element={<Home />} />
        </Routes>
      </Router>
    </ToastProvider>
  );
}

export default App;