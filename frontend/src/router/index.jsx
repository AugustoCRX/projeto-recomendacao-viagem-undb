import { createBrowserRouter } from 'react-router-dom';
import { ROUTES } from '@/constants';

import HomePage from '@/pages/Home';
import TripCreatePage from '@/pages/TripCreate';
import TripDetailPage from '@/pages/TripDetail';
import ItineraryPage from '@/pages/Itinerary';
import MapViewPage from '@/pages/MapView';
import ComparatorPage from '@/pages/Comparator';
import NotFoundPage from '@/pages/NotFound';

export const router = createBrowserRouter([
  { path: ROUTES.HOME, element: <HomePage /> },
  { path: ROUTES.TRIP_CREATE, element: <TripCreatePage /> },
  { path: ROUTES.TRIP_DETAIL, element: <TripDetailPage /> },
  { path: ROUTES.ITINERARY, element: <ItineraryPage /> },
  { path: ROUTES.MAP, element: <MapViewPage /> },
  { path: ROUTES.COMPARATOR, element: <ComparatorPage /> },
  { path: ROUTES.NOT_FOUND, element: <NotFoundPage /> },
]);
