import {
  BrowserRouter as Router,
  Routes,
  Route,
  Navigate,
} from "react-router-dom";
import Login from "./components/Login";
import Signup from "./components/Signup";
import PatientDashboard from "./components/PatientDashboard";
import DentistDashboard from "./components/DentistDashboard";
import CheckupResult from "./components/CheckupResult";
import { AuthProvider } from "./context/AuthContext";
import PrivateRoute from "./components/PrivateRoute";
import Header from "./components/Header";

function App() {
  return (
    <AuthProvider>
      <Router>
        <div className="min-h-screen bg-gray-100">
          <Header />
          <div className="container mx-auto px-4 py-8">
            <Routes>
              <Route path="/" element={<Navigate to="/login" />} />
              <Route path="/login" element={<Login />} />
              <Route path="/signup" element={<Signup />} />
              <Route
                path="/patient-dashboard"
                element={
                  <PrivateRoute allowedRole="patient">
                    <PatientDashboard />
                  </PrivateRoute>
                }
              />
              <Route
                path="/dentist-dashboard"
                element={
                  <PrivateRoute allowedRole="dentist">
                    <DentistDashboard />
                  </PrivateRoute>
                }
              />
              <Route
                path="/checkup-result/:requestId"
                element={
                  <PrivateRoute allowedRole="patient">
                    <CheckupResult />
                  </PrivateRoute>
                }
              />
            </Routes>
          </div>
        </div>
      </Router>
    </AuthProvider>
  );
}

export default App;
