import { expect, test } from "@playwright/test";

test("landing page exposes the create flow", async ({ page }) => {
  await page.goto("/");

  await expect(page.getByText("Gather a hidden court")).toBeVisible();
  await expect(page.getByTestId("create-join-submit")).toBeDisabled();
});

