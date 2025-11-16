import { BrowserRouter as Router, Routes, Route } from 'react-router-dom';
import HomePage from './pages/HomePage/HomePage';
import SignupPage from './pages/SignupPage/SignupPage';
import LoginPage from './pages/LoginPage/LoginPage';
import MatchingPage from './pages/MatchingPage/MatchingPage';
import ViewMapPage from './pages/ViewMapPage/ViewMapPage';
import InformationPage from './pages/InformationPage/InformationPage';
import SettingPage from './pages/SettingPage/SettingPage';
import ContributorMatchPage from './pages/ContributorMatchPage/ContributorMatchPage';
import RecipientMatchPage from './pages/RecipientMatchPage/RecipientMatchPage';

function App() {
  return (
    <Router>
      <Routes>
        <Route path="/" element={<HomePage />} />
        <Route path="/signup" element={<SignupPage />} />
        <Route path="/login" element={<LoginPage />} />
        <Route path="/matching" element={<MatchingPage />} />
        <Route path="/map" element={<ViewMapPage />} />
        <Route path="/information" element={<InformationPage />} />
        <Route path="/setting" element={<SettingPage />} />
        <Route path="/contributor-match" element={<ContributorMatchPage />} />
        <Route path="/recipient-match" element={<RecipientMatchPage />} />
      </Routes>
    </Router>
  );
}

export default App;

