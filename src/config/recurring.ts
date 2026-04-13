import {
  HeartPulse,
  Shield,
  Car,
  Home,
  Tv,
  Music,
  Dumbbell,
  Film,
  Wifi,
  Smartphone,
  Zap,
  Flame,
  CookingPot,
  Sparkles,
  Building2,
  CreditCard,
  PiggyBank,
  Landmark,
  Satellite,
  Droplets,
  GraduationCap,
  Baby,
  Newspaper,
  type LucideIcon,
} from "lucide-react";
import type { CategoryKey } from "@/src/config/categories";

export type Frequency =
  | "monthly"
  | "quarterly"
  | "yearly";

export const FREQUENCY_OPTIONS: {
  key: Frequency;
  label: string;
  shortLabel: string;
  days: number;
}[] = [
    { key: "monthly", label: "Monthly", shortLabel: "Monthly", days: 30 },
    { key: "quarterly", label: "Quarterly", shortLabel: "Quarterly", days: 91 },
    { key: "yearly", label: "Yearly", shortLabel: "Yearly", days: 365 },
  ];

export const FREQUENCY_LABEL_MAP: Record<Frequency, string> = {
  monthly: "Monthly",
  quarterly: "Quarterly",
  yearly: "Yearly",
};

export interface RecurringTemplate {
  id: string;
  name: string;
  hindiName?: string;
  category: CategoryKey;
  suggestedFrequency: Frequency;
  icon: LucideIcon;
  suggestedAmount?: number;
}

