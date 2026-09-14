"use client";

import { TANKER_TRIPS_SEED } from "@/lib/data/fleet";
import { useSharedState } from "@/lib/store/shared-store";
import type { TankerTrip, TripStatus } from "@/lib/manager/types";

export function useTankerTrips() {
  const [trips, setTrips] = useSharedState<TankerTrip[]>("tanker-trips", TANKER_TRIPS_SEED);

  function addTrip(trip: TankerTrip) {
    setTrips((prev) => [trip, ...prev]);
  }

  function updateTripStatus(id: string, status: TripStatus, actualArrival?: string) {
    setTrips((prev) =>
      prev.map((trip) =>
        trip.id === id
          ? { ...trip, status, actualArrival: actualArrival ?? trip.actualArrival }
          : trip,
      ),
    );
  }

  function confirmDelivery(id: string) {
    setTrips((prev) =>
      prev.map((trip) =>
        trip.id === id
          ? { ...trip, status: "delivered", deliveryConfirmed: true }
          : trip,
      ),
    );
  }

  return { trips, setTrips, addTrip, updateTripStatus, confirmDelivery };
}
