export type Destination = {
  title: string;
  lat: number;
  lng: number;
  placeId?: string;
};

export type NavigationRouteParams = {
  title: string;
  lat: string;
  lng: string;
  placeId?: string;
  leg?: 'pickup' | 'dropoff';
  orderId?: string;
};
