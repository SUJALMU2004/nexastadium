import { Navigate, Route, BrowserRouter as Router, Routes } from "react-router-dom";
import "./i18n.js";
import ErrorBoundary from "./components/common/ErrorBoundary.jsx";
import Footer from "./components/common/Footer.jsx";
import Navbar from "./components/common/Navbar.jsx";
import { StadiumProvider } from "./context/StadiumContext.jsx";
import AccessibilityGuide from "./pages/fan/AccessibilityGuide.jsx";
import AIAssistant from "./pages/fan/AIAssistant.jsx";
import FanHome from "./pages/fan/FanHome.jsx";
import SafetyGuide from "./pages/fan/SafetyGuide.jsx";
import StadiumNavigator from "./pages/fan/StadiumNavigator.jsx";
import TripPlanner from "./pages/fan/TripPlanner.jsx";
import AnnouncementDraft from "./pages/ops/AnnouncementDraft.jsx";
import CrowdSimulator from "./pages/ops/CrowdSimulator.jsx";
import IncidentManager from "./pages/ops/IncidentManager.jsx";
import MatchDayBriefing from "./pages/ops/MatchDayBriefing.jsx";
import OpsDashboard from "./pages/ops/OpsDashboard.jsx";
import OperationsReport from "./pages/ops/OperationsReport.jsx";
import SustainabilityTracker from "./pages/ops/SustainabilityTracker.jsx";
import EgressPlanner from "./pages/transit/EgressPlanner.jsx";
import FlowControl from "./pages/transit/FlowControl.jsx";
import RouteRecommender from "./pages/transit/RouteRecommender.jsx";
import TransportAlerts from "./pages/transit/TransportAlerts.jsx";

/**
 * Render the public NexaStadium AI application shell and route map.
 *
 * @returns {JSX.Element} Open-access app routes for Fan, Ops, and Transit portals.
 */
export default function App() {
  return (
    <ErrorBoundary>
      <StadiumProvider>
        <Router future={{ v7_startTransition: true, v7_relativeSplatPath: true }}>
          <div className="flex min-h-screen flex-col bg-stadium-surface">
            <Navbar />
            <main id="main-content" className="mx-auto w-full max-w-7xl flex-1 px-4 py-8 lg:px-8">
              <Routes>
                <Route path="/" element={<FanHome />} />
                <Route path="/fan" element={<Navigate to="/" replace />} />
                <Route path="/fan/assistant" element={<AIAssistant />} />
                <Route path="/fan/navigator" element={<StadiumNavigator />} />
                <Route path="/fan/trip-planner" element={<TripPlanner />} />
                <Route path="/fan/accessibility" element={<AccessibilityGuide />} />
                <Route path="/fan/safety-guide" element={<SafetyGuide />} />
                <Route path="/ops" element={<OpsDashboard />} />
                <Route path="/ops/incidents" element={<IncidentManager />} />
                <Route path="/ops/announcements" element={<AnnouncementDraft />} />
                <Route path="/ops/sustainability" element={<SustainabilityTracker />} />
                <Route path="/ops/simulator" element={<CrowdSimulator />} />
                <Route path="/ops/briefing" element={<MatchDayBriefing />} />
                <Route path="/ops/reports" element={<OperationsReport />} />
                <Route path="/transit" element={<EgressPlanner />} />
                <Route path="/transit/egress" element={<EgressPlanner />} />
                <Route path="/transit/routes" element={<RouteRecommender />} />
                <Route path="/transit/alerts" element={<TransportAlerts />} />
                <Route path="/transit/flow-control" element={<FlowControl />} />
                <Route path="*" element={<Navigate to="/" replace />} />
              </Routes>
            </main>
            <Footer />
          </div>
        </Router>
      </StadiumProvider>
    </ErrorBoundary>
  );
}

App.propTypes = {};
