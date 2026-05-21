import { test, expect } from "@playwright/test";

test.describe("Ingredient Editor", () => {
  test.beforeEach(async ({ page }) => {
    await page.goto("/", { waitUntil: "networkidle" });
    await page.fill('input[type="text"]', "TestUser");
    await page.click('button:has-text("Get Started")');
    await page.waitForTimeout(1000);
    await page.click("text=/☰/");
    await page.waitForTimeout(500);
    await page.click("text=/Ingredients/");
    await page.waitForTimeout(1000);
  });

  test("navigates to bulk ingredient editor and shows table", async ({ page }) => {
    const table = page.locator("table, .p-treetable");
    await expect(table.first()).toBeVisible();
  });

  test("LabelEditor dropdown opens and ArrowDown navigates within it", async ({ page }) => {
    const labelsHeaderIndex = await page.evaluate(() => {
      const headers = Array.from(document.querySelectorAll("th"));
      return headers.findIndex((h) => h.textContent.includes("Labels"));
    });

    expect(labelsHeaderIndex).toBeGreaterThanOrEqual(0);

    const labelsCell = page
      .locator(`tbody tr:first-child td:nth-child(${labelsHeaderIndex + 1}) span.it-editable`)
      .first();
    await expect(labelsCell).toBeVisible();
    await labelsCell.click();
    await page.waitForTimeout(500);

    const labelEditor = page.locator(".le__control, .it-label-editor").first();
    await expect(labelEditor).toBeVisible();

    const dropdownMenu = page.locator(".le__menu").first();
    await expect(dropdownMenu).toBeVisible();

    await page.keyboard.press("ArrowDown");
    await page.waitForTimeout(300);

    const isDropdownNavigated = await page.evaluate(() => {
      const combobox = document.querySelector("[role='combobox'][aria-expanded='true']");
      if (!combobox) return false;
      const activedescendant = combobox.getAttribute("aria-activedescendant");
      if (!activedescendant) return false;
      const option = document.getElementById(activedescendant);
      return option !== null && option.getAttribute("role") === "option";
    });

    expect(isDropdownNavigated).toBe(true);

    const dropdownStillOpen = await page.locator(".le__menu").first().isVisible();
    expect(dropdownStillOpen).toBe(true);

    await page.keyboard.press("Escape");
    await page.waitForTimeout(300);
  });

  test("MeasurementEditor closes on Escape key", async ({ page }) => {
    const valueHeaderIndex = await page.evaluate(() => {
      const headers = Array.from(document.querySelectorAll("th"));
      return headers.findIndex((h) => h.textContent.includes("Default"));
    });

    expect(valueHeaderIndex).toBeGreaterThanOrEqual(0);

    const valueCell = page
      .locator(`tbody tr:first-child td:nth-child(${valueHeaderIndex + 1}) span.it-editable`)
      .first();
    await expect(valueCell).toBeVisible();
    await valueCell.click();
    await page.waitForTimeout(500);

    const editor = page.locator(".me-root--open, .fe-header").first();
    await expect(editor).toBeVisible();

    await page.keyboard.press("Escape");
    await page.waitForTimeout(300);

    const editorStillVisible = await page.locator(".me-root--open").first().isVisible();
    expect(editorStillVisible).toBe(false);
  });

  test("MultiSelectFilter shows accept/revert buttons in viewport", async ({ page }) => {
    const filterInputs = page.locator(".it-filter-th .msf-wrapper .msf-input, th input.msf-input");
    await expect(filterInputs.first()).toBeVisible();

    const labelsFilter = filterInputs.nth(0);
    await labelsFilter.click();
    await page.waitForTimeout(500);

    const dropdown = page.locator(".msf-dropdown").first();
    await expect(dropdown).toBeVisible();

    const acceptBtn = page.locator(".msf-actions button:first-child").first();
    const revertBtn = page.locator(".msf-actions button:last-child").first();

    await expect(acceptBtn).toBeVisible();
    await expect(revertBtn).toBeVisible();

    const buttonsInViewport = await page.evaluate(() => {
      const actions = document.querySelector(".msf-actions");
      if (!actions) return false;
      const rect = actions.getBoundingClientRect();
      return rect.top > 0 && rect.bottom <= window.innerHeight;
    });

    expect(buttonsInViewport).toBe(true);

    await page.mouse.click(0, 0);
    await page.waitForTimeout(300);
  });
});
