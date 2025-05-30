import { BrowserRouter, Route, Routes } from 'react-router-dom';

import { CssBaseline } from '@mui/material';
import { LocalizationProvider } from '@mui/x-date-pickers';
import { AdapterDateFns } from '@mui/x-date-pickers/AdapterDateFns';

import Layout from './components/layout';
import Accounts from './pages/accounts';
import Dashboard from './pages/dashboard';
import Logs from './pages/logs';
import MovieDetails from './pages/movieDetails';
import Movies from './pages/movies';
import ShowDetails from './pages/showDetails';
import Shows from './pages/shows';
import SystemNotifications from './pages/systemNotifications';

function App() {
  return (
    <LocalizationProvider dateAdapter={AdapterDateFns}>
      <CssBaseline />
      <BrowserRouter>
        <Routes>
          <Route path="/" element={<Layout />}>
            <Route index element={<Dashboard />} />
            <Route path="accounts" element={<Accounts />} />
            <Route path="notifications" element={<SystemNotifications />} />
            <Route path="logs" element={<Logs />} />
            <Route path="shows" element={<Shows />} />
            <Route path="shows/:id" element={<ShowDetails />} />
            <Route path="movies" element={<Movies />} />
            <Route path="movies/:id" element={<MovieDetails />} />
          </Route>
        </Routes>
      </BrowserRouter>
    </LocalizationProvider>
  );
}

export default App;
