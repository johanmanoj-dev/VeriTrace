// tests/e2e/login.spec.ts
import { test, expect } from "@playwright/test";

test.describe("VeriTrace Login Page", () => {
  test("renders sign in screen with Google auth button", async ({ page }) => {
    await page.goto("/login");

    // Title and description
    await expect(page.getByText(/sign in to veritrace/i)).toBeVisible();

    // Google Auth button
    const googleBtn = page.getByRole("button", { name: /sign in with your google account/i });
    await expect(googleBtn).toBeVisible();
    await expect(googleBtn).toBeEnabled();
  });
});
