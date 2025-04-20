import React, { useState } from 'react';
import { Link, useNavigate, useLocation } from 'react-router-dom';
import { Layout, Menu, Button, Typography, Dropdown, Avatar, Space } from 'antd';
import { 
  UserOutlined, 
  HeartOutlined, 
  PlusCircleOutlined,
  LogoutOutlined,
  MenuOutlined
} from '@ant-design/icons';
import { authService } from '../services/api';

const { Header } = Layout;
const { Title, Text } = Typography;

const Navbar: React.FC = () => {
  const navigate = useNavigate();
  const location = useLocation();
  const isAuthenticated = authService.isAuthenticated();
  const currentUser = authService.getCurrentUser();
  const [mobileMenuVisible, setMobileMenuVisible] = useState(false);
  
  const handleLogout = () => {
    authService.logout();
    navigate('/login');
  };
  
  const items = [
    {
      key: 'kick',
      label: <Link to="/kick-counter">Kick Counter</Link>,
      icon: <HeartOutlined />,
      className: location.pathname === '/kick-counter' ? 'ant-menu-item-selected' : ''
    },
    {
      key: 'contraction',
      label: <Link to="/contraction-counter">Contraction Counter</Link>,
      icon: <PlusCircleOutlined />,
      className: location.pathname === '/contraction-counter' ? 'ant-menu-item-selected' : ''
    }
  ];
  
  const userMenuItems = [
    {
      key: 'logout',
      label: 'Logout',
      icon: <LogoutOutlined />,
      onClick: handleLogout
    }
  ];

  const toggleMobileMenu = () => {
    setMobileMenuVisible(!mobileMenuVisible);
  };

  return (
    <>
      <Header style={{ 
        position: 'fixed', 
        zIndex: 1, 
        width: '100%', 
        display: 'flex', 
        alignItems: 'center', 
        justifyContent: 'space-between',
        padding: '0 20px'
      }}>
        <div className="logo" style={{ display: 'flex', alignItems: 'center' }}>
          <Link to="/" style={{ color: 'white', textDecoration: 'none' }}>
            <Title level={4} style={{ color: 'white', margin: 0 }}>
              Baby Health
            </Title>
          </Link>
        </div>
        
        <div style={{ display: 'flex', alignItems: 'center' }}>
          {/* Desktop menu */}
          <div className="desktop-menu" style={{ display: 'none' }}>
            {isAuthenticated && (
              <Menu
                theme="dark"
                mode="horizontal"
                selectedKeys={[location.pathname === '/kick-counter' ? 'kick' : location.pathname === '/contraction-counter' ? 'contraction' : '']}
                items={items}
                style={{ minWidth: 200, borderBottom: 'none' }}
              />
            )}
          </div>
          
          {/* Mobile menu button */}
          <Button 
            type="text" 
            icon={<MenuOutlined style={{ color: 'white', fontSize: '18px' }} />} 
            onClick={toggleMobileMenu}
            style={{ marginRight: 16 }}
            className="mobile-menu-button"
          />
          
          {isAuthenticated ? (
            <Dropdown menu={{ items: userMenuItems }} placement="bottomRight">
              <div style={{ cursor: 'pointer', display: 'flex', alignItems: 'center' }}>
                <Avatar icon={<UserOutlined />} style={{ backgroundColor: '#1677ff' }} />
                <Text style={{ color: 'white', marginLeft: 8 }} className="user-name">
                  {currentUser?.name}
                </Text>
              </div>
            </Dropdown>
          ) : (
            <Space>
              <Button type="link" style={{ color: 'white' }} onClick={() => navigate('/login')}>
                Login
              </Button>
              <Button type="primary" onClick={() => navigate('/signup')}>
                Sign Up
              </Button>
            </Space>
          )}
        </div>
      </Header>
      
      {/* Mobile menu */}
      {mobileMenuVisible && isAuthenticated && (
        <div style={{
          position: 'fixed',
          top: 64,
          left: 0,
          width: '100%',
          zIndex: 999,
          backgroundColor: '#001529',
          padding: '8px 0',
          boxShadow: '0 2px 8px rgba(0,0,0,0.15)'
        }}>
          <Menu
            theme="dark"
            mode="vertical"
            selectedKeys={[location.pathname === '/kick-counter' ? 'kick' : location.pathname === '/contraction-counter' ? 'contraction' : '']}
            items={items}
            style={{ width: '100%', borderRight: 'none' }}
            onClick={() => setMobileMenuVisible(false)}
          />
        </div>
      )}
      
      {/* Placeholder for fixed header */}
      <div style={{ height: 64 }} />
      
      {/* CSS for responsive design */}
      <style>{`
        @media (min-width: 768px) {
          .desktop-menu {
            display: block !important;
          }
          .mobile-menu-button {
            display: none !important;
          }
        }
        @media (max-width: 767px) {
          .desktop-menu {
            display: none !important;
          }
          .mobile-menu-button {
            display: block !important;
          }
          .user-name {
            display: none;
          }
        }
        @media (min-width: 576px) {
          .user-name {
            display: inline !important;
          }
        }
      `}</style>
    </>
  );
};

export default Navbar; 