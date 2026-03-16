import React, { useState, useEffect } from 'react';
import { AnimatePresence, motion } from 'framer-motion';
import { onAuthStateChanged, signOut } from 'firebase/auth';
import { auth } from './firebase';
import BottomBar from './components/Navigation/BottomBar';
import AmberCard from './components/Alerts/AmberCard';
import SkeletonCard from './components/Common/SkeletonCard';
import AdoptionFeed from './pages/Adoption/AdoptionFeed';
import CreateAlert from './pages/Alerts/CreateAlert';
import AdoptionForm from './pages/Adoption/AdoptionForm';
import MatchSuccess from './components/Adoption/MatchSuccess';
import PostAdoption from './pages/Adoption/PostAdoption';
import Chats from './pages/Community/Chats';
import Profile from './pages/Profile/Profile';
import Splash from './pages/Auth/Splash';
import Login from './pages/Auth/Login';
import Register from './pages/Auth/Register';
import ForgotPassword from './pages/Auth/ForgotPassword';
import PetDetails from './components/Common/PetDetails';

import { Loader2 } from 'lucide-react';

import { BASE_URL } from './api';
const TABS = ['home', 'chats', 'panic', 'adoption', 'profile'];

function App() {
  const [view, setView] = useState('splash');
  const [activeTab, setActiveTab] = useState('home');
  const [isLoading, setIsLoading] = useState(true);
  const [authToken, setAuthToken] = useState(null);
  const [showCreateAlert, setShowCreateAlert] = useState(false);
  const [showPostAdoption, setShowPostAdoption] = useState(false);
  const [showMatchAnimation, setShowMatchAnimation] = useState(false);
  const [matchPet, setMatchPet] = useState(null);
  const [selectedPet, setSelectedPet] = useState(null);
  const [insideChat, setInsideChat] = useState(false);
  const [matches, setMatches] = useState([]);

  // --- Real Backend Connection ---
  const [alerts, setAlerts] = useState([]);
  const [loadingAlerts, setLoadingAlerts] = useState(true);

  const fetchBackendAlerts = async () => {
    try {
      setLoadingAlerts(true);
      const headers = authToken ? { 'Authorization': `Bearer ${authToken}` } : {};
      const res = await fetch(`${BASE_URL}/api/alerts/`, { headers });
      if (res.ok) {
        const data = await res.json();
        const formattedAlerts = data.map(item => ({
          id: item.id,
          type: item.type,
          name: 'Desconocido', // Backend feature pending
          breed: item.breed,
          description: item.description,
          location: 'Cerca', // Geocoding pending
          distance: 0,
          time: 'Reciente',
          image: item.image_url || 'https://images.unsplash.com/photo-1543852786-1cf6624b9987?auto=format&fit=crop&q=80&w=200&h=200'
        }));
        setAlerts(formattedAlerts);
      }
    } catch (err) {
      console.error("Error connecting to backend:", err);
    } finally {
      setLoadingAlerts(false);
    }
  };

  useEffect(() => {
    fetchBackendAlerts();
  }, [authToken]); // Re-fetch when token changes
  // ------------------------------

  const [userData, setUserData] = useState(null);

  // Listen to Firebase Auth state changes
  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, async (firebaseUser) => {
      if (firebaseUser) {
        // User is signed in, get fresh token
        const token = await firebaseUser.getIdToken();
        setAuthToken(token);
        // We will receive the full Postgres User object from Login/Register later,
        // but for auto-login we use basic Firebase info initially
        setUserData(prev => prev || {
          name: firebaseUser.displayName || 'Usuario Nuevo',
          email: firebaseUser.email,
          avatar: firebaseUser.photoURL,
          badges: [],
          happyEndings: 0
        });
        if (view === 'splash' || view === 'login' || view === 'register') {
           setView('main');
        }
      } else {
        // User is signed out
        setAuthToken(null);
        setUserData(null);
        if (view === 'main') setView('login');
      }
    });

    return () => unsubscribe();
  }, [view]);

  useEffect(() => {
    if (view === 'main') {
      const timer = setTimeout(() => setIsLoading(false), 1500);
      return () => clearTimeout(timer);
    }
  }, [view]);

  // Android Back Button Support
  useEffect(() => {
    const handleBackButton = () => {
      if (selectedPet) setSelectedPet(null);
      else if (showCreateAlert) setShowCreateAlert(false);
      else if (showPostAdoption) setShowPostAdoption(false);
      else if (matchPet && showMatchAnimation) setShowMatchAnimation(false);
      else if (matchPet) setMatchPet(null);
      else if (insideChat) setInsideChat(false);
    };
    window.addEventListener('popstate', handleBackButton);
    return () => window.removeEventListener('popstate', handleBackButton);
  }, [selectedPet, showCreateAlert, showPostAdoption, matchPet, showMatchAnimation, insideChat]);

  const handleTabChange = (tabId) => {
    if (tabId === 'panic') setShowCreateAlert(true);
    else setActiveTab(tabId);
  };

  const handleDragEnd = (event, info) => {
    if (insideChat) return;
    const swipeThreshold = 50;
    const availableTabs = TABS.filter(t => t !== 'panic');
    const currentIndex = availableTabs.indexOf(activeTab);

    if (info.offset.x < -swipeThreshold && currentIndex < availableTabs.length - 1) {
      setActiveTab(availableTabs[currentIndex + 1]);
    } else if (info.offset.x > swipeThreshold && currentIndex > 0) {
      setActiveTab(availableTabs[currentIndex - 1]);
    }
  };

  const handleMatch = (pet) => {
    setMatchPet(pet);
    setShowMatchAnimation(true);
    setSelectedPet(null);
    if (!matches.find(m => m.id === pet.id)) {
      setMatches(prev => [...prev, pet]);
    }
  };

  const handleLogout = async () => {
    try {
      await signOut(auth);
      setView('login');
      setActiveTab('home');
    } catch (error) {
      console.error("Error signing out:", error);
    }
  };

  if (view === 'splash') return <Splash onComplete={() => setView('login')} />;
  if (view === 'login') return <Login onLogin={(user) => { setUserData(user); setView('main'); }} onSwitchToRegister={() => setView('register')} onForgotPassword={() => setView('forgot-password')} />;
  if (view === 'register') return <Register onRegister={(user) => { setUserData(user); setView('main'); }} onBackToLogin={() => setView('login')} />;
  if (view === 'forgot-password') return <ForgotPassword onBack={() => setView('login')} />;

  return (
    <div className="mobile-container">
      {!insideChat && (
        <header className="app-header-master">
          <div className="header-center-group">
            <h1 className="app-branding-title">
              <span className="turq-text">Cleo</span> <span className="theme-text">PetAlert</span>
            </h1>
          </div>
        </header>
      )}

      <motion.main
        className="main-content-scrollable"
        drag={insideChat ? false : "x"}
        dragConstraints={{ left: 0, right: 0 }}
        dragElastic={0.1}
        onDragEnd={handleDragEnd}
      >
        <AnimatePresence mode="wait" initial={false}>
          {activeTab === 'home' && (
            <motion.div
              key="home"
              initial={{ opacity: 0, x: 50 }}
              animate={{ opacity: 1, x: 0 }}
              exit={{ opacity: 0, x: -50 }}
              transition={{ duration: 0.3 }}
              className="tab-content-wrapper"
            >
              <div className="section-header">
                <h2 className="turq-title">Alertas Activas</h2>
                <div className="section-line"></div>
              </div>

                <div className="alerts-list">
                  {loadingAlerts ? (
                    <><SkeletonCard /><SkeletonCard /></>
                  ) : alerts.length === 0 ? (
                    <div style={{textAlign: 'center', padding: '20px', color: 'var(--text-muted)'}}>
                      No hay alertas reportadas aún.
                    </div>
                  ) : (
                    alerts.map(alert => (
                      <AmberCard key={alert.id} pet={alert} onClick={() => setSelectedPet(alert)} />
                    ))
                  )}
                </div>
            </motion.div>
          )}

          {activeTab === 'chats' && (
            <motion.div
              key="chats"
              initial={{ opacity: 0, x: 50 }}
              animate={{ opacity: 1, x: 0 }}
              exit={{ opacity: 0, x: -50 }}
              transition={{ duration: 0.3 }}
              className={`tab-content-wrapper ${insideChat ? 'no-padding' : ''}`}
            >
              <Chats onChatStatusChange={(isInside) => setInsideChat(isInside)} />
            </motion.div>
          )}

          {activeTab === 'adoption' && (
            <motion.div
              key="adoption"
              initial={{ opacity: 0, x: 50 }}
              animate={{ opacity: 1, x: 0 }}
              exit={{ opacity: 0, x: -50 }}
              transition={{ duration: 0.3 }}
              className="tab-content-wrapper"
            >
              <div className="section-header">
                <h2 className="turq-title">Adoptar un Amigo</h2>
                <p className="section-subtitle">Desliza para conectar</p>
              </div>
              <AdoptionFeed onMatch={handleMatch} onDetails={(pet) => setSelectedPet(pet)} />
            </motion.div>
          )}

          {activeTab === 'profile' && (
            <motion.div
              key="profile"
              initial={{ opacity: 0, x: 50 }}
              animate={{ opacity: 1, x: 0 }}
              exit={{ opacity: 0, x: -50 }}
              transition={{ duration: 0.3 }}
              className="tab-content-wrapper"
            >
              <Profile
                userData={userData}
                setUserData={setUserData}
                matches={matches}
                onUploadAdoption={() => setShowPostAdoption(true)}
                onLogout={handleLogout}
              />
            </motion.div>
          )}
        </AnimatePresence>
      </motion.main>

      {!insideChat && <BottomBar activeTab={activeTab} onTabChange={handleTabChange} />}

      <AnimatePresence>
        {showCreateAlert && (
          <CreateAlert
            onCancel={() => setShowCreateAlert(false)}
            onSuccess={() => setShowCreateAlert(false)}
          />
        )}
        {showPostAdoption && (
          <PostAdoption
            onCancel={() => setShowPostAdoption(false)}
            onSuccess={() => { setShowPostAdoption(false); setActiveTab('adoption'); }}
          />
        )}
        {showMatchAnimation && (
          <MatchSuccess pet={matchPet} onContinue={() => setShowMatchAnimation(false)} />
        )}
        {matchPet && !showMatchAnimation && (
          <AdoptionForm
            pet={matchPet}
            onCancel={() => setMatchPet(null)}
            onSubmit={() => {
              setMatchPet(null);
              setActiveTab('chats');
            }}
          />
        )}
        {selectedPet && (
          <PetDetails 
            pet={selectedPet} 
            onClose={() => setSelectedPet(null)}
            onAction={(action) => {
              if (action === 'match') handleMatch(selectedPet);
              else setSelectedPet(null);
            }}
          />
        )}
      </AnimatePresence>

      <style>{`
        .app-header-master {
          padding: 10px 16px;
          display: flex;
          justify-content: center; /* PERFECT CENTERING LIKE INSTAGRAM */
          align-items: center;
          background: var(--header-bg);
          border-bottom: 1px solid var(--border-color);
          width: 100%;
          position: sticky;
          top: 0;
          z-index: 1000;
          height: 65px;
        }
        .header-center-group { display: flex; align-items: center; justify-content: center; width: 100%; }
        .app-branding-title { 
          font-size: 26px; 
          font-weight: 900; 
          margin: 0; 
          letter-spacing: -0.5px;
          display: flex;
          gap: 8px;
        }
        .theme-text { color: var(--text-main); }
        .turq-text { color: var(--primary); }

        .main-content-scrollable { flex: 1; position: relative; overflow: hidden; touch-action: pan-y; }
        .tab-content-wrapper { height: 100%; width: 100%; padding: 16px; overflow-y: auto; -webkit-overflow-scrolling: touch; }
        .tab-content-wrapper.no-padding { padding: 0; }

        .turq-title { color: var(--primary) !important; font-weight: 900; font-size: 24px; text-align: left; }
        .alerts-list { display: flex; flex-direction: column; gap: 18px; padding-bottom: 100px; }
        .section-header h2 { color: var(--primary); font-weight: 900; font-size: 24px; text-align: left; }
      `}</style>
    </div>
  );
}

export default App;
