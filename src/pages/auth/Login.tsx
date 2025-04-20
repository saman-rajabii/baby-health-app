import React, { useState } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { Formik, Form } from 'formik';
import * as Yup from 'yup';
import { 
  Card, 
  Typography, 
  Button, 
  Input, 
  Alert, 
  Space,
  Divider 
} from 'antd';
import { UserOutlined, LockOutlined } from '@ant-design/icons';
import { authService } from '../../services/api';

const { Title, Text } = Typography;

interface LoginFormValues {
  email: string;
  password: string;
}

const validationSchema = Yup.object({
  email: Yup.string()
    .email('Enter a valid email')
    .required('Email is required'),
  password: Yup.string()
    .min(6, 'Password should be of minimum 6 characters length')
    .required('Password is required'),
});

const Login: React.FC = () => {
  const navigate = useNavigate();
  const [error, setError] = useState<string | null>(null);
  
  const initialValues: LoginFormValues = {
    email: '',
    password: '',
  };
  
  const handleSubmit = async (values: LoginFormValues, { setSubmitting }: any) => {
    try {
      setError(null);
      await authService.login(values.email, values.password);
      navigate('/kick-counter');
    } catch (err: any) {
      setError(err.response?.data?.message || 'Login failed. Please try again.');
    } finally {
      setSubmitting(false);
    }
  };
  
  return (
    <div style={{ display: 'flex', justifyContent: 'center', marginTop: 80 }}>
      <Card 
        style={{ 
          width: '100%', 
          maxWidth: 400,
          boxShadow: '0 4px 12px rgba(0,0,0,0.1)',
          borderRadius: 8
        }}
      >
        <Title level={2} style={{ textAlign: 'center', marginBottom: 24 }}>
          Login
        </Title>
        
        {error && (
          <Alert
            message={error}
            type="error"
            showIcon
            style={{ marginBottom: 24 }}
          />
        )}
        
        <Formik
          initialValues={initialValues}
          validationSchema={validationSchema}
          onSubmit={handleSubmit}
        >
          {({ errors, touched, isSubmitting, handleChange, handleBlur, values }) => (
            <Form>
              <div style={{ marginBottom: 16 }}>
                <Input
                  id="email"
                  name="email"
                  placeholder="Email Address"
                  prefix={<UserOutlined />}
                  onChange={handleChange}
                  onBlur={handleBlur}
                  value={values.email}
                  status={touched.email && errors.email ? 'error' : ''}
                  size="large"
                />
                {touched.email && errors.email && (
                  <div style={{ color: '#ff4d4f', fontSize: '12px', marginTop: 4 }}>
                    {errors.email}
                  </div>
                )}
              </div>
              
              <div style={{ marginBottom: 24 }}>
                <Input.Password
                  id="password"
                  name="password"
                  placeholder="Password"
                  prefix={<LockOutlined />}
                  onChange={handleChange}
                  onBlur={handleBlur}
                  value={values.password}
                  status={touched.password && errors.password ? 'error' : ''}
                  size="large"
                />
                {touched.password && errors.password && (
                  <div style={{ color: '#ff4d4f', fontSize: '12px', marginTop: 4 }}>
                    {errors.password}
                  </div>
                )}
              </div>
              
              <Button
                type="primary"
                htmlType="submit"
                block
                loading={isSubmitting}
                size="large"
              >
                {isSubmitting ? 'Logging in...' : 'Login'}
              </Button>
            </Form>
          )}
        </Formik>
        
        <Divider style={{ margin: '24px 0' }}>
          <Text type="secondary">Don't have an account?</Text>
        </Divider>
        
        <Button 
          type="default" 
          block
          onClick={() => navigate('/signup')}
          size="large"
        >
          Create an Account
        </Button>
      </Card>
    </div>
  );
};

export default Login; 