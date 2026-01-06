import { Routes, Route } from 'react-router-dom'
import Layout from './components/Layout'
import HomePage from './pages/HomePage'
import TripDetailPage from './pages/TripDetailPage'
import NewTripPage from './pages/NewTripPage'
import ExchangePage from './pages/ExchangePage'
import WeeklyTimelinePage from './pages/WeeklyTimelinePage'

function App() {
  return (
    <Routes>
      <Route path="/" element={<Layout />}>
        <Route index element={<HomePage />} />
        <Route path="trip/new" element={<NewTripPage />} />
        <Route path="trip/:tripId" element={<TripDetailPage />} />
        <Route path="trip/:tripId/timeline" element={<WeeklyTimelinePage />} />
        <Route path="exchange" element={<ExchangePage />} />
      </Route>
    </Routes>
  )
}

export default App