export const RECURRING_TEMPLATES: RecurringTemplate[] = [
  {
    id: "health-insurance",
    name: "Health Insurance",
    hindiName: "स्वास्थ्य बीमा",
    category: "Insurance",
    suggestedFrequency: "yearly",
    icon: HeartPulse,
  },
  {
    id: "life-insurance",
    name: "Life Insurance",
    hindiName: "जीवन बीमा",
    category: "Insurance",
    suggestedFrequency: "yearly",
    icon: Shield,
  },
  {
    id: "vehicle-insurance",
    name: "Vehicle Insurance",
    hindiName: "वाहन बीमा",
    category: "Insurance",
    suggestedFrequency: "yearly",
    icon: Car,
  },
  {
    id: "home-insurance",
    name: "Home Insurance",
    hindiName: "गृह बीमा",
    category: "Insurance",
    suggestedFrequency: "yearly",
    icon: Home,
  },
  {
    id: "netflix",
    name: "Netflix",
    category: "Entertainment",
    suggestedFrequency: "monthly",
    icon: Tv,
    suggestedAmount: 649,
  },
  {
    id: "spotify",
    name: "Spotify",
    category: "Entertainment",
    suggestedFrequency: "monthly",
    icon: Music,
    suggestedAmount: 119,
  },
  {
    id: "amazon-prime",
    name: "Amazon Prime",
    category: "Entertainment",
    suggestedFrequency: "yearly",
    icon: Film,
    suggestedAmount: 1499,
  },
  {
    id: "hotstar",
    name: "Disney+ Hotstar",
    category: "Entertainment",
    suggestedFrequency: "yearly",
    icon: Tv,
    suggestedAmount: 899,
  },
  {
    id: "youtube-premium",
    name: "YouTube Premium",
    category: "Entertainment",
    suggestedFrequency: "monthly",
    icon: Film,
    suggestedAmount: 129,
  },
  {
    id: "gym",
    name: "Gym Membership",
    hindiName: "जिम",
    category: "Health",
    suggestedFrequency: "monthly",
    icon: Dumbbell,
  },
  {
    id: "newspaper",
    name: "Newspaper",
    hindiName: "अखबार",
    category: "Subscriptions",
    suggestedFrequency: "monthly",
    icon: Newspaper,
  },
  {
    id: "cook",
    name: "Cook",
    hindiName: "रसोइया",
    category: "Home Services",
    suggestedFrequency: "monthly",
    icon: CookingPot,
  },
  {
    id: "maid",
    name: "Maid / House Help",
    hindiName: "नौकरानी",
    category: "Home Services",
    suggestedFrequency: "monthly",
    icon: Sparkles,
  },
  {
    id: "driver",
    name: "Driver",
    hindiName: "ड्राइवर",
    category: "Home Services",
    suggestedFrequency: "monthly",
    icon: Car,
  },
  {
    id: "milkman",
    name: "Milk",
    hindiName: "दूध",
    category: "Home Services",
    suggestedFrequency: "monthly",
    icon: Droplets,
  },
  {
    id: "laundry",
    name: "Laundry / Dhobi",
    hindiName: "धोबी",
    category: "Home Services",
    suggestedFrequency: "monthly",
    icon: Sparkles,
  },
  {
    id: "rent",
    name: "Rent",
    hindiName: "किराया",
    category: "Housing",
    suggestedFrequency: "monthly",
    icon: Building2,
  },
  {
    id: "wifi",
    name: "WiFi / Broadband",
    hindiName: "वाईफाई",
    category: "Utilities",
    suggestedFrequency: "monthly",
    icon: Wifi,
  },
  {
    id: "mobile-recharge",
    name: "Mobile Recharge",
    hindiName: "मोबाइल रिचार्ज",
    category: "Utilities",
    suggestedFrequency: "monthly",
    icon: Smartphone,
  },
  {
    id: "electricity",
    name: "Electricity Bill",
    hindiName: "बिजली बिल",
    category: "Utilities",
    suggestedFrequency: "monthly",
    icon: Zap,
  },
  {
    id: "gas",
    name: "Gas / LPG",
    hindiName: "गैस",
    category: "Utilities",
    suggestedFrequency: "monthly",
    icon: Flame,
  },
  {
    id: "dth",
    name: "DTH / Cable TV",
    hindiName: "डीटीएच",
    category: "Utilities",
    suggestedFrequency: "monthly",
    icon: Satellite,
  },
  {
    id: "water",
    name: "Water Bill",
    hindiName: "पानी बिल",
    category: "Utilities",
    suggestedFrequency: "monthly",
    icon: Droplets,
  },
  {
    id: "society-maintenance",
    name: "Society Maintenance",
    hindiName: "सोसायटी मेंटेनेंस",
    category: "Housing",
    suggestedFrequency: "monthly",
    icon: Building2,
  },
  {
    id: "home-loan-emi",
    name: "Home Loan EMI",
    hindiName: "होम लोन EMI",
    category: "Financial",
    suggestedFrequency: "monthly",
    icon: Home,
  },
  {
    id: "car-loan-emi",
    name: "Car Loan EMI",
    hindiName: "कार लोन EMI",
    category: "Financial",
    suggestedFrequency: "monthly",
    icon: Car,
  },
  {
    id: "personal-loan-emi",
    name: "Personal Loan EMI",
    hindiName: "पर्सनल लोन EMI",
    category: "Financial",
    suggestedFrequency: "monthly",
    icon: Landmark,
  },
  {
    id: "credit-card-bill",
    name: "Credit Card Bill",
    hindiName: "क्रेडिट कार्ड बिल",
    category: "Financial",
    suggestedFrequency: "monthly",
    icon: CreditCard,
  },
  {
    id: "sip",
    name: "SIP / Mutual Fund",
    hindiName: "SIP",
    category: "Financial",
    suggestedFrequency: "monthly",
    icon: PiggyBank,
  },
  {
    id: "school-fees",
    name: "School Fees",
    hindiName: "स्कूल फीस",
    category: "Education",
    suggestedFrequency: "quarterly",
    icon: GraduationCap,
  },
  {
    id: "tuition",
    name: "Tuition / Coaching",
    hindiName: "ट्यूशन",
    category: "Education",
    suggestedFrequency: "monthly",
    icon: GraduationCap,
  },
  {
    id: "daycare",
    name: "Daycare / Creche",
    hindiName: "डेकेयर",
    category: "Education",
    suggestedFrequency: "monthly",
    icon: Baby,
  },
];

export const calculateNextDueDate = (
  fromDate: number,
  frequency: Frequency
): number => {
  const date = new Date(fromDate);

  switch (frequency) {
    case "monthly":
      date.setMonth(date.getMonth() + 1);
      break;
    case "quarterly":
      date.setMonth(date.getMonth() + 3);
      break;
    case "yearly":
      date.setFullYear(date.getFullYear() + 1);
      break;
  }

  return date.getTime();
};

export const getNextUpcomingDueDate = (
  fromDate: number,
  frequency: Frequency,
  now = Date.now(),
  endDate?: number
): number => {
  let nextDue = fromDate;
  let guard = 0;
  const maxIterations = 1200;

  while (nextDue < now && guard < maxIterations) {
    nextDue = calculateNextDueDate(nextDue, frequency);
    guard += 1;
    if (endDate && nextDue > endDate) {
      return endDate;
    }
  }

  return nextDue;
};

export const isDueSoon = (nextDue: number, withinDays = 5): boolean => {
  const now = Date.now();
  const daysUntilDue = (nextDue - now) / (1000 * 60 * 60 * 24);
  return daysUntilDue >= 0 && daysUntilDue <= withinDays;
};

