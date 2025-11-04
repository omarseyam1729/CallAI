// src/App.jsx
import React from "react";
import { BrowserRouter as Router, Routes, Route } from "react-router-dom";
import Layout from "./components/core/Layout";
import Dashboard from "./pages/dashboard/Dashboard";
import Batches from "./pages/batches/Batches";
import BatchDetail from "./pages/batches/BatchDetail";
import ScheduleMode from "./pages/schedule/ScheduleMode";
import CallExplorer from "./pages/calls/CallExplorer";
import CallDetails from "./pages/calls/CallDetails";   
import Triggers from "./pages/triggers/Triggers";   
import AgentsPage from "./pages/agents/AgentsPage";
import TriggerEvaluations from "./pages/triggers/TriggerEvaluations";


function App() {
  return (
    <Router>
      <Layout>
        <Routes>
          <Route path="/" element={<Dashboard />} />
          <Route path="/schedule" element={<ScheduleMode />} />
          <Route path="/explorer" element={<CallExplorer />} />
          <Route path="/calls/:id" element={<CallDetails />} />
          <Route path="/triggers" element={<Triggers />} />
          <Route path="/triggers/:id" element={<TriggerEvaluations />} />
          <Route path="/batches" element={<Batches />} />
          <Route path="/batches/:batchId" element={<BatchDetail />} />  
          <Route path="/agents" element={<AgentsPage />} />
        </Routes>
      </Layout>
    </Router>
  );
}

export default App;
