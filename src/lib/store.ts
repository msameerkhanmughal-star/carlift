// Car Lift shared data store using localStorage

export interface Booking {
  id: number;
  userId?: string;
  name: string;
  whatsapp: string;
  pickup: string;
  dropoff: string;
  timing: string;
  class: string;
  startDate: string;
  payment: string;
  fare: string;
  status: 'pending' | 'approved';
  assignedCar: string;
  createdAt: string;
}

export interface Notification {
  id: number;
  message: string;
  bookingId: number;
  read: boolean;
  createdAt: string;
}

export interface User {
  name: string;
  email: string;
  phone: string;
  password: string;
  role: 'user' | 'admin';
}

export interface CarImage {
  carName: string;
  imageUrl: string;
}

export const CARS_LIST = [
  "Suzuki Alto 2019 Silver BSB 179",
  "Suzuki Alto 2020 White BVG 830",
  "Suzuki Alto 2022 White BVF 238",
  "Suzuki Alto 2024 Grey CCD 522",
  "Suzuki Alto 2025 White CCK 873",
  "Suzuki Alto 2026 White CCK 874",
  "Suzuki Alto 2024 Grey BXQ 818",
  "Suzuki Alto 2022 White BXU 220",
  "Suzuki Every White 2025 SA 9775",
];

export const DEFAULT_PICKUPS = ["Gulistan-e-Johar", "PECHS", "DHA / Clifton", "Gulshan-e-Iqbal"];

export const DEFAULT_DROPOFF_MAP: Record<string, string[]> = {
  "Gulistan-e-Johar": ["PECHS"],
  "PECHS": ["DHA / Clifton"],
  "DHA / Clifton": ["PECHS"],
  "Gulshan-e-Iqbal": ["PECHS", "I.I. Chundrigar", "DHA / Clifton"],
};

export const ROUTE_TIMINGS: Record<string, string[]> = {
  "Gulistan-e-Johar→PECHS": ["7:30 AM – 1:45 PM"],
  "PECHS→DHA / Clifton": ["7:30 AM – 1:45 PM"],
  "DHA / Clifton→PECHS": ["7:30 AM – 1:45 PM", "10:00 AM – 6:00 PM"],
  "Gulshan-e-Iqbal→PECHS": ["7:30 AM – 1:45 PM"],
  "Gulshan-e-Iqbal→I.I. Chundrigar": ["10:00 AM – 6:00 PM"],
  "Gulshan-e-Iqbal→DHA / Clifton": ["8:30 AM – 4:30 PM", "10:00 AM – 6:00 PM"],
};

export const DISTANCE_DB: Record<string, number> = {
  "Gulistan-e-Johar-PECHS": 18.2,
  "PECHS-DHA / Clifton": 9.1,
  "DHA / Clifton-PECHS": 9.1,
  "Gulshan-e-Iqbal-PECHS": 10.5,
  "Gulshan-e-Iqbal-I.I. Chundrigar": 12.8,
  "Gulshan-e-Iqbal-DHA / Clifton": 15.6,
};

export const ROUTES_DATA = [
  { title: "Gulistan-e-Johar → PECHS", timings: ["7:30 AM – 1:45 PM"] },
  { title: "PECHS → DHA / Clifton", timings: ["7:30 AM – 1:45 PM"] },
  { title: "DHA / Clifton → PECHS", timings: ["7:30 AM – 1:45 PM"] },
  { title: "Gulshan-e-Iqbal → PECHS", timings: ["7:30 AM – 1:45 PM"] },
  { title: "Gulshan-e-Iqbal → I.I. Chundrigar", timings: ["10:00 AM – 6:00 PM"] },
  { title: "Gulshan-e-Iqbal → DHA / Clifton", timings: ["8:30 AM – 4:30 PM"] },
];

const FARE_PER_KM = 59;
const SRB_TAX = 0.11;

export function calculateFare(pickup: string, dropoff: string) {
  if (!pickup || !dropoff) return null;
  const km = DISTANCE_DB[`${pickup}-${dropoff}`] || 12;
  const total = Math.round(km * FARE_PER_KM * 22 * (1 + SRB_TAX));
  return { km, total };
}

export function parseFareAmount(fare: string): number {
  const digits = fare.replace(/[^0-9]/g, '');
  return digits ? parseInt(digits, 10) : 0;
}

// localStorage helpers
export function getBookings(): Booking[] {
  return JSON.parse(localStorage.getItem('carLiftBookings') || '[]');
}

export function saveBookings(bookings: Booking[]) {
  localStorage.setItem('carLiftBookings', JSON.stringify(bookings));
}

export function getUsers(): User[] {
  return JSON.parse(localStorage.getItem('carLiftUsers') || '[]');
}

export function saveUsers(users: User[]) {
  localStorage.setItem('carLiftUsers', JSON.stringify(users));
}

export function getCurrentUser(): User | null {
  return JSON.parse(localStorage.getItem('carLiftCurrentUser') || 'null');
}

export function setCurrentUser(user: User | null) {
  localStorage.setItem('carLiftCurrentUser', JSON.stringify(user));
}

export function getPickupLocations(): string[] {
  const stored = localStorage.getItem('carlift_pickups');
  if (stored) return JSON.parse(stored);
  localStorage.setItem('carlift_pickups', JSON.stringify(DEFAULT_PICKUPS));
  return [...DEFAULT_PICKUPS];
}

export function getDropoffMapping(): Record<string, string[]> {
  const stored = localStorage.getItem('carlift_dropmap');
  if (stored) return JSON.parse(stored);
  localStorage.setItem('carlift_dropmap', JSON.stringify(DEFAULT_DROPOFF_MAP));
  return { ...DEFAULT_DROPOFF_MAP };
}

export function savePickupLocations(pickups: string[]) {
  localStorage.setItem('carlift_pickups', JSON.stringify(pickups));
}

export function saveDropoffMapping(mapping: Record<string, string[]>) {
  localStorage.setItem('carlift_dropmap', JSON.stringify(mapping));
}

// Car images
export function getCarImages(): Record<string, string> {
  return JSON.parse(localStorage.getItem('carlift_car_images') || '{}');
}

export function saveCarImages(images: Record<string, string>) {
  localStorage.setItem('carlift_car_images', JSON.stringify(images));
}

// Notification helpers
export function getNotifications(): Notification[] {
  return JSON.parse(localStorage.getItem('carLiftNotifications') || '[]');
}

export function saveNotifications(notifications: Notification[]) {
  localStorage.setItem('carLiftNotifications', JSON.stringify(notifications));
}

export function addNotification(message: string, bookingId: number) {
  const notifications = getNotifications();
  notifications.unshift({
    id: Date.now(),
    message,
    bookingId,
    read: false,
    createdAt: new Date().toISOString(),
  });
  saveNotifications(notifications);
}

export function markNotificationRead(id: number) {
  const notifications = getNotifications();
  const updated = notifications.map(n => n.id === id ? { ...n, read: true } : n);
  saveNotifications(updated);
}

export function markAllNotificationsRead() {
  const notifications = getNotifications();
  const updated = notifications.map(n => ({ ...n, read: true }));
  saveNotifications(updated);
}

// Deadline helper - calculates days until start date
export function getDaysUntilDeadline(startDate: string): number | null {
  try {
    const parsed = new Date(startDate);
    if (isNaN(parsed.getTime())) return null;
    const now = new Date();
    now.setHours(0, 0, 0, 0);
    parsed.setHours(0, 0, 0, 0);
    return Math.ceil((parsed.getTime() - now.getTime()) / (1000 * 60 * 60 * 24));
  } catch {
    return null;
  }
}
