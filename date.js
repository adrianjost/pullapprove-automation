const dayjs = require("dayjs");
const weekday = require("dayjs/plugin/weekday");
dayjs.extend(weekday);



module.exports = function () {
  console.log("calculate new unavilability date...");
  // before Thursday
  const NOW = dayjs(new Date());

  if ((NOW.day() > 0 && NOW.day() < 3) || (NOW.day() === 3 && NOW.hour() > 14)) {
    return false;
  }

  return dayjs(new Date())
  .weekday(8)
  .set("hour", 7)
  .set("minute", 0)
  .format("YYYY-MM-DD HH:mm");
}