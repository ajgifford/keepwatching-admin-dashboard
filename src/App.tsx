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
import Notifications from './pages/notifications';
import People from './pages/people';
import PersonDetails from './pages/personDetails';
import ShowDetails from './pages/showDetails';
import Shows from './pages/shows';

function App() {
  return (
    <LocalizationProvider dateAdapter={AdapterDateFns}>
      <CssBaseline />
      <BrowserRouter>
        <Routes>
          <Route path="/" element={<Layout />}>
            <Route index element={<Dashboard />} />
            <Route path="accounts" element={<Accounts />} />
            <Route path="notifications" element={<Notifications />} />
            <Route path="logs" element={<Logs />} />
            <Route path="shows" element={<Shows />} />
            <Route path="shows/:id" element={<ShowDetails />} />
            <Route path="movies" element={<Movies />} />
            <Route path="movies/:id" element={<MovieDetails />} />
            <Route path="people" element={<People />} />
            <Route path="people/:id" element={<PersonDetails />} />
          </Route>
        </Routes>
      </BrowserRouter>
    </LocalizationProvider>
  );
}

export default App;
