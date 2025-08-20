export const MAX_BOOKING_PER_SLOT = 5;

export const TIME_SLOTS = [
  "11:30 - 11:50",
  "12:20 - 12:40",
  "1:00 - 1:20",
  "1:40 - 2:00",
  "2:20 - 2:40",
];

// For dropdowns like React-Select
export const TIME_OPTIONS = TIME_SLOTS.map((slot) => ({
  value: slot,
  label: formatTimeWithMeridian(slot),
}));

function formatTimeWithMeridian(slot) {
  const [startHour] = slot.split("-")[0].split(":");
  const hour= parseInt(startHour,10);
  const meridian= hour<12 ?"AM" : "PM";
  return `${slot} ${meridian}`;
}