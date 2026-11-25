import React, { useEffect } from 'react';
import { usePath, isAppRoute } from './utils/router';
import { ProductStoryPage } from './pages/ProductStoryPage';
import { AnalysisAppPage } from './pages/AnalysisAppPage';

export const App: React.FC = () => {
  const [currentPath, navigate] = usePath();
  const isApp = isAppRoute(currentPath);

  useEffect(() => {
    if (isApp) {
      document.title = 'Debunk — Bản demo cục bộ';
    } else {
      document.title = 'Debunk — Dừng một nhịp trước khi tin';
    }
  }, [isApp]);

  if (isApp) {
    return <AnalysisAppPage onNavigateHome={() => navigate('/')} />;
  }

  return <ProductStoryPage onNavigate={navigate} />;
};

export default App;
