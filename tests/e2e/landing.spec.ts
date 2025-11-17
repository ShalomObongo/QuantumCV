import { test, expect } from '@playwright/test';

test.describe('Landing Page', () => {
  test('should display the landing page correctly', async ({ page }) => {
    await page.goto('/');

    // Check for main heading
    await expect(page.getByText('Create Professional')).toBeVisible();
    await expect(page.getByText('AI-Powered')).toBeVisible();

    // Check for navigation buttons
    await expect(page.getByRole('link', { name: /sign in/i })).toBeVisible();
    await expect(page.getByRole('link', { name: /get started/i })).toBeVisible();

    // Check for features section
    await expect(page.getByText('Why Choose QuantumCV?')).toBeVisible();
  });

  test('should navigate to login page', async ({ page }) => {
    await page.goto('/');

    await page.getByRole('link', { name: /sign in/i }).first().click();

    await expect(page).toHaveURL(/\/login/);
    await expect(page.getByText('Welcome Back')).toBeVisible();
  });

  test('should navigate to register page', async ({ page }) => {
    await page.goto('/');

    await page.getByRole('link', { name: /get started/i }).first().click();

    await expect(page).toHaveURL(/\/register/);
    await expect(page.getByText('Create Account')).toBeVisible();
  });
});
