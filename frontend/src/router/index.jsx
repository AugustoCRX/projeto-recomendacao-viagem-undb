import { createBrowserRouter } from 'react-router-dom';
import { ROUTES } from '@/constants';
import { ProtectedRoute } from './ProtectedRoute';

import HomePage from '@/pages/Home';
import TripCreatePage from '@/pages/TripCreate';
import TripDetailPage from '@/pages/TripDetail';
import ItineraryPage from '@/pages/Itinerary';
import MapViewPage from '@/pages/MapView';
import ComparatorPage from '@/pages/Comparator';
import LoginPage from '@/pages/Login';
import RegisterPage from '@/pages/Register';
import NotFoundPage from '@/pages/NotFound';

const protect = (element) => <ProtectedRoute>{element}</ProtectedRoute>;

export const router = createBrowserRouter([
  // Rotas públicas
  { path: ROUTES.LOGIN,    element: <LoginPage /> },
  { path: ROUTES.REGISTER, element: <RegisterPage /> },

  // Rotas protegidas
  { path: ROUTES.HOME,        element: protect(<HomePage />) },
  { path: ROUTES.TRIP_CREATE, element: protect(<TripCreatePage />) },
  { path: ROUTES.TRIP_DETAIL, element: protect(<TripDetailPage />) },
  { path: ROUTES.ITINERARY,   element: protect(<ItineraryPage />) },
  { path: ROUTES.MAP,         element: protect(<MapViewPage />) },
  { path: ROUTES.COMPARATOR,  element: protect(<ComparatorPage />) },

  { path: ROUTES.NOT_FOUND, element: <NotFoundPage /> },
]);
