import { BrowserRouter, Routes, Route } from "react-router-dom";
import Navbar from "./components/Navbar";
import ListingsPage from "./pages/ListingsPage";
import ApartmentDetailPage from "./pages/ApartmentDetailPage";
import MapPage from "./pages/MapPage";
import ComparePage from "./pages/ComparePage";
import AdminPage from "./pages/AdminPage";

export default function App() {
  return (
    <BrowserRouter>
      <Navbar />
      <main>
        <Routes>
          <Route path="/" element={<ListingsPage />} />
          <Route path="/apartment/:id" element={<ApartmentDetailPage />} />
          <Route path="/map" element={<MapPage />} />
          <Route path="/compare" element={<ComparePage />} />
          <Route path="/saved" element={<ListingsPage />} />
          <Route path="/admin" element={<AdminPage />} />
        </Routes>
      </main>
    </BrowserRouter>
  );
}
