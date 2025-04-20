import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { Formik, Form } from 'formik';
import * as Yup from 'yup';
import { 
  Card, 
  Typography, 
  Button, 
  Input, 
  Alert, 
  Divider 
} from 'antd';
import { UserOutlined, MailOutlined, LockOutlined } from '@ant-design/icons';
import { authService } from '../../services/api';

const { Title, Text } = Typography;

interface SignupFormValues {
  name: string;
  email: string;
  password: string;
  confirmPassword: string;
}

const validationSchema = Yup.object({
  name: Yup.string()
    .required('Name is required'),
  email: Yup.string()
    .email('Enter a valid email')
    .required('Email is required'),
  password: Yup.string()
    .min(6, 'Password should be of minimum 6 characters length')
    .required('Password is required'),
  confirmPassword: Yup.string()
    .oneOf([Yup.ref('password')], 'Passwords must match')
    .required('Confirm Password is required'),
});

const Signup: React.FC = () => {
  const navigate = useNavigate();
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState<string | null>(null);
  
  const initialValues: SignupFormValues = {
    name: '',
    email: '',
    password: '',
    confirmPassword: '',
  };
  
  const handleSubmit = async (values: SignupFormValues, { setSubmitting, resetForm }: any) => {
    try {
      setError(null);
      await authService.signup(values.name, values.email, values.password);
      setSuccess('Registration successful! Redirecting to login...');
      resetForm();
      setTimeout(() => {
        navigate('/login');
      }, 2000);
    } catch (err: any) {
      setError(err.response?.data?.message || 'Registration failed. Please try again.');
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
          Create Account
        </Title>
        
        {error && (
          <Alert
            message={error}
            type="error"
            showIcon
            style={{ marginBottom: 24 }}
          />
        )}
        
        {success && (
          <Alert
            message={success}
            type="success"
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
                  id="name"
                  name="name"
                  placeholder="Full Name"
                  prefix={<UserOutlined />}
                  onChange={handleChange}
                  onBlur={handleBlur}
                  value={values.name}
                  status={touched.name && errors.name ? 'error' : ''}
                  size="large"
                />
                {touched.name && errors.name && (
                  <div style={{ color: '#ff4d4f', fontSize: '12px', marginTop: 4 }}>
                    {errors.name}
                  </div>
                )}
              </div>
              
              <div style={{ marginBottom: 16 }}>
                <Input
                  id="email"
                  name="email"
                  placeholder="Email Address"
                  prefix={<MailOutlined />}
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
              
              <div style={{ marginBottom: 16 }}>
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
              
              <div style={{ marginBottom: 24 }}>
                <Input.Password
                  id="confirmPassword"
                  name="confirmPassword"
                  placeholder="Confirm Password"
                  prefix={<LockOutlined />}
                  onChange={handleChange}
                  onBlur={handleBlur}
                  value={values.confirmPassword}
                  status={touched.confirmPassword && errors.confirmPassword ? 'error' : ''}
                  size="large"
                />
                {touched.confirmPassword && errors.confirmPassword && (
                  <div style={{ color: '#ff4d4f', fontSize: '12px', marginTop: 4 }}>
                    {errors.confirmPassword}
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
                {isSubmitting ? 'Signing up...' : 'Sign Up'}
              </Button>
            </Form>
          )}
        </Formik>
        
        <Divider style={{ margin: '24px 0' }}>
          <Text type="secondary">Already have an account?</Text>
        </Divider>
        
        <Button 
          type="default" 
          block
          onClick={() => navigate('/login')}
          size="large"
        >
          Login
        </Button>
      </Card>
    </div>
  );
};

export default Signup; 