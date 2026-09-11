import type { FuelType } from "@/lib/dashboard/data/stations";
import { DEPOT } from "@/lib/dashboard/data/stations";

export type DeliveryStatus = "Delivered" | "In Transit" | "Delayed" | "Cancelled";

export type Delivery = {
  id: string;
  tanker: string;
  driver: string;
  fuelType: FuelType;
  depot: string;
  pump: string;
  route: string;
  orderedLiters: number;
  unloadedLiters: number;
  departedDepot: string;
  arrivedPump: string | null;
  date: string;
  status: DeliveryStatus;
};

export const DELIVERIES: Delivery[] = [
  { id: "DEL-2201", tanker: "T-104", driver: "Shahid Iqbal", fuelType: "petrol", depot: DEPOT, pump: "Pump 3", route: "Central Depot → Kohat Road → Pump 3, Islamabad", orderedLiters: 12000, unloadedLiters: 11800, departedDepot: "6:00 AM", arrivedPump: "9:40 AM", date: "2026-09-10", status: "Delivered" },
  { id: "DEL-2202", tanker: "T-101", driver: "Nasir Hussain", fuelType: "petrol", depot: DEPOT, pump: "Pump 1", route: "Central Depot → National Highway → Pump 1, Karachi", orderedLiters: 15000, unloadedLiters: 0, departedDepot: "6:15 AM", arrivedPump: null, date: "2026-09-10", status: "In Transit" },
  { id: "DEL-2203", tanker: "T-103", driver: "Adnan Malik", fuelType: "petrol", depot: DEPOT, pump: "Pump 5", route: "Central Depot → Indus Highway → Pump 5, Rawalpindi", orderedLiters: 15000, unloadedLiters: 0, departedDepot: "6:30 AM", arrivedPump: null, date: "2026-09-10", status: "In Transit" },
  { id: "DEL-2198", tanker: "T-102", driver: "Tariq Javed", fuelType: "diesel", depot: DEPOT, pump: "Pump 2", route: "Central Depot → M-9 Motorway → Pump 2, Lahore", orderedLiters: 18000, unloadedLiters: 17750, departedDepot: "5:50 AM", arrivedPump: "1:20 PM", date: "2026-09-09", status: "Delivered" },
  { id: "DEL-2197", tanker: "T-108", driver: "Rashid Latif", fuelType: "diesel", depot: DEPOT, pump: "Pump 6", route: "Central Depot → N-5 Highway → Pump 6, Multan", orderedLiters: 18000, unloadedLiters: 17600, departedDepot: "6:10 AM", arrivedPump: "3:55 PM", date: "2026-09-08", status: "Delivered" },
  { id: "DEL-2190", tanker: "T-105", driver: "Kashif Bhatti", fuelType: "diesel", depot: DEPOT, pump: "Pump 4", route: "Central Depot → Faisalabad-Sargodha Road → Pump 4", orderedLiters: 18000, unloadedLiters: 0, departedDepot: "7:00 AM", arrivedPump: null, date: "2026-09-07", status: "Delayed" },
  { id: "DEL-2185", tanker: "T-106", driver: "Faisal Mahmood", fuelType: "hi-octane", depot: DEPOT, pump: "Pump 2", route: "Central Depot → M-9 Motorway → Pump 2, Lahore", orderedLiters: 8000, unloadedLiters: 8000, departedDepot: "6:30 AM", arrivedPump: "11:40 AM", date: "2026-09-06", status: "Delivered" },
  { id: "DEL-2181", tanker: "T-107", driver: "Bilal Aslam", fuelType: "petrol", depot: DEPOT, pump: "Pump 3", route: "Central Depot → Kohat Road → Pump 3, Islamabad", orderedLiters: 15000, unloadedLiters: 14750, departedDepot: "6:00 AM", arrivedPump: "9:15 AM", date: "2026-09-05", status: "Delivered" },
  { id: "DEL-2176", tanker: "T-101", driver: "Nasir Hussain", fuelType: "petrol", depot: DEPOT, pump: "Pump 5", route: "Central Depot → Indus Highway → Pump 5, Rawalpindi", orderedLiters: 15000, unloadedLiters: 15000, departedDepot: "6:20 AM", arrivedPump: "2:50 PM", date: "2026-09-04", status: "Delivered" },
  { id: "DEL-2170", tanker: "T-103", driver: "Adnan Malik", fuelType: "petrol", depot: DEPOT, pump: "Pump 1", route: "Central Depot → National Highway → Pump 1, Karachi", orderedLiters: 15000, unloadedLiters: 0, departedDepot: "6:30 AM", arrivedPump: null, date: "2026-09-03", status: "Cancelled" },
  { id: "DEL-2165", tanker: "T-104", driver: "Shahid Iqbal", fuelType: "diesel", depot: DEPOT, pump: "Pump 3", route: "Central Depot → Kohat Road → Pump 3, Islamabad", orderedLiters: 12000, unloadedLiters: 12150, departedDepot: "6:00 AM", arrivedPump: "9:20 AM", date: "2026-09-02", status: "Delivered" },
  { id: "DEL-2159", tanker: "T-102", driver: "Tariq Javed", fuelType: "diesel", depot: DEPOT, pump: "Pump 6", route: "Central Depot → N-5 Highway → Pump 6, Multan", orderedLiters: 10000, unloadedLiters: 9840, departedDepot: "6:45 AM", arrivedPump: "4:10 PM", date: "2026-09-01", status: "Delivered" },
];
