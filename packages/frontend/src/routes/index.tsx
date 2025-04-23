import {
  BrowserRouter as Router,
  Routes,
  Route,
  useParams,
  Navigate,
} from "react-router-dom";
import HomePage from "../pages/home";
import PaymentPage from "../pages/payment";

function SubscribePage() {
  return <h1>Subscribe Page</h1>;
}

export default function AppRoutes() {
  return (
    <Router>
      <Routes>
        <Route path="/" element={<HomePage />} />
        <Route path="/payment/:id" element={<PaymentPage />} />
        <Route path="/subscribe" element={<SubscribePage />} />
        <Route path="*" element={<Navigate to="/" replace />} />
      </Routes>
    </Router>
  );
}
