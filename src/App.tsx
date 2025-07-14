import React from 'react';
import { BrowserRouter as Router, Routes, Route, Navigate } from 'react-router-dom';
import { AuthProvider } from './context/AuthContext';
import ProtectedRoute from './components/layout/ProtectedRoute';
import LoginPage from './pages/LoginPage';
import SignupPage from './pages/SignupPage';
import DashboardPage from './pages/DashboardPage';
import SubmissionsPage from './pages/SubmissionsPage';
import SubmissionDetailPage from './pages/SubmissionDetailPage';
import EvaluatorSolutionDetailPage from './pages/EvaluatorSolutionDetailPage';
import BusinessInterestPage from './pages/BusinessInterestPage';
import CompanyPage from './pages/CompanyPage';
import BusinessSolutionPage from './pages/BusinessSolutionPage';
import CompanySolutionDetailPage from './pages/CompanySolutionDetailPage';
import CustomersPage from './pages/CustomersPage';
import CustomerDetailPage from './pages/CustomerDetailPage';
import CustomerSolutionPage from './pages/CustomerSolutionPage';
import MyProfilePage from './pages/MyProfilePage';

function App() {
  return (
    <AuthProvider>
      <Router>
        <Routes>
          {/* Public routes */}
          <Route path="/login" element={<LoginPage />} />
          <Route path="/signup" element={<SignupPage />} />
          
          {/* Protected routes */}
          <Route element={<ProtectedRoute />}>
            <Route path="/" element={<DashboardPage />} />
            <Route path="/submissions" element={<SubmissionsPage />} />
            <Route path="/submissions/:id" element={<SubmissionDetailPage />} />
            <Route path="/evaluator/solutions/:id" element={<EvaluatorSolutionDetailPage />} />
            <Route path="/business-interest" element={<BusinessInterestPage />} />
            <Route path="/companies/:companyName" element={<CompanyPage />} />
            <Route path="/business-solutions/:id" element={<BusinessSolutionPage />} />
            <Route path="/company/solutions/:id" element={<CompanySolutionDetailPage />} />
            <Route path="/customers" element={<CustomersPage />} />
            <Route path="/customers/:id" element={<CustomerDetailPage />} />
            <Route path="/customer/solutions/:id" element={<CustomerSolutionPage />} />
            <Route path="/profile" element={<MyProfilePage />} />
          </Route>
          
          {/* Catch-all route for 404s - redirect to dashboard */}
          <Route path="*" element={<Navigate to="/\" replace />} />
        </Routes>
      </Router>
    </AuthProvider>
  );
}

export default App;