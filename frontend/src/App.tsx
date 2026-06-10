import { lazy, Suspense } from 'react'
import { Routes, Route } from 'react-router-dom'
import Layout from './components/Layout'
import HomePage from './pages/HomePage'

// Lazy load non-critical pages
const TripDetailPage = lazy(() => import('./pages/TripDetailPage'))
const NewTripPage = lazy(() => import('./pages/NewTripPage'))
const ExchangePage = lazy(() => import('./pages/ExchangePage'))
const WeeklyTimelinePage = lazy(() => import('./pages/WeeklyTimelinePage'))

// Loading fallback component
function PageLoader() {
  return (
    <div className="flex items-center justify-center min-h-[50vh]">
      <div className="animate-spin rounded-full h-12 w-12 border-4 border-primary-500 border-t-transparent"></div>
    </div>
  )
}

function App() {
  return (
    <Routes>
      <Route path="/" element={<Layout />}>
        <Route index element={<HomePage />} />
        <Route path="trip/new" element={
          <Suspense fallback={<PageLoader />}>
            <NewTripPage />
          </Suspense>
        } />
        <Route path="trip/:tripId" element={
          <Suspense fallback={<PageLoader />}>
            <TripDetailPage />
          </Suspense>
        } />
        <Route path="trip/:tripId/timeline" element={
          <Suspense fallback={<PageLoader />}>
            <WeeklyTimelinePage />
          </Suspense>
        } />
        <Route path="exchange" element={
          <Suspense fallback={<PageLoader />}>
            <ExchangePage />
          </Suspense>
        } />
      </Route>
    </Routes>
  )
}

export default App
