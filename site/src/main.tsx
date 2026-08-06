import React from 'react';
import ReactDOM from 'react-dom/client';
import { HashRouter, Routes, Route } from 'react-router-dom';
import { LanguageProvider } from './i18n/LanguageContext';
import FrontPage from './pages/FrontPage';
import EditionPage from './pages/EditionPage';
import AboutPage from './pages/AboutPage';
import CategoryPage from './pages/CategoryPage';
import './assets/index.css';

ReactDOM.createRoot(document.getElementById('root')!).render(
  <React.StrictMode>
    <LanguageProvider>
      <HashRouter>
        <Routes>
          <Route path="/" element={<FrontPage />} />
          <Route path="/edition/:date" element={<EditionPage />} />
          <Route path="/category/:slug" element={<CategoryPage />} />
          <Route path="/about" element={<AboutPage />} />
        </Routes>
      </HashRouter>
    </LanguageProvider>
  </React.StrictMode>,
);
