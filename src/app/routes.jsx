import React, { useState } from 'react';
import { Routes, Route, Navigate } from 'react-router-dom';
import Layout from './layout';
import Login from '../pages/auth/Login';
import Dashboard from '../pages/dashboard/Dashboard';
import VideoCall from '../pages/Video-Call/Video-Call';
import MaterialTesting from '../pages/Material-Testing/MaterialTesting';

export default function AppRoutes() {




  return (
    <>
      <Routes>
        <Route path="/login" element={<Login />} />
        
        <Route path="/" element={<Layout />}>
          <Route index element={<Navigate to="/dashboard" replace />} />
          <Route path="dashboard" element={<Dashboard />} />
          <Route path="/video-call" element={<VideoCall />} />
          <Route path="/material-testing" element={<MaterialTesting />} />
        </Route>

        <Route path="*" element={<Navigate to="/" replace />} />
      </Routes>


    </>
  );
}
