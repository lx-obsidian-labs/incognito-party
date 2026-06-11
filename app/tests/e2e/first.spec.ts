import { test, expect } from '@playwright/test'

test.describe('Anonymous flow', () => {
  test('sign in anonymously, create regular post and a moment, verify in feed', async ({ page, baseURL }) => {
    // Navigate to feed (advice channel)
    await page.goto('/feed/advice')

    // Ensure mock mode is enabled (app reads NEXT_PUBLIC_MOCK_MODE at runtime)
    // The app's mock-data seeds localStorage when NEXT_PUBLIC_MOCK_MODE=true.
    // If tests run against dev server, ensure env var is set for the server.

    // Wait for composer textarea
    const composer = page.locator('textarea[aria-label="Post content"]')
    await expect(composer).toBeVisible({ timeout: 5000 })

    const unique = `e2e post ${Date.now()}`

    // Create regular post
    await composer.fill(unique)
    await page.getByRole('button', { name: /Post|Schedule/ }).click()

    // Wait for the post to appear in the feed - look for content text
    const newPost = page.locator(`text=${unique}`)
    await expect(newPost).toBeVisible({ timeout: 5000 })

    // Create a Moment (toggle Moment then post)
    const momentToggle = page.locator('button[aria-label="Toggle moment (24h expiry)"]')
    await momentToggle.click()
    const momentText = `e2e moment ${Date.now()}`
    await composer.fill(momentText)
    await page.getByRole('button', { name: /Post|Schedule/ }).click()

    // Verify moment appears (it may be grouped in MomentsBar) - check feed items
    const momentPost = page.locator(`text=${momentText}`)
    await expect(momentPost).toBeVisible({ timeout: 5000 })

    // Basic navigation sanity: open profile of author from the post
    const handleLink = newPost.locator('a').first()
    if (await handleLink.count()) {
      await handleLink.click()
      await expect(page).toHaveURL(/\/user\//)
    }
  })
})
