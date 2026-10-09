export type Language = "en" | "ur" | "both";

export const translations = {
  // Common
  save: { en: "Save", ur: "محفوظ کریں" },
  cancel: { en: "Cancel", ur: "منسوخ کریں" },
  delete: { en: "Delete", ur: "حذف کریں" },
  edit: { en: "Edit", ur: "ترمیم کریں" },
  add: { en: "Add", ur: "شامل کریں" },
  close: { en: "Close", ur: "بند کریں" },
  back: { en: "Back", ur: "واپس" },
  loading: { en: "Loading", ur: "لوڈ ہو رہا ہے" },
  error: { en: "Error", ur: "خرابی" },
  success: { en: "Success", ur: "کامیاب" },
  logout: { en: "Logout", ur: "لاگ آؤٹ" },

  // Auth
  login: { en: "Login", ur: "لاگ ان" },
  email: { en: "Email", ur: "ای میل" },
  password: { en: "Password", ur: "پاس ورڈ" },
  signIn: { en: "Sign In", ur: "سائن ان" },
  invalidCredentials: { en: "Invalid email or password", ur: "غلط ای میل یا پاس ورڈ" },

  // Dashboard
  overview: { en: "Overview", ur: "جائزہ" },
  dashboard: { en: "Dashboard", ur: "ڈیش بورڈ" },
  welcome: { en: "Welcome", ur: "خوش آمدید" },

  // Pump Owner Pages
  employees: { en: "Employees", ur: "ملازمین" },
  staff: { en: "Staff", ur: "عملہ" },
  manageEmployees: { en: "Manage Employees", ur: "ملازمین کا انتظام" },
  addEmployee: { en: "Add Employee", ur: "ملازم شامل کریں" },
  name: { en: "Name", ur: "نام" },
  phone: { en: "Phone", ur: "فون" },
  role: { en: "Role", ur: "کردار" },
  createdAt: { en: "Created", ur: "بنایا گیا" },

  // Khata
  khata: { en: "Khata", ur: "کھاتہ" },
  customerName: { en: "Customer Name", ur: "گاہک کا نام" },
  amount: { en: "Amount", ur: "رقم" },
  date: { en: "Date", ur: "تاریخ" },
  note: { en: "Note", ur: "نوٹ" },
  balance: { en: "Balance", ur: "بقایا" },
  totalCredit: { en: "Total Credit", ur: "کل کریڈٹ" },
  addKhata: { en: "Add New Khata", ur: "نیا کھاتہ شامل کریں" },

  // Fuel
  fuelStock: { en: "Fuel Stock", ur: "ایندھن کا ذخیرہ" },
  petrol: { en: "Petrol", ur: "پیٹرول" },
  diesel: { en: "Diesel", ur: "ڈیزل" },
  fuelprice: { en: "Fuel Price", ur: "ایندھن کی قیمت" },
  fuelOrders: { en: "Fuel Orders", ur: "ایندھن کی آرڈر" },

  // Sales and Tankers
  sales: { en: "Sales", ur: "فروخت" },
  tankers: { en: "Incoming Tanker", ur: "آنے والا ٹینکر" },
  payments: { en: "Payments to Company", ur: "کمپنی کو ادائیگی" },
  reports: { en: "Reports", ur: "رپورٹیں" },

  // Shifts
  shifts: { en: "Shifts", ur: "شفٹیں" },
  startShift: { en: "Start Shift", ur: "شفٹ شروع کریں" },
  endShift: { en: "End Shift", ur: "شفٹ ختم کریں" },
  status: { en: "Status", ur: "حالت" },

  // Common messages
  noRecords: { en: "No records found", ur: "کوئی ریکارڈ نہیں ملا" },
  confirmDelete: { en: "Are you sure you want to delete this?", ur: "کیا آپ اسے حذف کرنا چاہتے ہیں؟" },
  fieldRequired: { en: "This field is required", ur: "یہ فیلڈ ضروری ہے" },

  // Meters and readings
  meterReading: { en: "Meter Reading", ur: "میٹر کی پڑھائی" },
  startReading: { en: "Start Reading", ur: "شروعاتی پڑھائی" },
  endReading: { en: "End Reading", ur: "آخری پڑھائی" },
  litresSold: { en: "Litres Sold", ur: "فروخت شدہ لیٹر" },
  amountDue: { en: "Amount Due", ur: "واجب الادا رقم" },
} as const;

export type TranslationKey = keyof typeof translations;

export function getText(key: TranslationKey, language: Language): string {
  const text = translations[key];
  if (!text) return key;

  if (language === "en") return text.en;
  if (language === "ur") return text.ur;
  if (language === "both") return `${text.en} / ${text.ur}`;

  return text.en;
}

export function getBilingual(key: TranslationKey): string {
  const text = translations[key];
  if (!text) return key;
  return `${text.en} / ${text.ur}`;
}
