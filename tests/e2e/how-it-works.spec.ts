// tests/e2e/how-it-works.spec.ts
import { test, expect } from "@playwright/test";

test.describe("VeriTrace How It Works Page", () => {
  test("displays the four pillars of the verification pipeline", async ({ page }) => {
    await page.goto("/how-it-works");

    await expect(page.getByText(/how veritrace works/i)).toBeVisible();
    await expect(page.getByText(/01/i)).toBeVisible();
    await expect(page.getByText(/02/i)).toBeVisible();
    await expect(page.getByText(/03/i)).toBeVisible();

    const startBtn = page.getByRole("link", { name: /start verifying media/i });
    await expect(startBtn).toBeVisible();
  });
});
