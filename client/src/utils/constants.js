export const SUPPORTED_LANGUAGES = [
  { code: "en", nativeName: "English" },
  { code: "es", nativeName: "Español" },
  { code: "fr", nativeName: "Français" },
  { code: "ar", nativeName: "العربية" },
  { code: "pt", nativeName: "Português" },
  { code: "de", nativeName: "Deutsch" }
];

export const SCENARIO_TYPES = [
  "MATCH_ENTRY_SURGE",
  "HALFTIME_RUSH",
  "POST_MATCH_EGRESS",
  "MEDICAL_EMERGENCY",
  "VIP_ARRIVAL",
  "WEATHER_DISRUPTION"
];

export const STADIUM_ZONE_TYPES = [
  "perimeter gates",
  "security screening",
  "main concourse",
  "seating bowl",
  "transit plaza",
  "accessible service points"
];

export const DEFAULT_STADIUM = {
  id: "metlife-stadium",
  name: "MetLife Stadium",
  city: "East Rutherford, New Jersey",
  country: "United States",
  capacity: 87157
};

export const FAN_ASSISTANT_SUGGESTED_QUESTIONS = [
  "Where is the nearest accessible entrance?",
  "How do I reach my seating section?",
  "Where can I find vegetarian food?",
  "What should I do after the match ends?",
  "Where is the medical assistance point?",
  "Which exit should I use after full-time?"
];

export const STADIUM_FROM_LOCATION_OPTIONS = [
  "Main Gate",
  "North Entrance",
  "South Entrance",
  "East Stand",
  "West Stand",
  "Food Court",
  "Family Zone",
  "Accessible Entrance",
  "Parking Zone A",
  "Transit Drop-Off"
];

export const STADIUM_TO_LOCATION_OPTIONS = [
  "Seating Section",
  "Restrooms",
  "Food Zone",
  "Medical Assistance",
  "Information Desk",
  "Accessible Restroom",
  "Merchandise Area",
  "Exit Gate",
  "Prayer Room",
  "Family Assistance Desk"
];

export const ACCESSIBILITY_NEED_OPTIONS = [
  "None",
  "Wheelchair accessible route",
  "Avoid stairs",
  "Visual assistance needed",
  "Hearing assistance needed",
  "Family-friendly route",
  "Low-crowd route"
];

export const ARRIVAL_TIME_OPTIONS = [
  "3 hours before kickoff",
  "2 hours before kickoff",
  "1 hour before kickoff",
  "At gate opening"
];

export const TRANSPORT_MODE_OPTIONS = [
  "Metro / Train",
  "Bus",
  "Rideshare",
  "Private car",
  "Walking",
  "Accessible transport"
];

export const INCIDENT_TYPE_OPTIONS = [
  "Overcrowding",
  "Medical emergency",
  "Lost child",
  "Gate congestion",
  "Weather disruption",
  "Security concern",
  "Accessibility assistance needed",
  "Transport delay",
  "Food court surge",
  "Restroom queue surge"
];

export const SEVERITY_OPTIONS = ["Low", "Medium", "High", "Critical"];

export const ANNOUNCEMENT_PURPOSE_OPTIONS = [
  "Crowd movement",
  "Gate delay",
  "Weather delay",
  "Medical assistance",
  "Post-match exit",
  "Transport update",
  "Accessibility support",
  "General safety reminder"
];

export const ANNOUNCEMENT_TONE_OPTIONS = ["Calm", "Urgent", "Reassuring", "Instructional"];

export const CROWD_INTENSITY_OPTIONS = ["Normal", "Busy", "Very busy", "Critical"];

export const ROUTE_STARTING_POINT_OPTIONS = [
  "Airport",
  "City centre",
  "Fan zone",
  "Hotel district",
  "Transit hub",
  "Parking zone"
];

export const ROUTE_ARRIVAL_PREFERENCE_OPTIONS = [
  "Fastest",
  "Lowest crowd",
  "Accessible route",
  "Family-friendly",
  "Lowest carbon"
];

export const WEATHER_CONDITION_OPTIONS = [
  "Clear",
  "Mild",
  "Rain",
  "Heat advisory",
  "Thunderstorm watch"
];

export const TRANSIT_PRESSURE_OPTIONS = ["Low", "Medium", "High", "Critical"];

export const ACCESSIBILITY_DEMAND_OPTIONS = ["Standard", "Elevated", "High"];

export const BRIEFING_FOCUS_OPTIONS = [
  "Operations readiness",
  "Crowd and gate flow",
  "Accessibility and guest services",
  "Transit and egress",
  "Weather disruption readiness",
  "Volunteer coordination"
];

export const SAFETY_SUPPORT_FOCUS_OPTIONS = [
  "General safety",
  "Medical help",
  "Weather shelter",
  "Low-crowd movement",
  "Accessible route support",
  "Post-match departure"
];

export const FLOW_TRANSIT_MODE_OPTIONS = [
  "Metro / Train",
  "Bus",
  "Rideshare",
  "Parking shuttle",
  "Accessible transport"
];

export const SUSTAINABILITY_REPORT_FOCUS_OPTIONS = [
  "Waste sorting and public transit adoption",
  "Reusable cup returns",
  "Water refill station usage",
  "Energy load smoothing",
  "Low-carbon fan departure"
];

export const RISK_TONE_BY_LEVEL = {
  low: "success",
  medium: "warning",
  high: "danger",
  critical: "critical"
};
