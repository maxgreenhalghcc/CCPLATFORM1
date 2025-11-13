import { Navigate, Route, Routes } from 'react-router-dom';
import QuizPage from './pages/QuizPage';

function App() {
  return (
    <Routes>
      <Route path="/bars/:barSlug/build" element={<QuizPage />} />
      <Route path="*" element={<Navigate to="/bars/demo-bar/build" replace />} />
    </Routes>
  );
}

export default App;
