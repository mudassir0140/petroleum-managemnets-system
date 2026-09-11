export type DriverStatus = "On Duty" | "Off Duty" | "On Leave" | "Suspended";

export type Driver = {
  id: string;
  name: string;
  license: string;
  phone: string;
  experienceYears: number;
  assignedTanker: string;
  status: DriverStatus;
  rating: number;
  joinDate: string;
};

export const DRIVERS: Driver[] = [
  { id: "DRV-01", name: "Nasir Hussain", license: "KHI-204581", phone: "+92 301 111 2233", experienceYears: 9, assignedTanker: "T-101", status: "On Duty", rating: 4.7, joinDate: "2018-03-12" },
  { id: "DRV-02", name: "Tariq Javed", license: "KHI-118820", phone: "+92 301 222 3344", experienceYears: 12, assignedTanker: "T-102", status: "On Duty", rating: 4.8, joinDate: "2015-06-02" },
  { id: "DRV-03", name: "Adnan Malik", license: "KHI-556210", phone: "+92 301 333 4455", experienceYears: 6, assignedTanker: "T-103", status: "On Duty", rating: 4.5, joinDate: "2020-01-20" },
  { id: "DRV-04", name: "Shahid Iqbal", license: "ISB-772341", phone: "+92 301 444 5566", experienceYears: 8, assignedTanker: "T-104", status: "On Duty", rating: 4.6, joinDate: "2017-09-15" },
  { id: "DRV-05", name: "Kashif Bhatti", license: "FSD-390215", phone: "+92 301 555 6677", experienceYears: 5, assignedTanker: "T-105", status: "On Duty", rating: 4.3, joinDate: "2021-04-08" },
  { id: "DRV-06", name: "Faisal Mahmood", license: "KHI-905112", phone: "+92 301 666 7788", experienceYears: 4, assignedTanker: "T-106", status: "Off Duty", rating: 4.2, joinDate: "2022-02-11" },
  { id: "DRV-07", name: "Bilal Aslam", license: "KHI-661884", phone: "+92 301 777 8899", experienceYears: 3, assignedTanker: "T-107", status: "On Leave", rating: 4.0, joinDate: "2023-05-19" },
  { id: "DRV-08", name: "Rashid Latif", license: "KHI-247733", phone: "+92 301 888 9900", experienceYears: 10, assignedTanker: "T-108", status: "On Duty", rating: 4.9, joinDate: "2016-11-27" },
];
