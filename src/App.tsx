import React from 'react';
import { BrowserRouter as Router, Routes, Route, Navigate } from 'react-router-dom';
import { ConfigProvider } from 'antd';
import { Layout } from 'antd';
import './App.css';

// Import Ant Design styles
import 'antd/dist/reset.css';

// Pages
import Login from './pages/auth/Login';
import Signup from './pages/auth/Signup';
import KickCounter from './pages/kickCounter/KickCounter';
import ContractionCounter from './pages/contractionCounter/ContractionCounter';

// Components
import Navbar from './components/Navbar';
import ProtectedRoute from './components/ProtectedRoute';

const { Content } = Layout;

function App() {
  return (
    <ConfigProvider
      theme={{
        token: {
          colorPrimary: '#4a90e2',
        },
      }}
    >
      <Router>
        <Layout style={{ minHeight: '100vh' }}>
          <Navbar />
          <Content style={{ padding: '24px', marginTop: 64 }}>
            <Routes>
              <Route path="/login" element={<Login />} />
              <Route path="/signup" element={<Signup />} />
              <Route path="/kick-counter" element={
                <ProtectedRoute>
                  <KickCounter />
                </ProtectedRoute>
              } />
              <Route path="/contraction-counter" element={
                <ProtectedRoute>
                  <ContractionCounter />
                </ProtectedRoute>
              } />
              <Route path="/" element={<Navigate to="/login" />} />
              <Route path="*" element={<Navigate to="/login" />} />
            </Routes>
          </Content>
        </Layout>
      </Router>
    </ConfigProvider>
  );
}

export default App;
