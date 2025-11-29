import { Provider } from 'react-redux';
import { BrowserRouter, Route, Routes } from 'react-router-dom';

import { CssBaseline } from '@mui/material';
import { LocalizationProvider } from '@mui/x-date-pickers';
import { AdapterDateFns } from '@mui/x-date-pickers/AdapterDateFns';

import store from './app/store';
import Layout from './components/layout';
import AccountDetails from './pages/accountDetails';
import Accounts from './pages/accounts';
import ArchiveLogs from './pages/archiveLogs';
import Dashboard from './pages/dashboard';
import DBHealth from './pages/dbHealth';
import EmailManagement from './pages/email';
import Jobs from './pages/jobs';
import Logs from './pages/logs';
import MovieDetails from './pages/movieDetails';
import Movies from './pages/movies';
import Notifications from './pages/notifications';
import People from './pages/people';
import PerformanceTrends from './pages/performanceTrends';
import PersonDetails from './pages/personDetails';
import QueryHistory from './pages/queryHistory';
import ShowDetails from './pages/showDetails';
import Shows from './pages/shows';
import SlowestQueries from './pages/slowestQueries';
import Statistics from './pages/statistics';
import WeeklyEmailManagement from './pages/weeklyEmail';

function App() {
  return (
    <Provider store={store}>
      <LocalizationProvider dateAdapter={AdapterDateFns}>
        <CssBaseline />
        <BrowserRouter>
          <Routes>
            <Route path="/" element={<Layout />}>
              <Route index element={<Dashboard />} />
              <Route path="dbHealth" element={<DBHealth />} />
              <Route path="queryHistory" element={<QueryHistory />} />
              <Route path="slowestQueries" element={<SlowestQueries />} />
              <Route path="archiveLogs" element={<ArchiveLogs />} />
              <Route path="performanceTrends" element={<PerformanceTrends />} />
              <Route path="statistics" element={<Statistics />} />
              <Route path="accounts" element={<Accounts />} />
              <Route path="jobs" element={<Jobs />} />
              <Route path="accounts/:id" element={<AccountDetails />} />
              <Route path="notifications" element={<Notifications />} />
              <Route path="email" element={<EmailManagement />} />
              <Route path="weeklyEmail" element={<WeeklyEmailManagement />} />
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
    </Provider>
  );
}

export default App;
