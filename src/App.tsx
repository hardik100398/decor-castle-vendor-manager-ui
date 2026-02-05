import { Routes, Route } from 'react-router-dom'
import './App.css'
import Layout from './modules/common/layout'
import VendorsList from './pages/vendorsList'

function App() {
  return (
    <Layout>
      <Routes>
        <Route path="/" element={<div>Home</div>} />
        <Route path="/vendors" element={<VendorsList />} />
      </Routes>
    </Layout>
  )
}

export default App
