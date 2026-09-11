import type { FuelType } from "@/lib/dashboard/data/stations";

export type PumpStatus = "Online" | "Offline" | "Maintenance";

export type PumpFuelSale = { fuelType: FuelType; liters: number; revenue: number };

export type Pump = {
  id: string;
  number: number;
  name: string;
  owner: string;
  city: string;
  address: string;
  lat: number;
  lng: number;
  phone: string;
  status: PumpStatus;
  since: string;
  lastInspection: string;
  todaySales: PumpFuelSale[];
  weeklyRevenue: number[];
  monthlySales: number;
  lastMonthSales: number;
};

export const PUMPS: Pump[] = [
  {
    id: "PUMP-01",
    number: 1,
    name: "Al-Rehman Filling Station",
    owner: "Ahmed Rehman",
    city: "Karachi",
    address: "Gulshan-e-Iqbal, Block 13, Karachi",
    lat: 24.9204,
    lng: 67.0947,
    phone: "+92 300 111 2233",
    status: "Online",
    since: "2018-04-12",
    lastInspection: "2026-08-20",
    todaySales: [
      { fuelType: "petrol", liters: 5400, revenue: 1512000 },
      { fuelType: "diesel", liters: 3100, revenue: 905200 },
    ],
    weeklyRevenue: [2180000, 2340000, 2050000, 2410000, 2600000, 2890000, 2417200],
    monthlySales: 68500000,
    lastMonthSales: 63200000,
  },
  {
    id: "PUMP-02",
    number: 2,
    name: "Chaudhry Petroleum",
    owner: "Imran Chaudhry",
    city: "Lahore",
    address: "Model Town Link Road, Lahore",
    lat: 31.4805,
    lng: 74.3287,
    phone: "+92 300 222 3344",
    status: "Online",
    since: "2016-11-02",
    lastInspection: "2026-07-30",
    todaySales: [
      { fuelType: "petrol", liters: 6800, revenue: 1904000 },
      { fuelType: "diesel", liters: 4200, revenue: 1226400 },
      { fuelType: "hi-octane", liters: 900, revenue: 306000 },
    ],
    weeklyRevenue: [3120000, 3260000, 2980000, 3340000, 3410000, 3680000, 3436400],
    monthlySales: 91200000,
    lastMonthSales: 88700000,
  },
  {
    id: "PUMP-03",
    number: 3,
    name: "Sunrise Fuel Station",
    owner: "Sana Malik",
    city: "Islamabad",
    address: "Kohat Road, Sector I-9, Islamabad",
    lat: 33.6255,
    lng: 73.0298,
    phone: "+92 300 333 4455",
    status: "Online",
    since: "2020-02-18",
    lastInspection: "2026-08-05",
    todaySales: [
      { fuelType: "petrol", liters: 4600, revenue: 1288000 },
      { fuelType: "diesel", liters: 5100, revenue: 1489200 },
    ],
    weeklyRevenue: [2510000, 2600000, 2340000, 2710000, 2890000, 3010000, 2777200],
    monthlySales: 74300000,
    lastMonthSales: 71800000,
  },
  {
    id: "PUMP-04",
    number: 4,
    name: "Highway Filling Station",
    owner: "Waqar Hussain",
    city: "Faisalabad",
    address: "Sargodha Road, Faisalabad",
    lat: 31.4504,
    lng: 73.1350,
    phone: "+92 300 444 5566",
    status: "Maintenance",
    since: "2015-06-30",
    lastInspection: "2026-06-12",
    todaySales: [
      { fuelType: "petrol", liters: 0, revenue: 0 },
      { fuelType: "diesel", liters: 0, revenue: 0 },
    ],
    weeklyRevenue: [1980000, 2040000, 1890000, 0, 0, 0, 0],
    monthlySales: 31400000,
    lastMonthSales: 52600000,
  },
  {
    id: "PUMP-05",
    number: 5,
    name: "Malik Fuels",
    owner: "Malik Fuels",
    city: "Rawalpindi",
    address: "Adiala Road, Rawalpindi",
    lat: 33.5900,
    lng: 73.1000,
    phone: "+92 300 555 6677",
    status: "Online",
    since: "2019-09-10",
    lastInspection: "2026-08-28",
    todaySales: [
      { fuelType: "petrol", liters: 5900, revenue: 1652000 },
      { fuelType: "diesel", liters: 3800, revenue: 1109600 },
      { fuelType: "hi-octane", liters: 620, revenue: 210800 },
    ],
    weeklyRevenue: [2760000, 2890000, 2650000, 2980000, 3050000, 3220000, 2972400],
    monthlySales: 82100000,
    lastMonthSales: 79400000,
  },
  {
    id: "PUMP-06",
    number: 6,
    name: "Gulshan Petroleum",
    owner: "Bilal Ahmed",
    city: "Multan",
    address: "Bosan Road, Multan",
    lat: 30.1642,
    lng: 71.4675,
    phone: "+92 300 666 7788",
    status: "Offline",
    since: "2017-01-22",
    lastInspection: "2026-05-19",
    todaySales: [
      { fuelType: "petrol", liters: 0, revenue: 0 },
      { fuelType: "diesel", liters: 0, revenue: 0 },
    ],
    weeklyRevenue: [1740000, 1690000, 0, 0, 0, 0, 0],
    monthlySales: 18900000,
    lastMonthSales: 44300000,
  },
];

export function pumpById(id: string): Pump | null {
  return PUMPS.find((pump) => pump.id === id) ?? null;
}

export function pumpTodayLiters(pump: Pump): number {
  return pump.todaySales.reduce((sum, s) => sum + s.liters, 0);
}

export function pumpTodayRevenue(pump: Pump): number {
  return pump.todaySales.reduce((sum, s) => sum + s.revenue, 0);
}

export function pumpWeeklyTotal(pump: Pump): number {
  return pump.weeklyRevenue.reduce((sum, v) => sum + v, 0);
}
