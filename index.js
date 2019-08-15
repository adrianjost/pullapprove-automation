require("dotenv").config();

const { Builder, By, until } = require("selenium-webdriver");
const chrome = require("selenium-webdriver/chrome");
const chromedriver = require("chromedriver");
chrome.setDefaultService(new chrome.ServiceBuilder(chromedriver.path).build());
const TIMEOUT = 10000;

const twoFactor = require("node-2fa");
const GIT_USERNAME = process.env.GIT_USERNAME;
const GIT_PASSWORD = process.env.GIT_PASSWORD;
const GIT_2FA = () => twoFactor.generateToken(process.env.GIT_2FA_SECRET).token;

const dayjs = require("dayjs");
const weekday = require("dayjs/plugin/weekday");
dayjs.extend(weekday);

// before Thursday
const NOW = dayjs(new Date());
if (NOW.day() < 3 || (NOW.day() === 3 && NOW.hour() > 14)) {
  exit(0);
}

const unavailableUntil = dayjs(new Date())
  .weekday(8)
  .set("hour", 7)
  .set("minute", 0)
  .format("YYYY-MM-DD HH:mm");
console.error("Available @" + unavailableUntil);

(async function example() {
  let driver = await new Builder().forBrowser("chrome").build();
  try {
    await driver.get(
      "https://app.pullapprove.com/accounts/github/login/?next=%2Favailability%2F"
    );

    await driver.wait(until.urlContains("https://github.com"), TIMEOUT);

    const githubLoginUsername = await driver.findElement(
      By.css("#login_field")
    );
    const githubLoginPassword = await driver.findElement(By.css("#password"));
    const githubLoginButton = await driver.findElement(
      By.css(
        "#login > form > div.auth-form-body.mt-3 > input.btn.btn-primary.btn-block"
      )
    );
    await githubLoginUsername.sendKeys(...Array.from(GIT_USERNAME));
    await githubLoginPassword.sendKeys(...Array.from(GIT_PASSWORD));
    await githubLoginButton.click();

    await driver.wait(
      until.urlIs("https://github.com/sessions/two-factor"),
      TIMEOUT
    );
    const github2FAInput = await driver.findElement(By.css("#otp"));
    const github2FAButton = await driver.findElement(
      By.css("#login > div.auth-form-body.mt-3 > form > button")
    );
    await github2FAInput.sendKeys(...Array.from(GIT_2FA()));
    await github2FAButton.click();

    await driver.wait(
      until.urlIs("https://app.pullapprove.com/availability/"),
      TIMEOUT
    );

    await driver.executeScript(
      `document.getElementById("id_unavailable_until").value = "${unavailableUntil}"`
    );
    await driver.findElement(By.css("form > button")).click();

    await driver.wait(
      until.urlContains("https://app.pullapprove.com"),
      TIMEOUT
    );

    console.log("Unavailable date updated");
  } catch (error) {
    console.error(error);
  } finally {
    await driver.quit();
  }
})();
