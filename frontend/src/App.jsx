import React from 'react';
import { BrowserRouter, Routes, Route } from 'react-router-dom';
import Landing from './views/Landing';
import HostView from './views/HostView';
import PlayerView from './views/PlayerView';
import CreateQuiz from './views/CreateQuiz';
import ResultsView from './views/ResultsView';
import SignIn from './views/SignIn';
import SignUp from './views/SignUp';
import AdminView from './views/AdminView';

function App() {
  return (
    <BrowserRouter>
      <Routes>
        <Route path="/" element={<Landing />} />
        <Route path="/host" element={<HostView />} />
        <Route path="/play" element={<PlayerView />} />
        <Route path="/create" element={<CreateQuiz />} />
        <Route path="/results" element={<ResultsView />} />
        <Route path="/signin" element={<SignIn />} />
        <Route path="/signup" element={<SignUp />} />
        <Route path="/admin" element={<AdminView />} />
      </Routes>
    </BrowserRouter>
  );
}

export default App;
