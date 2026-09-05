// tests/e2e/home.spec.ts
import { test, expect } from "@playwright/test";

test.describe("VeriTrace Home Page", () => {
  test("loads landing page with branding, hero, and dropzone", async ({ page }) => {
    await page.goto("/");

    // Verify page title
    await expect(page).toHaveTitle(/VeriTrace/i);

    // Verify main navigation and branding
    const brand = page.locator("header");
    await expect(brand).toBeVisible();

    // Verify upload dropzone exists
    const dropzone = page.getByText(/drop media here/i);
    await expect(dropzone).toBeVisible();

    // Verify choose file button
    const chooseFileBtn = page.getByRole("button", { name: /choose file/i });
    await expect(chooseFileBtn).toBeVisible();

    // Verify URL input option exists
    const urlInput = page.getByPlaceholder(/paste a public media or webpage url/i);
    await expect(urlInput).toBeVisible();
  });

  test("contains accessible navigation links", async ({ page }) => {
    await page.goto("/");

    const howItWorksLink = page.getByRole("link", { name: /how it works/i });
    await expect(howItWorksLink).toBeVisible();
  });
});
