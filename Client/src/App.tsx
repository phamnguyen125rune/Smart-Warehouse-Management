import { BrowserRouter as Router, Routes, Route } from "react-router";
import { Toaster } from 'react-hot-toast';
import SignIn from "./pages/AuthPages/SignIn";
import SignUp from "./pages/AuthPages/SignUp";
import NotFound from "./pages/OtherPage/NotFound";
import UserProfiles from "./pages/UserProfiles";
import Videos from "./pages/UiElements/Videos";
import Images from "./pages/UiElements/Images";
import Alerts from "./pages/UiElements/Alerts";
import Badges from "./pages/UiElements/Badges";
import Avatars from "./pages/UiElements/Avatars";
import Buttons from "./pages/UiElements/Buttons";
import LineChart from "./pages/Charts/LineChart";
import BarChart from "./pages/Charts/BarChart";
import Calendar from "./pages/Calendar";
import BasicTables from "./pages/Tables/BasicTables";
import FormElements from "./pages/Forms/FormElements";
import Blank from "./pages/Blank";
import AppLayout from "./layout/AppLayout";
import { ScrollToTop } from "./components/common/ScrollToTop";
import Home from "./pages/Dashboard/Home";
import ProductReceipt from "./pages/Management/ProductReceipt";
import Inventorypage from "./pages/Dashboard/InventoryPage"
import CreateExportSlipPage from './pages/Management/CreateExportSlipPage';
import ManageUsersPage from "./pages/Management/ManageUsersPage";
import ProtectedRoute from './components/common/ProtectedRoute';
import MailboxPage from "./components/mailbox/MailboxPage";
import AuditLogPage from "./pages/Management/AuditLogPage";
import SlipsPage from "./pages/Management/SlipsPage";
import SlipDetailPage from "./pages/Management/SlipDetailPage";

export default function App() {
  return (
    <>
      <Router>
        <ScrollToTop />
        <Routes>
          <Route element={<ProtectedRoute />}>
            {/* Dashboard Layout */}
            <Route element={<AppLayout />}>
              <Route index path="/" element={<Home />} />

              <Route index path="/inventorypage" element={<Inventorypage />} />
              <Route path="/slips" element={<SlipsPage />} />
              <Route path="/slips/:type/:id" element={<SlipDetailPage />} />              
              {/* Management Layout */}
              <Route element={<ProtectedRoute allowedRoles={['manager']} />}>
                <Route path="/receipt" element={<ProductReceipt />} />
                <Route path="/export" element={<CreateExportSlipPage />} />
                <Route path="/manage-users" element={<ManageUsersPage />} />
                <Route path="/audit-logs" element={<AuditLogPage />} />
              </Route>
              {/* Others Page */}
              <Route path="/profile" element={<UserProfiles />} />
              <Route path="/calendar" element={<Calendar />} />
              <Route path="/blank" element={<Blank />} />

              {/* Forms */}
              <Route path="/form-elements" element={<FormElements />} />
              <Route path="/mailboxpage" element={<MailboxPage />} />

              {/* Tables */}
              <Route path="/basic-tables" element={<BasicTables />} />

              {/* Ui Elements */}
              <Route path="/alerts" element={<Alerts />} />
              <Route path="/avatars" element={<Avatars />} />
              <Route path="/badge" element={<Badges />} />
              <Route path="/buttons" element={<Buttons />} />
              <Route path="/images" element={<Images />} />
              <Route path="/videos" element={<Videos />} />

              {/* Charts */}
              <Route path="/line-chart" element={<LineChart />} />
              <Route path="/bar-chart" element={<BarChart />} />
            </Route>
          </Route>
          {/* Auth Layout */}
          <Route path="/signin" element={<SignIn />} />
          <Route path="/signup" element={<SignUp />} />

          {/* Fallback Route */}
          <Route path="*" element={<NotFound />} />
        </Routes>
      </Router>
      <Toaster
        position="bottom-right"
        reverseOrder={false}
        toastOptions={{
          // Tùy chỉnh mặc định cho đẹp
          duration: 4000,
          style: {
            background: '#363636',
            color: '#fff',
          },
          success: {
            duration: 3000,
            iconTheme: {
              primary: 'green',
              secondary: 'black',
            },
          },
        }}
      />
    </>
  );
}