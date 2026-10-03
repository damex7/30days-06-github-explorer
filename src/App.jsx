import { Route, Routes } from 'react-router-dom'
import AppShell from './components/layout/AppShell.jsx'
import NotFound from './pages/NotFound.jsx'

export default function App() {
  return (
    <Routes>
      <Route element={<AppShell />}>
        <Route index element={<h1 className="text-3xl font-bold">Scout</h1>} />
        <Route path="*" element={<NotFound />} />
      </Route>
    </Routes>
  )
}
