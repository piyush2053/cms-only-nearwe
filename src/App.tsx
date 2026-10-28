import { ConfigProvider } from "antd";
import { BrowserRouter, Navigate, Route, Routes } from "react-router-dom";
import CmsHome from "./cms/cms_home";
import AppManagement from "./cms/pages/AppManagement";
import Announcements from "./cms/pages/Announcements";
import CategoryManagement from "./cms/pages/CategoryManagement";
import EventManagement from "./cms/pages/EventManagement";
import InsightsDashboard from "./cms/pages/InsightsDashboard";
import UserInterestDetail from "./cms/pages/Interest";
import Reports from "./cms/pages/Reports";
import UserManagement from "./cms/pages/UserManagement";
import ProtectedRoute from "./components/ProtectedRoute";
import { AuthProvider } from "./contexts/AuthContext";
import { NotificationProvider } from "./contexts/NotificationContext";
import { UserProvider } from "./contexts/UserContext";
import Login from "./pages/Login";
import { ANT_THEME_CONFIG } from "./cms/cmstheme";
import "./index.css";

function App() {
  return (
    <ConfigProvider theme={ANT_THEME_CONFIG}>
      <AuthProvider>
        <UserProvider>
          <NotificationProvider>
            <BrowserRouter>
              <div className="min-h-screen">
                  <Routes>
                    <Route path="/login" element={<Login />} />
                    <Route
                      path="/"
                      element={
                        <ProtectedRoute>
                          <CmsHome />
                        </ProtectedRoute>
                      }
                    >
                      <Route index element={<Navigate to="/insights" replace />} />
                      <Route path="insights" element={<InsightsDashboard />} />
                      <Route path="users" element={<UserManagement />} />
                      <Route path="categories" element={<CategoryManagement />} />
                      <Route path="events" element={<EventManagement />} />
                      <Route path="app" element={<AppManagement />} />
                      <Route path="announcements" element={<Announcements />} />
                      <Route path="reports" element={<Reports />} />
                      <Route path="interests" element={<UserInterestDetail />} />
                    </Route>
                    <Route path="*" element={<Navigate to="/" replace />} />
                  </Routes>
              </div>
            </BrowserRouter>
          </NotificationProvider>
        </UserProvider>
      </AuthProvider>
    </ConfigProvider>
  );
}

export default App;
