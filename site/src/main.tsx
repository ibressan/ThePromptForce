import React from 'react';
import ReactDOM from 'react-dom/client';
import { HashRouter, Routes, Route } from 'react-router-dom';
import { LanguageProvider } from './i18n/LanguageContext';
import FrontPage from './pages/FrontPage';
import EditionPage from './pages/EditionPage';
import './assets/index.css';

ReactDOM.createRoot(document.getElementById('root')!).render(
  <React.StrictMode>
    <LanguageProvider>
      <HashRouter>
        <Routes>
          <Route path="/" element={<FrontPage />} />
          <Route path="/edition/:date" element={<EditionPage />} />
        </Routes>
      </HashRouter>
    </LanguageProvider>
  </React.StrictMode>,
);
