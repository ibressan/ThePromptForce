import React from 'react';
import ReactDOM from 'react-dom/client';
import { HashRouter, Routes, Route } from 'react-router-dom';
import { LanguageProvider } from './i18n/LanguageContext';
import FrontPage from './pages/FrontPage';
import EditionPage from './pages/EditionPage';
import AboutPage from './pages/AboutPage';
import CategoryPage from './pages/CategoryPage';
import BlogPostPage from './pages/BlogPostPage';
import BlogCategoryPage from './pages/BlogCategoryPage';
import './assets/index.css';

ReactDOM.createRoot(document.getElementById('root')!).render(
  <React.StrictMode>
    <LanguageProvider>
      <HashRouter>
        <Routes>
          <Route path="/" element={<FrontPage mode="all" />} />
          <Route path="/news" element={<FrontPage mode="news" />} />
          <Route path="/news/edition/:date" element={<EditionPage />} />
          <Route path="/news/category/:slug" element={<CategoryPage />} />
          <Route path="/blog" element={<FrontPage mode="blog" />} />
          <Route path="/blog/category/:slug" element={<BlogCategoryPage />} />
          <Route path="/blog/:slug" element={<BlogPostPage />} />
          <Route path="/about" element={<AboutPage />} />
        </Routes>
      </HashRouter>
    </LanguageProvider>
  </React.StrictMode>,
);
