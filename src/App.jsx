import { lazy } from 'react'
import { Route, Routes } from 'react-router-dom'
import AppShell from './components/layout/AppShell.jsx'
import Home from './pages/Home.jsx'
import NotFound from './pages/NotFound.jsx'

// Split by page: the chart library (Recharts) only downloads when a profile opens.
const Profile = lazy(() => import('./pages/Profile.jsx'))
const Explore = lazy(() => import('./pages/Explore.jsx'))
const Compare = lazy(() => import('./pages/Compare.jsx'))

export default function App() {
  return (
    <Routes>
      <Route element={<AppShell />}>
        <Route index element={<Home />} />
        <Route path="user/:username" element={<Profile />} />
        <Route path="explore" element={<Explore />} />
        <Route path="compare" element={<Compare />} />
        <Route path="*" element={<NotFound />} />
      </Route>
    </Routes>
  )
}
