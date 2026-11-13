import { createBrowserRouter } from 'react-router-dom';
import AppLayout from '../components/layout/AppLayout';

export const router = createBrowserRouter([
  {
    path: '/',
    element: <AppLayout />,
    children: [
      {
        index: true,
        lazy: async () => {
          const { default: Home } = await import('../pages/Home');
          return { Component: Home };
        },
      },
      {
        path: 'medicines',
        lazy: async () => {
          const { default: Medicines } = await import('../pages/Medicines');
          return { Component: Medicines };
        },
      },
      {
        path: 'medicines/:medicineId',
        lazy: async () => {
          const { default: MedicineDetail } = await import('../pages/MedicineDetail');
          return { Component: MedicineDetail };
        },
      },
      {
        path: 'medicine-information',
        lazy: async () => {
          const { default: MedicineInformation } = await import('../pages/MedicineInformation');
          return { Component: MedicineInformation };
        },
      },
      {
        path: 'schedule',
        lazy: async () => {
          const { default: Schedule } = await import('../pages/Schedule');
          return { Component: Schedule };
        },
      },
      {
        path: 'first-aid',
        lazy: async () => {
          const { default: FirstAid } = await import('../pages/FirstAid');
          return { Component: FirstAid };
        },
      },
      {
        path: 'emergency',
        lazy: async () => {
          const { default: Emergency } = await import('../pages/Emergency');
          return { Component: Emergency };
        },
      },
      {
        path: 'profile',
        lazy: async () => {
          const { default: Profile } = await import('../pages/Profile');
          return { Component: Profile };
        },
      },
      {
        path: 'auth/signin',
        lazy: async () => {
          const { default: SignIn } = await import('../pages/auth/SignIn');
          return { Component: SignIn };
        },
      },
      {
        path: 'auth/signup',
        lazy: async () => {
          const { default: SignUp } = await import('../pages/auth/SignUp');
          return { Component: SignUp };
        },
      },
      {
        path: 'auth/forgot-password',
        lazy: async () => {
          const { default: ForgotPassword } = await import('../pages/auth/ForgotPassword');
          return { Component: ForgotPassword };
        },
      },
      {
        path: '*',
        lazy: async () => {
          const { default: NotFound } = await import('../pages/NotFound');
          return { Component: NotFound };
        },
      },
    ],
  },
]);
