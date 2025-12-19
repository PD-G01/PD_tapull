import { BrowserRouter as Router, Routes, Route } from 'react-router-dom';
import HomePage from './pages/HomePage/HomePage';
import SignupPage from './pages/SignupPage/SignupPage';
import LoginPage from './pages/LoginPage/LoginPage';
import MatchingPage from './pages/MatchingPage/MatchingPage';
import ViewMapPage from './pages/ViewMapPage/ViewMapPage';
import InformationPage from './pages/InformationPage/InformationPage';
import SettingPage from './pages/SettingPage/SettingPage';
import ChatPage from './pages/ChatPage/ChatPage';
import TermsPage from './pages/TermsPage/TermsPage';
import PrivacyPage from './pages/PrivacyPage/PrivacyPage';
import MyInformationPage from './pages/MyInformationPage/MyInformationPage';

function App() {
  return (
    <Router>
      <Routes>
        <Route path="/" element={<LoginPage />} />
        <Route path="/signup" element={<SignupPage />} />
        <Route path="/login" element={<LoginPage />} />
        <Route path="/matching" element={<MatchingPage />} />
        <Route path="/map" element={<ViewMapPage />} />
        <Route path="/information" element={<InformationPage />} />
        <Route path="/setting" element={<SettingPage />} />
        <Route path="/chat" element={<ChatPage />} />
        <Route path="/terms" element={<TermsPage />} />
        <Route path="/privacy" element={<PrivacyPage />} />
        <Route path="/my-information" element={<MyInformationPage />} />
      </Routes>
    </Router>
  );
}

export default App;

