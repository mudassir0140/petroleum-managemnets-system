import type { Driver, Tanker, TankerTrip } from "@/lib/types";

export const DRIVERS: Driver[] = [
  { id: "emp-12", name: "Sanjay Rawat", phone: "+91 90210 10122", licenseNo: "UP32 DL 22910", status: "on-trip" },
  { id: "emp-13", name: "Harish Bhatt", phone: "+91 90210 10133", licenseNo: "UP32 DL 24471", status: "on-trip" },
  { id: "emp-14", name: "Om Prakash", phone: "+91 90210 10144", licenseNo: "UP32 DL 25580", status: "off-duty" },
  { id: "drv-04", name: "Ravi Shankar", phone: "+91 90210 10166", licenseNo: "UP32 DL 26621", status: "available" },
  { id: "drv-05", name: "Mahesh Kori", phone: "+91 90210 10177", licenseNo: "UP32 DL 27793", status: "on-trip" },
];

export const TANKERS: Tanker[] = [
  { id: "tk-01", regNumber: "UP32 GT 1101", capacityLiters: 12000, status: "in-transit" },
  { id: "tk-02", regNumber: "UP32 GT 1102", capacityLiters: 12000, status: "in-transit" },
  { id: "tk-03", regNumber: "UP32 GT 1103", capacityLiters: 16000, status: "in-transit" },
  { id: "tk-04", regNumber: "UP32 GT 1104", capacityLiters: 12000, status: "available" },
  { id: "tk-05", regNumber: "UP32 GT 1105", capacityLiters: 16000, status: "maintenance" },
];

const ORIGIN_DEPOT = "Central Depot, Dera Ismail Khan";

export const TANKER_TRIPS_SEED: TankerTrip[] = [
  {
    id: "trip-101",
    tankerId: "tk-01",
    driverId: "emp-12",
    originDepot: ORIGIN_DEPOT,
    destinationPumpId: "PUMP-02", // Lahore
    product: "Diesel",
    quantityLiters: 9000,
    departureTime: "Today, 05:30 AM",
    expectedArrival: "Today, 03:30 PM",
    actualArrival: null,
    status: "delayed",
    deliveryConfirmed: false,
    notes: "Held up at a highway checkpoint near Multan, ETA revised.",
  },
  {
    id: "trip-102",
    tankerId: "tk-02",
    driverId: "emp-13",
    originDepot: ORIGIN_DEPOT,
    destinationPumpId: "PUMP-06", // Multan
    product: "Petrol",
    quantityLiters: 8000,
    departureTime: "Today, 06:15 AM",
    expectedArrival: "Today, 11:15 AM",
    actualArrival: null,
    status: "in-transit",
    deliveryConfirmed: false,
  },
  {
    id: "trip-103",
    tankerId: "tk-03",
    driverId: "drv-05",
    originDepot: ORIGIN_DEPOT,
    destinationPumpId: "PUMP-03", // Islamabad
    product: "Petrol",
    quantityLiters: 10000,
    departureTime: "Today, 07:00 AM",
    expectedArrival: "Today, 01:00 PM",
    actualArrival: null,
    status: "in-transit",
    deliveryConfirmed: false,
  },
  {
    id: "trip-104",
    tankerId: "tk-04",
    driverId: "drv-04",
    originDepot: ORIGIN_DEPOT,
    destinationPumpId: "PUMP-01", // Karachi
    product: "Diesel",
    quantityLiters: 7500,
    departureTime: "Today, 02:00 AM",
    expectedArrival: "Today, 10:00 PM",
    actualArrival: "Today, 09:42 PM",
    status: "delivered",
    deliveryConfirmed: true,
  },
  {
    id: "trip-105",
    tankerId: "tk-05",
    driverId: "emp-14",
    originDepot: ORIGIN_DEPOT,
    destinationPumpId: "PUMP-05", // Rawalpindi
    product: "Premium",
    quantityLiters: 4000,
    departureTime: "Today, 06:00 AM",
    expectedArrival: "Today, 12:30 PM",
    actualArrival: "Today, 12:11 PM",
    status: "delivered",
    deliveryConfirmed: true,
  },
  {
    id: "trip-106",
    tankerId: "tk-01",
    driverId: "emp-12",
    originDepot: ORIGIN_DEPOT,
    destinationPumpId: "PUMP-04", // Faisalabad
    product: "Diesel",
    quantityLiters: 8500,
    departureTime: "Today, 01:30 PM",
    expectedArrival: "Today, 09:30 PM",
    actualArrival: null,
    status: "scheduled",
    deliveryConfirmed: false,
  },
  {
    id: "trip-107",
    tankerId: "tk-02",
    driverId: "emp-13",
    originDepot: ORIGIN_DEPOT,
    destinationPumpId: "PUMP-02", // Lahore
    product: "Petrol",
    quantityLiters: 6000,
    departureTime: "Today, 02:00 PM",
    expectedArrival: "Tomorrow, 12:00 AM",
    actualArrival: null,
    status: "scheduled",
    deliveryConfirmed: false,
  },
  {
    id: "trip-108",
    tankerId: "tk-03",
    driverId: "drv-05",
    originDepot: ORIGIN_DEPOT,
    destinationPumpId: "PUMP-06", // Multan
    product: "Diesel",
    quantityLiters: 9500,
    departureTime: "Yesterday, 04:10 PM",
    expectedArrival: "Yesterday, 09:10 PM",
    actualArrival: "Yesterday, 09:02 PM",
    status: "delivered",
    deliveryConfirmed: true,
  },
];

export function tankerById(id: string) {
  return TANKERS.find((tanker) => tanker.id === id) ?? null;
}

export function driverById(id: string) {
  return DRIVERS.find((driver) => driver.id === id) ?? null;
}
