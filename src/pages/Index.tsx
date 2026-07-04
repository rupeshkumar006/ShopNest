import React from 'react';
import { useUserAuth } from '../context/UserAuthContext';
import Home from './Home';
import Login from './Login';
import { Navigate } from 'react-router-dom';

const Index = () => <Navigate to="/home" replace />;

export default Index;
