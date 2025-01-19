// src/routes/fertilizer.jsx
import { FertilizerProvider } from '@/context/FertilizerContext';
import { useAuth } from '@/hooks/useAuth'; // Add this import
import AdminFertilizerAllocations from '@/pages/admin/fertilizer/Allocations';
import AdminFertilizerDashboard from '@/pages/admin/fertilizer/Dashboard';
import FarmerFertilizerAllocations from '@/pages/farmer/fertilizer/Allocations';
import FarmerFertilizerDashboard from '@/pages/farmer/fertilizer/Dashboard';
import { Navigate, Route, Routes } from 'react-router-dom';

export const FertilizerRoutes = () => {
  const { user } = useAuth();

  return (
    <FertilizerProvider>
      <Routes>
        {user?.role === 'ADMIN' ? (
          <>
            <Route path="dashboard" element={<AdminFertilizerDashboard />} />
            <Route path="allocations" element={<AdminFertilizerAllocations />} />
          </>
        ) : (
          <>
            <Route path="dashboard" element={<FarmerFertilizerDashboard />} />
            <Route path="allocations" element={<FarmerFertilizerAllocations />} />
          </>
        )}
        <Route path="*" element={<Navigate to="dashboard" replace />} />
      </Routes>
    </FertilizerProvider>
  );
};

export default FertilizerRoutes;